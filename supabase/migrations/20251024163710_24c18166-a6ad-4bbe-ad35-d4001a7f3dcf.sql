-- 1) Completar enum de papéis (idempotente)
DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'funcionario';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'conselho';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Tabela condominio_config (idempotente)
CREATE TABLE IF NOT EXISTS public.condominio_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  unidades integer DEFAULT 0,
  endereco text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (condominio_id)
);

-- Função genérica para updated_at (se ainda não existir)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger de updated_at para condominio_config
DROP TRIGGER IF EXISTS set_condominio_config_updated_at ON public.condominio_config;
CREATE TRIGGER set_condominio_config_updated_at
BEFORE UPDATE ON public.condominio_config
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS para condominio_config
ALTER TABLE public.condominio_config ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todos
DROP POLICY IF EXISTS "Admins podem ver condominio_config" ON public.condominio_config;
CREATE POLICY "Admins podem ver condominio_config"
ON public.condominio_config
FOR SELECT
USING (public.has_role_auth(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem inserir condominio_config" ON public.condominio_config;
CREATE POLICY "Admins podem inserir condominio_config"
ON public.condominio_config
FOR INSERT
WITH CHECK (public.has_role_auth(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem atualizar condominio_config" ON public.condominio_config;
CREATE POLICY "Admins podem atualizar condominio_config"
ON public.condominio_config
FOR UPDATE
USING (public.has_role_auth(auth.uid(), 'admin'))
WITH CHECK (public.has_role_auth(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem deletar condominio_config" ON public.condominio_config;
CREATE POLICY "Admins podem deletar condominio_config"
ON public.condominio_config
FOR DELETE
USING (public.has_role_auth(auth.uid(), 'admin'));

-- Síndicos do condomínio podem ver e gerenciar o seu próprio
DROP POLICY IF EXISTS "Síndicos podem ver config do seu condomínio" ON public.condominio_config;
CREATE POLICY "Síndicos podem ver config do seu condomínio"
ON public.condominio_config
FOR SELECT
USING (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM public.usuarios_condominios uc
    JOIN public.usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Síndicos podem inserir config do seu condomínio" ON public.condominio_config;
CREATE POLICY "Síndicos podem inserir config do seu condomínio"
ON public.condominio_config
FOR INSERT
WITH CHECK (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM public.usuarios_condominios uc
    JOIN public.usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
      AND uc.papel IN ('sindico','admin')
  )
);

DROP POLICY IF EXISTS "Síndicos podem atualizar config do seu condomínio" ON public.condominio_config;
CREATE POLICY "Síndicos podem atualizar config do seu condomínio"
ON public.condominio_config
FOR UPDATE
USING (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM public.usuarios_condominios uc
    JOIN public.usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
      AND uc.papel IN ('sindico','admin')
  )
)
WITH CHECK (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM public.usuarios_condominios uc
    JOIN public.usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
      AND uc.papel IN ('sindico','admin')
  )
);

DROP POLICY IF EXISTS "Síndicos podem deletar config do seu condomínio" ON public.condominio_config;
CREATE POLICY "Síndicos podem deletar config do seu condomínio"
ON public.condominio_config
FOR DELETE
USING (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM public.usuarios_condominios uc
    JOIN public.usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
      AND uc.papel IN ('sindico','admin')
  )
);

-- 3) Funções RPC ausentes (idempotentes)
CREATE OR REPLACE FUNCTION public.conf_registrar_execucao(
  p_item_id uuid,
  p_data_execucao date,
  p_observacoes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualiza item
  UPDATE public.conformidade_itens
  SET 
    ultimo = p_data_execucao,
    observacoes = COALESCE(p_observacoes, observacoes),
    status = 'verde'::semaforo,
    updated_at = now()
  WHERE id = p_item_id;

  -- Recalcula próximo vencimento
  UPDATE public.conformidade_itens
  SET proximo = ultimo + periodicidade
  WHERE id = p_item_id;

  -- Log opcional
  INSERT INTO public.conformidade_logs (acao, usuario_id, item_id, detalhes)
  SELECT 'edicao', u.id, p_item_id, jsonb_build_object('tipo', 'execucao', 'data', p_data_execucao)
  FROM public.usuarios u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.conf_adiar_proximo(
  p_item_id uuid,
  p_nova_data date,
  p_motivo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conformidade_itens
  SET 
    proximo = p_nova_data,
    observacoes = COALESCE(
      CASE WHEN p_motivo IS NOT NULL THEN
        (COALESCE(observacoes, '') || CASE WHEN COALESCE(observacoes,'') = '' THEN '' ELSE E'\n' END || '[Adiado]: ' || p_motivo)
      ELSE observacoes END,
      observacoes
    ),
    updated_at = now()
  WHERE id = p_item_id;

  -- Log opcional
  INSERT INTO public.conformidade_logs (acao, usuario_id, item_id, detalhes)
  SELECT 'edicao', u.id, p_item_id, jsonb_build_object('tipo', 'adiamento', 'nova_data', p_nova_data, 'motivo', p_motivo)
  FROM public.usuarios u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
END;
$$;

-- 4) Triggers faltantes (idempotentes)
-- Gerar planos quando ativo for criado
DROP TRIGGER IF EXISTS ativos_generate_plans ON public.ativos;
CREATE TRIGGER ativos_generate_plans
AFTER INSERT ON public.ativos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_generate_maintenance_plans();

-- Sincronizar datas de conformidade quando plano for atualizado
DROP TRIGGER IF EXISTS planos_sync_conformidade ON public.planos_manutencao;
CREATE TRIGGER planos_sync_conformidade
AFTER UPDATE OF periodicidade, proxima_execucao ON public.planos_manutencao
FOR EACH ROW
EXECUTE FUNCTION public.sync_conformidade_dates();

-- Garantir único principal por usuário
DROP TRIGGER IF EXISTS ensure_single_principal_trigger ON public.usuarios_condominios;
CREATE TRIGGER ensure_single_principal_trigger
BEFORE INSERT OR UPDATE ON public.usuarios_condominios
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_principal();

-- Inicializar ativos padrão ao criar condomínio
DROP TRIGGER IF EXISTS cond_inicializar_ativos ON public.condominios;
CREATE TRIGGER cond_inicializar_ativos
AFTER INSERT ON public.condominios
FOR EACH ROW
EXECUTE FUNCTION public.trigger_inicializar_ativos_padrao();