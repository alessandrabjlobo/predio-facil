-- Adicionar campos de localização e conformidade aos ativos
ALTER TABLE public.ativos 
ADD COLUMN IF NOT EXISTS torre TEXT,
ADD COLUMN IF NOT EXISTS tipo_uso TEXT CHECK (tipo_uso IN ('social', 'servico', 'comum', 'privativo')),
ADD COLUMN IF NOT EXISTS andar TEXT,
ADD COLUMN IF NOT EXISTS identificador TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS requer_conformidade BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_instalacao DATE,
ADD COLUMN IF NOT EXISTS numero_serie TEXT;

-- Criar índices para melhorar performance nas buscas
CREATE INDEX IF NOT EXISTS idx_ativos_torre ON public.ativos(torre);
CREATE INDEX IF NOT EXISTS idx_ativos_tipo_uso ON public.ativos(tipo_uso);
CREATE INDEX IF NOT EXISTS idx_ativos_local ON public.ativos(local);
CREATE INDEX IF NOT EXISTS idx_ativos_conformidade ON public.ativos(requer_conformidade);

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.ativos.torre IS 'Identificação da torre/bloco onde o ativo está localizado';
COMMENT ON COLUMN public.ativos.tipo_uso IS 'Tipo de uso do ativo: social, serviço, comum ou privativo';
COMMENT ON COLUMN public.ativos.andar IS 'Andar onde o ativo está localizado';
COMMENT ON COLUMN public.ativos.identificador IS 'Identificador único ou número do ativo (ex: Elevador 1, Elevador 2)';
COMMENT ON COLUMN public.ativos.requer_conformidade IS 'Indica se o ativo requer controle de conformidade (NBR 5674)';
COMMENT ON COLUMN public.ativos.data_instalacao IS 'Data de instalação do ativo';
COMMENT ON COLUMN public.ativos.numero_serie IS 'Número de série do equipamento';

-- Criar uma view para histórico de manutenção por ativo
CREATE OR REPLACE VIEW public.ativo_historico_manutencao AS
SELECT 
  a.id as ativo_id,
  a.nome as ativo_nome,
  a.torre,
  a.tipo_uso,
  a.identificador,
  m.id as manutencao_id,
  m.tipo as manutencao_tipo,
  m.titulo as manutencao_titulo,
  m.status,
  m.vencimento,
  m.executada_em,
  m.created_at as data_criacao,
  p.titulo,
  p.periodicidade
FROM public.ativos a
LEFT JOIN public.manutencoes m ON m.ativo_id = a.id
LEFT JOIN public.planos_manutencao p ON p.ativo_id = a.id
ORDER BY a.nome, m.created_at DESC;