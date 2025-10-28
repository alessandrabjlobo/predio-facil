-- Fix 1: Add missing columns to condominios table
ALTER TABLE public.condominios 
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS uf TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS unidades INTEGER;

-- Fix 2: Add performance indexes for OS queries
CREATE INDEX IF NOT EXISTS idx_os_condominio_status ON public.os(condominio_id, status);
CREATE INDEX IF NOT EXISTS idx_os_ativo_id ON public.os(ativo_id);
CREATE INDEX IF NOT EXISTS idx_os_plano_id ON public.os(plano_id);
CREATE INDEX IF NOT EXISTS idx_conformidade_condominio ON public.conformidade_itens(condominio_id);
CREATE INDEX IF NOT EXISTS idx_ativos_condominio_tipo ON public.ativos(condominio_id, tipo_id);
CREATE INDEX IF NOT EXISTS idx_planos_condominio_ativo ON public.planos_manutencao(condominio_id, ativo_id);

-- Fix 3: Optimize criar_os_detalhada function to prevent timeouts
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
RETURNS TABLE(
  os_id UUID,
  os_numero TEXT,
  success BOOLEAN,
  message TEXT
)
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
  -- Get current user quickly with limit
  SELECT u.id INTO v_solicitante_id
  FROM usuarios u
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
  
  IF v_solicitante_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE, 'Usuário não autenticado';
    RETURN;
  END IF;
  
  -- Generate unique OS number efficiently
  v_numero := generate_os_numero(p_condominio_id);
  
  -- Calculate SLA (default 30 days)
  v_sla_vencimento := COALESCE(p_data_prevista, CURRENT_DATE + INTERVAL '30 days');
  
  -- Build checklist from plan or custom items (optimize query)
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
  
  -- Create checklist items efficiently
  IF jsonb_array_length(v_checklist) > 0 THEN
    INSERT INTO os_checklist_itens (os_id, descricao, ordem, obrigatorio)
    SELECT 
      v_os_id,
      COALESCE(item->>'descricao', item->>'item', item::TEXT),
      COALESCE((item->>'ordem')::INTEGER, idx),
      COALESCE((item->>'obrigatorio')::BOOLEAN, true)
    FROM jsonb_array_elements(v_checklist) WITH ORDINALITY arr(item, idx);
  END IF;
  
  -- Log creation (optimized)
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

-- Fix 4: Create function to get asset checklist and history efficiently
CREATE OR REPLACE FUNCTION public.get_asset_maintenance_info(p_ativo_id UUID)
RETURNS TABLE(
  checklist_items JSONB,
  maintenance_history JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Get NBR checklist from asset type
    COALESCE(
      (SELECT at.checklist_default
       FROM ativos a
       JOIN ativo_tipos at ON at.id = a.tipo_id
       WHERE a.id = p_ativo_id
       LIMIT 1),
      '[]'::JSONB
    ) as checklist_items,
    -- Get maintenance history
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'os_numero', o.numero,
          'data_conclusao', o.data_conclusao,
          'responsavel', o.executor_nome,
          'status', o.status,
          'tipo', o.origem
        ) ORDER BY o.data_conclusao DESC
      )
      FROM os o
      WHERE o.ativo_id = p_ativo_id
        AND o.status = 'concluida'
      LIMIT 20),
      '[]'::JSONB
    ) as maintenance_history;
END;
$$;