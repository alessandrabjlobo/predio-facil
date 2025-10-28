/*
  # Maintenance Statistics Functions
  
  Creates functions for dashboard KPIs and maintenance tracking:
  - get_maintenance_stats: Returns overall stats
  - get_upcoming_maintenances: Lists upcoming maintenance
  - get_non_conformities: Lists overdue compliance items
*/

-- Get Maintenance Stats
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

-- Get Upcoming Maintenances
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

-- Get Non-Conformities
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

GRANT EXECUTE ON FUNCTION public.get_maintenance_stats TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_upcoming_maintenances TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_non_conformities TO anon, authenticated, service_role;
