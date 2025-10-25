-- Remover a view anterior com SECURITY DEFINER
DROP VIEW IF EXISTS calendario_manutencoes;

-- Recriar a view sem SECURITY DEFINER (usando SECURITY INVOKER por padrão)
CREATE OR REPLACE VIEW calendario_manutencoes 
WITH (security_invoker = true)
AS
SELECT 
  pm.id,
  pm.titulo,
  pm.proxima_execucao as data_evento,
  pm.tipo,
  pm.periodicidade,
  a.nome as ativo_nome,
  at.nome as ativo_tipo,
  pm.condominio_id,
  CASE 
    WHEN ci.status = 'verde' THEN 'executado'
    WHEN pm.proxima_execucao < CURRENT_DATE THEN 'atrasado'
    WHEN pm.proxima_execucao <= CURRENT_DATE + INTERVAL '7 days' THEN 'iminente'
    ELSE 'agendado'
  END as status_visual,
  ci.ultimo as ultima_execucao,
  ci.status as status_conformidade,
  pm.is_legal as requer_conformidade
FROM planos_manutencao pm
LEFT JOIN ativos a ON pm.ativo_id = a.id
LEFT JOIN ativo_tipos at ON a.tipo_id = at.id
LEFT JOIN conformidade_itens ci ON ci.plano_id = pm.id
WHERE pm.proxima_execucao IS NOT NULL;

-- Criar política RLS para a view (funciona com security_invoker)
-- A view irá respeitar as políticas RLS das tabelas subjacentes automaticamente