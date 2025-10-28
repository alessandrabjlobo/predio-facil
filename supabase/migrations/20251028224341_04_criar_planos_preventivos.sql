/*
  # Create Preventive Plans Function
  
  Automatically creates preventive maintenance plans based on NBR requirements.
  Links assets to their compliance obligations.
*/

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

GRANT EXECUTE ON FUNCTION public.criar_planos_preventivos TO anon, authenticated, service_role;
