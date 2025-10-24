-- Criar função de segurança para verificar se é owner do sistema
create or replace function public.is_system_owner()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_is_owner boolean;
begin
  -- Pegar auth_user_id do usuário autenticado
  v_user_id := auth.uid();
  
  if v_user_id is null then
    return false;
  end if;
  
  -- Verificar se tem role 'admin' na tabela user_roles
  select exists(
    select 1 
    from user_roles ur
    join usuarios u on u.id = ur.user_id
    where u.auth_user_id = v_user_id
    and ur.role = 'admin'
  ) into v_is_owner;
  
  return v_is_owner;
end;
$$;

comment on function public.is_system_owner is 
  'Verifica se o usuário autenticado é o dono do sistema (super admin)';