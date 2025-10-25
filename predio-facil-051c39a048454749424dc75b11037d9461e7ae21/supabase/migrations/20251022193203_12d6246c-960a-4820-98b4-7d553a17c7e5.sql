-- Adicionar coluna sistema_manutencao para mapear tipos de ativos aos sistemas de templates
ALTER TABLE ativo_tipos 
ADD COLUMN IF NOT EXISTS sistema_manutencao TEXT;

-- Mapear tipos de ativos existentes para sistemas de manutenção
UPDATE ativo_tipos SET sistema_manutencao = 'Elevador' WHERE nome = 'Elevador';
UPDATE ativo_tipos SET sistema_manutencao = 'Elétrico' WHERE nome = 'Quadro Elétrico';
UPDATE ativo_tipos SET sistema_manutencao = 'Elétrico' WHERE nome = 'Gerador de Emergência';
UPDATE ativo_tipos SET sistema_manutencao = 'Hidráulico' WHERE nome = 'Bomba de Água';
UPDATE ativo_tipos SET sistema_manutencao = 'Hidráulico' WHERE nome = 'Reservatório de Água';
UPDATE ativo_tipos SET sistema_manutencao = 'Gás' WHERE nome = 'Central de Gás';
UPDATE ativo_tipos SET sistema_manutencao = 'Segurança' WHERE nome = 'Extintor de Incêndio';
UPDATE ativo_tipos SET sistema_manutencao = 'Segurança' WHERE nome = 'Porta Corta-Fogo';
UPDATE ativo_tipos SET sistema_manutencao = 'Segurança' WHERE nome = 'Interfone/CFTV';
UPDATE ativo_tipos SET sistema_manutencao = 'Acesso' WHERE nome = 'Portão Automático';
UPDATE ativo_tipos SET sistema_manutencao = 'Lazer' WHERE nome = 'Piscina';
UPDATE ativo_tipos SET sistema_manutencao = 'Elétrico' WHERE nome = 'SPDA (Para-raios)';

-- Recriar a função com o mapeamento correto
CREATE OR REPLACE FUNCTION public.generate_maintenance_plans_for_asset(ativo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Buscar templates de manutenção relacionados ao tipo do ativo usando sistema_manutencao
  FOR v_template IN
    SELECT mt.*
    FROM manut_templates mt
    JOIN ativo_tipos at ON mt.sistema = at.sistema_manutencao
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
      15,
      30
    )
    RETURNING id INTO v_plano_id;

    -- Criar item de conformidade inicial
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
$function$;