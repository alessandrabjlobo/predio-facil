-- ============================================
-- FASE 1: CRIAR TABELA NBR_REQUISITOS
-- ============================================

-- Criar tabela para mapeamento NBR → Tipo de Ativo
CREATE TABLE IF NOT EXISTS public.nbr_requisitos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nbr_codigo TEXT NOT NULL, -- Ex: "NBR 5674", "NBR 12693"
  nbr_titulo TEXT NOT NULL, -- Ex: "Manutenção de Edificações"
  ativo_tipo_slug TEXT NOT NULL, -- Referência ao slug em ativo_tipos
  requisito_descricao TEXT NOT NULL, -- O que a NBR exige
  periodicidade_minima INTERVAL NOT NULL, -- Ex: '1 month', '3 months'
  responsavel_sugerido TEXT, -- 'sindico', 'terceirizado', etc.
  checklist_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_nbr_requisitos_tipo ON public.nbr_requisitos(ativo_tipo_slug);
CREATE INDEX idx_nbr_requisitos_codigo ON public.nbr_requisitos(nbr_codigo);

-- RLS
ALTER TABLE public.nbr_requisitos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver requisitos NBR"
ON public.nbr_requisitos
FOR SELECT
USING (true);

-- ============================================
-- FASE 2: POPULAR TABELA NBR_REQUISITOS
-- ============================================

INSERT INTO public.nbr_requisitos (nbr_codigo, nbr_titulo, ativo_tipo_slug, requisito_descricao, periodicidade_minima, responsavel_sugerido, checklist_items) VALUES
-- NBR 5674 - Manutenção de Edificações (Geral)
('NBR 5674', 'Manutenção de Edificações', 'extintor', 'Inspeção visual mensal e recarga anual de extintores', '1 month', 'sindico', '[
  {"item": "Verificar pressão do manômetro", "obrigatorio": true},
  {"item": "Verificar lacre e pino de segurança", "obrigatorio": true},
  {"item": "Verificar estado da mangueira", "obrigatorio": true},
  {"item": "Verificar validade da carga", "obrigatorio": true},
  {"item": "Verificar sinalização", "obrigatorio": true}
]'::jsonb),

('NBR 5674', 'Manutenção de Edificações', 'elevador', 'Manutenção mensal preventiva de elevadores', '1 month', 'terceirizado', '[
  {"item": "Verificar funcionamento de botões e indicadores", "obrigatorio": true},
  {"item": "Testar sistema de alarme", "obrigatorio": true},
  {"item": "Verificar nivelamento da cabine", "obrigatorio": true},
  {"item": "Inspecionar cabos e polias", "obrigatorio": true},
  {"item": "Verificar sistema de segurança", "obrigatorio": true}
]'::jsonb),

('NBR 5674', 'Manutenção de Edificações', 'gerador', 'Teste mensal de funcionamento de gerador', '1 month', 'terceirizado', '[
  {"item": "Verificar nível de óleo", "obrigatorio": true},
  {"item": "Verificar nível de combustível", "obrigatorio": true},
  {"item": "Testar partida automática", "obrigatorio": true},
  {"item": "Verificar painel de controle", "obrigatorio": true},
  {"item": "Inspecionar bateria", "obrigatorio": true}
]'::jsonb),

-- NBR 12693 - Sistemas de proteção por extintores de incêndio
('NBR 12693', 'Extintores de Incêndio', 'extintor', 'Recarga anual e teste hidrostático conforme NBR 12693', '1 year', 'terceirizado', '[
  {"item": "Realizar recarga conforme especificação", "obrigatorio": true},
  {"item": "Teste hidrostático (a cada 5 anos)", "obrigatorio": true},
  {"item": "Emissão de laudo técnico", "obrigatorio": true},
  {"item": "Atualizar etiqueta de validade", "obrigatorio": true}
]'::jsonb),

-- NBR 13714 - Sistemas de hidrantes e mangotinhos
('NBR 13714', 'Sistemas de Hidrantes', 'bomba-incendio', 'Manutenção semestral de bombas de incêndio', '6 months', 'terceirizado', '[
  {"item": "Verificar funcionamento da bomba principal", "obrigatorio": true},
  {"item": "Testar bomba jockey", "obrigatorio": true},
  {"item": "Verificar pressão do sistema", "obrigatorio": true},
  {"item": "Inspecionar mangueiras e esguichos", "obrigatorio": true},
  {"item": "Testar acionamento automático", "obrigatorio": true}
]'::jsonb),

