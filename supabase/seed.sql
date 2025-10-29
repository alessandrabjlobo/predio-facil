-- ============================================================================
-- SUPABASE SEED DATA - ABNT NBR 5674 COMPLIANT ASSET LIBRARY
-- ============================================================================
--
-- This seed file populates the global Asset Library with normative maintenance
-- requirements aligned with ABNT NBR 5674 and related Brazilian standards.
--
-- Architecture:
-- - conf_categorias: 14 compliance categories (master reference)
-- - ativo_tipos: 20+ asset types (global library, no condo coupling)
-- - Each asset includes default periodicity and normative preventive checklists
-- - Condos select assets from this library; system auto-generates maintenance plans
--
-- Idempotency: All inserts use ON CONFLICT DO NOTHING
-- ============================================================================

-- ============================================================================
-- PHASE 1: COMPLIANCE CATEGORIES (conf_categorias)
-- ============================================================================

INSERT INTO public.conf_categorias (slug, nome, descricao) VALUES
('estrutural', 'Estrutural', 'Estrutura, fundações, elementos estruturais - NBR 5674, 6118, 15575'),
('envoltorio', 'Envoltório', 'Coberturas, fachadas, impermeabilizações, vedações - NBR 5674, 13755, 9574'),
('eletrica', 'Elétrica', 'Instalações elétricas, painéis, geradores, iluminação - NBR 5410, 5674'),
('spda', 'SPDA', 'Sistema de proteção contra descargas atmosféricas - NBR 5419, 5674'),
('hidraulica', 'Hidráulica', 'Instalações hidrossanitárias, redes, tubulações - NBR 5626, 5674'),
('gas', 'Gás', 'Instalações de gás GLP e GN, centrais, reguladores - NBR 15526, 5674'),
('incendio', 'Incêndio', 'Sistemas de combate a incêndio, extintores, hidrantes - NBR 13714, 17240'),
('elevacao', 'Elevação', 'Elevadores, monta-cargas, plataformas - NR-12, NBR 16042'),
('climatizacao', 'Climatização', 'Ar condicionado, ventilação, PMOC - Portaria 3523/GM, RE-09'),
('seguranca', 'Segurança', 'CFTV, controle de acesso, alarmes, vigilância'),
('acessibilidade', 'Acessibilidade', 'Rotas acessíveis, sinalização tátil-visual - NBR 9050'),
('reservatorios', 'Reservatórios', 'Caixas d\'água, cisternas, potabilidade - Portarias sanitárias'),
('saida-emergencia', 'Saída Emergência', 'Rotas de fuga, portas corta-fogo, sinalização - NBR 9077'),
('documentacao', 'Documentação', 'Gestão documental, ARTs, laudos, evidências - NBR 5674, 14037')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PHASE 2: GLOBAL ASSET LIBRARY (ativo_tipos)
-- ============================================================================
--
-- Each asset type includes:
-- - nome: Display name
-- - slug: Unique kebab-case identifier
-- - conf_tipo: References conf_categorias.slug
-- - criticidade: baixa | media | alta | urgente
-- - periodicidade_default: Text format (e.g., '6 months', '1 year')
-- - checklist_default: JSON array with normative preventive tasks
--   Each checklist item must include:
--   - descricao: Task description
--   - responsavel: Responsible party (sindico, terceirizado, eng_civil, etc.)
--   - tipo_manutencao: rotineira | preventiva | corretiva
--   - evidencia: Required evidence (laudo, fotos, art, certificado, etc.)
--   - referencia: NBR/regulatory references
-- - impacta_conformidade: true for safety-critical assets
-- - is_conformidade: true for assets with mandatory legal requirements
-- ============================================================================

INSERT INTO public.ativo_tipos (
  nome, slug, conf_tipo, criticidade, periodicidade_default,
  impacta_conformidade, is_conformidade, checklist_default
) VALUES

