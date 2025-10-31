-- ===========================================
-- DROP das variações conhecidas para evitar 42P13
-- ===========================================
drop function if exists public.criar_os_detalhada(uuid, uuid, uuid, text, uuid, text, text, text, date);
drop function if exists public.criar_os_detalhada(uuid, uuid, uuid, text, uuid, text, text, text, timestamp with time zone);
drop function if exists public.criar_os_detalhada(uuid, uuid, uuid, text, uuid, text, text, text);

-- ===========================================
-- (RE)CRIAR VERSÃO OFICIAL (SEM DEFAULTS)
-- ===========================================
create or replace function public.criar_os_detalhada(
  p_condominio_id   uuid,
  p_ativo_id        uuid,
  p_responsavel_id  uuid,
  p_titulo          text,
  p_solicitante_id  uuid,
  p_descricao       text,
  p_prioridade      text,
  p_status          text,
  p_data_execucao   date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_os_id   uuid;
  v_numero  text;
begin
  -- Gerar número da OS usando generate_os_numero(condominio_id) se existir
  begin
    select generate_os_numero(p_condominio_id) into v_numero;
  exception
    when undefined_function then
      v_numero := 'OS-'||to_char(now(),'YYYYMMDD')||'-'||lpad((floor(random()*9999))::int::text, 4, '0');
  end;

  insert into public.os (
    condominio_id,
    ativo_id,
    responsavel_id,
    solicitante_id,
    titulo,
    descricao,
    prioridade,
    status,
    data_execucao,
    numero
  ) values (
    p_condominio_id,
    p_ativo_id,
    p_responsavel_id,
    p_solicitante_id,
    p_titulo,
    p_descricao,
    p_prioridade,
    p_status,
    p_data_execucao,
    v_numero
  )
  returning id into v_os_id;

  -- Log inicial (ignora se a tabela não existir)
  begin
    insert into public.os_logs(os_id, usuario_id, acao, observacoes)
    values (v_os_id, p_solicitante_id, 'criada', coalesce('OS criada: '||p_titulo, 'OS criada'));
  exception
    when undefined_table or undefined_column then
      -- segue sem travar
      null;
  end;

  return v_os_id;
end;
$$;

-- Permissões de execução da função
grant execute on function public.criar_os_detalhada(uuid, uuid, uuid, text, uuid, text, text, text, date)
to authenticated, anon;
