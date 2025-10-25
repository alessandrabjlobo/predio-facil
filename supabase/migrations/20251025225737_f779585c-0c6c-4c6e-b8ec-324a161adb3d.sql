-- ====================================================================================
-- ETAPA 1: FUNDAÇÃO - SISTEMA DE MANUTENÇÃO NBR 5674 PROFISSIONAL
-- ====================================================================================

-- 1. TABELA DE FORNECEDORES
-- ====================================================================================
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  especialidade TEXT[], -- ['elevadores', 'incendio', 'eletrica', 'hidraulica', 'spda', 'pmoc']
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_condominio ON public.fornecedores(condominio_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_ativo ON public.fornecedores(ativo);

-- RLS para fornecedores
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver fornecedores de seus condomínios" ON public.fornecedores;
CREATE POLICY "Usuários podem ver fornecedores de seus condomínios"
ON public.fornecedores FOR SELECT
USING (
  condominio_id IN (
    SELECT uc.condominio_id 
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Síndicos e admins podem gerenciar fornecedores" ON public.fornecedores;
CREATE POLICY "Síndicos e admins podem gerenciar fornecedores"
ON public.fornecedores FOR ALL
USING (
  condominio_id IN (
    SELECT uc.condominio_id 
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid() 
    AND uc.papel IN ('sindico', 'admin')
  )
);

-- 2. TABELA DE PROGRAMAÇÃO DE MANUTENÇÃO (núcleo do sistema)
-- ====================================================================================
CREATE TABLE IF NOT EXISTS public.programacao_manutencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID REFERENCES public.planos_manutencao(id) ON DELETE CASCADE NOT NULL,
  ativo_id UUID REFERENCES public.ativos(id) ON DELETE CASCADE NOT NULL,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  data_prevista DATE NOT NULL,
  status TEXT DEFAULT 'programada' CHECK (status IN ('programada', 'atrasada', 'em_execucao', 'concluida', 'cancelada')),
  os_id UUID REFERENCES public.os(id) ON DELETE SET NULL,
  alerta_enviado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programacao_plano ON public.programacao_manutencao(plano_id);
CREATE INDEX IF NOT EXISTS idx_programacao_ativo ON public.programacao_manutencao(ativo_id);
CREATE INDEX IF NOT EXISTS idx_programacao_condominio ON public.programacao_manutencao(condominio_id);
CREATE INDEX IF NOT EXISTS idx_programacao_data ON public.programacao_manutencao(data_prevista);
CREATE INDEX IF NOT EXISTS idx_programacao_status ON public.programacao_manutencao(status);

-- RLS para programacao_manutencao
ALTER TABLE public.programacao_manutencao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver programação de seus condomínios" ON public.programacao_manutencao;
CREATE POLICY "Usuários podem ver programação de seus condomínios"
ON public.programacao_manutencao FOR SELECT
USING (
  condominio_id IN (
    SELECT uc.condominio_id 
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Sistema pode gerenciar programação" ON public.programacao_manutencao;
CREATE POLICY "Sistema pode gerenciar programação"
ON public.programacao_manutencao FOR ALL
USING (
  condominio_id IN (
    SELECT uc.condominio_id 
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND uc.papel IN ('sindico', 'admin', 'zelador', 'funcionario')
  )
);

-- 3. TABELA DE CHECKLIST DE OS (detalhar execução)
-- ====================================================================================
CREATE TABLE IF NOT EXISTS public.os_checklist_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID REFERENCES public.os(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT NOT NULL,
  concluido BOOLEAN DEFAULT false,
  observacao TEXT,
  ordem INTEGER DEFAULT 0,
  obrigatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_os_checklist_os ON public.os_checklist_itens(os_id);

-- RLS para os_checklist_itens
ALTER TABLE public.os_checklist_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver checklist de OS de seus condomínios" ON public.os_checklist_itens;
CREATE POLICY "Usuários podem ver checklist de OS de seus condomínios"
ON public.os_checklist_itens FOR SELECT
USING (
  os_id IN (
    SELECT o.id FROM os o
    WHERE o.condominio_id IN (
      SELECT uc.condominio_id 
      FROM usuarios_condominios uc
      JOIN usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Executores podem gerenciar checklist de suas OS" ON public.os_checklist_itens;
CREATE POLICY "Executores podem gerenciar checklist de suas OS"
ON public.os_checklist_itens FOR ALL
USING (
  os_id IN (
    SELECT o.id FROM os o
    WHERE o.condominio_id IN (
      SELECT uc.condominio_id 
      FROM usuarios_condominios uc
      JOIN usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
      AND uc.papel IN ('sindico', 'admin', 'zelador', 'funcionario')
    )
    OR o.executante_id IN (
      SELECT id FROM usuarios WHERE auth_user_id = auth.uid()
    )
  )
);

-- 4. TABELA DE DOCUMENTOS DE ATIVOS (controlar validade)
-- ====================================================================================
CREATE TABLE IF NOT EXISTS public.ativo_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo_id UUID REFERENCES public.ativos(id) ON DELETE CASCADE NOT NULL,
  tipo_documento TEXT NOT NULL, -- 'laudo', 'art', 'certificado', 'manual', 'nf'
  nome_arquivo TEXT NOT NULL,
  file_path TEXT NOT NULL,
  data_emissao DATE,
  data_validade DATE,
  obrigatorio BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ativo_docs_ativo ON public.ativo_documentos(ativo_id);
CREATE INDEX IF NOT EXISTS idx_ativo_docs_validade ON public.ativo_documentos(data_validade);

-- RLS para ativo_documentos
ALTER TABLE public.ativo_documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver documentos de ativos de seus condomínios" ON public.ativo_documentos;
CREATE POLICY "Usuários podem ver documentos de ativos de seus condomínios"
ON public.ativo_documentos FOR SELECT
USING (
  ativo_id IN (
    SELECT a.id FROM ativos a
    WHERE a.condominio_id IN (
      SELECT uc.condominio_id 
      FROM usuarios_condominios uc
      JOIN usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Funcionários podem gerenciar documentos de ativos" ON public.ativo_documentos;
CREATE POLICY "Funcionários podem gerenciar documentos de ativos"
ON public.ativo_documentos FOR ALL
USING (
  ativo_id IN (
    SELECT a.id FROM ativos a
    WHERE a.condominio_id IN (
      SELECT uc.condominio_id 
      FROM usuarios_condominios uc
      JOIN usuarios u ON uc.usuario_id = u.id
      WHERE u.auth_user_id = auth.uid()
      AND uc.papel IN ('sindico', 'admin', 'zelador', 'funcionario')
    )
  )
);

-- 5. MODIFICAÇÕES EM TABELAS EXISTENTES
-- ====================================================================================

-- ATIVOS: adicionar campos de rastreamento de conformidade
ALTER TABLE public.ativos 
ADD COLUMN IF NOT EXISTS ultima_manutencao DATE,
ADD COLUMN IF NOT EXISTS proxima_manutencao DATE,
ADD COLUMN IF NOT EXISTS status_conformidade TEXT DEFAULT 'pendente' CHECK (status_conformidade IN ('conforme', 'atencao', 'nao_conforme', 'pendente'));

CREATE INDEX IF NOT EXISTS idx_ativos_status_conformidade ON public.ativos(status_conformidade);

-- OS: expandir para absorver chamados + rastreamento completo
ALTER TABLE public.os 
ADD COLUMN IF NOT EXISTS programacao_id UUID REFERENCES public.programacao_manutencao(id),
ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.fornecedores(id),
ADD COLUMN IF NOT EXISTS checklist_completo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status_validacao TEXT DEFAULT 'pendente' CHECK (status_validacao IN ('pendente', 'aprovada', 'reprovada'));

CREATE INDEX IF NOT EXISTS idx_os_programacao ON public.os(programacao_id);
CREATE INDEX IF NOT EXISTS idx_os_fornecedor ON public.os(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_os_status_validacao ON public.os(status_validacao);

-- PLANOS_MANUTENCAO: adicionar automação
ALTER TABLE public.planos_manutencao
ADD COLUMN IF NOT EXISTS auto_gerar_programacao BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS meses_antecedencia INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS dias_alerta INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS template_origem UUID REFERENCES public.manut_templates(id);

CREATE INDEX IF NOT EXISTS idx_planos_template ON public.planos_manutencao(template_origem);

-- USUARIOS_CONDOMINIOS: adicionar descrição de cargo
ALTER TABLE public.usuarios_condominios
ADD COLUMN IF NOT EXISTS descricao_cargo TEXT;

-- 6. FUNÇÃO PARA ATUALIZAR STATUS DE CONFORMIDADE
-- ====================================================================================
CREATE OR REPLACE FUNCTION public.atualizar_status_conformidade_ativo(p_ativo_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_tem_plano BOOLEAN;
  v_tem_atrasada BOOLEAN;
  v_docs_vencidos INTEGER;
  v_docs_vencendo INTEGER;
  v_status TEXT;
BEGIN
  -- 1. Verificar se tem plano de conformidade
  SELECT EXISTS(
    SELECT 1 FROM planos_manutencao 
    WHERE ativo_id = p_ativo_id AND is_legal = true
  ) INTO v_tem_plano;
  
  IF NOT v_tem_plano THEN
    RETURN 'pendente';
  END IF;
  
  -- 2. Verificar programação atrasada
  SELECT EXISTS(
    SELECT 1 FROM programacao_manutencao
    WHERE ativo_id = p_ativo_id AND status = 'atrasada'
  ) INTO v_tem_atrasada;
  
  -- 3. Contar documentos vencidos
  SELECT COUNT(*) INTO v_docs_vencidos
  FROM ativo_documentos
  WHERE ativo_id = p_ativo_id 
    AND obrigatorio = true
    AND data_validade < CURRENT_DATE;
  
  -- 4. Contar documentos vencendo (< 15 dias)
  SELECT COUNT(*) INTO v_docs_vencendo
  FROM ativo_documentos
  WHERE ativo_id = p_ativo_id 
    AND obrigatorio = true
    AND data_validade >= CURRENT_DATE
    AND data_validade < CURRENT_DATE + INTERVAL '15 days';
  
  -- 5. Determinar status
  IF v_tem_atrasada OR v_docs_vencidos > 0 THEN
    v_status := 'nao_conforme';
  ELSIF v_docs_vencendo > 0 THEN
    v_status := 'atencao';
  ELSE
    v_status := 'conforme';
  END IF;
  
  -- 6. Atualizar ativo
  UPDATE ativos SET status_conformidade = v_status WHERE id = p_ativo_id;
  
  RETURN v_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER PARA GERAR PROGRAMAÇÃO AUTOMATICAMENTE
-- ====================================================================================
CREATE OR REPLACE FUNCTION public.auto_gerar_programacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando plano é criado ou atualizado
  IF NEW.auto_gerar_programacao = true AND NEW.proxima_execucao IS NOT NULL THEN
    -- Deletar programação futura existente para este plano
    DELETE FROM programacao_manutencao 
    WHERE plano_id = NEW.id 
      AND data_prevista > CURRENT_DATE
      AND status IN ('programada', 'atrasada');
    
    -- Gerar próximos N meses (padrão: 12)
    INSERT INTO programacao_manutencao (
      plano_id, ativo_id, condominio_id, data_prevista, status
    )
    SELECT 
      NEW.id,
      NEW.ativo_id,
      NEW.condominio_id,
      NEW.proxima_execucao + (s.n * NEW.periodicidade),
      CASE 
        WHEN NEW.proxima_execucao + (s.n * NEW.periodicidade) < CURRENT_DATE THEN 'atrasada'
        ELSE 'programada'
      END
    FROM generate_series(0, COALESCE(NEW.meses_antecedencia, 12) - 1) s(n)
    WHERE NEW.proxima_execucao + (s.n * NEW.periodicidade) IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_gerar_programacao ON public.planos_manutencao;
CREATE TRIGGER trigger_auto_gerar_programacao
AFTER INSERT OR UPDATE ON public.planos_manutencao
FOR EACH ROW
EXECUTE FUNCTION public.auto_gerar_programacao();

-- 8. TRIGGER PARA ATUALIZAR CONFORMIDADE APÓS OS CONCLUÍDA
-- ====================================================================================
CREATE OR REPLACE FUNCTION public.trigger_atualizar_conformidade_pos_os()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluida' AND NEW.status_validacao = 'aprovada' AND NEW.ativo_id IS NOT NULL THEN
    PERFORM public.atualizar_status_conformidade_ativo(NEW.ativo_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_conformidade_pos_os ON public.os;
CREATE TRIGGER trigger_conformidade_pos_os
AFTER UPDATE ON public.os
FOR EACH ROW
EXECUTE FUNCTION public.trigger_atualizar_conformidade_pos_os();

-- 9. FUNÇÃO PARA ATUALIZAR UPDATED_AT
-- ====================================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em fornecedores
DROP TRIGGER IF EXISTS set_fornecedores_updated_at ON public.fornecedores;
CREATE TRIGGER set_fornecedores_updated_at
BEFORE UPDATE ON public.fornecedores
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Aplicar trigger em programacao_manutencao
DROP TRIGGER IF EXISTS set_programacao_updated_at ON public.programacao_manutencao;
CREATE TRIGGER set_programacao_updated_at
BEFORE UPDATE ON public.programacao_manutencao
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();