-- ============================================================================
-- ESTRUTURAL (Structure)
-- ============================================================================
(
  'Estrutura do Edifício',
  'estrutura-edificio',
  'estrutural',
  'alta',
  '6 months',
  true,
  true,
  '[
    {
      "descricao": "Inspeção visual de fissuras, trincas, descolamentos e deformações",
      "responsavel": "eng_civil",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_fotografico,art",
      "referencia": "NBR 5674, NBR 6118, NBR 15575"
    },
    {
      "descricao": "Classificação de fissuras (ativa/passiva, estrutural/não estrutural)",
      "responsavel": "eng_civil",
      "tipo_manutencao": "preventiva",
      "evidencia": "laudo_tecnico,art",
      "referencia": "NBR 6118, NBR 15575-1"
    },
    {
      "descricao": "Verificação de elementos estruturais críticos (pilares, vigas, lajes)",
      "responsavel": "eng_civil",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_tecnico,fotos",
      "referencia": "NBR 5674, NBR 6118"
    },
    {
      "descricao": "Elaboração de plano de ação corretiva se necessário",
      "responsavel": "eng_civil",
      "tipo_manutencao": "preventiva",
      "evidencia": "plano_acao,art",
      "referencia": "NBR 5674"
    }
  ]'::jsonb
),

-- ============================================================================
-- ENVOLTÓRIO (Building Envelope)
-- ============================================================================
(
  'Cobertura e Rufos',
  'cobertura-rufos',
  'envoltorio',
  'alta',
  '6 months',
  true,
  true,
  '[
    {
      "descricao": "Inspeção de pontos de infiltração e umidade",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_fotografico,checklist",
      "referencia": "NBR 5674"
    },
    {
      "descricao": "Verificação de telhas, rufos, calhas e condutores",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "fotos,checklist",
      "referencia": "NBR 5674"
    },
    {
      "descricao": "Limpeza de calhas e condutores pluviais",
      "responsavel": "zelador",
      "tipo_manutencao": "rotineira",
      "evidencia": "registro_servico",
      "referencia": "NBR 5674"
    },
    {
      "descricao": "Verificação de impermeabilização e juntas de dilatação",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 5674, NBR 9574"
    }
  ]'::jsonb
),

(
  'Fachadas e Revestimentos',
  'fachadas-revestimentos',
  'envoltorio',
  'alta',
  '1 year',
  true,
  true,
  '[
    {
      "descricao": "Inspeção visual de revestimentos externos (descolamentos, trincas)",
      "responsavel": "eng_civil",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_fotografico,art",
      "referencia": "NBR 5674, NBR 13755"
    },
    {
      "descricao": "Teste de aderência por percussão (balde d''água)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 13755"
    },
    {
      "descricao": "Verificação de juntas de movimentação e selantes",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 5674, NBR 13755"
    },
    {
      "descricao": "Elaboração de plano de reparo para áreas críticas",
      "responsavel": "eng_civil",
      "tipo_manutencao": "preventiva",
      "evidencia": "plano_acao,art",
      "referencia": "NBR 5674"
    }
  ]'::jsonb
),

(
  'Impermeabilização',
  'impermeabilizacao',
  'envoltorio',
  'alta',
  '1 year',
  true,
  true,
  '[
    {
      "descricao": "Inspeção de áreas impermeabilizadas (lajes, jardineiras, banheiros)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 9574, NBR 9575"
    },
    {
      "descricao": "Verificação de aderência e integridade da manta/sistema",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "laudo_tecnico",
      "referencia": "NBR 9575"
    },
    {
      "descricao": "Teste de estanqueidade quando aplicável",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste,fotos",
      "referencia": "NBR 9574"
    },
    {
      "descricao": "Mapeamento de pontos críticos e plano de intervenção",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "mapeamento,plano_acao",
      "referencia": "NBR 5674"
    }
  ]'::jsonb
),

-- ============================================================================
-- ELÉTRICA (Electrical)
-- ============================================================================
(
  'Painéis e Quadros Elétricos',
  'paineis-eletricos',
  'eletrica',
  'alta',
  '6 months',
  true,
  true,
  '[
    {
      "descricao": "Inspeção termográfica de quadros elétricos (se aplicável)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_termografia,art",
      "referencia": "NBR 5410, NR-10"
    },
    {
      "descricao": "Verificação e reaperto de conexões elétricas",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist,fotos",
      "referencia": "NBR 5410, NBR 5674"
    },
    {
      "descricao": "Teste de funcionamento de DR (dispositivo residual) e IDR",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste",
      "referencia": "NBR 5410"
    },
    {
      "descricao": "Verificação de identificação e sinalização dos circuitos",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "fotos,checklist",
      "referencia": "NBR 5410, NR-10"
    },
    {
      "descricao": "Limpeza interna dos quadros (se necessário)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "registro_servico",
      "referencia": "NBR 5674"
    }
  ]'::jsonb
),

