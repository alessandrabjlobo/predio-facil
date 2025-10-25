-- FASE 2: SISTEMA DE TEMPLATES COM HERANÇA

-- Criar tabela de tipos de documentos
CREATE TABLE documento_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir documentos padrão
INSERT INTO documento_tipos (codigo, nome, descricao) VALUES
('ART', 'ART (Anotação de Responsabilidade Técnica)', 'Documento obrigatório para manutenções técnicas'),
('LAUDO_TECNICO', 'Laudo Técnico', 'Relatório técnico detalhado da manutenção'),
('RELATORIO_FOTOS', 'Relatório Fotográfico', 'Evidências fotográficas da execução'),
('CERTIFICADO', 'Certificado de Conformidade', 'Certificado emitido por órgão competente'),
('NOTA_FISCAL', 'Nota Fiscal', 'Comprovante fiscal do serviço');

-- Criar tabela de documentos obrigatórios por template
CREATE TABLE manut_template_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES manut_templates(id) ON DELETE CASCADE,
  documento_tipo_id UUID REFERENCES documento_tipos(id) ON DELETE CASCADE,
  obrigatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, documento_tipo_id)
);

-- Criar tabela de customizações por condomínio
CREATE TABLE condominio_template_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES condominios(id) ON DELETE CASCADE,
  template_id UUID REFERENCES manut_templates(id) ON DELETE CASCADE,
  checklist_adicional JSONB DEFAULT '[]',
  documentos_adicionais UUID[] DEFAULT '{}',
  periodicidade_customizada INTERVAL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(condominio_id, template_id)
);

-- RLS Policies para documento_tipos
ALTER TABLE documento_tipos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver tipos de documentos"
ON documento_tipos FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar tipos de documentos"
ON documento_tipos FOR ALL
USING (has_role_auth(auth.uid(), 'admin'));

-- RLS Policies para manut_template_documentos
ALTER TABLE manut_template_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver documentos de templates"
ON manut_template_documentos FOR SELECT USING (true);

CREATE POLICY "Admins podem gerenciar documentos de templates"
ON manut_template_documentos FOR ALL
USING (has_role_auth(auth.uid(), 'admin'));

-- RLS Policies para condominio_template_overrides
ALTER TABLE condominio_template_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Síndicos podem ver overrides de seu condomínio"
ON condominio_template_overrides FOR SELECT
USING (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND uc.papel IN ('sindico', 'admin')
  )
);

CREATE POLICY "Síndicos podem criar/editar overrides de seu condomínio"
ON condominio_template_overrides FOR INSERT
WITH CHECK (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND uc.papel IN ('sindico', 'admin')
  )
);

CREATE POLICY "Síndicos podem atualizar overrides de seu condomínio"
ON condominio_template_overrides FOR UPDATE
USING (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND uc.papel IN ('sindico', 'admin')
  )
);

CREATE POLICY "Síndicos podem deletar overrides de seu condomínio"
ON condominio_template_overrides FOR DELETE
USING (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND uc.papel IN ('sindico', 'admin')
  )
);