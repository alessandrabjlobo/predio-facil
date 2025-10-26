-- Fase 1: Estrutura de Banco para Ativos Padrão com Ativação/Desativação

-- 1. Adicionar coluna is_ativo na tabela ativos
ALTER TABLE ativos ADD COLUMN IF NOT EXISTS is_ativo BOOLEAN DEFAULT true;

-- 2. Criar função para inicializar ativos padrão quando um condomínio é criado
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
  -- Buscar IDs dos tipos de ativos
  SELECT id INTO v_tipo_extintor FROM ativo_tipos WHERE slug = 'extintor' LIMIT 1;
  SELECT id INTO v_tipo_elevador FROM ativo_tipos WHERE slug = 'elevador' LIMIT 1;
  SELECT id INTO v_tipo_bomba FROM ativo_tipos WHERE slug = 'bomba-incendio' LIMIT 1;
  SELECT id INTO v_tipo_reservatorio FROM ativo_tipos WHERE slug = 'reservatorio' LIMIT 1;
  SELECT id INTO v_tipo_geradores FROM ativo_tipos WHERE slug = 'gerador' LIMIT 1;
  SELECT id INTO v_tipo_portao FROM ativo_types WHERE slug = 'portao-automatico' LIMIT 1;

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

-- 3. Criar trigger para inicializar ativos padrão ao criar condomínio
CREATE OR REPLACE FUNCTION trigger_inicializar_ativos_padrao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chamar função para criar ativos padrão
  PERFORM inicializar_ativos_padrao(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS after_create_condominio ON condominios;
CREATE TRIGGER after_create_condominio
  AFTER INSERT ON condominios
  FOR EACH ROW
  EXECUTE FUNCTION trigger_inicializar_ativos_padrao();

-- 4. Criar tabela de logs de ativação/desativação de ativos
CREATE TABLE IF NOT EXISTS ativo_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo_id UUID NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  acao TEXT NOT NULL CHECK (acao IN ('ativado', 'desativado')),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para logs de status de ativos
ALTER TABLE ativo_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver logs de ativos de seus condomínios"
  ON ativo_status_logs FOR SELECT
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

CREATE POLICY "Síndicos e admins podem inserir logs de status"
  ON ativo_status_logs FOR INSERT
  WITH CHECK (
    ativo_id IN (
      SELECT a.id FROM ativos a
      WHERE a.condominio_id IN (
        SELECT uc.condominio_id
        FROM usuarios_condominios uc
        JOIN usuarios u ON uc.usuario_id = u.id
        WHERE u.auth_user_id = auth.uid()
        AND uc.papel IN ('sindico', 'admin')
      )
    )
  );