/*
  # Create Simple OS Function
  
  Simpler version of OS creation function used by useOrdemServico hook.
  Returns jsonb format for compatibility.
*/

CREATE OR REPLACE FUNCTION public.criar_os(
  p_condominio_id UUID,
  p_ativo_id UUID,
  p_responsavel_id UUID,
  p_titulo TEXT,
  p_plano_id UUID DEFAULT NULL,
  p_descricao TEXT DEFAULT '',
  p_prioridade TEXT DEFAULT 'media',
  p_tipo_os TEXT DEFAULT 'preventiva',
  p_data_prevista DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_os_id UUID;
  v_numero TEXT;
  v_checklist JSONB;
  v_sla_vencimento DATE;
BEGIN
  -- Validations
  IF p_condominio_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Condomínio não informado');
  END IF;

  IF p_ativo_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ativo não informado');
  END IF;

  -- Generate OS number
  v_numero := generate_os_numero(p_condominio_id);

  -- Calculate SLA (default 30 days)
  v_sla_vencimento := COALESCE(p_data_prevista, CURRENT_DATE + INTERVAL '30 days');

  -- Get checklist from plan if exists
  IF p_plano_id IS NOT NULL THEN
    SELECT COALESCE(checklist, '[]'::JSONB) INTO v_checklist
    FROM planos_manutencao
    WHERE id = p_plano_id;
  ELSE
    v_checklist := '[]'::JSONB;
  END IF;

  -- Insert OS
  INSERT INTO os (
    condominio_id,
    numero,
    titulo,
    descricao,
    status,
    origem,
    prioridade,
    ativo_id,
    plano_id,
    solicitante_id,
    data_abertura,
    data_prevista,
    sla_vencimento,
    checklist
  )
  VALUES (
    p_condominio_id,
    v_numero,
    p_titulo,
    p_descricao,
    'aberta',
    p_tipo_os,
    p_prioridade,
    p_ativo_id,
    p_plano_id,
    p_responsavel_id,
    NOW(),
    p_data_prevista,
    v_sla_vencimento,
    v_checklist
  )
  RETURNING id INTO v_os_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Ordem de Serviço criada com sucesso',
    'os_id', v_os_id,
    'numero', v_numero,
    'condominio_id', p_condominio_id,
    'ativo_id', p_ativo_id,
    'plano_id', p_plano_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Falha ao criar Ordem de Serviço'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_os TO anon, authenticated, service_role;
