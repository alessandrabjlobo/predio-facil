/*
  # Update Next Execution Trigger
  
  Automatically updates maintenance plan dates when OS is completed.
  Also updates conformidade status.
*/

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
  -- Only update when OS is completed
  IF NEW.status = 'concluida' THEN
    v_plano_id := NEW.plano_id;
    
    IF v_plano_id IS NOT NULL THEN
      -- Get the plan's periodicity
      SELECT periodicidade INTO v_periodicidade
      FROM planos_manutencao
      WHERE id = v_plano_id;
      
      -- Update next execution date
      UPDATE planos_manutencao
      SET 
        proxima_execucao = COALESCE(NEW.data_conclusao::date, CURRENT_DATE) + v_periodicidade,
        updated_at = now()
      WHERE id = v_plano_id;
      
      -- Update conformidade_itens
      UPDATE conformidade_itens
      SET 
        ultimo = COALESCE(NEW.data_conclusao::date, CURRENT_DATE),
        proximo = COALESCE(NEW.data_conclusao::date, CURRENT_DATE) + v_periodicidade,
        status = 'verde',
        executado_por = NEW.executante_id,
        updated_at = now()
      WHERE plano_id = v_plano_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_os_completed_update_next_execution ON public.os;
CREATE TRIGGER on_os_completed_update_next_execution
  AFTER UPDATE ON public.os
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_next_execution();
