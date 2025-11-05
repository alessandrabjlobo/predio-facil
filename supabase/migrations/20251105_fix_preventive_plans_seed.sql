/*
  # Seed data for preventive plans testing

  ## Purpose
  Provides sample data to test the criar_planos_preventivos function:
  - ativo_tipos with periodicidade_default
  - manut_templates with INTERVAL periodicidade
  - Sample ativos to trigger plan generation
*/

-- Ensure we have a test ativo_tipo with periodicidade_default
INSERT INTO public.ativo_tipos (
  nome,
  slug,
  periodicidade_default,
  is_conformidade,
  impacta_conformidade,
  criticidade
) VALUES (
  'Bombas de Incêndio',
  'bombas-de-incendio',
  interval '3 months',
  true,
  true,
  'alta'
)
ON CONFLICT (slug) DO UPDATE SET
  periodicidade_default = EXCLUDED.periodicidade_default;

-- Ensure we have a maintenance template for this asset type
INSERT INTO public.manut_templates (
  sistema,
  titulo_plano,
  periodicidade,
  checklist,
  responsavel,
  descricao
) VALUES (
  'bombas de incendio',
  'Inspeção Trimestral de Bombas',
  interval '3 months',
  '[
    {"item": "Verificar pressão do sistema", "obrigatorio": true},
    {"item": "Testar acionamento automático", "obrigatorio": true},
    {"item": "Inspecionar mangueiras e conexões", "obrigatorio": true},
    {"item": "Verificar nível de óleo do motor", "obrigatorio": false}
  ]'::jsonb,
  'tecnico',
  'Inspeção trimestral conforme NBR 10897'
)
ON CONFLICT DO NOTHING;

-- Add another common asset type
INSERT INTO public.ativo_tipos (
  nome,
  slug,
  periodicidade_default,
  is_conformidade,
  impacta_conformidade,
  criticidade
) VALUES (
  'Geradores',
  'geradores',
  interval '1 month',
  true,
  true,
  'alta'
)
ON CONFLICT (slug) DO UPDATE SET
  periodicidade_default = EXCLUDED.periodicidade_default;

-- Template for generators
INSERT INTO public.manut_templates (
  sistema,
  titulo_plano,
  periodicidade,
  checklist,
  responsavel,
  descricao
) VALUES (
  'geradores',
  'Manutenção Mensal de Gerador',
  interval '1 month',
  '[
    {"item": "Verificar nível de óleo", "obrigatorio": true},
    {"item": "Testar partida manual", "obrigatorio": true},
    {"item": "Verificar bateria", "obrigatorio": true},
    {"item": "Limpar filtros de ar", "obrigatorio": false}
  ]'::jsonb,
  'tecnico',
  'Manutenção preventiva mensal'
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.manut_templates IS
  'Templates de manutenção preventiva. Campo periodicidade é INTERVAL, não TEXT.';
