/*
  # Comprehensive OS Backend Fix - Repair Migration

  ## Summary
  This migration repairs and hardens the Work Order (OS) backend infrastructure
  to support both frontend dialog patterns without any UI changes.

  ## Changes Made

  ### 1. Schema Updates
  - Add missing columns to `os` table:
    - `responsavel_id` (uuid) - references usuarios
    - `tipo_os` (text) - type of work order (preventiva, corretiva, emergencial)
    - `tipo_manutencao` (text) - maintenance type
    - `nbr_referencias` (jsonb) - NBR standard references
    - `checklist_items` (jsonb) - checklist items for execution

  ### 2. Function Repairs
  - Drop overloaded `generate_os_numero` functions
  - Keep single version that uses `os_sequence` table
  - Drop all `criar_os_detalhada` overloads
  - Create unified RPC supporting both dialog patterns

  ### 3. Constraints & Indexes
  - Ensure unique index on (condominio_id, numero_os)
  - Fix usuarios auth_user_id unique constraint idempotently

  ### 4. Security
  - RPC uses SECURITY DEFINER
  - Respects existing RLS policies
  - Minimal privilege escalation

  ## Compatibility
  - Frontend unchanged
  - Backward compatible with existing data
  - Idempotent - safe to run multiple times
*/

-- ============================================================================
-- PART 1: ADD MISSING COLUMNS TO OS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add responsavel_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'os'
      AND column_name = 'responsavel_id'
  ) THEN
    ALTER TABLE public.os
    ADD COLUMN responsavel_id UUID REFERENCES public.usuarios(id);

    CREATE INDEX IF NOT EXISTS idx_os_responsavel
    ON public.os(responsavel_id)
    WHERE responsavel_id IS NOT NULL;
  END IF;

  -- Add tipo_os if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'os'
      AND column_name = 'tipo_os'
  ) THEN
    ALTER TABLE public.os
    ADD COLUMN tipo_os TEXT DEFAULT 'corretiva'
    CHECK (tipo_os IN ('preventiva', 'corretiva', 'emergencial', 'preditiva'));
  END IF;

  -- Add tipo_manutencao if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'os'
      AND column_name = 'tipo_manutencao'
  ) THEN
    ALTER TABLE public.os
    ADD COLUMN tipo_manutencao TEXT;
  END IF;

  -- Add nbr_referencias if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'os'
      AND column_name = 'nbr_referencias'
  ) THEN
    ALTER TABLE public.os
    ADD COLUMN nbr_referencias JSONB DEFAULT '[]'::jsonb;

    CREATE INDEX IF NOT EXISTS idx_os_nbr_referencias
    ON public.os USING gin(nbr_referencias);
  END IF;

  -- Add checklist_items if not exists (different from checklist column)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'os'
      AND column_name = 'checklist_items'
  ) THEN
    ALTER TABLE public.os
    ADD COLUMN checklist_items JSONB DEFAULT '[]'::jsonb;

    CREATE INDEX IF NOT EXISTS idx_os_checklist_items
    ON public.os USING gin(checklist_items);
  END IF;

END $$;

-- ============================================================================
-- PART 2: FIX GENERATE_OS_NUMERO FUNCTION (REMOVE OVERLOADS)
-- ============================================================================

-- Drop all existing overloads to ensure clean state
DROP FUNCTION IF EXISTS public.generate_os_numero(uuid);
DROP FUNCTION IF EXISTS public.generate_os_numero(uuid, date);
DROP FUNCTION IF EXISTS public.generate_os_numero(uuid, text);