-- NBR 16083 - Elevadores elétricos de passageiros
('NBR 16083', 'Elevadores de Passageiros', 'elevador', 'Inspeção de segurança semestral conforme NBR 16083', '6 months', 'terceirizado', '[
  {"item": "Verificar sistema de freio de segurança", "obrigatorio": true},
  {"item": "Testar dispositivos de proteção de porta", "obrigatorio": true},
  {"item": "Verificar limitador de velocidade", "obrigatorio": true},
  {"item": "Inspecionar para-quedas", "obrigatorio": true},
  {"item": "Emissão de ART", "obrigatorio": true}
]'::jsonb),

-- NBR 5626 - Sistemas prediais de água fria e NBR 5626
('NBR 5626', 'Água Fria e Reservatórios', 'reservatorio', 'Limpeza semestral de reservatórios', '6 months', 'terceirizado', '[
  {"item": "Esvaziar e lavar reservatório", "obrigatorio": true},
  {"item": "Desinfetar com cloro", "obrigatorio": true},
  {"item": "Verificar estrutura e vedação", "obrigatorio": true},
  {"item": "Coletar amostra para análise bacteriológica", "obrigatorio": true},
  {"item": "Emissão de laudo de potabilidade", "obrigatorio": true}
]'::jsonb),

-- NBR 5419 - Proteção contra descargas atmosféricas
('NBR 5419', 'SPDA - Sistema de Proteção', 'spda', 'Inspeção anual de SPDA', '1 year', 'terceirizado', '[
  {"item": "Medição de resistência de aterramento", "obrigatorio": true},
  {"item": "Inspeção visual de captores", "obrigatorio": true},
  {"item": "Verificar conexões e emendas", "obrigatorio": true},
  {"item": "Verificar descidas e hastes", "obrigatorio": true},
  {"item": "Emissão de laudo técnico com ART", "obrigatorio": true}
]'::jsonb),

-- NBR 14039 - Instalações elétricas de média tensão
('NBR 14039', 'Instalações Elétricas', 'gerador', 'Manutenção anual de quadros elétricos', '1 year', 'terceirizado', '[
  {"item": "Termografia de quadros elétricos", "obrigatorio": true},
  {"item": "Verificar aperto de conexões", "obrigatorio": true},
  {"item": "Testar disjuntores e relés", "obrigatorio": true},
  {"item": "Verificar aterramento", "obrigatorio": true},
  {"item": "Emissão de relatório técnico", "obrigatorio": true}
]'::jsonb),

-- NBR 13523 - Central de gás
('NBR 13523', 'Central de GLP', 'central-gas', 'Inspeção mensal de central de gás', '1 month', 'terceirizado', '[
  {"item": "Verificar vazamentos com detector", "obrigatorio": true},
  {"item": "Verificar válvulas e registros", "obrigatorio": true},
  {"item": "Inspecionar mangueiras e conexões", "obrigatorio": true},
  {"item": "Verificar ventilação da central", "obrigatorio": true},
  {"item": "Verificar sinalização de segurança", "obrigatorio": true}
]'::jsonb),

-- NBR 10897 - Proteção contra incêndio por chuveiros automáticos
('NBR 10897', 'Sprinklers', 'sprinkler', 'Teste trimestral de sprinklers', '3 months', 'terceirizado', '[
  {"item": "Testar válvula de governo e alarme", "obrigatorio": true},
  {"item": "Verificar manômetros", "obrigatorio": true},
  {"item": "Inspecionar bicos aspersores", "obrigatorio": true},
  {"item": "Verificar pressão do sistema", "obrigatorio": true}
]'::jsonb);

-- ============================================
-- FASE 3: MELHORAR FUNÇÃO DE INICIALIZAÇÃO
-- ============================================

