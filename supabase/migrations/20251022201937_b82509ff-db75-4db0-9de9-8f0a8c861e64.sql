-- Corrigir erro de typo na função inicializar_ativos_padrao
-- A tabela é "ativo_tipos" e não "ativo_types"

CREATE OR REPLACE FUNCTION inicializar_ativos_padrao(p_condominio_id UUID)
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
  v_tipo_geradores UUID;
  v_tipo_portao UUID;
BEGIN
  -- Buscar IDs dos tipos de ativos (CORRIGIDO: ativo_tipos em todas as queries)
  SELECT id INTO v_tipo_extintor FROM ativo_tipos WHERE slug = 'extintor' LIMIT 1;
  SELECT id INTO v_tipo_elevador FROM ativo_tipos WHERE slug = 'elevador' LIMIT 1;
  SELECT id INTO v_tipo_bomba FROM ativo_tipos WHERE slug = 'bomba-incendio' LIMIT 1;
  SELECT id INTO v_tipo_reservatorio FROM ativo_tipos WHERE slug = 'reservatorio' LIMIT 1;
  SELECT id INTO v_tipo_geradores FROM ativo_tipos WHERE slug = 'gerador' LIMIT 1;
  SELECT id INTO v_tipo_portao FROM ativo_tipos WHERE slug = 'portao-automatico' LIMIT 1;

  -- Criar ativos padrão de Segurança Contra Incêndio
  IF v_tipo_extintor IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_extintor, 'Extintor Portaria Principal', 'Portaria', 'Extintor padrão ABC 6kg', true, true),
      (p_condominio_id, v_tipo_extintor, 'Extintor Hall Elevadores', 'Hall Social', 'Extintor padrão ABC 6kg', true, true),
      (p_condominio_id, v_tipo_extintor, 'Extintor Garagem', 'Subsolo', 'Extintor padrão ABC 6kg', true, true);
  END IF;

  -- Criar ativos padrão de Elevadores
  IF v_tipo_elevador IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_elevador, 'Elevador Social', 'Torre Principal', 'Elevador principal para moradores', true, true),
      (p_condominio_id, v_tipo_elevador, 'Elevador Serviço', 'Torre Principal', 'Elevador de serviço e mudanças', true, true);
  END IF;

  -- Criar ativos padrão de Hidráulica
  IF v_tipo_bomba IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_bomba, 'Bomba Incêndio Principal', 'Casa de Bombas', 'Bomba principal do sistema de combate a incêndio', true, true);
  END IF;

  IF v_tipo_reservatorio IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_reservatorio, 'Reservatório Superior', 'Terraço', 'Reservatório de água potável', true, true),
      (p_condominio_id, v_tipo_reservatorio, 'Reservatório Inferior', 'Subsolo', 'Cisterna principal', true, true);
  END IF;

  -- Criar ativos padrão de Infraestrutura
  IF v_tipo_geradores IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_geradores, 'Gerador de Emergência', 'Casa de Máquinas', 'Gerador diesel para emergências', true, true);
  END IF;

  IF v_tipo_portao IS NOT NULL THEN
    INSERT INTO ativos (condominio_id, tipo_id, nome, local, descricao, requer_conformidade, is_ativo)
    VALUES 
      (p_condominio_id, v_tipo_portao, 'Portão Principal', 'Entrada', 'Portão automático de acesso', true, true);
  END IF;

END;
$$;