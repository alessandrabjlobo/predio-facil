-- Fix OS creation and number generation
-- Drop existing function
DROP FUNCTION IF EXISTS public.generate_os_numero(uuid);
DROP FUNCTION IF EXISTS public.criar_os_detalhada CASCADE;

-- Create improved OS number generation (handles conflicts)
CREATE OR REPLACE FUNCTION public.generate_os_numero(p_condominio_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano TEXT := TO_CHAR(NOW(), 'YYYY');
  v_count INT;
  v_numero TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Get next sequential number for this year
    SELECT COUNT(*) + 1 INTO v_count
    FROM os
    WHERE condominio_id = p_condominio_id
      AND EXTRACT(YEAR FROM data_abertura) = EXTRACT(YEAR FROM NOW());
    
    -- Generate number
    v_numero := 'OS-' || v_ano || '-' || LPAD(v_count::TEXT, 4, '0');
    
    -- Check if exists
    SELECT EXISTS(
      SELECT 1 FROM os WHERE numero = v_numero
    ) INTO v_exists;
    
    -- If unique, return it
    IF NOT v_exists THEN
      RETURN v_numero;
    END IF;
    
    -- Otherwise, increment and try again
    v_count := v_count + 1;
  END LOOP;
END;
$$;

-- Create comprehensive OS creation function with NBR checklist
CREATE OR REPLACE FUNCTION public.criar_os_detalhada(
  p_condominio_id UUID,
  p_ativo_id UUID,
  p_titulo TEXT,
  p_plano_id UUID DEFAULT NULL,
  p_descricao TEXT DEFAULT NULL,
  p_tipo_manutencao TEXT DEFAULT 'preventiva',
  p_prioridade TEXT DEFAULT 'media',
  p_tipo_executor TEXT DEFAULT 'externo',
  p_executor_nome TEXT DEFAULT NULL,
  p_executor_contato TEXT DEFAULT NULL,
  p_data_prevista DATE DEFAULT NULL,
  p_nbr_referencias TEXT[] DEFAULT NULL,
  p_checklist_items JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE(os_id UUID, os_numero TEXT, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os_id UUID;
  v_numero TEXT;
  v_solicitante_id UUID;
  v_sla_vencimento DATE;
  v_checklist JSONB;
  v_descricao_completa TEXT;
BEGIN
  -- Get current user
  SELECT u.id INTO v_solicitante_id
  FROM usuarios u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
  
  IF v_solicitante_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, 'Usuário não autenticado';
    RETURN;
  END IF;
  
  -- Generate unique OS number
  v_numero := generate_os_numero(p_condominio_id);
  
  -- Calculate SLA (default 30 days)
  v_sla_vencimento := COALESCE(p_data_prevista, CURRENT_DATE + INTERVAL '30 days');
  
  -- Build checklist from plan or custom items
  IF p_plano_id IS NOT NULL THEN
    SELECT COALESCE(pm.checklist, '[]'::JSONB) INTO v_checklist
    FROM planos_manutencao pm
    WHERE pm.id = p_plano_id;
  ELSE
    v_checklist := p_checklist_items;
  END IF;
  
  -- Build complete description with NBR references
  v_descricao_completa := p_descricao;
  IF p_nbr_referencias IS NOT NULL AND array_length(p_nbr_referencias, 1) > 0 THEN
    v_descricao_completa := COALESCE(v_descricao_completa, '') || E'\n\n' ||
      '📋 Normas Aplicáveis: ' || array_to_string(p_nbr_referencias, ', ');
  END IF;
  
  -- Create OS
  INSERT INTO os (
    condominio_id,
    numero,
    titulo,
    descricao,
    ativo_id,
    plano_id,
    solicitante_id,
    origem,
    prioridade,
    tipo_executor,
    executor_nome,
    executor_contato,
    data_abertura,
    data_prevista,
    sla_vencimento,
    status,
    status_validacao
  ) VALUES (
    p_condominio_id,
    v_numero,
    p_titulo,
    v_descricao_completa,
    p_ativo_id,
    p_plano_id,
    v_solicitante_id,
    p_tipo_manutencao,
    p_prioridade,
    p_tipo_executor,
    p_executor_nome,
    p_executor_contato,
    NOW(),
    p_data_prevista,
    v_sla_vencimento,
    'aberta',
    'pendente'
  ) RETURNING id INTO v_os_id;
  
  -- Create checklist items
  IF jsonb_array_length(v_checklist) > 0 THEN
    INSERT INTO os_checklist_itens (os_id, descricao, ordem, obrigatorio)
    SELECT 
      v_os_id,
      COALESCE(item->>'descricao', item->>'item', item::TEXT),
      COALESCE((item->>'ordem')::INTEGER, idx),
      COALESCE((item->>'obrigatorio')::BOOLEAN, true)
    FROM jsonb_array_elements(v_checklist) WITH ORDINALITY arr(item, idx);
  END IF;
  
  -- Log creation
  INSERT INTO os_logs (os_id, usuario_id, acao, detalhes)
  VALUES (
    v_os_id,
    v_solicitante_id,
    'criacao',
    jsonb_build_object(
      'tipo', p_tipo_manutencao,
      'nbr_referencias', p_nbr_referencias,
      'checklist_items', jsonb_array_length(v_checklist)
    )
  );
  
  RETURN QUERY SELECT v_os_id, v_numero, TRUE, 'OS criada com sucesso - Checklist NBR vinculado e salvo';
END;
$$;