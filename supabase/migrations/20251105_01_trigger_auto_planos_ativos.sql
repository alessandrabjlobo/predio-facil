-- Gera planos preventivos automaticamente quando um ATIVO novo é inserido

-- 1) Trigger function
create or replace function public.trg_after_insert_ativos_criar_planos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- chama a função existente para o condomínio do ativo novo
  perform public.criar_planos_preventivos(new.condominio_id);
  return new;
end;
$$;

-- 2) Trigger
drop trigger if exists after_insert_ativos_criar_planos on public.ativos;
create trigger after_insert_ativos_criar_planos
after insert on public.ativos
for each row
execute function public.trg_after_insert_ativos_criar_planos();
