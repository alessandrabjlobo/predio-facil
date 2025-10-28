/*
  # Performance Indexes
  
  Creates indexes for optimal query performance on maintenance operations.
*/

CREATE INDEX IF NOT EXISTS idx_os_condominio_data ON public.os(condominio_id, data_abertura DESC);
CREATE INDEX IF NOT EXISTS idx_os_numero ON public.os(numero);
CREATE INDEX IF NOT EXISTS idx_os_plano ON public.os(plano_id) WHERE plano_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_os_ativo ON public.os(ativo_id) WHERE ativo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_planos_condominio_ativo ON public.planos_manutencao(condominio_id, ativo_id);
CREATE INDEX IF NOT EXISTS idx_planos_condominio_proxima ON planos_manutencao(condominio_id, proxima_execucao);
CREATE INDEX IF NOT EXISTS idx_conformidade_condominio_plano ON public.conformidade_itens(condominio_id, plano_id);
CREATE INDEX IF NOT EXISTS idx_conformidade_condominio_status ON conformidade_itens(condominio_id, status);
CREATE INDEX IF NOT EXISTS idx_ativos_condominio_tipo ON public.ativos(condominio_id, tipo_id);
CREATE INDEX IF NOT EXISTS idx_ativos_condominio_conformidade ON ativos(condominio_id, requer_conformidade, is_ativo);
CREATE INDEX IF NOT EXISTS idx_os_condominio_status_data ON os(condominio_id, status, data_abertura);
