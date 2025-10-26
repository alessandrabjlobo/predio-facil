-- Primeiro, popular conf_categorias
INSERT INTO conf_categorias (nome, slug, descricao) VALUES
('Equipamento', 'equipamento', 'Equipamentos mecânicos e elétricos'),
('Instalação', 'instalacao', 'Instalações prediais e sistemas'),
('Sistema', 'sistema', 'Sistemas integrados do edifício')
ON CONFLICT (slug) DO NOTHING;

-- Agora popular ativo_tipos com tipos comuns NBR 5674
INSERT INTO ativo_tipos (nome, slug, is_conformidade, impacta_conformidade, criticidade, periodicidade_default, conf_tipo, checklist_default) VALUES
-- Elevadores
('Elevador', 'elevador', true, true, 'alta', '1 month', 'equipamento', '[
  {"item": "Teste de funcionamento de todos os dispositivos de segurança", "obrigatorio": true},
  {"item": "Verificação de desgaste das guias", "obrigatorio": true},
  {"item": "Inspeção do sistema de freios", "obrigatorio": true},
  {"item": "Limpeza da casa de máquinas", "obrigatorio": true},
  {"item": "Verificação de cabos de tração", "obrigatorio": true}
]'::jsonb),

-- Sistema Hidráulico
('Reservatório de Água', 'reservatorio', true, true, 'alta', '6 months', 'instalacao', '[
  {"item": "Limpeza e desinfecção do reservatório", "obrigatorio": true},
  {"item": "Verificação de vazamentos", "obrigatorio": true},
  {"item": "Inspeção de tampas e vedações", "obrigatorio": true},
  {"item": "Análise da qualidade da água", "obrigatorio": true}
]'::jsonb),

('Bomba de Água', 'bomba-agua', true, true, 'media', '3 months', 'equipamento', '[
  {"item": "Verificação de funcionamento", "obrigatorio": true},
  {"item": "Inspeção de vazamentos", "obrigatorio": true},
  {"item": "Lubrificação de componentes", "obrigatorio": false},
  {"item": "Teste de pressão", "obrigatorio": true}
]'::jsonb),

-- Sistema Elétrico
('Gerador de Emergência', 'gerador', true, true, 'alta', '1 month', 'equipamento', '[
  {"item": "Teste de funcionamento", "obrigatorio": true},
  {"item": "Verificação de nível de óleo e combustível", "obrigatorio": true},
  {"item": "Inspeção de conexões elétricas", "obrigatorio": true},
  {"item": "Teste de transferência automática", "obrigatorio": true}
]'::jsonb),

('Quadro Elétrico', 'quadro-eletrico', true, true, 'alta', '1 year', 'instalacao', '[
  {"item": "Termografia de componentes", "obrigatorio": true},
  {"item": "Verificação de aperto de conexões", "obrigatorio": true},
  {"item": "Limpeza interna", "obrigatorio": true},
  {"item": "Teste de disjuntores", "obrigatorio": true}
]'::jsonb),

-- Segurança
('Extintor de Incêndio', 'extintor', true, true, 'alta', '1 year', 'equipamento', '[
  {"item": "Verificação de pressão", "obrigatorio": true},
  {"item": "Inspeção visual do cilindro", "obrigatorio": true},
  {"item": "Verificação do lacre", "obrigatorio": true},
  {"item": "Teste hidrostático (5 anos)", "obrigatorio": true}
]'::jsonb),

('SPDA (Para-raios)', 'spda', true, true, 'alta', '1 year', 'instalacao', '[
  {"item": "Medição de resistência de aterramento", "obrigatorio": true},
  {"item": "Inspeção de captores", "obrigatorio": true},
  {"item": "Verificação de conexões", "obrigatorio": true},
  {"item": "Inspeção de descidas", "obrigatorio": true}
]'::jsonb),

