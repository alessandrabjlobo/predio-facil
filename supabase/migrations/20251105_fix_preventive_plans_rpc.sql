/*
  # Fix Preventive Plans Auto-Generation (RPC + INTERVAL handling)

  ## Overview
  This migration fixes the automatic preventive plan generation when new assets are created.

  ## Changes
  1. Drops and recreates `criar_planos_preventivos(uuid)` with proper INTERVAL handling
  2. Function matches templates by sistema (case-insensitive) or ativo_tipos.nome
  3. Uses periodicidade as INTERVAL (no TEXT conversion)
  4. Creates default plans using ativo_tipos.periodicidade_default if no templates match
  5. Prevents duplicates (checks ativo_id + titulo)
  6. Returns integer count of plans created

  ## Tables involved
  - ativos (source of assets)
  - ativo_tipos (periodicidade_default lookup)
  - manut_templates (template-based plan creation)
  - planos_manutencao (target table)

  ## Safety
  - Idempotent: running multiple times won't create duplicates
  - SECURITY DEFINER to bypass RLS during auto-creation
  - Granted to anon, authenticated, service_role
*/

-- Drop existing function to avoid signature conflicts
DROP FUNCTION IF EXISTS public.criar_planos_preventivos(UUID);

-- Recreate function with proper INTERVAL handling
CREATE OR REPLACE FUNCTION public.criar_planos_preventivos(p_condominio_id UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ativo RECORD;
  v_template RECORD;
  v_ativo_tipo RECORD;
  v_plans_created integer := 0;
  v_periodicidade_interval interval;
  v_titulo_plano text;
  v_checklist jsonb;
BEGIN
  -- Loop through all ativos (using tipo_id FK to get ativo_tipos.nome)
  FOR v_ativo IN
    SELECT
      a.id,
      a.nome,
      a.condominio_id,
      a.tipo_id,
      at.nome as tipo_nome,
      at.slug as tipo_slug
    FROM public.ativos a
    LEFT JOIN public.ativo_tipos at ON a.tipo_id = at.id
    WHERE (p_condominio_id IS NULL OR a.condominio_id = p_condominio_id)
  LOOP

    -- Skip if we can't determine the asset type
    IF v_ativo.tipo_nome IS NULL THEN
      CONTINUE;
    END IF;

    -- Get ativo_tipo record for periodicidade_default
    SELECT * INTO v_ativo_tipo
    FROM public.ativo_tipos
    WHERE id = v_ativo.tipo_id
    LIMIT 1;

    -- Look for matching templates by sistema (match against tipo_nome or slug)
    FOR v_template IN
      SELECT *
      FROM public.manut_templates
      WHERE LOWER(sistema) = LOWER(v_ativo.tipo_nome)
         OR LOWER(sistema) = LOWER(REPLACE(v_ativo.tipo_nome, ' ', ''))
         OR LOWER(sistema) = LOWER(COALESCE(v_ativo.tipo_slug, ''))
    LOOP

      -- Handle periodicidade (should already be INTERVAL, but be defensive)
      BEGIN
        IF v_template.periodicidade IS NOT NULL THEN
          -- If it's already interval, use it directly
          v_periodicidade_interval := v_template.periodicidade;
        ELSE
          -- Fallback to 1 month if null
          v_periodicidade_interval := interval '1 month';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- If any error, default to 1 month
        v_periodicidade_interval := interval '1 month';
      END;

      v_titulo_plano := COALESCE(v_template.titulo_plano, 'Manutenção Preventiva - ' || v_ativo.tipo_nome);
      v_checklist := COALESCE(v_template.checklist, '[]'::jsonb);

      -- Check if plan already exists (avoid duplicates)
      IF NOT EXISTS (
        SELECT 1 FROM public.planos_manutencao
        WHERE ativo_id = v_ativo.id
          AND titulo = v_titulo_plano
      ) THEN
        -- Create plan from template
        INSERT INTO public.planos_manutencao (
          ativo_id,
          condominio_id,
          titulo,
          tipo,
          periodicidade,
          proxima_execucao,
          checklist,
          responsavel,
          descricao
        ) VALUES (
          v_ativo.id,
          v_ativo.condominio_id,
          v_titulo_plano,
          'preventiva',
          v_periodicidade_interval,
          CURRENT_DATE + v_periodicidade_interval,
          v_checklist,
          COALESCE(v_template.responsavel, 'sindico'),
          v_template.descricao
        );

        v_plans_created := v_plans_created + 1;
      END IF;
    END LOOP;

    -- If no templates matched, create a default plan using ativo_tipos.periodicidade_default
    IF NOT EXISTS (
      SELECT 1 FROM public.planos_manutencao
      WHERE ativo_id = v_ativo.id
    ) THEN

      -- Get default periodicity
      BEGIN
        IF v_ativo_tipo.periodicidade_default IS NOT NULL THEN
          v_periodicidade_interval := v_ativo_tipo.periodicidade_default;
        ELSE
          v_periodicidade_interval := interval '1 month';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_periodicidade_interval := interval '1 month';
      END;

      -- Create default plan
      INSERT INTO public.planos_manutencao (
        ativo_id,
        condominio_id,
        titulo,
        tipo,
        periodicidade,
        proxima_execucao,
        checklist,
        responsavel
      ) VALUES (
        v_ativo.id,
        v_ativo.condominio_id,
        'Preventiva – ' || COALESCE(v_ativo.tipo_nome, 'Ativo'),
        'preventiva',
        v_periodicidade_interval,
        CURRENT_DATE + v_periodicidade_interval,
        '[]'::jsonb,
        'sindico'
      );

      v_plans_created := v_plans_created + 1;
    END IF;

  END LOOP;

  RETURN v_plans_created;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.criar_planos_preventivos TO anon, authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION public.criar_planos_preventivos IS
  'Creates preventive maintenance plans for assets based on templates or defaults. ' ||
  'Handles INTERVAL periodicidade correctly. Returns count of plans created. Idempotent.';
