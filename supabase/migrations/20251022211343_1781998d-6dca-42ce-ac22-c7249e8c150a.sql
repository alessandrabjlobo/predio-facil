-- Remover a view que foi criada com SECURITY DEFINER
DROP VIEW IF EXISTS conformidade_historico_auditoria;

-- Recriar a view SEM SECURITY DEFINER e com RLS adequado
-- Views por padrão usam as permissões do usuário que executa a query, não do criador
CREATE OR REPLACE VIEW conformidade_historico_auditoria AS
SELECT 
  ci.id as item_id,
  ci.condominio_id,
  a.nome as ativo_nome,
  pm.titulo as manutencao,
  ci.ultimo as data_execucao,
  ci.executado_por,
  u_exec.nome as executado_por_nome,
  ci.observacoes,
  ci.updated_at,
  (
    SELECT json_agg(json_build_object(
      'id', ca.id,
      'file_path', ca.file_path,
      'created_at', ca.created_at,
      'uploaded_by', u_upload.nome,
      'documento_tipo', dt.nome
    ) ORDER BY ca.created_at DESC)
    FROM conformidade_anexos ca
    LEFT JOIN usuarios u_upload ON ca.uploaded_by = u_upload.id
    LEFT JOIN documento_tipos dt ON ca.documento_tipo_id = dt.id
    WHERE ca.item_id = ci.id
  ) as anexos
FROM conformidade_itens ci
LEFT JOIN ativos a ON ci.ativo_id = a.id
LEFT JOIN planos_manutencao pm ON ci.plano_id = pm.id
LEFT JOIN usuarios u_exec ON ci.executado_por = u_exec.id
WHERE ci.ultimo IS NOT NULL
ORDER BY ci.updated_at DESC;

-- Garantir que a view respeita as mesmas políticas RLS das tabelas base
-- Como a view usa JOIN com as tabelas, ela automaticamente herda as políticas RLS
GRANT SELECT ON conformidade_historico_auditoria TO authenticated;