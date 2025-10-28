/*
  # Generate OS Number Function
  
  Creates a function to generate sequential OS numbers per condominium per year.
  Format: OS-YYYY-0001
*/

CREATE OR REPLACE FUNCTION public.generate_os_numero(p_condominio_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano TEXT := TO_CHAR(NOW(), 'YYYY');
  v_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM os
  WHERE condominio_id = p_condominio_id
    AND EXTRACT(YEAR FROM data_abertura) = EXTRACT(YEAR FROM NOW());
  
  RETURN 'OS-' || v_ano || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_os_numero TO anon, authenticated, service_role;
