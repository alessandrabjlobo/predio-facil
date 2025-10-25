-- Adicionar tipo de ativo "Bomba de Incêndio" que estava faltando
INSERT INTO ativo_tipos (nome, slug, sistema_manutencao, criticidade)
VALUES ('Bomba de Incêndio', 'bomba-incendio', 'Hidráulico', 'alta')
ON CONFLICT (slug) DO NOTHING;