('Porta Corta-Fogo', 'porta-corta-fogo', true, true, 'alta', '1 month', 'equipamento', '[
  {"item": "Teste de fechamento automático", "obrigatorio": true},
  {"item": "Verificação de vedação", "obrigatorio": true},
  {"item": "Inspeção de dobradiças e fechaduras", "obrigatorio": true},
  {"item": "Limpeza e lubrificação", "obrigatorio": true}
]'::jsonb),

-- Piscina
('Piscina', 'piscina', true, true, 'media', '1 day', 'instalacao', '[
  {"item": "Teste de pH e cloro", "obrigatorio": true},
  {"item": "Limpeza de superfície", "obrigatorio": true},
  {"item": "Verificação de filtros", "obrigatorio": false},
  {"item": "Aspiração de fundo", "obrigatorio": false}
]'::jsonb),

-- Outros
('Central de Gás', 'central-gas', true, true, 'alta', '1 month', 'instalacao', '[
  {"item": "Verificação de vazamentos", "obrigatorio": true},
  {"item": "Inspeção de válvulas", "obrigatorio": true},
  {"item": "Teste de manômetros", "obrigatorio": true},
  {"item": "Verificação de ventilação", "obrigatorio": true}
]'::jsonb),

('Portão Automático', 'portao-automatico', false, false, 'media', '3 months', 'equipamento', '[
  {"item": "Teste de sensores de segurança", "obrigatorio": true},
  {"item": "Lubrificação de correntes e trilhos", "obrigatorio": true},
  {"item": "Verificação de motor", "obrigatorio": true},
  {"item": "Teste de abertura de emergência", "obrigatorio": true}
]'::jsonb),

('Interfone/CFTV', 'interfone-cftv', false, false, 'baixa', '6 months', 'equipamento', '[
  {"item": "Teste de comunicação", "obrigatorio": true},
  {"item": "Verificação de câmeras", "obrigatorio": true},
  {"item": "Limpeza de lentes", "obrigatorio": false},
  {"item": "Teste de gravação", "obrigatorio": true}
]'::jsonb)

ON CONFLICT (slug) DO NOTHING;

-- Popular manut_templates com manutenções NBR 5674
INSERT INTO manut_templates (titulo_plano, sistema, periodicidade, is_conformidade, responsavel, evidencia, descricao, checklist) VALUES
-- Elevador - Mensal
('Manutenção Mensal de Elevador', 'Elevador', '1 month', true, 'fornecedor', 'laudo_tecnico,fotos,nf', 
'Manutenção preventiva mensal conforme NBR 16042 e NR-12',
'[
  {"item": "Teste de funcionamento de todos os dispositivos de segurança", "obrigatorio": true},
  {"item": "Verificação de desgaste das guias", "obrigatorio": true},
  {"item": "Inspeção do sistema de freios", "obrigatorio": true},
  {"item": "Limpeza da casa de máquinas", "obrigatorio": true},
  {"item": "Verificação de cabos de tração", "obrigatorio": true},
  {"item": "Teste de comunicação de emergência", "obrigatorio": true}
]'::jsonb),

-- Elevador - Trimestral
('Manutenção Trimestral de Elevador', 'Elevador', '3 months', true, 'fornecedor', 'laudo_tecnico,fotos', 
'Manutenção preventiva trimestral com inspeções aprofundadas',
'[
  {"item": "Verificação completa do sistema de segurança", "obrigatorio": true},
  {"item": "Medição de isolamento elétrico", "obrigatorio": true},
  {"item": "Inspeção de rolamentos", "obrigatorio": true},
  {"item": "Verificação de nivelamento", "obrigatorio": true},
  {"item": "Teste de velocidade", "obrigatorio": true}
]'::jsonb),

