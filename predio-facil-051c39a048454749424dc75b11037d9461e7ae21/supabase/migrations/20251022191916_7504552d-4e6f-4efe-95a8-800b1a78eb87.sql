-- Função para gerar automaticamente planos de manutenção baseados em templates NBR 5674
CREATE OR REPLACE FUNCTION public.generate_maintenance_plans_for_asset(ativo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ativo RECORD;
  v_template RECORD;
  v_condominio_id UUID;
  v_tipo_id UUID;
  v_plano_id UUID;
BEGIN
  -- Buscar informações do ativo
  SELECT condominio_id, tipo_id INTO v_condominio_id, v_tipo_id
  FROM ativos
  WHERE id = ativo_id;

  -- Se não encontrou o ativo, sair
  IF v_condominio_id IS NULL THEN
    RETURN;
  END IF;

  -- Buscar templates de manutenção relacionados ao tipo do ativo
  FOR v_template IN
    SELECT mt.*
    FROM manut_templates mt
    JOIN ativo_tipos at ON mt.sistema = at.nome
    WHERE at.id = v_tipo_id
    AND mt.is_conformidade = true
  LOOP
    -- Criar plano de manutenção
    INSERT INTO planos_manutencao (
      condominio_id,
      ativo_id,
      titulo,
      tipo,
      periodicidade,
      responsavel,
      checklist,
      is_legal,
      proxima_execucao,
      antecedencia_dias,
      sla_dias
    )
    VALUES (
      v_condominio_id,
      ativo_id,
      v_template.titulo_plano,
      'preventiva',
      v_template.periodicidade,
      COALESCE(v_template.responsavel, 'sindico'),
      COALESCE(v_template.checklist, '[]'::jsonb),
      true,
      CURRENT_DATE + v_template.periodicidade,
      15, -- 15 dias de antecedência por padrão
      30  -- 30 dias de SLA por padrão
    )
    RETURNING id INTO v_plano_id;

    -- Criar item de conformidade inicial (status amarelo = pendente)
    INSERT INTO conformidade_itens (
      condominio_id,
      ativo_id,
      plano_id,
      tipo,
      periodicidade,
      proximo,
      status
    )
    VALUES (
      v_condominio_id,
      ativo_id,
      v_plano_id,
      'preventiva',
      v_template.periodicidade,
      CURRENT_DATE + v_template.periodicidade,
      'amarelo'
    );
  END LOOP;
END;
$$;

-- Trigger para gerar planos automaticamente quando um ativo é inserido
CREATE OR REPLACE FUNCTION public.trigger_generate_maintenance_plans()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só gerar planos se o ativo requer conformidade
  IF NEW.requer_conformidade = true THEN
    PERFORM generate_maintenance_plans_for_asset(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger AFTER INSERT na tabela ativos
DROP TRIGGER IF EXISTS auto_generate_maintenance_plans ON public.ativos;
CREATE TRIGGER auto_generate_maintenance_plans
AFTER INSERT ON public.ativos
FOR EACH ROW
EXECUTE FUNCTION trigger_generate_maintenance_plans();