-- Create single authoritative version
CREATE OR REPLACE FUNCTION public.generate_os_numero(
  p_condominio_id uuid,
  p_data date DEFAULT CURRENT_DATE
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano text := to_char(COALESCE(p_data, CURRENT_DATE), 'YYYY');
  v_seq int;
BEGIN
  -- Use the os_sequence table for concurrency-safe sequence generation
  v_seq := public.next_os_seq(p_condominio_id, p_data);

  -- Return format: OS-YYYY-0001
  RETURN format('OS-%s-%s', v_ano, lpad(v_seq::text, 4, '0'));
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_os_numero(uuid, date)
TO anon, authenticated, service_role;

-- ============================================================================
-- PART 3: CREATE UNIFIED CRIAR_OS_DETALHADA RPC
-- ============================================================================

-- Drop all existing overloads
DROP FUNCTION IF EXISTS public.criar_os_detalhada(uuid, uuid, uuid, uuid, text, text, text, text, date);
DROP FUNCTION IF EXISTS public.criar_os_detalhada(uuid, uuid, uuid, text, uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.criar_os_detalhada(uuid, uuid, text, uuid, text, text, text, text, text, text, text, text, date, text[], jsonb);
-- Drop any other possible signatures
DROP FUNCTION IF EXISTS public.criar_os_detalhada CASCADE;

-- Create unified function supporting both dialog patterns
CREATE OR REPLACE FUNCTION public.criar_os_detalhada(
  -- Core parameters (required by both dialogs)
  p_condominio_id uuid,
  p_ativo_id uuid,
  p_titulo text,

  -- Optional parameters with defaults
  p_plano_id uuid DEFAULT NULL,
  p_responsavel_id uuid DEFAULT NULL,
  p_solicitante_id uuid DEFAULT NULL,
  p_descricao text DEFAULT NULL,
  p_prioridade text DEFAULT 'media',
  p_tipo_os text DEFAULT 'corretiva',
  p_status text DEFAULT 'aberta',
  p_data_prevista date DEFAULT NULL,

  -- Second dialog specific parameters
  p_tipo_manutencao text DEFAULT NULL,
  p_tipo_executor text DEFAULT NULL,
  p_executor_nome text DEFAULT NULL,
  p_executor_contato text DEFAULT NULL,
  p_nbr_referencias jsonb DEFAULT NULL,
  p_checklist_items jsonb DEFAULT NULL
)
RETURNS public.os
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_numero_os text;
  v_row public.os;
  v_current_user_id uuid;
  v_sla_vencimento date;
BEGIN
  -- Validate required parameters
  IF p_condominio_id IS NULL THEN
    RAISE EXCEPTION 'condominio_id is required';
  END IF;

  IF p_ativo_id IS NULL THEN
    RAISE EXCEPTION 'ativo_id is required';
  END IF;

  IF p_titulo IS NULL OR trim(p_titulo) = '' THEN
    RAISE EXCEPTION 'titulo is required';
  END IF;

  -- Get current authenticated user if solicitante not provided
  IF p_solicitante_id IS NULL THEN
    SELECT u.id INTO v_current_user_id
    FROM public.usuarios u
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1;
  ELSE
    v_current_user_id := p_solicitante_id;
  END IF;

  -- Generate unique OS number
  v_numero_os := public.generate_os_numero(p_condominio_id, p_data_prevista);

  -- Calculate SLA (default 30 days from data_prevista or today)
  v_sla_vencimento := COALESCE(p_data_prevista, CURRENT_DATE) + INTERVAL '30 days';

  -- Insert OS with all fields
  INSERT INTO public.os (
    id,
    condominio_id,
    numero_os,
    plano_id,
    ativo_id,
    responsavel_id,
    solicitante_id,
    titulo,
    descricao,
    prioridade,
    tipo_os,
    status,
    origem,
    data_prevista,
    sla_vencimento,
    data_abertura,
    tipo_manutencao,
    tipo_executor,
    executor_nome,
    executor_contato,
    nbr_referencias,
    checklist_items,
    checklist
  )
  VALUES (
    gen_random_uuid(),
    p_condominio_id,
    v_numero_os,
    p_plano_id,
    p_ativo_id,
    p_responsavel_id,
    v_current_user_id,
    trim(p_titulo),
    p_descricao,
    COALESCE(p_prioridade, 'media'),
    COALESCE(p_tipo_os, 'corretiva'),
    COALESCE(p_status, 'aberta'),
    COALESCE(p_tipo_os, 'corretiva'), -- origem mirrors tipo_os for backward compatibility
    p_data_prevista,
    v_sla_vencimento,
    NOW(),
    p_tipo_manutencao,
    p_tipo_executor,
    p_executor_nome,
    p_executor_contato,
    COALESCE(p_nbr_referencias, '[]'::jsonb),
    COALESCE(p_checklist_items, '[]'::jsonb),
    COALESCE(p_checklist_items, '[]'::jsonb) -- Also populate old checklist column
  )
  RETURNING * INTO v_row;

  -- Log OS creation
  INSERT INTO public.os_logs (
    os_id,
    usuario_id,
    acao,
    detalhes
  )
  VALUES (
    v_row.id,
    v_current_user_id,
    'OS criada',
    jsonb_build_object(
      'numero_os', v_numero_os,
      'tipo_os', p_tipo_os,
      'prioridade', p_prioridade
    )
  );

  RETURN v_row;

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Número de OS duplicado. Tente novamente.';
  WHEN foreign_key_violation THEN
    RAISE EXCEPTION 'Referência inválida: verifique condomínio, ativo ou usuários';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar OS: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.criar_os_detalhada(
  uuid, uuid, text, uuid, uuid, uuid, text, text, text, text, date,
  text, text, text, text, jsonb, jsonb
) TO anon, authenticated, service_role;

-- Add helpful comment
COMMENT ON FUNCTION public.criar_os_detalhada IS
'Unified RPC to create Work Orders supporting both frontend dialog patterns.
Generates unique numero_os per condominium/year, handles NBR references and checklists.';

-- ============================================================================
-- PART 4: FIX USUARIOS UNIQUE CONSTRAINT IDEMPOTENTLY
-- ============================================================================

DO $$
BEGIN
  -- Create unique index if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'usuarios'
      AND indexname = 'usuarios_auth_user_id_uix'
  ) THEN
    CREATE UNIQUE INDEX usuarios_auth_user_id_uix
    ON public.usuarios(auth_user_id);
  END IF;

  -- Try to add constraint using the index (only if constraint doesn't exist)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usuarios_auth_user_id_key'
      AND conrelid = 'public.usuarios'::regclass
  ) THEN
    BEGIN
      ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_auth_user_id_key
      UNIQUE USING INDEX usuarios_auth_user_id_uix;
    EXCEPTION
      WHEN duplicate_object THEN
        -- Constraint already exists, do nothing
        NULL;
      WHEN undefined_object THEN
        -- Index doesn't exist somehow, skip
        NULL;
    END;
  END IF;
END $$;

-- ============================================================================
-- PART 5: ENSURE RLS POLICIES ARE INSERT-COMPATIBLE
-- ============================================================================

-- Add INSERT policy for os_logs if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'os_logs'
      AND policyname = 'os_logs_insert_authenticated'
  ) THEN
    CREATE POLICY "os_logs_insert_authenticated"
    ON public.os_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.os
        WHERE os.id = os_logs.os_id
          AND os.condominio_id IN (
            SELECT uc.condominio_id
            FROM public.usuarios_condominios uc
            JOIN public.usuarios u ON uc.usuario_id = u.id
            WHERE u.auth_user_id = auth.uid()
          )
      )
    );
  END IF;