-- Elevador - Anual
('Manutenção Anual de Elevador', 'Elevador', '1 year', true, 'fornecedor', 'laudo_tecnico,art,nf', 
'Manutenção preventiva anual completa com laudo técnico',
'[
  {"item": "Inspeção completa de todos os componentes", "obrigatorio": true},
  {"item": "Teste de carga", "obrigatorio": true},
  {"item": "Verificação de todos os dispositivos de segurança", "obrigatorio": true},
  {"item": "Atualização de registros e documentação", "obrigatorio": true},
  {"item": "Emissão de laudo técnico", "obrigatorio": true}
]'::jsonb),

-- Reservatório - Semestral
('Limpeza de Reservatório', 'Hidráulico', '6 months', true, 'fornecedor', 'laudo_bacteriologico,fotos,nf', 
'Limpeza e desinfecção conforme Portaria 2914/2011 do Ministério da Saúde',
'[
  {"item": "Esvaziamento do reservatório", "obrigatorio": true},
  {"item": "Limpeza completa com produtos adequados", "obrigatorio": true},
  {"item": "Desinfecção com cloro", "obrigatorio": true},
  {"item": "Coleta de amostra para análise bacteriológica", "obrigatorio": true},
  {"item": "Emissão de laudo de qualidade da água", "obrigatorio": true}
]'::jsonb),

-- Bomba - Trimestral
('Manutenção de Bomba de Água', 'Hidráulico', '3 months', true, 'zelador', 'fotos,checklist', 
'Manutenção preventiva de bombas de recalque',
'[
  {"item": "Verificação de funcionamento", "obrigatorio": true},
  {"item": "Inspeção de vazamentos", "obrigatorio": true},
  {"item": "Lubrificação de componentes", "obrigatorio": false},
  {"item": "Teste de pressão", "obrigatorio": true},
  {"item": "Verificação de ruídos anormais", "obrigatorio": true}
]'::jsonb),

-- Gerador - Mensal
('Teste de Gerador', 'Elétrico', '1 month', true, 'zelador', 'relatorio,fotos', 
'Teste mensal de funcionamento do gerador de emergência',
'[
  {"item": "Teste de partida automática", "obrigatorio": true},
  {"item": "Verificação de nível de óleo", "obrigatorio": true},
  {"item": "Verificação de nível de combustível", "obrigatorio": true},
  {"item": "Inspeção visual de vazamentos", "obrigatorio": true},
  {"item": "Teste de transferência de carga", "obrigatorio": true}
]'::jsonb),

-- Quadro Elétrico - Anual
('Manutenção de Quadro Elétrico', 'Elétrico', '1 year', true, 'fornecedor', 'laudo_tecnico,termografia,art', 
'Manutenção preventiva anual conforme NR-10 e NBR 5410',
'[
  {"item": "Termografia de componentes", "obrigatorio": true},
  {"item": "Verificação de aperto de conexões", "obrigatorio": true},
  {"item": "Limpeza interna completa", "obrigatorio": true},
  {"item": "Teste de disjuntores e dispositivos", "obrigatorio": true},
  {"item": "Medição de isolamento", "obrigatorio": true},
  {"item": "Emissão de laudo técnico", "obrigatorio": true}
]'::jsonb),

-- Extintor - Anual
('Recarga de Extintor', 'Segurança', '1 year', true, 'fornecedor', 'certificado,nf', 
'Recarga anual conforme NBR 12962',
'[
  {"item": "Verificação de pressão", "obrigatorio": true},
  {"item": "Inspeção visual do cilindro", "obrigatorio": true},
  {"item": "Verificação do lacre", "obrigatorio": true},
  {"item": "Recarga completa", "obrigatorio": true},
  {"item": "Emissão de certificado", "obrigatorio": true}
]'::jsonb),

-- SPDA - Anual
('Inspeção de SPDA', 'Segurança', '1 year', true, 'fornecedor', 'laudo_tecnico,art', 
'Inspeção anual conforme NBR 5419',
'[
  {"item": "Medição de resistência de aterramento", "obrigatorio": true},
  {"item": "Inspeção de captores", "obrigatorio": true},
  {"item": "Verificação de conexões", "obrigatorio": true},
  {"item": "Inspeção de descidas", "obrigatorio": true},
  {"item": "Emissão de laudo técnico", "obrigatorio": true}
]'::jsonb),

