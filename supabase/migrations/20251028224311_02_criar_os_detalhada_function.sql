/*
  # Create OS Detalhada Function
  
  Creates detailed service orders with NBR compliance tracking.
  Returns table format with os_id, os_numero, success, and message.
*/

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
  -- Validate required parameters
  IF p_condominio_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, 'Condomínio não especificado';
    RETURN;
  END IF;

  IF p_ativo_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, 'Ativo não especificado';
    RETURN;
  END IF;

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
    WHERE pm.id = p_plano_id
    LIMIT 1;
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
    executor_nome,
    executor_contato,
    data_abertura,
    data_prevista,
    sla_vencimento,
    status,
    checklist
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
    p_executor_nome,
    p_executor_contato,
    NOW(),
    p_data_prevista,
    v_sla_vencimento,
    'aberta',
    v_checklist
  ) RETURNING id INTO v_os_id;
  
  RETURN QUERY SELECT v_os_id, v_numero, TRUE, 'OS criada com sucesso';
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_os_detalhada TO anon, authenticated, service_role;