(
  'Gerador de Emergência',
  'gerador-emergencia',
  'eletrica',
  'alta',
  '1 month',
  true,
  true,
  '[
    {
      "descricao": "Teste de funcionamento sob carga",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste,registro_horas",
      "referencia": "NBR 5674, Manual fabricante"
    },
    {
      "descricao": "Verificação de nível de óleo e combustível",
      "responsavel": "zelador",
      "tipo_manutencao": "rotineira",
      "evidencia": "checklist",
      "referencia": "Manual fabricante"
    },
    {
      "descricao": "Teste de partida automática e transferência de carga",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste",
      "referencia": "NBR 5674"
    },
    {
      "descricao": "Verificação de filtros, bateria e conexões",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist,fotos",
      "referencia": "Manual fabricante"
    },
    {
      "descricao": "Registro de horímetro e consumo",
      "responsavel": "zelador",
      "tipo_manutencao": "rotineira",
      "evidencia": "planilha_controle",
      "referencia": "NBR 5674"
    }
  ]'::jsonb
),

(
  'Iluminação de Emergência',
  'iluminacao-emergencia',
  'eletrica',
  'alta',
  '1 month',
  true,
  true,
  '[
    {
      "descricao": "Teste de funcionamento e autonomia das luminárias",
      "responsavel": "zelador",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist,registro",
      "referencia": "NBR 10898, NBR 5674"
    },
    {
      "descricao": "Verificação de sinalização de rotas de fuga",
      "responsavel": "zelador",
      "tipo_manutencao": "preventiva",
      "evidencia": "fotos,checklist",
      "referencia": "NBR 10898"
    },
    {
      "descricao": "Registro de não conformidades e substituição de lâmpadas",
      "responsavel": "zelador",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_nc",
      "referencia": "NBR 5674"
    }
  ]'::jsonb
),

-- ============================================================================
-- SPDA (Lightning Protection)
-- ============================================================================
(
  'SPDA - Para-raios',
  'spda-pararaios',
  'spda',
  'urgente',
  '1 year',
  true,
  true,
  '[
    {
      "descricao": "Medição de resistência de aterramento (< 10 ohms)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "laudo_tecnico,art,medicoes",
      "referencia": "NBR 5419, NBR 5674"
    },
    {
      "descricao": "Inspeção visual de captores, hastes e conexões",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 5419"
    },
    {
      "descricao": "Verificação de continuidade elétrica das descidas",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste,medicoes",
      "referencia": "NBR 5419"
    },
    {
      "descricao": "Inspeção de eletrodos de aterramento e caixas de inspeção",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 5419"
    },
    {
      "descricao": "Emissão de laudo técnico com ART",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "laudo_tecnico,art",
      "referencia": "NBR 5419, NBR 5674"
    }
  ]'::jsonb
),

-- ============================================================================
-- INCÊNDIO (Fire Protection)
-- ============================================================================
(
  'Extintores de Incêndio',
  'extintores',
  'incendio',
  'urgente',
  '1 month',
  true,
  true,
  '[
    {
      "descricao": "Verificação de pressão do manômetro (faixa verde)",
      "responsavel": "sindico",
      "tipo_manutencao": "rotineira",
      "evidencia": "checklist",
      "referencia": "IT CBM, NBR 12962"
    },
    {
      "descricao": "Verificação de lacre, pino de segurança e gatilho",
      "responsavel": "sindico",
      "tipo_manutencao": "rotineira",
      "evidencia": "checklist",
      "referencia": "IT CBM"
    },
    {
      "descricao": "Inspeção visual do cilindro e mangueira",
      "responsavel": "sindico",
      "tipo_manutencao": "rotineira",
      "evidencia": "checklist",
      "referencia": "NBR 12962"
    },
    {
      "descricao": "Verificação de validade da carga e etiquetas",
      "responsavel": "sindico",
      "tipo_manutencao": "rotineira",
      "evidencia": "checklist,fotos",
      "referencia": "IT CBM, NBR 12962"
    },
    {
      "descricao": "Verificação de sinalização e desobstrução de acesso",
      "responsavel": "sindico",
      "tipo_manutencao": "rotineira",
      "evidencia": "checklist",
      "referencia": "IT CBM, NBR 5674"
    },
    {
      "descricao": "Recarga anual conforme validade (anual)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "certificado,nf",
      "referencia": "NBR 12962"
    }
  ]'::jsonb
),

