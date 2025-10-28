-- ==========================================
-- 🔧 MIGRATION: Fix criar_os_detalhada
-- DATA: 2025-10-29
-- OBJETIVO: Corrigir a função RPC criar_os_detalhada
-- ==========================================

-- Remove versões antigas da função
DROP FUNCTION IF EXISTS public.criar_os_detalhada;

-- ==========================================
-- ✅ FUNÇÃO CORRIGIDA
-- ==========================================
CREATE OR REPLACE FUNCTION public.criar_os_detalhada(
  p_condominio_id uuid,
  p_plano_id uuid DEFAULT NULL,
  p_ativo_id uuid,
  p_responsavel_id uuid,
  p_titulo text,
  p_descricao text DEFAULT '',
  p_prioridade text DEFAULT 'media',
  p_tipo_os text DEFAULT 'preventiva',
  p_data_prevista date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_os_id uuid;
  v_numero integer;
  v_checklist jsonb;
  v_data_abertura timestamp := now();
  v_sla_vencimento date;
BEGIN
  -- =====================================================
  -- 1️⃣ Validações iniciais
  -- =====================================================
  IF p_condominio_id IS NULL THEN
    RAISE EXCEPTION 'Condomínio não informado';
  END IF;

  IF p_ativo_id IS NULL THEN
    RAISE EXCEPTION 'Ativo não informado';
  END IF;

  -- =====================================================
  -- 2️⃣ Geração do número sequencial da OS
  -- =====================================================
  SELECT COALESCE(MAX(numero), 0) + 1 INTO v_numero
  FROM os
  WHERE condominio_id = p_condominio_id;

  -- =====================================================
  -- 3️⃣ Determinar prazo de vencimento (30 dias padrão)
  -- =====================================================
  v_sla_vencimento := COALESCE(p_data_prevista, (current_date + interval '30 days'));

  -- =====================================================
  -- 4️⃣ Buscar checklist do plano, se existir
  -- =====================================================
  IF p_plano_id IS NOT NULL THEN
    SELECT checklist INTO v_checklist
    FROM planos_manutencao
    WHERE id = p_plano_id;
  ELSE
    v_checklist := '[]'::jsonb;
  END IF;

  -- =====================================================
  -- 5️⃣ Inserir OS na tabela principal
  -- =====================================================
  INSERT INTO os (
    id,
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
    gen_random_uuid(),
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
    v_data_abertura,
    p_data_prevista,
    v_sla_vencimento,
    v_checklist
  )
  RETURNING id INTO v_os_id;

  -- =====================================================
  -- 6️⃣ Retorno em formato JSON
  -- =====================================================
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

-- ==========================================
-- 🧩 PERMISSÕES
-- ==========================================
GRANT EXECUTE ON FUNCTION public.criar_os_detalhada TO anon, authenticated, service_role;
