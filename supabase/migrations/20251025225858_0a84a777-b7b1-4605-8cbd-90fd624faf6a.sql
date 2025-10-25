-- ====================================================================================
-- SEED: TEMPLATES NBR 5674 E TIPOS DE DOCUMENTOS
-- ====================================================================================

-- 1. TEMPLATES DE COMBATE A INCÊNDIO
-- ====================================================================================
INSERT INTO manut_templates (titulo_plano, sistema, periodicidade, descricao, checklist, is_conformidade, responsavel, evidencia) VALUES
('Inspeção Visual Mensal - Extintor', 'incendio', '1 month', 'Verificação visual conforme NBR 12962', 
 '[
   {"item": "Verificar pressão do manômetro (zona verde)", "obrigatorio": true},
   {"item": "Verificar lacre e selo INMETRO intactos", "obrigatorio": true},
   {"item": "Verificar integridade física do cilindro", "obrigatorio": true},
   {"item": "Verificar mangueira e gatilho sem danos", "obrigatorio": true},
   {"item": "Verificar sinalização e acesso desobstruído", "obrigatorio": true},
   {"item": "Registrar leitura do manômetro", "obrigatorio": false}
 ]'::jsonb, 
 true, 'Funcionário interno ou Fornecedor', 'Registro fotográfico do manômetro'),

