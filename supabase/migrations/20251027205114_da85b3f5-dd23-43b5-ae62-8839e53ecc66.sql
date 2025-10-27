-- ============================================
-- PRÉDIO FÁCIL - MÓDULO PREVENTIVO NBR 5674
-- ============================================

-- FASE 1: BACKEND AUTOMATION FUNCTIONS
-- ============================================

-- 1. Function to update next execution date after OS completion
CREATE OR REPLACE FUNCTION public.update_next_execution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plano_id UUID;
  v_periodicidade INTERVAL;
BEGIN
  -- Only update when OS is completed and approved
  IF NEW.status = 'concluida' AND NEW.status_validacao = 'aprovada' THEN
    -- Get the maintenance plan
    v_plano_id := NEW.plano_id;
    
    IF v_plano_id IS NOT NULL THEN
      -- Get the plan's periodicity
      SELECT periodicidade INTO v_periodicidade
      FROM planos_manutencao
      WHERE id = v_plano_id;
      
      -- Update next execution date
      UPDATE planos_manutencao
      SET 
        proxima_execucao = NEW.data_conclusao::date + v_periodicidade,
        updated_at = now()
      WHERE id = v_plano_id;
      
      -- Update conformidade_itens
      UPDATE conformidade_itens
      SET 
        ultimo = NEW.data_conclusao::date,
        proximo = NEW.data_conclusao::date + v_periodicidade,
        status = 'verde',
        executado_por = NEW.executante_id,
        updated_at = now()
      WHERE plano_id = v_plano_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-updating next execution
DROP TRIGGER IF EXISTS on_os_completed_update_next_execution ON public.os;
CREATE TRIGGER on_os_completed_update_next_execution
  AFTER UPDATE ON public.os
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.status_validacao IS DISTINCT FROM NEW.status_validacao)
  EXECUTE FUNCTION public.update_next_execution();

