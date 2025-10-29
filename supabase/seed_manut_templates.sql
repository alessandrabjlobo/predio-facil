-- ============================================================================
-- NBR 5674 MAINTENANCE TEMPLATES SEED - COMPREHENSIVE LIBRARY
-- ============================================================================
--
-- This seed file populates the global Maintenance Templates Library with
-- normative preventive maintenance plans strictly aligned with:
-- - ABNT NBR 5674 (Manutenção de Edificações)
-- - NBR 5410, 5419, 13714, 17240, 10898, 13434, 9077, 9050
-- - NBR 5626, 15526, 15575, 13755, 9574/9575, 12962, 15808/15980
-- - Portarias ministeriais e legislação aplicável
--
-- Idempotency: Uses WHERE NOT EXISTS to prevent duplicates
-- ============================================================================

-- ============================================================================
-- INCÊNDIO (Fire Protection) - 5 templates
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'incendio',
  'Extintores – Inspeção Anual',
  'Inspeção, teste hidrostático e recarga anual de extintores conforme NBR 12962, 15808 e 15980',
  interval '1 year',
  'empresa especializada',
  'Certificado de recarga com ART, etiquetas de validade, relatório fotográfico',
  '[
    {"descricao":"Verificar validade da carga e estado do cilindro","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"certificado de recarga, etiquetas","referencia":"NBR 12962, NBR 15808"},
    {"descricao":"Realizar teste hidrostático quinquenal","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"certificado com ART","referencia":"NBR 12962"},
    {"descricao":"Verificar pressão, lacre, pino de segurança e gatilho","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"checklist fotográfico","referencia":"NBR 15808, IT CBM"},
    {"descricao":"Checar sinalização e desobstrução de acesso ao extintor","responsavel":"zeladoria","tipo_manutencao":"rotineira","evidencia":"checklist visual, fotos","referencia":"IT CBM local, NBR 13434"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'incendio' AND titulo_plano = 'Extintores – Inspeção Anual'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'incendio',
  'Alarme de Incêndio – Teste Mensal',
  'Teste mensal de detectores, acionadores e central conforme NBR 17240',
  interval '1 month',
  'empresa especializada',
  'Relatório de teste com assinatura de técnico responsável, fotos',
  '[
    {"descricao":"Testar detectores de fumaça e temperatura (amostragem rotativa)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste, checklist","referencia":"NBR 17240"},
    {"descricao":"Acionar botoeiras manuais e verificar sirenes/sinalizadores","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste","referencia":"NBR 17240, IT CBM"},
    {"descricao":"Verificar estado da central, baterias e loops de comunicação","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório técnico, medições","referencia":"NBR 17240"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'incendio' AND titulo_plano = 'Alarme de Incêndio – Teste Mensal'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'incendio',
  'Iluminação de Emergência – Teste Mensal',
  'Teste de funcionamento e autonomia das luminárias de emergência conforme NBR 10898',
  interval '1 month',
  'zeladoria',
  'Checklist de teste, registro de luminárias não conformes, fotos',
  '[
    {"descricao":"Desligar energia e verificar acionamento automático das luminárias","responsavel":"zeladoria","tipo_manutencao":"preventiva","evidencia":"checklist de teste, cronômetro","referencia":"NBR 10898"},
    {"descricao":"Testar autonomia mínima de 1 hora (amostragem)","responsavel":"zeladoria","tipo_manutencao":"preventiva","evidencia":"registro de tempo, checklist","referencia":"NBR 10898"},
    {"descricao":"Verificar sinalização de rotas de fuga e visibilidade","responsavel":"zeladoria","tipo_manutencao":"rotineira","evidencia":"checklist fotográfico","referencia":"NBR 10898, NBR 13434"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'incendio' AND titulo_plano = 'Iluminação de Emergência – Teste Mensal'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'incendio',
  'Hidrantes e Mangotinhos – Inspeção Semestral',
  'Inspeção e teste do sistema de hidrantes/mangotinhos conforme NBR 13714',
  interval '6 months',
  'empresa especializada',
  'Relatório técnico com pressões medidas, fotos, checklist assinado',
  '[
    {"descricao":"Testar partida das bombas (principal e jockey)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste com medições de pressão","referencia":"NBR 13714"},
    {"descricao":"Verificar pressão do sistema nos manômetros","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório com medições, fotos","referencia":"NBR 13714"},
    {"descricao":"Inspecionar mangueiras, esguichos, válvulas e abrigos","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"checklist fotográfico, relatório de não conformidades","referencia":"NBR 13714, IT CBM"},
    {"descricao":"Verificar estanqueidade visível e sinalização dos hidrantes","responsavel":"zeladoria","tipo_manutencao":"rotineira","evidencia":"checklist visual","referencia":"NBR 5674"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'incendio' AND titulo_plano = 'Hidrantes e Mangotinhos – Inspeção Semestral'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'incendio',
  'Sinalização de Emergência – Inspeção Semestral',
  'Inspeção de sinalização fotoluminescente e rotas de fuga conforme NBR 13434',
  interval '6 months',
  'sindico',
  'Checklist fotográfico, relatório de não conformidades',
  '[
    {"descricao":"Verificar integridade e visibilidade de placas fotoluminescentes","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"checklist com fotos","referencia":"NBR 13434"},
    {"descricao":"Checar sinalização de rotas de fuga, escadas e saídas","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"checklist fotográfico","referencia":"NBR 13434, NBR 9077"},
    {"descricao":"Verificar desobstrução de rotas e portas de emergência","responsavel":"zeladoria","tipo_manutencao":"rotineira","evidencia":"checklist, fotos","referencia":"NBR 9077, IT CBM"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'incendio' AND titulo_plano = 'Sinalização de Emergência – Inspeção Semestral'
);

-- ============================================================================
-- SPDA (Lightning Protection) - 1 template
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'spda',
  'SPDA – Inspeção Anual',
  'Inspeção anual do Sistema de Proteção contra Descargas Atmosféricas conforme NBR 5419',
  interval '1 year',
  'empresa especializada',
  'Laudo técnico com ART, medições de resistência de aterramento, fotos',
  '[
    {"descricao":"Medir resistência de aterramento (< 10 ohms)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"laudo técnico com ART, planilha de medições","referencia":"NBR 5419"},
    {"descricao":"Inspecionar visualmente captores, hastes, descidas e conexões","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório fotográfico, checklist","referencia":"NBR 5419"},
    {"descricao":"Verificar continuidade elétrica das descidas","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste com medições","referencia":"NBR 5419"},
    {"descricao":"Inspecionar eletrodos de aterramento e caixas de inspeção","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"fotos, relatório","referencia":"NBR 5419"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'spda' AND titulo_plano = 'SPDA – Inspeção Anual'
);

-- ============================================================================
-- ELEVAÇÃO (Elevators) - 1 template
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'elevacao',
  'Elevadores – Manutenção Mensal',
  'Manutenção preventiva mensal contratual conforme NR-12, legislação local e contrato',
  interval '1 month',
  'empresa especializada',
  'Boletim de manutenção assinado, OS assinada, registro no livro de ocorrências',
  '[
    {"descricao":"Executar manutenção preventiva conforme checklist contratual","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"boletim assinado, OS","referencia":"Contrato de manutenção, NR-12"},
    {"descricao":"Testar dispositivos de segurança (trava de porta, para-quedas, etc)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste","referencia":"NR-12, NBR 16042"},
    {"descricao":"Registrar pendências e não conformidades no livro","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"livro de ocorrências atualizado","referencia":"Legislação municipal, NBR 5674"},
    {"descricao":"Verificar histórico de chamados e intervenções corretivas","responsavel":"sindico","tipo_manutencao":"rotineira","evidencia":"histórico consolidado","referencia":"NBR 5674"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'elevacao' AND titulo_plano = 'Elevadores – Manutenção Mensal'
);

-- ============================================================================
-- CLIMATIZAÇÃO (HVAC/PMOC) - 1 template
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'climatizacao',
  'PMOC – Ar Condicionado – Rotina Mensal',
  'Plano de Manutenção, Operação e Controle (PMOC) mensal conforme Portaria 3523/GM e RE-09 ANVISA',
  interval '1 month',
  'empresa especializada',
  'Relatório de intervenção assinado, registro no livro PMOC, medições de qualidade do ar',
  '[
    {"descricao":"Limpar filtros e serpentinas dos equipamentos","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório com fotos antes/depois","referencia":"Portaria 3523/GM, RE-09 ANVISA"},
    {"descricao":"Medir temperatura, umidade e vazão de ar (amostragem)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de medições, planilha","referencia":"RE-09 ANVISA"},
    {"descricao":"Registrar intervenções no livro de manutenção PMOC","responsavel":"empresa especializada","tipo_manutencao":"rotineira","evidencia":"livro PMOC atualizado","referencia":"Portaria 3523/GM"},
    {"descricao":"Coletar amostras para análise de qualidade do ar (conforme periodicidade PMOC)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"laudo laboratorial","referencia":"RE-09 ANVISA"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'climatizacao' AND titulo_plano = 'PMOC – Ar Condicionado – Rotina Mensal'
);

-- ============================================================================
-- ELÉTRICA (Electrical) - 2 templates
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'eletrica',
  'Painéis/Quadros Elétricos – Inspeção Trimestral',
  'Inspeção trimestral de painéis e quadros elétricos conforme NBR 5410 e NR-10',
  interval '3 months',
  'empresa especializada',
  'Relatório de inspeção com fotos, termografia (se aplicável), checklist assinado',
  '[
    {"descricao":"Realizar inspeção termográfica dos quadros (se aplicável)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório termográfico com ART, imagens térmicas","referencia":"NBR 5410, NR-10"},
    {"descricao":"Verificar e reapertar conexões elétricas","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"checklist, fotos","referencia":"NBR 5410, NBR 5674"},
    {"descricao":"Testar DR (dispositivo residual) e disjuntores","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste","referencia":"NBR 5410"},
    {"descricao":"Verificar identificação e sinalização dos circuitos","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"fotos, checklist","referencia":"NBR 5410, NR-10"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'eletrica' AND titulo_plano = 'Painéis/Quadros Elétricos – Inspeção Trimestral'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'eletrica',
  'Grupo Gerador – Partida de Teste Mensal',
  'Teste mensal de partida e funcionamento do grupo gerador conforme manual do fabricante',
  interval '1 month',
  'empresa especializada',
  'Relatório de teste com registro de horímetro, fotos, checklist',
  '[
    {"descricao":"Realizar teste de funcionamento sob carga (mínimo 30% da carga)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste, registro de horímetro","referencia":"Manual do fabricante, NBR 5674"},
    {"descricao":"Verificar nível de óleo, combustível e líquido de arrefecimento","responsavel":"zeladoria","tipo_manutencao":"rotineira","evidencia":"checklist","referencia":"Manual do fabricante"},
    {"descricao":"Testar partida automática e transferência de carga","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste","referencia":"Manual do fabricante"},
    {"descricao":"Verificar filtros, bateria, correias e conexões","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"checklist com fotos","referencia":"Manual do fabricante"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'eletrica' AND titulo_plano = 'Grupo Gerador – Partida de Teste Mensal'
);

-- ============================================================================
-- HIDRÁULICA (Plumbing) - 2 templates
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'hidraulica',
  'Bombas de Água – Inspeção Mensal',
  'Inspeção mensal de bombas de água (recalque, pressurização) conforme manual do fabricante',
  interval '1 month',
  'equipe local',
  'Checklist de inspeção, registro de funcionamento, fotos',
  '[
    {"descricao":"Testar funcionamento e acionamento automático das bombas","responsavel":"equipe local","tipo_manutencao":"preventiva","evidencia":"checklist, registro de teste","referencia":"Manual do fabricante, NBR 5626"},
    {"descricao":"Verificar ruídos anormais, vazamentos e vibrações","responsavel":"equipe local","tipo_manutencao":"rotineira","evidencia":"checklist visual, fotos","referencia":"Manual do fabricante"},
    {"descricao":"Checar pressostato, bóia e quadro de comando","responsavel":"equipe local","tipo_manutencao":"preventiva","evidencia":"checklist, fotos","referencia":"NBR 5626"}
  ]'::jsonb,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'hidraulica' AND titulo_plano = 'Bombas de Água – Inspeção Mensal'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'reservatorios',
  'Reservatórios – Limpeza/Sanitização Semestral',
  'Limpeza e desinfecção semestral de reservatórios de água conforme Portaria MS e legislação local',
  interval '6 months',
  'empresa especializada',
  'Certificado de limpeza com ART, laudo de potabilidade, fotos, nota fiscal',
  '[
    {"descricao":"Esvaziar, limpar e desinfetar o reservatório","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"certificado de limpeza com ART, fotos antes/depois","referencia":"Portaria 2914 MS, legislação municipal"},
    {"descricao":"Coletar amostra para análise bacteriológica da água","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"laudo de potabilidade de laboratório credenciado","referencia":"Portaria 2914 MS"},
    {"descricao":"Inspecionar tampas, extravasores, telas e estrutura física","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório com fotos, checklist","referencia":"NBR 5626, NBR 5674"},
    {"descricao":"Verificar vedação contra entrada de vetores","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"checklist fotográfico","referencia":"Vigilância Sanitária local"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'reservatorios' AND titulo_plano = 'Reservatórios – Limpeza/Sanitização Semestral'
);

-- ============================================================================
-- GÁS (Gas) - 1 template
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'gas',
  'Sistema de Gás – Inspeção Semestral',
  'Inspeção semestral da central de GLP/GN conforme NBR 15526 e NBR 13523',
  interval '6 months',
  'empresa especializada',
  'Laudo técnico com ART, relatório de estanqueidade, fotos',
  '[
    {"descricao":"Inspecionar central, reguladores, válvulas e tubulações","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório com fotos, ART","referencia":"NBR 15526, NBR 13523"},
    {"descricao":"Realizar teste de estanqueidade com detector de vazamento","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste com ART","referencia":"NBR 15526"},
    {"descricao":"Verificar ventilação adequada da central de gás","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório, fotos, medições","referencia":"NBR 13523"},
    {"descricao":"Checar sinalização de segurança e extintores próximos","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"checklist fotográfico","referencia":"NBR 13523, NR-20"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'gas' AND titulo_plano = 'Sistema de Gás – Inspeção Semestral'
);

-- ============================================================================
-- SEGURANÇA/COMUNICAÇÕES (Security) - 3 templates
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'seguranca',
  'CFTV – Verificação Mensal',
  'Verificação mensal do sistema de CFTV conforme procedimento interno',
  interval '1 month',
  'equipe local',
  'Checklist de verificação, capturas de imagem, relatório de não conformidades',
  '[
    {"descricao":"Verificar funcionamento de câmeras e qualidade de gravação","responsavel":"equipe local","tipo_manutencao":"preventiva","evidencia":"checklist, capturas de tela","referencia":"Procedimento interno"},
    {"descricao":"Testar qualidade de imagem e iluminação noturna (se aplicável)","responsavel":"equipe local","tipo_manutencao":"preventiva","evidencia":"capturas em horários variados","referencia":"Boas práticas CFTV"},
    {"descricao":"Verificar fontes, nobreak e baterias do sistema","responsavel":"equipe local","tipo_manutencao":"preventiva","evidencia":"checklist","referencia":"Procedimento interno"}
  ]'::jsonb,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'seguranca' AND titulo_plano = 'CFTV – Verificação Mensal'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'seguranca',
  'Controle de Acesso – Verificação Mensal',
  'Verificação mensal de catracas, fechaduras e leitores de controle de acesso',
  interval '1 month',
  'equipe local',
  'Checklist de teste, relatório de falhas, fotos',
  '[
    {"descricao":"Testar leitores de cartão/biometria e catracas","responsavel":"equipe local","tipo_manutencao":"preventiva","evidencia":"checklist de teste","referencia":"Manual dos equipamentos"},
    {"descricao":"Verificar fechaduras eletromagnéticas e travas","responsavel":"equipe local","tipo_manutencao":"preventiva","evidencia":"checklist, fotos","referencia":"Manual dos equipamentos"},
    {"descricao":"Checar sincronização com software de gestão","responsavel":"equipe local","tipo_manutencao":"preventiva","evidencia":"relatório de teste","referencia":"Procedimento interno"}
  ]'::jsonb,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'seguranca' AND titulo_plano = 'Controle de Acesso – Verificação Mensal'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'seguranca',
  'Portões Automáticos – Verificação Trimestral',
  'Inspeção trimestral de portões automáticos conforme norma do fabricante e segurança',
  interval '3 months',
  'empresa especializada',
  'Relatório de inspeção, checklist, fotos, teste de segurança',
  '[
    {"descricao":"Testar sensores de segurança (fotocélula, borda sensível)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste de segurança","referencia":"Manual do fabricante, NR-12"},
    {"descricao":"Verificar motor, corrente/correia e trilhos","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"checklist com fotos","referencia":"Manual do fabricante"},
    {"descricao":"Lubrificar partes móveis e ajustar fim de curso","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"checklist","referencia":"Manual do fabricante"}
  ]'::jsonb,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'seguranca' AND titulo_plano = 'Portões Automáticos – Verificação Trimestral'
);

-- ============================================================================
-- ENVOLTÓRIO/DESEMPENHO (Building Envelope) - 2 templates
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'envoltorio',
  'Fachadas e Revestimentos – Inspeção Anual',
  'Inspeção anual de fachadas e revestimentos externos conforme NBR 13755, 15575, 9574/9575',
  interval '1 year',
  'empresa especializada',
  'Relatório técnico com ART, fotos, mapeamento de não conformidades',
  '[
    {"descricao":"Inspecionar visualmente revestimentos (descolamentos, trincas, infiltrações)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório fotográfico com ART","referencia":"NBR 13755, NBR 15575"},
    {"descricao":"Realizar teste de aderência por percussão (balde d''água)","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório de teste, fotos","referencia":"NBR 13755"},
    {"descricao":"Verificar juntas de movimentação e selantes","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório com fotos","referencia":"NBR 13755"},
    {"descricao":"Elaborar plano de reparo para áreas críticas","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"plano de ação com ART","referencia":"NBR 5674"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'envoltorio' AND titulo_plano = 'Fachadas e Revestimentos – Inspeção Anual'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'envoltorio',
  'Coberturas e Vedações – Inspeção Semestral',
  'Inspeção semestral de coberturas, rufos, calhas e vedações conforme NBR 15575, 9574/9575',
  interval '6 months',
  'empresa especializada',
  'Relatório de inspeção com fotos, checklist, mapeamento de infiltrações',
  '[
    {"descricao":"Inspecionar telhas, rufos, calhas e condutores pluviais","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório fotográfico, checklist","referencia":"NBR 5674, NBR 15575"},
    {"descricao":"Verificar pontos de infiltração e umidade","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"fotos, mapeamento","referencia":"NBR 9574/9575"},
    {"descricao":"Limpar calhas e condutores (desobstruir)","responsavel":"zeladoria","tipo_manutencao":"rotineira","evidencia":"registro de serviço, fotos","referencia":"NBR 5674"},
    {"descricao":"Checar impermeabilização de lajes e juntas de dilatação","responsavel":"empresa especializada","tipo_manutencao":"preventiva","evidencia":"relatório, fotos","referencia":"NBR 9574/9575"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'envoltorio' AND titulo_plano = 'Coberturas e Vedações – Inspeção Semestral'
);

-- ============================================================================
-- SAÍDAS/ACESSIBILIDADE (Emergency Exits / Accessibility) - 2 templates
-- ============================================================================

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'saida-emergencia',
  'Saídas de Emergência – Inspeção Trimestral',
  'Inspeção trimestral de rotas de fuga, escadas e portas de emergência conforme NBR 9077',
  interval '3 months',
  'sindico',
  'Checklist fotográfico, relatório de não conformidades',
  '[
    {"descricao":"Verificar desobstrução de rotas de fuga e escadas de emergência","responsavel":"sindico","tipo_manutencao":"rotineira","evidencia":"checklist com fotos","referencia":"NBR 9077, IT CBM"},
    {"descricao":"Testar portas corta-fogo e barras antipânico","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"checklist de teste","referencia":"NBR 9077, NBR 11742"},
    {"descricao":"Verificar fechamento automático de portas","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"checklist","referencia":"NBR 9077, IT CBM"},
    {"descricao":"Checar sinalização de emergência e visibilidade","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"checklist fotográfico","referencia":"NBR 13434"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'saida-emergencia' AND titulo_plano = 'Saídas de Emergência – Inspeção Trimestral'
);

INSERT INTO public.manut_templates (
  sistema, titulo_plano, descricao, periodicidade, responsavel,
  evidencia, checklist, is_conformidade
)
SELECT
  'acessibilidade',
  'Acessibilidade de Rotas e Sinalização – Inspeção Semestral',
  'Inspeção semestral de rotas acessíveis, rampas e sinalização conforme NBR 9050',
  interval '6 months',
  'sindico',
  'Relatório de inspeção com fotos, checklist, plano de adequação',
  '[
    {"descricao":"Inspecionar rotas acessíveis, rampas e desníveis","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"relatório com fotos, medições","referencia":"NBR 9050, Lei 13146/2015"},
    {"descricao":"Verificar sinalização tátil e visual (piso tátil, braile)","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"checklist fotográfico","referencia":"NBR 9050"},
    {"descricao":"Checar pisos táteis de alerta e direcional","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"fotos, checklist","referencia":"NBR 9050"},
    {"descricao":"Identificar ajustes necessários e elaborar plano de ação","responsavel":"sindico","tipo_manutencao":"preventiva","evidencia":"relatório de não conformidades, plano de ação","referencia":"NBR 9050, NBR 5674"}
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.manut_templates
  WHERE sistema = 'acessibilidade' AND titulo_plano = 'Acessibilidade de Rotas e Sinalização – Inspeção Semestral'
);

-- ============================================================================
-- END OF SEED FILE
-- ============================================================================
--
-- Summary:
-- Total Templates: 18
-- Categories: incendio (5), spda (1), elevacao (1), climatizacao (1),
--             eletrica (2), hidraulica (1), reservatorios (1), gas (1),
--             seguranca (3), envoltorio (2), saida-emergencia (1), acessibilidade (1)
--
-- All templates follow NBR 5674 and related norms
-- All inserts use WHERE NOT EXISTS for idempotency
-- All periodicidade values use INTERVAL type
-- All checklists include required keys: descricao, responsavel, tipo_manutencao, evidencia, referencia
-- ============================================================================