-- Atualizar função para criar ativos baseados em NBR
CREATE OR REPLACE FUNCTION public.inicializar_ativos_nbr_completo(p_condominio_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tipo_extintor UUID;
  v_tipo_elevador UUID;
  v_tipo_bomba UUID;
  v_tipo_reservatorio UUID;
  v_tipo_gerador UUID;
  v_tipo_portao UUID;
  v_tipo_spda UUID;
  v_tipo_gas UUID;
  v_ativo_id UUID;
  v_nbr_rec RECORD;
BEGIN
  -- Buscar IDs dos tipos
  SELECT id INTO v_tipo_extintor FROM ativo_tipos WHERE slug = 'extintor' LIMIT 1;
  SELECT id INTO v_tipo_elevador FROM ativo_tipos WHERE slug = 'elevador' LIMIT 1;
  SELECT id INTO v_tipo_bomba FROM ativo_tipos WHERE slug = 'bomba-incendio' LIMIT 1;
  SELECT id INTO v_tipo_reservatorio FROM ativo_tipos WHERE slug = 'reservatorio' LIMIT 1;
  SELECT id INTO v_tipo_gerador FROM ativo_tipos WHERE slug = 'gerador' LIMIT 1;
  SELECT id INTO v_tipo_portao FROM ativo_tipos WHERE slug = 'portao-automatico' LIMIT 1;
  SELECT id INTO v_tipo_spda FROM ativo_tipos WHERE slug = 'spda' LIMIT 1;
  SELECT id INTO v_tipo_gas FROM ativo_tipos WHERE slug = 'central-gas' LIMIT 1;

  -- EXTINTORES (NBR 12693)
  IF v_tipo_extintor IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_extintor, 'Extintor Portaria Principal', 'Portaria', 'Extintor ABC 6kg - NBR 12693', true, true)
    RETURNING id INTO v_ativo_id;
    
    -- Criar planos baseados em NBR
    FOR v_nbr_rec IN 
      SELECT * FROM nbr_requisitos WHERE ativo_tipo_slug = 'extintor'
    LOOP
      INSERT INTO planos_manutencao (
        condominio_id, ativo_id, titulo, tipo, periodicidade, 
        proxima_execucao, is_legal, checklist, responsavel
      ) VALUES (
        p_condominio_id, v_ativo_id, 
        v_nbr_rec.nbr_codigo || ': ' || v_nbr_rec.requisito_descricao,
        'preventiva', v_nbr_rec.periodicidade_minima,
        CURRENT_DATE + v_nbr_rec.periodicidade_minima,
        true, v_nbr_rec.checklist_items,
        COALESCE(v_nbr_rec.responsavel_sugerido, 'sindico')
      );
    END LOOP;

    -- Mais extintores
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_extintor, 'Extintor Hall Elevadores', 'Hall Social', 'Extintor ABC 6kg - NBR 12693', true, true),
      (p_condominio_id, v_tipo_extintor, 'Extintor Garagem', 'Subsolo', 'Extintor ABC 6kg - NBR 12693', true, true);
  END IF;

  -- ELEVADORES (NBR 16083)
  IF v_tipo_elevador IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_elevador, 'Elevador Social', 'Torre Principal', 'Elevador 6 pessoas - NBR 16083', true, true)
    RETURNING id INTO v_ativo_id;
    
    FOR v_nbr_rec IN 
      SELECT * FROM nbr_requisitos WHERE ativo_tipo_slug = 'elevador'
    LOOP
      INSERT INTO planos_manutencao (
        condominio_id, ativo_id, titulo, tipo, periodicidade, 
        proxima_execucao, is_legal, checklist, responsavel
      ) VALUES (
        p_condominio_id, v_ativo_id, 
        v_nbr_rec.nbr_codigo || ': ' || v_nbr_rec.requisito_descricao,
        'preventiva', v_nbr_rec.periodicidade_minima,
        CURRENT_DATE + v_nbr_rec.periodicidade_minima,
        true, v_nbr_rec.checklist_items,
        COALESCE(v_nbr_rec.responsavel_sugerido, 'terceirizado')
      );
    END LOOP;
  END IF;

  -- BOMBAS DE INCÊNDIO (NBR 13714)
  IF v_tipo_bomba IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_bomba, 'Bomba Principal Incêndio', 'Casa de Bombas', 'Sistema hidrantes - NBR 13714', true, true)
    RETURNING id INTO v_ativo_id;
    
    FOR v_nbr_rec IN 
      SELECT * FROM nbr_requisitos WHERE ativo_tipo_slug = 'bomba-incendio'
    LOOP
      INSERT INTO planos_manutencao (
        condominio_id, ativo_id, titulo, tipo, periodicidade, 
        proxima_execucao, is_legal, checklist, responsavel
      ) VALUES (
        p_condominio_id, v_ativo_id, 
        v_nbr_rec.nbr_codigo || ': ' || v_nbr_rec.requisito_descricao,
        'preventiva', v_nbr_rec.periodicidade_minima,
        CURRENT_DATE + v_nbr_rec.periodicidade_minima,
        true, v_nbr_rec.checklist_items,
        COALESCE(v_nbr_rec.responsavel_sugerido, 'terceirizado')
      );
    END LOOP;
  END IF;

  -- RESERVATÓRIOS (NBR 5626)
  IF v_tipo_reservatorio IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_reservatorio, 'Reservatório Superior', 'Terraço', 'Caixa d água 10.000L - NBR 5626', true, true)
    RETURNING id INTO v_ativo_id;
    
    FOR v_nbr_rec IN 
      SELECT * FROM nbr_requisitos WHERE ativo_tipo_slug = 'reservatorio'
    LOOP
      INSERT INTO planos_manutencao (
        condominio_id, ativo_id, titulo, tipo, periodicidade, 
        proxima_execucao, is_legal, checklist, responsavel
      ) VALUES (
        p_condominio_id, v_ativo_id, 
        v_nbr_rec.nbr_codigo || ': ' || v_nbr_rec.requisito_descricao,
        'preventiva', v_nbr_rec.periodicidade_minima,
        CURRENT_DATE + v_nbr_rec.periodicidade_minima,
        true, v_nbr_rec.checklist_items,
        COALESCE(v_nbr_rec.responsavel_sugerido, 'terceirizado')
      );
    END LOOP;
  END IF;

  -- GERADOR (NBR 5674 + NBR 14039)
  IF v_tipo_gerador IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_gerador, 'Gerador de Emergência', 'Casa de Máquinas', 'Gerador diesel 100kVA - NBR 14039', true, true)
    RETURNING id INTO v_ativo_id;
    
    FOR v_nbr_rec IN 
      SELECT * FROM nbr_requisitos WHERE ativo_tipo_slug = 'gerador'
    LOOP
      INSERT INTO planos_manutencao (
        condominio_id, ativo_id, titulo, tipo, periodicidade, 
        proxima_execucao, is_legal, checklist, responsavel
      ) VALUES (
        p_condominio_id, v_ativo_id, 
        v_nbr_rec.nbr_codigo || ': ' || v_nbr_rec.requisito_descricao,
        'preventiva', v_nbr_rec.periodicidade_minima,
        CURRENT_DATE + v_nbr_rec.periodicidade_minima,
        true, v_nbr_rec.checklist_items,
        COALESCE(v_nbr_rec.responsavel_sugerido, 'terceirizado')
      );
    END LOOP;
  END IF;

  -- SPDA (NBR 5419)
  IF v_tipo_spda IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_spda, 'SPDA - Proteção Atmosférica', 'Cobertura', 'Sistema para-raios - NBR 5419', true, true)
    RETURNING id INTO v_ativo_id;
    
    FOR v_nbr_rec IN 
      SELECT * FROM nbr_requisitos WHERE ativo_tipo_slug = 'spda'
    LOOP
      INSERT INTO planos_manutencao (
        condominio_id, ativo_id, titulo, tipo, periodicidade, 
        proxima_execucao, is_legal, checklist, responsavel
      ) VALUES (
        p_condominio_id, v_ativo_id, 
        v_nbr_rec.nbr_codigo || ': ' || v_nbr_rec.requisito_descricao,
        'preventiva', v_nbr_rec.periodicidade_minima,
        CURRENT_DATE + v_nbr_rec.periodicidade_minima,
        true, v_nbr_rec.checklist_items,
        COALESCE(v_nbr_rec.responsavel_sugerido, 'terceirizado')
      );
    END LOOP;
  END IF;

  -- GÁS (NBR 13523)
  IF v_tipo_gas IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_gas, 'Central de Gás GLP', 'Área Externa', 'Central 2x P45 - NBR 13523', true, true)
    RETURNING id INTO v_ativo_id;
    
    FOR v_nbr_rec IN 
      SELECT * FROM nbr_requisitos WHERE ativo_tipo_slug = 'central-gas'
    LOOP
      INSERT INTO planos_manutencao (
        condominio_id, ativo_id, titulo, tipo, periodicidade, 
        proxima_execucao, is_legal, checklist, responsavel
      ) VALUES (
        p_condominio_id, v_ativo_id, 
        v_nbr_rec.nbr_codigo || ': ' || v_nbr_rec.requisito_descricao,
        'preventiva', v_nbr_rec.periodicidade_minima,
        CURRENT_DATE + v_nbr_rec.periodicidade_minima,
        true, v_nbr_rec.checklist_items,
        COALESCE(v_nbr_rec.responsavel_sugerido, 'terceirizado')
      );
    END LOOP;
  END IF;

END;
$$;

-- Atualizar trigger para usar nova função
CREATE OR REPLACE FUNCTION public.trigger_inicializar_ativos_nbr()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM inicializar_ativos_nbr_completo(NEW.id);
  RETURN NEW;
END;
$$;

-- Substituir trigger existente
DROP TRIGGER IF EXISTS on_condominio_created_init_ativos ON public.condominios;
CREATE TRIGGER on_condominio_created_init_ativos
  AFTER INSERT ON public.condominios
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_inicializar_ativos_nbr();