(
  'Hidrantes e Bombas de Incêndio',
  'hidrantes-bombas',
  'incendio',
  'urgente',
  '1 month',
  true,
  true,
  '[
    {
      "descricao": "Teste de partida da bomba principal e jockey",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste,registro",
      "referencia": "NBR 13714, NBR 5674"
    },
    {
      "descricao": "Verificação de pressão do sistema (manômetros)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,medicoes",
      "referencia": "NBR 13714"
    },
    {
      "descricao": "Inspeção de mangueiras, esguichos e abrigos",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist,fotos",
      "referencia": "NBR 13714, IT CBM"
    },
    {
      "descricao": "Teste de acionamento automático das bombas",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste",
      "referencia": "NBR 13714"
    },
    {
      "descricao": "Verificação de estanqueidade visível do sistema",
      "responsavel": "zelador",
      "tipo_manutencao": "rotineira",
      "evidencia": "checklist",
      "referencia": "NBR 5674"
    }
  ]'::jsonb
),

(
  'Alarme e Detecção de Incêndio',
  'alarme-deteccao-incendio',
  'incendio',
  'urgente',
  '3 months',
  true,
  true,
  '[
    {
      "descricao": "Teste de detectores (fumaça, temperatura)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste,checklist",
      "referencia": "NBR 17240, IT CBM"
    },
    {
      "descricao": "Teste de acionadores manuais (botoeiras)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste",
      "referencia": "NBR 17240"
    },
    {
      "descricao": "Teste de sirenes e sinalizadores audiovisuais",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste",
      "referencia": "NBR 17240"
    },
    {
      "descricao": "Verificação de loops, central e baterias",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 17240"
    },
    {
      "descricao": "Emissão de certificado de conformidade",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "certificado",
      "referencia": "IT CBM, NBR 17240"
    }
  ]'::jsonb
),

-- ============================================================================
-- HIDRÁULICA (Plumbing)
-- ============================================================================
(
  'Rede Hidrossanitária',
  'rede-hidrossanitaria',
  'hidraulica',
  'media',
  '1 year',
  true,
  true,
  '[
    {
      "descricao": "Inspeção de pontos de vazamento visível",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 5626, NBR 5674"
    },
    {
      "descricao": "Verificação de válvulas, registros e componentes",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist,fotos",
      "referencia": "NBR 5626"
    },
    {
      "descricao": "Teste de pressões (quando aplicável)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste,medicoes",
      "referencia": "NBR 5626"
    },
    {
      "descricao": "Verificação de ventilação e ralos sifonados",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist",
      "referencia": "NBR 8160"
    }
  ]'::jsonb
),

(
  'Reservatório de Água Potável',
  'reservatorio-agua',
  'reservatorios',
  'urgente',
  '6 months',
  true,
  true,
  '[
    {
      "descricao": "Limpeza e desinfecção do reservatório",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "certificado,fotos,nf",
      "referencia": "Portaria 2914 MS, NBR 5674"
    },
    {
      "descricao": "Coleta de amostra para análise bacteriológica",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "laudo_potabilidade",
      "referencia": "Portaria 2914 MS"
    },
    {
      "descricao": "Inspeção física de tampas, extravasores e estrutura",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 5626, NBR 5674"
    },
    {
      "descricao": "Verificação de telas e vedação contra vetores",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "fotos,checklist",
      "referencia": "Vigilância Sanitária"
    },
    {
      "descricao": "Emissão de certificado de limpeza",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "certificado",
      "referencia": "Vigilância Sanitária"
    }
  ]'::jsonb
),