-- 2. Function to automatically create preventive maintenance plans
CREATE OR REPLACE FUNCTION public.criar_planos_preventivos(p_condominio_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ativo RECORD;
  v_nbr RECORD;
  v_plano_id UUID;
BEGIN
  -- Loop through all compliance-required assets
  FOR v_ativo IN 
    SELECT id, tipo_id, nome
    FROM ativos
    WHERE condominio_id = p_condominio_id
      AND requer_conformidade = true
      AND is_ativo = true
  LOOP
    -- Get NBR requirements for this asset type
    FOR v_nbr IN
      SELECT *
      FROM nbr_requisitos nr
      JOIN ativo_tipos at ON at.slug = nr.ativo_tipo_slug
      WHERE at.id = v_ativo.tipo_id
    LOOP
      -- Check if plan already exists
      IF NOT EXISTS (
        SELECT 1 FROM planos_manutencao
        WHERE ativo_id = v_ativo.id
          AND titulo = v_nbr.nbr_codigo || ': ' || v_nbr.requisito_descricao
      ) THEN
        -- Create maintenance plan
        INSERT INTO planos_manutencao (
          condominio_id,
          ativo_id,
          titulo,
          tipo,
          periodicidade,
          proxima_execucao,
          is_legal,
          checklist,
          responsavel
        ) VALUES (
          p_condominio_id,
          v_ativo.id,
          v_nbr.nbr_codigo || ': ' || v_nbr.requisito_descricao,
          'preventiva',
          v_nbr.periodicidade_minima,
          CURRENT_DATE + v_nbr.periodicidade_minima,
          true,
          v_nbr.checklist_items,
          COALESCE(v_nbr.responsavel_sugerido, 'sindico')
        ) RETURNING id INTO v_plano_id;
        
        -- Create conformidade item
        INSERT INTO conformidade_itens (
          condominio_id,
          ativo_id,
          plano_id,
          tipo,
          periodicidade,
          proximo,
          status
        ) VALUES (
          p_condominio_id,
          v_ativo.id,
          v_plano_id,
          'preventiva',
          v_nbr.periodicidade_minima,
          CURRENT_DATE + v_nbr.periodicidade_minima,
          'amarelo'
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 3. Function to get maintenance dashboard stats
CREATE OR REPLACE FUNCTION public.get_maintenance_stats(p_condominio_id UUID)
RETURNS TABLE (
  total_ativos BIGINT,
  planos_preventivos BIGINT,
  os_abertas BIGINT,
  conformidade_percent NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      (SELECT COUNT(*) FROM ativos WHERE condominio_id = p_condominio_id AND is_ativo = true) AS total_ativos,
      (SELECT COUNT(*) FROM planos_manutencao WHERE condominio_id = p_condominio_id) AS planos_preventivos,
      (SELECT COUNT(*) FROM os WHERE condominio_id = p_condominio_id AND status NOT IN ('concluida', 'cancelada')) AS os_abertas,
      (SELECT 
        CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE ROUND((COUNT(*) FILTER (WHERE status = 'verde') * 100.0 / COUNT(*)), 2)
        END
       FROM conformidade_itens WHERE condominio_id = p_condominio_id
      ) AS conformidade_percent
  )
  SELECT * FROM stats;
END;
$$;

-- 4. Function to get upcoming maintenances (next 15 days)
CREATE OR REPLACE FUNCTION public.get_upcoming_maintenances(p_condominio_id UUID, p_days_ahead INTEGER DEFAULT 15)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  ativo_nome TEXT,
  ativo_tipo TEXT,
  proxima_execucao DATE,
  days_until INTEGER,
  status TEXT,
  criticidade TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.titulo,
    a.nome AS ativo_nome,
    at.nome AS ativo_tipo,
    pm.proxima_execucao,
    (pm.proxima_execucao - CURRENT_DATE) AS days_until,
    CASE
      WHEN pm.proxima_execucao < CURRENT_DATE THEN 'atrasado'
      WHEN pm.proxima_execucao <= CURRENT_DATE + p_days_ahead THEN 'proximo'
      ELSE 'futuro'
    END AS status,
    COALESCE(at.criticidade, 'media') AS criticidade
  FROM planos_manutencao pm
  JOIN ativos a ON a.id = pm.ativo_id
  LEFT JOIN ativo_tipos at ON at.id = a.tipo_id
  WHERE pm.condominio_id = p_condominio_id
    AND pm.proxima_execucao <= CURRENT_DATE + p_days_ahead
  ORDER BY pm.proxima_execucao ASC;
END;
$$;

-- 5. Function to get non-conformities
CREATE OR REPLACE FUNCTION public.get_non_conformities(p_condominio_id UUID)
RETURNS TABLE (
  ativo_id UUID,
  ativo_nome TEXT,
  tipo_nome TEXT,
  nbr_codigo TEXT,
  dias_atrasado INTEGER,
  gravidade TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS ativo_id,
    a.nome AS ativo_nome,
    at.nome AS tipo_nome,
    SUBSTRING(pm.titulo FROM '^([^:]+)') AS nbr_codigo,
    (CURRENT_DATE - pm.proxima_execucao) AS dias_atrasado,
    CASE
      WHEN (CURRENT_DATE - pm.proxima_execucao) > 30 THEN 'critica'
      WHEN (CURRENT_DATE - pm.proxima_execucao) > 15 THEN 'alta'
      ELSE 'media'
    END AS gravidade
  FROM planos_manutencao pm
  JOIN ativos a ON a.id = pm.ativo_id
  LEFT JOIN ativo_tipos at ON at.id = a.tipo_id
  WHERE pm.condominio_id = p_condominio_id
    AND pm.proxima_execucao < CURRENT_DATE
    AND pm.is_legal = true
  ORDER BY dias_atrasado DESC;
END;
$$;

-- FASE 2: IMPROVE EXISTING INICIALIZAR FUNCTION
-- ============================================

-- Update the existing function to also call criar_planos_preventivos
CREATE OR REPLACE FUNCTION public.trigger_inicializar_ativos_nbr()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Initialize standard NBR assets
  PERFORM inicializar_ativos_nbr_completo(NEW.id);
  
  -- Create preventive maintenance plans
  PERFORM criar_planos_preventivos(NEW.id);
  
  RETURN NEW;
END;
$$;

-- FASE 3: INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_planos_condominio_proxima 
  ON planos_manutencao(condominio_id, proxima_execucao);

CREATE INDEX IF NOT EXISTS idx_conformidade_condominio_status 
  ON conformidade_itens(condominio_id, status);

CREATE INDEX IF NOT EXISTS idx_os_condominio_status_data 
  ON os(condominio_id, status, data_abertura);

CREATE INDEX IF NOT EXISTS idx_ativos_condominio_conformidade 
  ON ativos(condominio_id, requer_conformidade, is_ativo);