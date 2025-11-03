-- 20251102_fix_os_flow.sql
-- Hardening do fluxo de OS (Work Order) – idempotente

-- 1) Pré-requisitos e índices de unicidade/consulta --------------------------

-- Tabela OS: índice único para numero_os por condomínio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'os_condominio_numero_os_uix'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX os_condominio_numero_os_uix ON public.os (condominio_id, numero_os)';
  END IF;
END$$;

-- Índices úteis
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'os_condominio_status_idx') THEN
    EXECUTE 'CREATE INDEX os_condominio_status_idx ON public.os (condominio_id, status)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'os_ativo_idx') THEN
    EXECUTE 'CREATE INDEX os_ativo_idx ON public.os (ativo_id)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'os_data_prevista_idx') THEN
    EXECUTE 'CREATE INDEX os_data_prevista_idx ON public.os (data_prevista)';
  END IF;
END$$;

-- NÃO recriar a unique de usuarios.auth_user_id; apenas garantir índice único caso falte
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'usuarios_auth_user_id_uix') THEN
    EXECUTE 'CREATE UNIQUE INDEX usuarios_auth_user_id_uix ON public.usuarios (auth_user_id)';
  END IF;
END$$;

-- 2) Função geradora do número de OS ----------------------------------------

-- Gera número no formato: OS-YYYY-0001 com escopo por condomínio
CREATE OR REPLACE FUNCTION public.generate_os_numero(p_condominio_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_ano int := EXTRACT(YEAR FROM now())::int;
  v_seq int;
  v_num text;
BEGIN
  -- lock por chave para evitar corrida entre sessões do mesmo condomínio+ano
  PERFORM pg_advisory_xact_lock( ('x'||substr(replace(p_condominio_id::text,'-',''),1,8))::bit(32)::int, v_ano );

  SELECT COALESCE(MAX((regexp_match(numero_os, 'OS-'||v_ano||'-(\d{4})'))[1]::int), 0) + 1
    INTO v_seq
  FROM public.os
  WHERE condominio_id = p_condominio_id
    AND numero_os ~ ('^OS-'||v_ano||'-\d{4}$');

  v_num := format('OS-%s-%s', v_ano, lpad(v_seq::text, 4, '0'));
  RETURN v_num;
END
$$;

-- 3) RPC unificada criar_os_detalhada ---------------------------------------

-- Apagamos versões antigas com assinaturas diferentes (se existirem)
DO $$
BEGIN
  -- tente eliminar assinaturas antigas conhecidas; ignore se não existir
  PERFORM 1 FROM pg_proc WHERE proname = 'criar_os_detalhada';
  -- drop por assinatura conhecida A
  BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.criar_os_detalhada(uuid, uuid, uuid, text, uuid, text, text, text, date)';
  EXCEPTION WHEN undefined_function THEN
    -- ok
  END;
  -- drop por assinatura conhecida B
  BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.criar_os_detalhada(uuid, uuid, text, uuid, text, text, text, text, text, date, jsonb, jsonb)';
  EXCEPTION WHEN undefined_function THEN
  END;
  -- drop genérico: remove qualquer outra versão sem quebrar se não houver
  FOR
    -- pega todas as versões na schema public
    _sig IN
      SELECT oid::regprocedure::text AS sig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname  = 'criar_os_detalhada'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS '||_sig;
  END LOOP;
END$$;

-- Assinatura UNIFICADA (engloba os dois dialogs)
-- Atenção: manter textos como TEXT (com validação leve), e campos opcionais DEFAULT NULL
CREATE OR REPLACE FUNCTION public.criar_os_detalhada(
  p_condominio_id     uuid,
  p_plano_id          uuid DEFAULT NULL,
  p_ativo_id          uuid DEFAULT NULL,
  p_responsavel_id    uuid DEFAULT NULL,
  p_titulo            text,
  p_descricao         text DEFAULT NULL,
  p_prioridade        text DEFAULT 'media',        -- baixa|media|alta|critica (validamos mais abaixo)
  p_tipo_os           text DEFAULT 'corretiva',    -- corretiva|preventiva|inspecao|outro
  p_data_prevista     date DEFAULT NULL,

  -- campos do segundo dialog / manutenção
  p_solicitante_id    uuid DEFAULT NULL,
  p_tipo_manutencao   text DEFAULT NULL,           -- preventiva|corretiva|...
  p_tipo_executor     text DEFAULT NULL,           -- interno|externo
  p_executor_nome     text DEFAULT NULL,
  p_executor_contato  text DEFAULT NULL,
  p_nbr_referencias   jsonb DEFAULT '[]',
  p_checklist_items   jsonb DEFAULT '[]'
)
RETURNS public.os
LANGUAGE plpgsql
AS $$
DECLARE
  v_numero_os text;
  v_status text := 'aberta';
  v_row public.os;
