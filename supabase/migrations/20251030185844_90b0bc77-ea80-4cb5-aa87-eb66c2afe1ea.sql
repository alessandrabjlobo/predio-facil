-- View: Lista de Chamados
CREATE OR REPLACE VIEW v_chamados_list AS
SELECT 
  c.id,
  c.titulo,
  c.descricao,
  c.status,
  c.prioridade,
  c.categoria,
  c.local,
  c.created_at,
  c.condominio_id,
  cond.nome AS condominio_nome,
  CASE 
    WHEN c.prioridade = 'urgente' THEN 'P1'
    WHEN c.prioridade = 'alta' THEN 'P2'
    WHEN c.prioridade = 'media' THEN 'P3'
    ELSE 'P4'
  END AS criticidade
FROM chamados c
LEFT JOIN condominios cond ON cond.id = c.condominio_id;

-- View: Pipeline de Chamados (status x prioridade)
CREATE OR REPLACE VIEW v_chamados_pipeline AS
SELECT 
  c.condominio_id,
  c.status,
  c.prioridade,
  COUNT(*) AS qtd
FROM chamados c
GROUP BY c.condominio_id, c.status, c.prioridade;

-- View: Lista de OS
CREATE OR REPLACE VIEW v_os_list AS
SELECT 
  o.id,
  o.numero,
  o.titulo AS chamado_titulo,
  o.status,
  o.data_prevista AS inicio_prev,
  o.sla_vencimento AS fim_prev,
  o.custo_final AS custo_total,
  o.created_at,
  o.condominio_id,
  cond.nome AS condominio_nome
FROM os o
LEFT JOIN condominios cond ON cond.id = o.condominio_id;

-- View: Resumo de OS (KPIs)
CREATE OR REPLACE VIEW v_os_resumo AS
SELECT 
  o.condominio_id,
  COUNT(*) AS total_os,
  COUNT(*) FILTER (WHERE o.status = 'aberta') AS abertas,
  COUNT(*) FILTER (WHERE o.status = 'em_execucao') AS em_andamento,
  COUNT(*) FILTER (WHERE o.status = 'concluida') AS concluidas,
  COALESCE(SUM(o.custo_final), 0) AS custo_total,
  COALESCE(AVG(o.custo_final), 0) AS custo_medio
FROM os o
GROUP BY o.condominio_id;

-- View: Pipeline de OS (status, qtd, custo)
CREATE OR REPLACE VIEW v_os_pipeline AS
SELECT 
  o.condominio_id,
  o.status,
  COUNT(*) AS qtd,
  COALESCE(SUM(o.custo_final), 0) AS custo_total
FROM os o
GROUP BY o.condominio_id, o.status;

-- View: OS com SLA atrasado
CREATE OR REPLACE VIEW v_os_sla_atraso AS
SELECT 
  o.id AS os_id,
  o.numero,
  o.titulo AS chamado_titulo,
  o.status,
  o.sla_vencimento AS fim_prev,
  o.condominio_id,
  EXTRACT(EPOCH FROM (NOW() - o.sla_vencimento)) / 3600 AS atraso_horas
FROM os o
WHERE o.sla_vencimento < NOW()
  AND o.status NOT IN ('concluida', 'cancelada', 'fechada');

-- Table: OS Itens (se não existir)
CREATE TABLE IF NOT EXISTS os_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES os(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  concluido BOOLEAN DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para os_itens
ALTER TABLE os_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver itens de OS de seus condomínios"
  ON os_itens FOR SELECT
  USING (
    os_id IN (
      SELECT o.id FROM os o
      WHERE o.condominio_id IN (
        SELECT uc.condominio_id FROM usuarios_condominios uc
        JOIN usuarios u ON u.id = uc.usuario_id
        WHERE u.auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Executores podem gerenciar itens de suas OS"
  ON os_itens FOR ALL
  USING (
    os_id IN (
      SELECT o.id FROM os o
      WHERE o.condominio_id IN (
        SELECT uc.condominio_id FROM usuarios_condominios uc
        JOIN usuarios u ON u.id = uc.usuario_id
        WHERE u.auth_user_id = auth.uid()
        AND uc.papel IN ('sindico', 'admin', 'zelador', 'funcionario')
      )
      OR o.executante_id IN (
        SELECT id FROM usuarios WHERE auth_user_id = auth.uid()
      )
    )
  );