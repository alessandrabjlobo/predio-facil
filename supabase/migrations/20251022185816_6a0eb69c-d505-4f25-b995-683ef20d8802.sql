-- Recriar a view sem SECURITY DEFINER (será controlado por RLS das tabelas)
DROP VIEW IF EXISTS public.ativo_historico_manutencao;

CREATE OR REPLACE VIEW public.ativo_historico_manutencao 
WITH (security_invoker = true)
AS
SELECT 
  a.id as ativo_id,
  a.nome as ativo_nome,
  a.torre,
  a.tipo_uso,
  a.identificador,
  a.condominio_id,
  m.id as manutencao_id,
  m.tipo as manutencao_tipo,
  m.titulo as manutencao_titulo,
  m.status,
  m.vencimento,
  m.executada_em,
  m.created_at as data_criacao,
  p.titulo as plano_titulo,
  p.periodicidade
FROM public.ativos a
LEFT JOIN public.manutencoes m ON m.ativo_id = a.id
LEFT JOIN public.planos_manutencao p ON p.ativo_id = a.id
ORDER BY a.nome, m.created_at DESC;