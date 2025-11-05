-- =========================================
-- SAFETY WRAPPER
-- =========================================
BEGIN;

-- =========================================
-- A) Índice único (evita duplicatas por ativo + título)
-- (idempotente)
-- =========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_indexes
    WHERE  schemaname = 'public'
      AND  indexname  = 'ux_planos_manutencao_ativo_titulo'
  ) THEN
    EXECUTE '
      CREATE UNIQUE INDEX ux_planos_manutencao_ativo_titulo
      ON public.planos_manutencao(ativo_id, titulo)
    ';
  END IF;
END;
$$;

-- =========================================
-- A) Fix RPC criar_planos_preventivos(uuid)  (DROP para evitar erro 42P13)
-- =========================================
DROP FUNCTION IF EXISTS public.criar_planos_preventivos(uuid);

CREATE OR REPLACE FUNCTION public.criar_planos_preventivos(p_condominio_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_ativo RECORD;
  v_count_created INT := 0;
  v_count_skipped INT := 0;
BEGIN
  IF p_condominio_id IS NULL THEN
    RAISE EXCEPTION '[criar_planos_preventivos] condominio_id não pode ser NULL';
  END IF;

  RAISE NOTICE '[criar_planos_preventivos] Starting for condominio_id=%', p_condominio_id;

  FOR v_ativo IN
    SELECT 
      a.id  AS ativo_id,
      a.nome AS ativo_nome,
      at.id AS tipo_id,
      at.nome AS tipo_nome,
      at.periodicidade_default
    FROM public.ativos a
    JOIN public.ativo_tipos at ON at.id = a.tipo_id
    WHERE a.condominio_id = p_condominio_id
      AND a.is_ativo = true
      AND at.periodicidade_default IS NOT NULL
  LOOP
    RAISE NOTICE '  Checking asset: % (tipo: %)', v_ativo.ativo_nome, v_ativo.tipo_nome;

    -- Se não existe plano "Preventiva - <tipo>"
    IF NOT EXISTS (
      SELECT 1
      FROM public.planos_manutencao pm
      WHERE pm.ativo_id = v_ativo.ativo_id
        AND pm.titulo  = ('Preventiva - ' || v_ativo.tipo_nome)
    ) THEN
      INSERT INTO public.planos_manutencao (
        condominio_id,
        ativo_id,
        titulo,
        tipo,
        periodicidade,
        proxima_execucao,
        responsavel,
        checklist
      )
      VALUES (
        p_condominio_id,
        v_ativo.ativo_id,
        'Preventiva - ' || v_ativo.tipo_nome,
        'preventiva',
        v_ativo.periodicidade_default,               -- (espera INTERVAL)
        CURRENT_DATE + v_ativo.periodicidade_default,
        'sindico',
        '[]'::jsonb
      );
      v_count_created := v_count_created + 1;
      RAISE NOTICE '    ✓ Created plan for: %', v_ativo.ativo_nome;
    ELSE
      v_count_skipped := v_count_skipped + 1;
      RAISE NOTICE '    ⊘ Plan already exists for: %', v_ativo.ativo_nome;
    END IF;
  END LOOP;

  RAISE NOTICE '[criar_planos_preventivos] Complete: created=%, skipped=%', v_count_created, v_count_skipped;
  RETURN true;
END;
$function$;

-- =========================================
-- B) Trigger para auto-criar plano ao inserir ativo
-- =========================================
DROP FUNCTION IF EXISTS public.trigger_auto_criar_plano_preventivo();

CREATE OR REPLACE FUNCTION public.trigger_auto_criar_plano_preventivo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_tipo RECORD;
BEGIN
  IF NEW.tipo_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, nome, periodicidade_default
  INTO v_tipo
  FROM public.ativo_tipos
  WHERE id = NEW.tipo_id;

  IF v_tipo.periodicidade_default IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.planos_manutencao (
    condominio_id,
    ativo_id,
    titulo,
    tipo,
    periodicidade,
    proxima_execucao,
    responsavel,
    checklist
  ) VALUES (
    NEW.condominio_id,
    NEW.id,
    'Preventiva - ' || v_tipo.nome,
    'preventiva',
    v_tipo.periodicidade_default,
    CURRENT_DATE + v_tipo.periodicidade_default,
    'sindico',
    '[]'::jsonb
  )
  ON CONFLICT ON CONSTRAINT ux_planos_manutencao_ativo_titulo DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_auto_criar_plano_preventivo ON public.ativos;

CREATE TRIGGER trigger_auto_criar_plano_preventivo
AFTER INSERT ON public.ativos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_criar_plano_preventivo();

-- =========================================
-- C) Grants mínimos (em Supabase, role postgres já tem; mantemos por clareza)
-- =========================================
GRANT EXECUTE ON FUNCTION public.criar_planos_preventivos(uuid) TO authenticated;

-- (normalmente desnecessário, mas inofensivo)
GRANT SELECT ON public.ativos TO postgres;
GRANT SELECT ON public.ativo_tipos TO postgres;
GRANT INSERT ON public.planos_manutencao TO postgres;

COMMIT;
