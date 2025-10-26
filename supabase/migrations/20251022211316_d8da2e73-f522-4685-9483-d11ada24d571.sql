-- Adicionar campos de auditoria na tabela conformidade_anexos
ALTER TABLE conformidade_anexos
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS documento_tipo_id UUID REFERENCES documento_tipos(id);

-- Criar índice para melhor performance nas consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_conformidade_anexos_uploaded_by ON conformidade_anexos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_conformidade_anexos_item_id ON conformidade_anexos(item_id);

-- Adicionar campo de usuário que marcou como executado na tabela conformidade_itens
ALTER TABLE conformidade_itens
ADD COLUMN IF NOT EXISTS executado_por UUID REFERENCES usuarios(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_conformidade_itens_executado_por ON conformidade_itens(executado_por);

-- Atualizar a política RLS para permitir inserção de anexos
DROP POLICY IF EXISTS "Usuários podem inserir anexos de conformidade" ON conformidade_anexos;
CREATE POLICY "Usuários podem inserir anexos de conformidade"
ON conformidade_anexos
FOR INSERT
WITH CHECK (
  item_id IN (
    SELECT ci.id
    FROM conformidade_itens ci
    WHERE ci.condominio_id IN (
      SELECT uc.condominio_id
      FROM usuarios_condominios uc
      JOIN usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
      AND uc.papel IN ('sindico', 'zelador', 'admin')
    )
  )
);

-- Permitir atualização de anexos (para soft delete ou modificações)
DROP POLICY IF EXISTS "Usuários podem atualizar anexos de conformidade" ON conformidade_anexos;
CREATE POLICY "Usuários podem atualizar anexos de conformidade"
ON conformidade_anexos
FOR UPDATE
USING (
  item_id IN (
    SELECT ci.id
    FROM conformidade_itens ci
    WHERE ci.condominio_id IN (
      SELECT uc.condominio_id
      FROM usuarios_condominios uc
      JOIN usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
      AND uc.papel IN ('sindico', 'zelador', 'admin')
    )
  )
);

-- Criar view para histórico de auditoria de conformidade
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

-- Permitir leitura da view de auditoria
GRANT SELECT ON conformidade_historico_auditoria TO authenticated;