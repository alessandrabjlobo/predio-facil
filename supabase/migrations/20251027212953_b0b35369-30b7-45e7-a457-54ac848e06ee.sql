-- Create RPC function to create multiple assets at once
-- This function creates multiple assets and automatically triggers maintenance plan generation
CREATE OR REPLACE FUNCTION public.create_multiple_assets(
  p_condominio_id UUID,
  p_assets JSONB[]
)
RETURNS SETOF ativos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_asset JSONB;
  v_created_asset ativos;
  v_created_ids UUID[] := '{}';
BEGIN
  -- Loop through each asset to create
  FOREACH v_asset IN ARRAY p_assets
  LOOP
    INSERT INTO public.ativos (
      condominio_id,
      tipo_id,
      nome,
      local,
      torre,
      andar,
      observacoes,
      requer_conformidade,
      is_ativo
    )
    VALUES (
      p_condominio_id,
      (v_asset->>'tipo_id')::UUID,
      v_asset->>'nome',
      v_asset->>'local',
      v_asset->>'torre',
      v_asset->>'andar',
      v_asset->>'observacoes',
      COALESCE((v_asset->>'requer_conformidade')::BOOLEAN, false),
      true
    )
    RETURNING * INTO v_created_asset;
    
    -- Add to created IDs array
    v_created_ids := array_append(v_created_ids, v_created_asset.id);
    
    -- Return the created asset
    RETURN NEXT v_created_asset;
    
    -- If asset requires conformidade, generate maintenance plans
    IF v_created_asset.requer_conformidade = true THEN
      PERFORM generate_maintenance_plans_for_asset(v_created_asset.id);
    END IF;
  END LOOP;
  
  -- Log the operation
  RAISE NOTICE 'Created % assets with IDs: %', array_length(v_created_ids, 1), v_created_ids;
  
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_multiple_assets(UUID, JSONB[]) TO authenticated;