('Recarga Anual - Extintor', 'incendio', '1 year', 'Recarga conforme NBR 12962', 
 '[
   {"item": "Realizar recarga completa do agente extintor", "obrigatorio": true},
   {"item": "Trocar lacre e emitir nova etiqueta de identificação", "obrigatorio": true},
   {"item": "Realizar teste de funcionamento", "obrigatorio": true},
   {"item": "Emitir ART do serviço executado", "obrigatorio": true},
   {"item": "Atualizar registro de manutenção no extintor", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado (obrigatório)', 'ART + Nota Fiscal'),

('Teste Hidrostático - Extintor', 'incendio', '5 years', 'Teste hidrostático conforme NBR 12962', 
 '[
   {"item": "Realizar teste de pressão hidrostática no cilindro", "obrigatorio": true},
   {"item": "Verificar integridade estrutural após teste", "obrigatorio": true},
   {"item": "Emitir laudo técnico do teste", "obrigatorio": true},
   {"item": "Emitir ART do responsável técnico", "obrigatorio": true},
   {"item": "Aplicar nova etiqueta com data do teste", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado (obrigatório)', 'Laudo Técnico + ART'),

('Inspeção Semestral - Hidrantes', 'incendio', '6 months', 'Inspeção de hidrantes conforme NBR 13714', 
 '[
   {"item": "Verificar pressão da rede", "obrigatorio": true},
   {"item": "Testar funcionamento de válvulas", "obrigatorio": true},
   {"item": "Verificar estado das mangueiras", "obrigatorio": true},
   {"item": "Verificar esguichos e acessórios", "obrigatorio": true},
   {"item": "Verificar sinalização e acesso", "obrigatorio": true},
   {"item": "Emitir relatório técnico", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado', 'Relatório Técnico');

-- 2. TEMPLATES DE ELEVADORES
-- ====================================================================================
INSERT INTO manut_templates (titulo_plano, sistema, periodicidade, descricao, checklist, is_conformidade, responsavel, evidencia) VALUES
('Manutenção Preventiva Mensal - Elevador', 'elevadores', '1 month', 'Preventiva conforme NR-12 e NBR 16042', 
 '[
   {"item": "Inspeção visual geral da cabine e componentes", "obrigatorio": true},
   {"item": "Lubrificação de trilhos e componentes móveis", "obrigatorio": true},
   {"item": "Teste de freios de segurança", "obrigatorio": true},
   {"item": "Verificar limitadores de velocidade", "obrigatorio": true},
   {"item": "Testar sistema de emergência e alarme", "obrigatorio": true},
   {"item": "Verificar portas e travas de segurança", "obrigatorio": true},
   {"item": "Testar botoeiras e sinalização", "obrigatorio": true},
   {"item": "Emitir relatório técnico mensal", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado (obrigatório)', 'Relatório Técnico Mensal'),

('Inspeção Anual INMETRO - Elevador', 'elevadores', '1 year', 'Inspeção obrigatória INMETRO', 
 '[
   {"item": "Inspeção completa por órgão certificado", "obrigatorio": true},
   {"item": "Teste de todos os dispositivos de segurança", "obrigatorio": true},
   {"item": "Verificação de conformidade com NR-12", "obrigatorio": true},
   {"item": "Emissão de certificado INMETRO", "obrigatorio": true},
   {"item": "Emissão de ART do responsável técnico", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor certificado INMETRO', 'Certificado INMETRO + ART');

-- 3. TEMPLATES DE HIDRÁULICA
-- ====================================================================================
INSERT INTO manut_templates (titulo_plano, sistema, periodicidade, descricao, checklist, is_conformidade, responsavel, evidencia) VALUES
('Limpeza Semestral - Reservatório', 'hidraulica', '6 months', 'Limpeza conforme Portaria MS 2.914/2011', 
 '[
   {"item": "Comunicar usuários sobre interrupção de água", "obrigatorio": true},
   {"item": "Esvaziar completamente o reservatório", "obrigatorio": true},
   {"item": "Realizar limpeza manual completa", "obrigatorio": true},
   {"item": "Desinfetar com hipoclorito de sódio", "obrigatorio": true},
   {"item": "Enxaguar e reencher o reservatório", "obrigatorio": true},
   {"item": "Coletar amostra para análise laboratorial", "obrigatorio": true},
   {"item": "Emitir laudo de qualidade da água", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado', 'Laudo de Qualidade da Água'),

('Manutenção Trimestral - Bombas de Recalque', 'hidraulica', '3 months', 'Manutenção preventiva de bombas', 
 '[
   {"item": "Verificar funcionamento e ruídos anormais", "obrigatorio": true},
   {"item": "Verificar nível de óleo lubrificante", "obrigatorio": true},
   {"item": "Verificar vedações e vazamentos", "obrigatorio": true},
   {"item": "Testar pressostato e boia", "obrigatorio": true},
   {"item": "Verificar quadro elétrico e proteções", "obrigatorio": true},
   {"item": "Registrar tempo de partida e pressão", "obrigatorio": true}
 ]'::jsonb, 
 false, 'Funcionário ou Fornecedor', 'Registro fotográfico');

-- 4. TEMPLATES DE SPDA (PARA-RAIOS)
-- ====================================================================================
INSERT INTO manut_templates (titulo_plano, sistema, periodicidade, descricao, checklist, is_conformidade, responsavel, evidencia) VALUES
('Inspeção Anual - SPDA', 'spda', '1 year', 'Inspeção conforme NBR 5419', 
 '[
   {"item": "Medição de resistência de aterramento", "obrigatorio": true},
   {"item": "Inspeção visual de captores (para-raios)", "obrigatorio": true},
   {"item": "Verificar estado de cabos descida", "obrigatorio": true},
   {"item": "Verificar conexões e emendas", "obrigatorio": true},
   {"item": "Verificar hastes de aterramento", "obrigatorio": true},
   {"item": "Emitir laudo técnico com medições", "obrigatorio": true},
   {"item": "Emitir ART do responsável técnico", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado (obrigatório)', 'Laudo Técnico + ART');

-- 5. TEMPLATES DE ELÉTRICA
-- ====================================================================================
INSERT INTO manut_templates (titulo_plano, sistema, periodicidade, descricao, checklist, is_conformidade, responsavel, evidencia) VALUES
('Teste Mensal - Gerador', 'eletrica', '1 month', 'Teste de funcionamento mensal', 
 '[
   {"item": "Ligar gerador e verificar partida", "obrigatorio": true},
   {"item": "Verificar nível de óleo lubrificante", "obrigatorio": true},
   {"item": "Verificar nível de combustível", "obrigatorio": true},
   {"item": "Testar transferência automática", "obrigatorio": true},
   {"item": "Registrar tempo de estabilização", "obrigatorio": true},
   {"item": "Verificar temperatura de operação", "obrigatorio": true},
   {"item": "Verificar tensão e frequência geradas", "obrigatorio": true}
 ]'::jsonb, 
 false, 'Funcionário ou Fornecedor', 'Registro de teste'),

('Manutenção Preventiva Semestral - Gerador', 'eletrica', '6 months', 'Preventiva completa do gerador', 
 '[
   {"item": "Trocar óleo lubrificante e filtros", "obrigatorio": true},
   {"item": "Verificar e limpar filtro de ar", "obrigatorio": true},
   {"item": "Verificar sistema de arrefecimento", "obrigatorio": true},
   {"item": "Verificar bateria e sistema de partida", "obrigatorio": true},
   {"item": "Verificar aperto de conexões elétricas", "obrigatorio": true},
   {"item": "Testar sob carga", "obrigatorio": true},
   {"item": "Emitir relatório técnico", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado', 'Relatório Técnico'),

('Inspeção Bienal - Quadro Elétrico Geral', 'eletrica', '2 years', 'Inspeção conforme NBR 5410', 
 '[
   {"item": "Termografia de conexões e barramentos", "obrigatorio": true},
   {"item": "Verificar aperto de todas as conexões", "obrigatorio": true},
   {"item": "Testar disjuntores e proteções", "obrigatorio": true},
   {"item": "Verificar estado de isolação", "obrigatorio": true},
   {"item": "Emitir laudo técnico", "obrigatorio": true},
   {"item": "Emitir ART", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado (obrigatório)', 'Laudo Técnico + ART');

-- 6. TEMPLATES DE PMOC
-- ====================================================================================
INSERT INTO manut_templates (titulo_plano, sistema, periodicidade, descricao, checklist, is_conformidade, responsavel, evidencia) VALUES
('Manutenção Mensal - PMOC', 'pmoc', '1 month', 'PMOC conforme Lei 13.589/2018 e Portaria MS 3.523/98', 
 '[
   {"item": "Limpeza de filtros de ar", "obrigatorio": true},
   {"item": "Verificação de bandejas de condensação", "obrigatorio": true},
   {"item": "Limpeza de serpentinas", "obrigatorio": true},
   {"item": "Verificação de vazamentos de gás", "obrigatorio": true},
   {"item": "Verificação de isolamento térmico", "obrigatorio": true},
   {"item": "Registro de temperatura ambiente", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado', 'Registro de Manutenção'),

('Análise de Qualidade do Ar - PMOC', 'pmoc', '6 months', 'Análise laboratorial conforme PMOC', 
 '[
   {"item": "Coleta de amostras de ar interior", "obrigatorio": true},
   {"item": "Análise microbiológica (fungos/bactérias)", "obrigatorio": true},
   {"item": "Análise físico-química (CO2, CO, particulados)", "obrigatorio": true},
   {"item": "Emissão de laudo laboratorial", "obrigatorio": true},
   {"item": "Atualização do Plano de PMOC", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor certificado', 'Laudo Laboratorial + PMOC atualizado');

-- 7. TEMPLATES DE GÁS
-- ====================================================================================
INSERT INTO manut_templates (titulo_plano, sistema, periodicidade, descricao, checklist, is_conformidade, responsavel, evidencia) VALUES
('Inspeção Anual - Central de Gás', 'gas', '1 year', 'Inspeção conforme NBR 15526', 
 '[
   {"item": "Verificar estado de tubulações", "obrigatorio": true},
   {"item": "Teste de estanqueidade do sistema", "obrigatorio": true},
   {"item": "Verificar válvulas e registros", "obrigatorio": true},
   {"item": "Verificar ventilação da central", "obrigatorio": true},
   {"item": "Emitir laudo técnico", "obrigatorio": true},
   {"item": "Emitir ART", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Fornecedor especializado (obrigatório)', 'Laudo Técnico + ART');

-- 8. TEMPLATES DE ESTRUTURA
-- ====================================================================================
INSERT INTO manut_templates (titulo_plano, sistema, periodicidade, descricao, checklist, is_conformidade, responsavel, evidencia) VALUES
('Inspeção Predial Completa', 'inspecao_predial', '5 years', 'Inspeção conforme NBR 16747 e Lei de Inspeção Predial', 
 '[
   {"item": "Inspeção de estrutura (lajes, vigas, pilares)", "obrigatorio": true},
   {"item": "Inspeção de fachadas e revestimentos", "obrigatorio": true},
   {"item": "Inspeção de impermeabilização", "obrigatorio": true},
   {"item": "Inspeção de esquadrias", "obrigatorio": true},
   {"item": "Classificação de anomalias (crítica/regular/mínima)", "obrigatorio": true},
   {"item": "Emissão de laudo técnico completo", "obrigatorio": true},
   {"item": "Emissão de ART", "obrigatorio": true}
 ]'::jsonb, 
 true, 'Engenheiro Civil (obrigatório)', 'Laudo de Inspeção Predial + ART');

-- 9. TIPOS DE DOCUMENTOS
-- ====================================================================================
INSERT INTO documento_tipos (codigo, nome, descricao) VALUES
('LAUDO_TEC', 'Laudo Técnico', 'Laudo técnico de manutenção, inspeção ou vistoria'),
('ART', 'ART - Anotação de Responsabilidade Técnica', 'Registro do CREA/CAU do responsável técnico'),
('CERT_INMETRO', 'Certificado INMETRO', 'Certificação de equipamentos (elevadores, etc)'),
('LAUDO_AGUA', 'Laudo de Qualidade da Água', 'Análise laboratorial de potabilidade'),
('LAUDO_AR', 'Laudo de Qualidade do Ar', 'Análise laboratorial PMOC'),
('MANUAL_EQUIP', 'Manual do Equipamento', 'Manual técnico do fabricante'),
('NF_SERVICO', 'Nota Fiscal de Serviço', 'Comprovante fiscal de execução'),
('PMOC', 'Plano de PMOC', 'Plano de Manutenção, Operação e Controle'),
('CERT_BRIGADA', 'Certificado de Brigada', 'Certificado de treinamento de brigadistas'),
('PROJETO_SPDA', 'Projeto de SPDA', 'Projeto técnico do sistema de para-raios')
ON CONFLICT (codigo) DO NOTHING;

-- 10. CRIAR RELACIONAMENTO TEMPLATE-DOCUMENTOS
-- ====================================================================================
-- Extintores precisam de ART na recarga anual
INSERT INTO manut_template_documentos (template_id, documento_tipo_id, obrigatorio)
SELECT 
  t.id,
  dt.id,
  true
FROM manut_templates t
CROSS JOIN documento_tipos dt
WHERE t.titulo_plano = 'Recarga Anual - Extintor' AND dt.codigo = 'ART';

-- Extintores precisam de Laudo no teste hidrostático
INSERT INTO manut_template_documentos (template_id, documento_tipo_id, obrigatorio)
SELECT 
  t.id,
  dt.id,
  true
FROM manut_templates t
CROSS JOIN documento_tipos dt
WHERE t.titulo_plano = 'Teste Hidrostático - Extintor' AND dt.codigo IN ('LAUDO_TEC', 'ART');

-- Elevadores precisam de certificado INMETRO
INSERT INTO manut_template_documentos (template_id, documento_tipo_id, obrigatorio)
SELECT 
  t.id,
  dt.id,
  true
FROM manut_templates t
CROSS JOIN documento_tipos dt
WHERE t.titulo_plano = 'Inspeção Anual INMETRO - Elevador' AND dt.codigo IN ('CERT_INMETRO', 'ART');

-- Reservatórios precisam de laudo de água
INSERT INTO manut_template_documentos (template_id, documento_tipo_id, obrigatorio)
SELECT 
  t.id,
  dt.id,
  true
FROM manut_templates t
CROSS JOIN documento_tipos dt
WHERE t.titulo_plano = 'Limpeza Semestral - Reservatório' AND dt.codigo = 'LAUDO_AGUA';

-- SPDA precisa de laudo + ART
INSERT INTO manut_template_documentos (template_id, documento_tipo_id, obrigatorio)
SELECT 
  t.id,
  dt.id,
  true
FROM manut_templates t
CROSS JOIN documento_tipos dt
WHERE t.titulo_plano = 'Inspeção Anual - SPDA' AND dt.codigo IN ('LAUDO_TEC', 'ART');

-- PMOC precisa de laudo de ar + PMOC atualizado
INSERT INTO manut_template_documentos (template_id, documento_tipo_id, obrigatorio)
SELECT 
  t.id,
  dt.id,
  true
FROM manut_templates t
CROSS JOIN documento_tipos dt
WHERE t.titulo_plano = 'Análise de Qualidade do Ar - PMOC' AND dt.codigo IN ('LAUDO_AR', 'PMOC');

-- Gás precisa de laudo + ART
INSERT INTO manut_template_documentos (template_id, documento_tipo_id, obrigatorio)
SELECT 
  t.id,
  dt.id,
  true
FROM manut_templates t
CROSS JOIN documento_tipos dt
WHERE t.titulo_plano = 'Inspeção Anual - Central de Gás' AND dt.codigo IN ('LAUDO_TEC', 'ART');

-- Inspeção Predial precisa de laudo + ART
INSERT INTO manut_template_documentos (template_id, documento_tipo_id, obrigatorio)
SELECT 
  t.id,
  dt.id,
  true
FROM manut_templates t
CROSS JOIN documento_tipos dt
WHERE t.titulo_plano = 'Inspeção Predial Completa' AND dt.codigo IN ('LAUDO_TEC', 'ART');