BEGIN
  IF p_titulo IS NULL OR btrim(p_titulo) = '' THEN
    RAISE EXCEPTION 'Título é obrigatório' USING ERRCODE = '23514';
  END IF;

  -- validação leve de domínio (não cria constraint dura para manter compatibilidade)
  IF p_prioridade IS NOT NULL AND p_prioridade NOT IN ('baixa','media','alta','critica') THEN
    RAISE EXCEPTION 'Prioridade inválida: %', p_prioridade USING ERRCODE = '22000';
  END IF;
  IF p_tipo_os IS NOT NULL AND p_tipo_os NOT IN ('corretiva','preventiva','inspecao','outro') THEN
    RAISE EXCEPTION 'Tipo de OS inválido: %', p_tipo_os USING ERRCODE = '22000';
  END IF;

  -- número de OS
  v_numero_os := public.generate_os_numero(p_condominio_id);

  INSERT INTO public.os (
    condominio_id,
    plano_id,
    ativo_id,
    responsavel_id,
    solicitante_id,
    titulo,
    descricao,
    prioridade,
    tipo_os,
    status,
    data_prevista,
    executor_tipo,
    executor_nome,
    executor_contato,
    numero_os,
    nbr_referencias,
    checklist_items
  ) VALUES (
    p_condominio_id,
    p_plano_id,
    p_ativo_id,
    p_responsavel_id,
    p_solicitante_id,
    p_titulo,
    p_descricao,
    COALESCE(p_prioridade,'media'),
    COALESCE(p_tipo_os,'corretiva'),
    v_status,
    p_data_prevista,
    p_tipo_executor,
    p_executor_nome,
    p_executor_contato,
    v_numero_os,
    COALESCE(p_nbr_referencias, '[]'::jsonb),
    COALESCE(p_checklist_items, '[]'::jsonb)
  )
  ON CONFLICT (condominio_id, numero_os) DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    -- colisão improvável: gere novo número e tente novamente uma vez
    v_numero_os := public.generate_os_numero(p_condominio_id);
    INSERT INTO public.os (
      condominio_id, plano_id, ativo_id, responsavel_id, solicitante_id,
      titulo, descricao, prioridade, tipo_os, status, data_prevista,
      executor_tipo, executor_nome, executor_contato, numero_os,
      nbr_referencias, checklist_items
    )
    VALUES (
      p_condominio_id, p_plano_id, p_ativo_id, p_responsavel_id, p_solicitante_id,
      p_titulo, p_descricao, COALESCE(p_prioridade,'media'), COALESCE(p_tipo_os,'corretiva'),
      v_status, p_data_prevista, p_tipo_executor, p_executor_nome, p_executor_contato,
      v_numero_os, COALESCE(p_nbr_referencias,'[]'::jsonb), COALESCE(p_checklist_items,'[]'::jsonb)
    )
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END
$$ SECURITY DEFINER;

-- 4) Políticas RLS mínimas (mantendo compatibilidade) -----------------------

-- Garante que tabelas críticas estejam com RLS ativo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='os'
  ) THEN
    RAISE EXCEPTION 'Tabela public.os não existe';
  END IF;

  -- Ativar RLS se necessário
  EXECUTE 'ALTER TABLE public.os ENABLE ROW LEVEL SECURITY';
END$$;

-- Políticas exemplo baseadas em condominio_id (ajuste se já tiver as suas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='os' AND policyname='os_select_same_condo') THEN
    EXECUTE $SQL$
      CREATE POLICY os_select_same_condo ON public.os
      FOR SELECT
      USING (condominio_id = current_setting('app.condominio_id', true)::uuid);
    $SQL$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='os' AND policyname='os_insert_same_condo') THEN
    EXECUTE $SQL$
      CREATE POLICY os_insert_same_condo ON public.os
      FOR INSERT
      WITH CHECK (condominio_id = current_setting('app.condominio_id', true)::uuid);
    $SQL$;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='os' AND policyname='os_update_same_condo') THEN
    EXECUTE $SQL$
      CREATE POLICY os_update_same_condo ON public.os
      FOR UPDATE
      USING (condominio_id = current_setting('app.condominio_id', true)::uuid)
      WITH CHECK (condominio_id = current_setting('app.condominio_id', true)::uuid);
    $SQL$;
  END IF;
END$$;

-- Observação: mantenha suas políticas de papel (admin/síndico/zelador) já existentes.
-- Este bloco só adiciona fallback por condominio_id, não remove nada.


-- 5) Seeds: nenhum placeholder; opcionalmente crie um condominio default ----

-- Exemplos seguros (executa somente se não houver nenhum condomínio)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.condominios) THEN
    INSERT INTO public.condominios (id, nome) VALUES (gen_random_uuid(), 'Condomínio Padrão');
  END IF;
END$$;

-- Fim
