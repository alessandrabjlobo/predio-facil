-- Criar função update_updated_at_column se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela ordens_servico
CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  ativo_id UUID REFERENCES public.ativos(id) ON DELETE SET NULL,
  manutencao_id UUID REFERENCES public.manutencoes(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'concluida', 'cancelada')),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_conclusao TIMESTAMPTZ,
  responsavel_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  fornecedor_id UUID,
  valor_orcado DECIMAL(10,2),
  valor_final DECIMAL(10,2),
  anexos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies para ordens_servico
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_podem_ver_os_do_seu_condominio"
ON public.ordens_servico
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.usuarios_condominios uc ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
      AND uc.condominio_id = ordens_servico.condominio_id
  )
);

CREATE POLICY "sindicos_podem_gerenciar_os"
ON public.ordens_servico
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.usuarios_condominios uc ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
      AND uc.condominio_id = ordens_servico.condominio_id
      AND uc.papel IN ('sindico', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.usuarios_condominios uc ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
      AND uc.condominio_id = ordens_servico.condominio_id
      AND uc.papel IN ('sindico', 'admin')
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();