-- Porta Corta-Fogo - Mensal
('Teste de Porta Corta-Fogo', 'Segurança', '1 month', true, 'zelador', 'checklist,fotos', 
'Teste mensal conforme IT 09 do Corpo de Bombeiros',
'[
  {"item": "Teste de fechamento automático", "obrigatorio": true},
  {"item": "Verificação de vedação", "obrigatorio": true},
  {"item": "Inspeção de dobradiças e fechaduras", "obrigatorio": true},
  {"item": "Limpeza e lubrificação", "obrigatorio": true}
]'::jsonb),

-- Piscina - Diária
('Tratamento Diário de Piscina', 'Lazer', '1 day', true, 'zelador', 'planilha,fotos', 
'Tratamento diário conforme Portaria CVS 12/2013',
'[
  {"item": "Teste de pH", "obrigatorio": true},
  {"item": "Teste de cloro", "obrigatorio": true},
  {"item": "Limpeza de superfície", "obrigatorio": true},
  {"item": "Registro em planilha", "obrigatorio": true}
]'::jsonb),

-- Piscina - Semanal
('Manutenção Semanal de Piscina', 'Lazer', '7 days', true, 'zelador', 'planilha,fotos', 
'Manutenção semanal da piscina',
'[
  {"item": "Aspiração de fundo", "obrigatorio": true},
  {"item": "Limpeza de filtros", "obrigatorio": true},
  {"item": "Verificação de equipamentos", "obrigatorio": true},
  {"item": "Escovação de bordas", "obrigatorio": true}
]'::jsonb),

-- Central de Gás - Mensal
('Inspeção de Central de Gás', 'Gás', '1 month', true, 'fornecedor', 'laudo,fotos', 
'Inspeção mensal conforme NBR 13523',
'[
  {"item": "Verificação de vazamentos com detector", "obrigatorio": true},
  {"item": "Inspeção de válvulas", "obrigatorio": true},
  {"item": "Teste de manômetros", "obrigatorio": true},
  {"item": "Verificação de ventilação", "obrigatorio": true},
  {"item": "Inspeção de tubulações", "obrigatorio": true}
]'::jsonb),

-- Portão - Trimestral
('Manutenção de Portão Automático', 'Acesso', '3 months', false, 'fornecedor', 'relatorio,fotos', 
'Manutenção preventiva trimestral',
'[
  {"item": "Teste de sensores de segurança", "obrigatorio": true},
  {"item": "Lubrificação de correntes e trilhos", "obrigatorio": true},
  {"item": "Verificação de motor", "obrigatorio": true},
  {"item": "Teste de abertura de emergência", "obrigatorio": true},
  {"item": "Ajuste de fim de curso", "obrigatorio": true}
]'::jsonb)

ON CONFLICT (id) DO NOTHING;

-- Criar bucket para anexos de manutenção
INSERT INTO storage.buckets (id, name, public) 
VALUES ('manutencao-anexos', 'manutencao-anexos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS para anexos (usuários podem ver/inserir anexos de seus condomínios)
CREATE POLICY "Usuários podem ver anexos de seus condomínios"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'manutencao-anexos' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text
    FROM condominios c
    JOIN usuarios_condominios uc ON uc.condominio_id = c.id
    JOIN usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem inserir anexos de seus condomínios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'manutencao-anexos' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text
    FROM condominios c
    JOIN usuarios_condominios uc ON uc.condominio_id = c.id
    JOIN usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar anexos de seus condomínios"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'manutencao-anexos' AND
  (storage.foldername(name))[1] IN (
    SELECT c.id::text
    FROM condominios c
    JOIN usuarios_condominios uc ON uc.condominio_id = c.id
    JOIN usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
  )
);