-- ============================================================================
-- GÁS (Gas)
-- ============================================================================
(
  'Central de Gás GLP/GN',
  'central-gas',
  'gas',
  'urgente',
  '1 year',
  true,
  true,
  '[
    {
      "descricao": "Inspeção da central, reguladores e tubulações",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos,art",
      "referencia": "NBR 15526, NBR 13523"
    },
    {
      "descricao": "Teste de estanqueidade (detector de vazamento)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste,art",
      "referencia": "NBR 15526"
    },
    {
      "descricao": "Verificação de válvulas, registros e conexões",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist,fotos",
      "referencia": "NBR 15526"
    },
    {
      "descricao": "Verificação de ventilação adequada da central",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 13523"
    },
    {
      "descricao": "Verificação de sinalização de segurança",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "fotos,checklist",
      "referencia": "NBR 13523, NR-20"
    },
    {
      "descricao": "Emissão de laudo técnico com ART",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "laudo_tecnico,art",
      "referencia": "NBR 15526, NBR 5674"
    }
  ]'::jsonb
),

-- ============================================================================
-- ELEVAÇÃO (Elevators)
-- ============================================================================
(
  'Elevadores',
  'elevador',
  'elevacao',
  'urgente',
  '1 month',
  true,
  true,
  '[
    {
      "descricao": "Manutenção preventiva contratual mensal",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "os_assinada,checklist",
      "referencia": "NR-12, NBR 16042, NBR 5674"
    },
    {
      "descricao": "Verificação de pendências e não conformidades",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "registro_nc",
      "referencia": "NBR 5674"
    },
    {
      "descricao": "Teste de dispositivos de segurança",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste",
      "referencia": "NR-12, NBR 16042"
    },
    {
      "descricao": "Registro de intervenções e histórico de manutenção",
      "responsavel": "sindico",
      "tipo_manutencao": "rotineira",
      "evidencia": "livro_os,historico",
      "referencia": "Legislação municipal, NBR 5674"
    }
  ]'::jsonb
),

-- ============================================================================
-- CLIMATIZAÇÃO (HVAC)
-- ============================================================================
(
  'HVAC - PMOC',
  'hvac-pmoc',
  'climatizacao',
  'alta',
  '1 month',
  true,
  true,
  '[
    {
      "descricao": "Limpeza de filtros e serpentinas",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "Portaria 3523/GM, RE-09 Anvisa"
    },
    {
      "descricao": "Medição de temperatura, umidade e vazão de ar",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_medicoes",
      "referencia": "RE-09 Anvisa"
    },
    {
      "descricao": "Verificação e atualização do PMOC",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "pmoc_atualizado,art",
      "referencia": "Portaria 3523/GM"
    },
    {
      "descricao": "Registro de intervenções no livro de manutenção",
      "responsavel": "terceirizado",
      "tipo_manutencao": "rotineira",
      "evidencia": "livro_manutencao",
      "referencia": "Portaria 3523/GM, NBR 5674"
    },
    {
      "descricao": "Coleta de amostras para análise (quando aplicável)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "laudo_qualidade_ar",
      "referencia": "RE-09 Anvisa"
    }
  ]'::jsonb
),

-- ============================================================================
-- SAÍDA DE EMERGÊNCIA (Emergency Exits)
-- ============================================================================
(
  'Rotas de Fuga e Saídas',
  'rotas-fuga',
  'saida-emergencia',
  'urgente',
  '1 month',
  true,
  true,
  '[
    {
      "descricao": "Verificação de desobstrução das rotas de fuga",
      "responsavel": "sindico",
      "tipo_manutencao": "rotineira",
      "evidencia": "checklist,fotos",
      "referencia": "NBR 9077, IT CBM"
    },
    {
      "descricao": "Teste de portas corta-fogo e barras antipânico",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist",
      "referencia": "NBR 9077, NBR 11742"
    },
    {
      "descricao": "Verificação de sinalização de emergência",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "fotos,checklist",
      "referencia": "NBR 13434, NBR 5674"
    },
    {
      "descricao": "Inspeção de fechamento automático de portas",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist",
      "referencia": "IT CBM, NBR 9077"
    }
  ]'::jsonb
),

