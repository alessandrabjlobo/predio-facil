-- Drop previous function if exists
DROP FUNCTION IF EXISTS criar_os_detalhada;

-- Create improved RPC for detailed OS creation with NBR compliance
-- All parameters after the first required ones have default values
CREATE OR REPLACE FUNCTION criar_os_detalhada(
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
) RETURNS TABLE(
  os_id UUID,
  os_numero TEXT,
  success BOOLEAN,
  message TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_os_id UUID;
  v_numero TEXT;
  v_solicitante_id UUID;
  v_sla_vencimento DATE;
  v_checklist JSONB;
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
  
  -- Generate OS number
  SELECT generate_os_numero(p_condominio_id) INTO v_numero;
  
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
    p_descricao,
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
      item->>'descricao',
      COALESCE((item->>'ordem')::INTEGER, 0),
      COALESCE((item->>'obrigatorio')::BOOLEAN, true)
    FROM jsonb_array_elements(v_checklist) item;
  END IF;
  
  RETURN QUERY SELECT v_os_id, v_numero, TRUE, 'OS criada com sucesso';
END;
$$;