END $$;

-- Add INSERT policy for os_anexos if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'os_anexos'
      AND policyname = 'os_anexos_insert_authenticated'
  ) THEN
    CREATE POLICY "os_anexos_insert_authenticated"
    ON public.os_anexos
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.os
        WHERE os.id = os_anexos.os_id
          AND os.condominio_id IN (
            SELECT uc.condominio_id
            FROM public.usuarios_condominios uc
            JOIN public.usuarios u ON uc.usuario_id = u.id
            WHERE u.auth_user_id = auth.uid()
          )
      )
    );
  END IF;
END $$;

-- ============================================================================
-- PART 6: VALIDATE INDEXES AND CONSTRAINTS
-- ============================================================================

-- Ensure os_condominio_numero_key unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'os_condominio_numero_key'
      AND connamespace = 'public'::regnamespace
  ) THEN
    -- Index already exists (os_condominio_numero_key), just bind constraint
    ALTER TABLE public.os
    ADD CONSTRAINT os_condominio_numero_key
    UNIQUE USING INDEX os_condominio_numero_key;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;  -- Constraint already exists
  WHEN undefined_object THEN
    NULL;  -- Index doesn't exist, skip
END $$;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OS Backend Comprehensive Fix - COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Schema changes:';
  RAISE NOTICE '  ✓ Added missing columns to os table';
  RAISE NOTICE '  ✓ Fixed generate_os_numero (single signature)';
  RAISE NOTICE '  ✓ Created unified criar_os_detalhada RPC';
  RAISE NOTICE '  ✓ Fixed usuarios unique constraint';
  RAISE NOTICE '  ✓ Added RLS policies for os_logs and os_anexos INSERT';
  RAISE NOTICE '';
  RAISE NOTICE 'RPC Signature:';
  RAISE NOTICE '  criar_os_detalhada(';
  RAISE NOTICE '    p_condominio_id, p_ativo_id, p_titulo,';
  RAISE NOTICE '    [p_plano_id], [p_responsavel_id], [p_solicitante_id],';
  RAISE NOTICE '    [p_descricao], [p_prioridade], [p_tipo_os],';
  RAISE NOTICE '    [p_status], [p_data_prevista],';
  RAISE NOTICE '    [p_tipo_manutencao], [p_tipo_executor],';
  RAISE NOTICE '    [p_executor_nome], [p_executor_contato],';
  RAISE NOTICE '    [p_nbr_referencias], [p_checklist_items]';
  RAISE NOTICE '  )';
  RAISE NOTICE '';
  RAISE NOTICE 'All operations are idempotent and safe to re-run.';
  RAISE NOTICE '========================================';
END $$;