-- ============================================================================
-- ACESSIBILIDADE (Accessibility)
-- ============================================================================
(
  'Acessibilidade - Rotas e Sinalização',
  'acessibilidade',
  'acessibilidade',
  'media',
  '1 year',
  true,
  true,
  '[
    {
      "descricao": "Inspeção de rotas acessíveis e rampas",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "NBR 9050, Lei 13146/2015"
    },
    {
      "descricao": "Verificação de sinalização tátil e visual",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "fotos,checklist",
      "referencia": "NBR 9050"
    },
    {
      "descricao": "Verificação de pisos táteis de alerta e direcional",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "fotos,checklist",
      "referencia": "NBR 9050"
    },
    {
      "descricao": "Identificação de ajustes necessários",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_nc,plano_acao",
      "referencia": "NBR 9050, NBR 5674"
    }
  ]'::jsonb
),

-- ============================================================================
-- SEGURANÇA (Security)
-- ============================================================================
(
  'CFTV e Controle de Acesso',
  'cftv-acesso',
  'seguranca',
  'media',
  '3 months',
  false,
  false,
  '[
    {
      "descricao": "Verificação de câmeras e gravação",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,fotos",
      "referencia": "Política interna, NBR 5674"
    },
    {
      "descricao": "Teste de qualidade de imagem e iluminação",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio,capturas",
      "referencia": "Política interna"
    },
    {
      "descricao": "Verificação de fontes, nobreak e baterias",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist",
      "referencia": "Política interna"
    },
    {
      "descricao": "Teste de backup e retenção de gravações",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_teste",
      "referencia": "LGPD, Política interna"
    },
    {
      "descricao": "Verificação de controles de acesso (catracas, fechaduras)",
      "responsavel": "terceirizado",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist,fotos",
      "referencia": "Política interna"
    }
  ]'::jsonb
),

-- ============================================================================
-- DOCUMENTAÇÃO (Documentation)
-- ============================================================================
(
  'Gestão Documental e Evidências',
  'gestao-documental',
  'documentacao',
  'alta',
  '1 month',
  true,
  true,
  '[
    {
      "descricao": "Consolidação de relatórios e evidências do mês",
      "responsavel": "sindico",
      "tipo_manutencao": "rotineira",
      "evidencia": "pasta_digital,indice",
      "referencia": "NBR 5674, NBR 14037"
    },
    {
      "descricao": "Organização de ARTs, laudos e certificados",
      "responsavel": "sindico",
      "tipo_manutencao": "rotineira",
      "evidencia": "arquivo_organizado",
      "referencia": "NBR 14037"
    },
    {
      "descricao": "Consolidação de indicadores de conformidade",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "relatorio_indicadores",
      "referencia": "NBR 5674"
    },
    {
      "descricao": "Verificação de fluxo documental conforme",
      "responsavel": "sindico",
      "tipo_manutencao": "preventiva",
      "evidencia": "checklist_conformidade",
      "referencia": "NBR 5674, NBR 14037"
    }
  ]'::jsonb
)

ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- END OF SEED FILE
-- ============================================================================
--
-- Verification Checklist:
-- ✓ All conf_categorias slugs are kebab-case and unique
-- ✓ All ativo_tipos slugs are kebab-case and unique
-- ✓ All conf_tipo values reference valid conf_categorias.slug
-- ✓ All periodicidade_default use TEXT format (e.g., '6 months', '1 year')
-- ✓ All checklist_default are valid JSON arrays
-- ✓ All checklist items include required keys: descricao, responsavel, tipo_manutencao, evidencia, referencia
-- ✓ All criticidade values are valid: baixa, media, alta, urgente
-- ✓ Safety-critical assets have impacta_conformidade = true
-- ✓ All inserts use ON CONFLICT DO NOTHING for idempotency
-- ✓ No condo coupling - pure library data
--
-- Total Categories: 14
-- Total Asset Types: 20
--
-- Architecture Note:
-- These are GLOBAL master records. When a condo selects an asset from this
-- library, the system will auto-generate a condo-specific maintenance plan
-- using the asset's periodicidade_default and checklist_default values.
-- ============================================================================
