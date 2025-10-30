import { supabase } from "@/integrations/supabase/client";

export interface ChamadosFilters {
  search?: string;
  status?: string[];
  prioridade?: string[];
  criticidade?: string[];
}

export interface OSFilters {
  search?: string;
  status?: string[];
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Busca lista de chamados com filtros e paginação
 */
export async function fetchChamadosList(
  condominioId: string,
  filters: ChamadosFilters = {},
  page = 0,
  pageSize = 20
) {
  let query = supabase
    .from("v_chamados_list")
    .select("*", { count: "exact" })
    .eq("condominio_id", condominioId)
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.or(
      `titulo.ilike.%${filters.search}%,categoria.ilike.%${filters.search}%`
    );
  }

  if (filters.status?.length) {
    query = query.in("status", filters.status);
  }

  if (filters.prioridade?.length) {
    query = query.in("prioridade", filters.prioridade);
  }

  if (filters.criticidade?.length) {
    query = query.in("criticidade", filters.criticidade);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  return query;
}

/**
 * Pipeline de chamados (status x prioridade)
 */
export async function fetchChamadosPipeline(condominioId: string) {
  return supabase
    .from("v_chamados_pipeline")
    .select("*")
    .eq("condominio_id", condominioId);
}

/**
 * Busca lista de OS com filtros e paginação
 */
export async function fetchOSList(
  condominioId: string,
  filters: OSFilters = {},
  page = 0,
  pageSize = 20
) {
  let query = supabase
    .from("v_os_list")
    .select("*", { count: "exact" })
    .eq("condominio_id", condominioId)
    .order("created_at", { ascending: false });

  if (filters.search) {
    query = query.ilike("chamado_titulo", `%${filters.search}%`);
  }

  if (filters.status?.length) {
    query = query.in("status", filters.status);
  }

  if (filters.dataInicio) {
    query = query.gte("inicio_prev", filters.dataInicio);
  }

  if (filters.dataFim) {
    query = query.lte("fim_prev", filters.dataFim);
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  return query;
}

/**
 * Resumo de OS (KPIs)
 */
export async function fetchOSResumo(condominioId: string) {
  return supabase
    .from("v_os_resumo")
    .select("*")
    .eq("condominio_id", condominioId);
}

/**
 * Pipeline de OS (status, qtd, custo)
 */
export async function fetchOSPipeline(condominioId: string) {
  return supabase
    .from("v_os_pipeline")
    .select("*")
    .eq("condominio_id", condominioId);
}

/**
 * OS com SLA atrasado
 */
export async function fetchOSSlaAtraso(condominioId: string, limit = 5) {
  return supabase
    .from("v_os_sla_atraso")
    .select("*")
    .eq("condominio_id", condominioId)
    .order("atraso_horas", { ascending: false })
    .limit(limit);
}

/**
 * Itens de uma OS específica
 */
export async function fetchOSItens(osId: string) {
  return supabase.from("os_itens").select("*").eq("os_id", osId);
}
