// FILE: src/lib/api.ts
import { supabase } from "@/integrations/supabase/client";
import type {
  Papel,
  Status,
  Prioridade,
  ManutTipo,
  ExecStatus,
  ConfTipo,
  Semaforo,
  ConfAcao,
} from "./types";

export type {
  Papel,
  Status,
  Prioridade,
  ManutTipo,
  ExecStatus,
  ConfTipo,
  Semaforo,
  ConfAcao,
};

export type NovoChamadoInput = {
  titulo: string;
  descricao?: string;
  prioridade?: Prioridade;
  condominio_id?: string;
  ativo_id?: string;
  local?: string | null;
  categoria?: string | null;
};

/* ===========================
 * Helpers
 * =========================== */
function normalizeStatus(s?: string | null): Status | undefined {
  if (!s) return undefined;
  const k = s.toLowerCase().trim();
  const map: Record<string, Status> = {
    aberto: "aberto",
    em_andamento: "em_andamento",
    "em andamento": "em_andamento",
    concluido: "concluido",
    concluído: "concluido",
    cancelado: "cancelado",
  };
  return map[k];
}

function normalizePrioridade(p?: string | null): Prioridade | undefined {
  if (!p) return undefined;
  const k = p.toLowerCase().trim();
  const map: Record<string, Prioridade> = {
    baixa: "baixa",
    media: "media",
    média: "media",
    alta: "alta",
    urgente: "urgente",
  };
  return map[k];
}

/* slug util */
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/* ===== Helpers específicos para OS ===== */

/** remove emojis e normaliza rótulos para os CHECKs do DB */
function cleanLabel(input?: string | null) {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeOsPrioridade(p?: string | null): "baixa"|"media"|"alta"|"urgente"|null {
  const k = cleanLabel(p);
  if (k.includes("urg")) return "urgente";
  if (k.includes("alta")) return "alta";
  if (k.includes("med")) return "media";
  if (k.includes("baix")) return "baixa";
  return null;
}

function normalizeTipoManutencao(t?: string | null): "preventiva"|"corretiva"|"preditiva"|null {
  const k = cleanLabel(t);
  if (k.startsWith("prev")) return "preventiva";
  if (k.startsWith("corr")) return "corretiva";
  if (k.startsWith("pred")) return "preditiva";
  return null;
}

/** status mostrado na UI */
export type OSStatus =
  | "aberta"
  | "em andamento"
  | "aguardando_validacao"
  | "concluida"
  | "cancelada";

/** normaliza o que vem do DB para exibir na UI */
function osNormalizeStatus(s?: string | null): OSStatus {
  const k = (s ?? "").toLowerCase().trim();
  if (k === "em_andamento" || k === "em andamento") return "em andamento";
  if (k === "aguardando_validacao" || k === "aguardando validacao") return "aguardando_validacao";
  if (k === "concluida") return "concluida";
  if (k === "cancelada") return "cancelada";
  return "aberta";
}

/** 🚨 encode para o DB (usa UNDERSCORE onde o CHECK exige) */
function osDbEncodeStatus(s: OSStatus | string): string {
  const k = (s ?? "aberta").toString().toLowerCase().trim();
  if (k === "em andamento" || k === "em_andamento") return "em_andamento";
  if (k === "aguardando validacao" || k === "aguardando_validacao") return "aguardando_validacao";
  // "aberta", "concluida", "cancelada" já estão no formato esperado
  return k;
}

/** força 'YYYY-MM-DD' */
function toISODateOnly(d?: string | null) {
  if (!d) return null;
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

/* ===========================
 * Perfil
 * =========================== */
export async function getOrCreatePerfil() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error("Usuário não autenticado");

  const { data: perfilExistente, error: eSel } = await supabase
    .from("usuarios")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (eSel) throw eSel;
  if (perfilExistente) return perfilExistente;

  const nomeMeta =
    (user.user_metadata?.nome as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "Usuario";
  const papelMeta = (user.user_metadata?.papel as Papel) || "morador";

  const { data: novo, error: eIns } = await supabase
    .from("usuarios")
    .insert([
      {
        auth_user_id: user.id,
        email: user.email,
        nome: nomeMeta,
        papel: papelMeta,
      },
    ])
    .select()
    .single();
  if (eIns) throw eIns;
  return novo;
}

/** Versão tolerante: retorna null se não houver sessão ainda */
export async function getPerfil() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return getOrCreatePerfil();
  return data;
}

/* ===========================
 * Chamados
 * =========================== */
export async function listChamados() {
  const { data, error, status } = await supabase
    .from("chamados")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error) return data ?? [];
  if (status === 400) {
    const { data: d2, error: e2 } = await supabase.from("chamados").select("*");
    if (e2) throw e2;
    return (d2 ?? []).sort((a: any, b: any) => {
      const ta = new Date(
        a.created_at ?? a.criado_em ?? a.updated_at ?? 0
      ).getTime();
      const tb = new Date(
        b.created_at ?? b.criado_em ?? b.updated_at ?? 0
      ).getTime();
      return tb - ta;
    });
  }
  throw error;
}

export async function getChamado(id: string) {
  const { data, error } = await supabase
    .from("chamados")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Chamado não encontrado");
  return data;
}

export async function createChamado(input: NovoChamadoInput) {
  const perfil = await getOrCreatePerfil();
  const prioridade =
    normalizePrioridade(input.prioridade ?? "baixa") ?? "baixa";

  const payload: any = {
    titulo: input.titulo,
    descricao: input.descricao ?? null,
    prioridade,
    status: "aberto" as Status,
    criado_por: perfil.id,
    criado_em: new Date().toISOString(),
  };
  if (input.condominio_id) payload.condominio_id = input.condominio_id;
  if (input.ativo_id) payload.ativo_id = input.ativo_id;
  if (typeof input.local !== "undefined") payload.local = input.local;
  if (typeof input.categoria !== "undefined") payload.categoria = input.categoria;

  const { data, error } = await supabase
    .from("chamados")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChamado(
  id: string,
  patch: Partial<{
    titulo: string;
    descricao: string;
    prioridade: Prioridade | string;
    status: Status | string;
    condominio_id: string;
    ativo_id: string;
    local: string | null;
    categoria: string | null;
  }>
) {
  const update: any = {};
  if (typeof patch.titulo !== "undefined") update.titulo = patch.titulo ?? null;
  if (typeof patch.descricao !== "undefined")
    update.descricao = patch.descricao ?? null;
  if (typeof patch.prioridade !== "undefined") {
    const p = normalizePrioridade(patch.prioridade as string);
    if (!p) throw new Error("Prioridade inválida");
    update.prioridade = p;
  }
  if (typeof patch.status !== "undefined") {
    const s = normalizeStatus(patch.status as string);
    if (!s) throw new Error("Status inválido");
    update.status = s;
  }
  if (typeof patch.condominio_id !== "undefined")
    update.condominio_id = patch.condominio_id ?? null;
  if (typeof patch.ativo_id !== "undefined")
    update.ativo_id = patch.ativo_id ?? null;
  if (typeof patch.local !== "undefined") update.local = patch.local;
  if (typeof patch.categoria !== "undefined") update.categoria = patch.categoria;

  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("chamados")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("updateChamado erro:", error);
    throw new Error(error.message);
  }
  return data;
}

/* ===========================
 * Storage: Anexos dos chamados
 * =========================== */
export async function uploadAnexo(chamadoId: string, file: File) {
  const ext = file.name.split(".").pop();
  const path = `chamados/${chamadoId}/${Date.now()}.${ext}`;
  const { error: eUp } = await supabase.storage
    .from("anexos")
    .upload(path, file, { upsert: false });
  if (eUp) throw eUp;
  const { data: signed } = await supabase.storage
    .from("anexos")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  return { path, url: signed?.signedUrl };
}

export async function listAnexos(chamadoId: string) {
  const { data, error } = await supabase.storage
    .from("anexos")
    .list(`chamados/${chamadoId}`);
  if (error) return [];
  const files = data ?? [];
  const signed = await Promise.all(
    files.map(async (f) => {
      const key = `chamados/${chamadoId}/${f.name}`;
      const { data: s } = await supabase.storage
        .from("anexos")
        .createSignedUrl(key, 60 * 60);
      return { name: f.name, url: s?.signedUrl as string | undefined };
    })
  );
  return signed.filter((x) => x.url) as { name: string; url: string }[];
}

/* ===========================
 * ATIVOS
 * =========================== */
export async function listAtivos() {
  try {
    const { data, error } = await supabase
      .from("ativos")
      .select(
        `
        *,
        ativo_tipos:ativo_tipos!ativos_tipo_id_fkey ( id, nome, slug )
      `
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((a: any) => ({
      ...a,
      tipo: a.ativo_tipos?.nome ?? a.tipo ?? "Outros",
    }));
  } catch (_e) {
    const { data: d2, error: e2 } = await supabase.from("ativos").select("*");
    if (e2) throw e2;
    return (d2 ?? []).sort((a: any, b: any) => {
      const ta = new Date(
        a.created_at ?? a.inserted_at ?? a.updated_at ?? 0
      ).getTime();
      const tb = new Date(
        b.created_at ?? b.inserted_at ?? b.updated_at ?? 0
      ).getTime();
      return tb - ta;
    });
  }
}

export async function createAtivo(payload: {
  nome: string;
  tipo_id?: string;          // ✅ usar id do tipo
  tipo?: string;             // (opcional) ainda aceita nome e resolve para id
  local?: string;
  condominio_id?: string;    // importante para multi-tenant
}) {
  let tipo_id = payload.tipo_id;

  // Se veio "tipo" (nome), resolvemos para id:
  if (!tipo_id && payload.tipo) {
    const meta = await getAtivoTipoMeta(payload.tipo);
    if (meta) tipo_id = meta.id;
  }

  // Ensure condominio_id is always provided
  const condoId = payload.condominio_id || localStorage.getItem("currentCondominioId");
  if (!condoId) {
    throw new Error("Condomínio não selecionado. Por favor, selecione um condomínio antes de criar um ativo.");
  }

  const insert: any = {
    nome: payload.nome,
    local: payload.local ?? null,
    condominio_id: condoId,
    ...(tipo_id ? { tipo_id } : {}),   // ✅ só envia se tiver
  };

  const { data: ativo, error } = await supabase
    .from("ativos")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;

  // Trigger will auto-create preventive plan
  return ativo;
}

export async function updateAtivo(
  id: string,
  patch: Partial<{ nome: string; tipo_id: string | null; tipo: string | null; local: string | null }>
) {
  const update: any = {};
  if (typeof patch.nome !== "undefined") update.nome = patch.nome ?? null;
  if (typeof patch.local !== "undefined") update.local = patch.local ?? null;

  // Preferir tipo_id; se vier "tipo" (nome), resolver para id
  if (typeof patch.tipo_id !== "undefined") {
    update.tipo_id = patch.tipo_id; // aceita null
  } else if (typeof patch.tipo !== "undefined") {
    if (patch.tipo) {
      const meta = await getAtivoTipoMeta(patch.tipo);
      update.tipo_id = meta?.id ?? null;
    } else {
      update.tipo_id = null;
    }
  }

  const { data, error } = await supabase
    .from("ativos")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Exclui: manutencoes -> planos -> ativo (ordem segura contra FKs) */
export async function deleteAtivoAndRelated(ativoId: string) {
  const { error: eMan } = await supabase
    .from("manutencoes")
    .delete()
    .eq("ativo_id", ativoId);
  if (eMan) throw eMan;

  const { error: ePlan } = await supabase
    .from("planos_manutencao")
    .delete()
    .eq("ativo_id", ativoId);
  if (ePlan) throw ePlan;

  const { error: eAtivo } = await supabase
    .from("ativos")
    .delete()
    .eq("id", ativoId);
  if (eAtivo) throw eAtivo;
}

/* ===========================
 * PLANOS DE MANUTENÇÃO
 * =========================== */
export async function listPlanos() {
  const { data, error } = await supabase
    .from("planos_manutencao")
    .select("*")
    .order("proxima_execucao", { ascending: true });
  if (error) throw error;
  return data;
}

export async function listPlanosByAtivo(ativo_id: string) {
  const { data, error } = await supabase
    .from("planos_manutencao")
    .select("*")
    .eq("ativo_id", ativo_id)
    .order("proxima_execucao", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createPlano(payload: {
  ativo_id?: string | null;
  titulo: string;
  tipo: ManutTipo;
  periodicidade: string;
  proxima_execucao: string;
  checklist?: any;
  responsavel?: string;
}) {
  const { data, error } = await supabase
    .from("planos_manutencao")
    .insert({
      ativo_id: payload.ativo_id ?? null,
      titulo: payload.titulo,
      tipo: payload.tipo as any,
      periodicidade: payload.periodicidade as any,
      proxima_execucao: payload.proxima_execucao,
      checklist: payload.checklist ?? [],
      responsavel: payload.responsavel ?? "sindico",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ========= Garante plano preventivo default por tipo de ativo =========
export async function ensureDefaultPlanoParaAtivo(ativo: {
  id: string;
  tipo: string;
}) {
  const slug = slugify(ativo.tipo || "");
  let periodicidadeDefault: string | null = null;

  {
    const { data, error } = await supabase
      .from("ativo_tipos")
      .select("periodicidade_default, nome, slug")
      .eq("slug", slug)
      .maybeSingle();
    if (error && (error as any).code !== "PGRST116") throw error;
    if (data?.periodicidade_default)
      periodicidadeDefault = data.periodicidade_default;
  }

  if (!periodicidadeDefault) {
    const { data, error } = await supabase
      .from("ativo_tipos")
      .select("periodicidade_default, nome, slug")
      .eq("nome", ativo.tipo)
      .maybeSingle();
    if (error && (error as any).code !== "PGRST116") throw error;
    if (data?.periodicidade_default)
      periodicidadeDefault = data.periodicidade_default;
  }

  if (!periodicidadeDefault) return null;

  const tituloPadrao = `Preventiva - ${ativo.tipo}`;
  {
    const { data: ja, error: eJa } = await supabase
      .from("planos_manutencao")
      .select("id, titulo, ativo_id")
      .eq("ativo_id", ativo.id)
      .eq("titulo", tituloPadrao)
      .maybeSingle();
    if (eJa && (eJa as any).code !== "PGRST116") throw eJa;
    if (ja) return ja;
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const { data: novo, error: eNovo } = await supabase
    .from("planos_manutencao")
    .insert({
      ativo_id: ativo.id,
      titulo: tituloPadrao,
      tipo: "preventiva",
      periodicidade: periodicidadeDefault as any,
      proxima_execucao: hoje,
      checklist: [],
      responsavel: "sindico",
    })
    .select()
    .single();

  if (eNovo) throw eNovo;
  return novo;
}

/* ===========================
 * MANUTENÇÕES (tarefas/execução)
 * =========================== */

export type DashManutRow = {
  id: string;
  titulo: string;
  tipo: string;
  status: ExecStatus;
  vencimento?: string | null;
  ativo_id?: string | null;
  ativo_nome?: string | null;
};

export async function listUpcomingManutencoes(
  limit = 50
): Promise<DashManutRow[]> {
  const { data, error } = await supabase
    .from("manutencoes")
    .select(
      "id,titulo,tipo,status,vencimento,ativo_id,ativos:ativo_id(id,nome)"
    )
    .in("status", ["pendente", "em_execucao"])
    .order("vencimento", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    titulo: r.titulo,
    tipo: r.tipo,
    status: r.status,
    vencimento: r.vencimento,
    ativo_id: r.ativo_id,
    ativo_nome: r.ativos?.nome ?? null,
  }));
}

export async function listManutencoesPendentes() {
  const { data, error } = await supabase
    .from("manutencoes")
    .select("*")
    .eq("status", "pendente")
    .order("vencimento", { ascending: true });
  if (error) throw error;
  return data;
}

export async function listManutencoesByAtivo(ativo_id: string) {
  const { data, error } = await supabase
    .from("manutencoes")
    .select("*")
    .eq("ativo_id", ativo_id)
    .order("vencimento", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** cria UMA manutenção a partir do plano */
export async function scheduleFromPlano(plano_id: string) {
  const { data: plano, error: e1 } = await supabase
    .from("planos_manutencao")
    .select("*")
    .eq("id", plano_id)
    .maybeSingle();
  if (e1) throw e1;
  if (!plano) throw new Error("Plano não encontrado");

  const payload = {
    plano_id,
    ativo_id: plano.ativo_id,
    titulo: plano.titulo,
    tipo: plano.tipo,
    status: "pendente" as ExecStatus,
    vencimento: plano.proxima_execucao,
  };

  const { data, error, status } = await supabase
    .from("manutencoes")
    .insert(payload)
    .select()
    .single();

  if (!error) return data;

  const isConflict =
    status === 409 ||
    (error as any)?.code === "23505" ||
    /duplicate key|unique constraint/i.test(
      (error as any)?.message || ""
    );

  if (isConflict) {
    const { data: ja, error: eSel } = await supabase
      .from("manutencoes")
      .select("*")
      .eq("plano_id", plano_id)
      .eq("vencimento", plano.proxima_execucao)
      .maybeSingle();
    if (eSel) throw eSel;
    if (ja) return ja;
  }

  throw error;
}

export async function concluirManutencao(
  id: string,
  anexo_path?: string
) {
  const { data, error } = await supabase
    .from("manutencoes")
    .update({
      status: "concluida",
      executada_em: new Date().toISOString(),
      anexo_path: anexo_path ?? null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * ⚠️ IMPORTANTE:
 * A chave interna do arquivo NÃO deve incluir o nome do bucket.
 */
export async function uploadManutencaoAnexo(
  manutencaoId: string,
  file: File
) {
  const ext = file.name.split(".").pop() || "bin";
  const key = `${manutencaoId}/${Date.now()}.${ext}`;

  const { error: eUp } = await supabase.storage
    .from("manutencoes")
    .upload(key, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });
  if (eUp) throw eUp;

  return key;
}

/** Agenda com nome do ativo */
export async function listManutencoesAgenda(params?: {
  from?: string;
  to?: string;
}) {
  const { from, to } = params || {};
  let query = supabase
    .from("manutencoes")
    .select(
      "id,titulo,tipo,status,vencimento,ativo_id,ativos:ativo_id(id,nome)"
    )
    .order("vencimento", { ascending: true, nullsFirst: false });

  if (from) query = query.gte("vencimento", from);
  if (to) query = query.lte("vencimento", to);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(
    (r: any) =>
      ({
        id: r.id,
        titulo: r.titulo,
        tipo: r.tipo,
        status: r.status as ExecStatus,
        vencimento: r.vencimento as string | null | undefined,
        ativo_id: r.ativo_id ?? null,
        ativo_nome: r.ativos?.nome ?? null,
      } as {
        id: string;
        titulo: string;
        tipo: string;
        status: ExecStatus;
        vencimento?: string | null;
        ativo_id?: string | null;
        ativo_nome?: string | null;
      })
  );
}

/* ===========================
 * CONFORMIDADE
 * =========================== */

export async function listConformidadeItens() {
  const { data: itens, error } = await supabase
    .from("conformidade_itens")
    .select("*")
    .order("proximo", { ascending: true });
  if (error) throw error;
  return itens ?? [];
}

export async function upsertConformidadeItem(payload: {
  id?: string;
  tipo: ConfTipo | string;
  periodicidade: string; // interval textual
  ultimo?: string | null;
  proximo: string;
  observacoes?: string | null;
}) {
  const inserting = !payload.id;
  const base = {
    tipo: payload.tipo as any,
    periodicidade: payload.periodicidade as any,
    ultimo: payload.ultimo ?? null,
    proximo: payload.proximo,
    observacoes: payload.observacoes ?? null,
  };
  const { data, error } = inserting
    ? await supabase.from("conformidade_itens").insert(base).select().single()
    : await supabase
        .from("conformidade_itens")
        .update(base)
        .eq("id", payload.id!)
        .select()
        .single();
  if (error) throw error;
  return data;
}

export async function uploadConformidadeAnexo(
  item_id: string,
  file: File
) {
  const perfil = await getOrCreatePerfil();

  const safeName = file.name.replace(/[^\w.\-]/g, "_");
  const path = `itens/${item_id}/${crypto.randomUUID?.() ?? `${Date.now()}`}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from("conformidade")
    .upload(path, file, {
      upsert: false,
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    });

  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("conformidade_anexos")
    .insert({ item_id, file_path: path })
    .select()
    .single();
  if (error) throw error;

  await logConformidadeAcao(item_id, "anexar", {
    file_path: path,
    file_name: safeName,
    size: file.size,
    usuario_id: perfil.id,
  });

  return data;
}

export async function getSignedUrl(
  bucket: "anexos" | "manutencoes" | "conformidade",
  path: string,
  seconds = 3600
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function listConformidadeAnexos(item_id: string) {
  const { data, error } = await supabase
    .from("conformidade_anexos")
    .select("*")
    .eq("item_id", item_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteConformidadeAnexo(id: string) {
  const { error } = await supabase
    .from("conformidade_anexos")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function updateConformidadeDatas(
  item_id: string,
  payload: {
    ultimo?: string | null;
    proximo?: string;
    observacoes?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("conformidade_itens")
    .update({
      ultimo: payload.ultimo ?? null,
      proximo: payload.proximo,
      observacoes: payload.observacoes ?? null,
    })
    .eq("id", item_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listConformidadeLogs(item_id: string) {
  const { data, error } = await supabase
    .from("conformidade_logs")
    .select(
      `
      id, item_id, usuario_id, acao, detalhes, created_at,
      actor:usuarios ( id, nome, email )
    `
    )
    .eq("item_id", item_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    ...r,
    actorName: r?.actor?.nome ?? r?.actor?.email ?? "Usuário",
  }));
}

export function labelAcao(acao: ConfAcao): string {
  switch (acao) {
    case "resolver":
      return "Resolvido";
    case "remarcar":
      return "Remarcado";
    case "anexar":
      return "Anexo";
    default:
      return acao;
  }
}

export async function logConformidadeAcao(
  item_id: string,
  acao: ConfAcao,
  detalhes?: any
) {
  const perfil = await getOrCreatePerfil();
  const acaoValida: "criacao" | "edicao" | "exclusao" | "validacao" =
    acao === "anexar" || acao === "resolver" || acao === "remarcar"
      ? "edicao"
      : (acao as any);

  const { data, error } = await supabase
    .from("conformidade_logs")
    .insert([
      {
        item_id,
        usuario_id: perfil.id,
        acao: acaoValida,
        detalhes: detalhes ?? {},
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function remarcarConformidadeManualmente(
  item_id: string,
  novoProximo: string,
  motivo?: string | null,
  antes?: { proximo?: string | null }
) {
  await updateConformidadeDatas(item_id, { proximo: novoProximo });
  await logConformidadeAcao(item_id, "remarcar", {
    de: antes?.proximo ?? null,
    para: novoProximo,
    motivo: motivo ?? null,
    modo: "manual",
  });
}

export async function registrarExecucaoConformidade(
  itemId: string,
  dataISO?: string
) {
  const { data, error } = await supabase.rpc("conf_registrar_execucao", {
    p_item_id: itemId,
    p_data_execucao: dataISO ?? new Date().toISOString().slice(0, 10),
  });
  if (error) throw error;
  return data;
}

export async function adiarProximoConformidade(
  itemId: string,
  novaData: string,
  motivo?: string
) {
  const { data, error } = await supabase.rpc("conf_adiar_proximo", {
    p_item_id: itemId,
    p_nova_data: novaData,
    p_motivo: motivo ?? null,
  });
  if (error) throw error;
  return data;
}

/* ===========================
 * MÓDULO DE OS (Ordem de Serviço)
 * =========================== */

export type OSRow = {
  id: string;
  numero?: string | null;           // numero sequencial da OS
  titulo: string;
  descricao?: string | null;
  status: OSStatus;
  responsavel?: string | null;      // "interno" | "externo" | nome
  ativo_id?: string | null;
  condominio_id?: string | null;

  tipo_manutencao?: string | null;  // preventiva/corretiva/preditiva
  prioridade?: string | null;       // baixa/media/alta/urgente
  data_prevista?: string | null;    // ISO 'YYYY-MM-DD'
  origem?: string | null;           // "preventiva" | "corretiva" | origem da OS

  fornecedor_nome?: string | null;
  fornecedor_contato?: string | null;

  checklist?: any[] | null;         // checklist items

  created_at?: string | null;
  updated_at?: string | null;
  data_abertura?: string | null;
  data_fechamento?: string | null;

  pdf_path?: string | null;
  pdf_url?: string | null;
};

/** lista OS com fallback de ordenação caso 'created_at' não exista */
export async function listOS(params?: {
  status?: OSStatus | "todas";
  ativo_id?: string;
  search?: string;
  limit?: number;
}): Promise<OSRow[]> {
  const { status, ativo_id, search, limit = 100 } = params ?? {};

  const run = async (useOrder: boolean) => {
    let q = supabase.from("os").select("*").limit(limit);
    if (useOrder) q = q.order("created_at", { ascending: false });

    if (status && status !== "todas") q = q.eq("status", osDbEncodeStatus(status));
    if (ativo_id) q = q.eq("ativo_id", ativo_id);
    if (search && search.trim()) {
      q = q.or(`titulo.ilike.%${search}%,descricao.ilike.%${search}%`);
    }
    return await q;
  };

  let { data, error, status: http } = await run(true);
  if (error && http === 400) {
    ({ data, error } = await run(false));
  }
  if (error) throw error;

  const rows = (data ?? []) as any[];
  const withUrls = await Promise.all(
    rows.map(async (r) => {
      const pdf_path: string | null = r.pdf_path ?? null;
      let pdf_url: string | null = null;
      if (pdf_path) {
        try {
          const { data: signed } = await supabase.storage
            .from("os_docs")
            .createSignedUrl(pdf_path, 60 * 60);
          pdf_url = signed?.signedUrl ?? null;
        } catch {
          pdf_url = null;
        }
      }
      return {
        ...r,
        status: osNormalizeStatus(r.status),
        pdf_path,
        pdf_url,
        data_abertura: r.data_abertura ?? r.created_at ?? null,
      } as OSRow;
    })
  );

  return withUrls;
}

export async function getOS(id: string) {
  const { data, error } = await supabase
    .from("os")
    .select("*")
    .eq("id", id)
    .maybeSingle(); // sem limit(1) aqui

  if (error) throw error;
  if (!data) throw new Error("OS não encontrada");

  const r: any = data;
  return {
    ...r,
    status: osNormalizeStatus(r.status),
    data_abertura: r.data_abertura ?? r.created_at ?? null,
  } as OSRow;
}

/**
 * Gera planos preventivos usando a RPC do banco de dados.
 * Comportamento defensivo: se o RPC não existir, retorna erro descritivo.
 */
export async function gerarPlanosPreventivos(condominioId: string): Promise<boolean> {
  if (!condominioId) {
    throw new Error("ID do condomínio é obrigatório para gerar planos preventivos");
  }

  const { data, error } = await supabase.rpc("criar_planos_preventivos", {
    p_condominio_id: condominioId,
  });

  if (error) {
    // Erro defensivo: se RPC não existe
    if (error.message?.includes("function") && error.message?.includes("does not exist")) {
      console.warn("⚠️ RPC criar_planos_preventivos não encontrado no banco de dados");
      throw new Error(
        "A função de geração de planos não está disponível. " +
        "Contate o administrador para executar a migração SQL necessária."
      );
    }
    throw error;
  }

  console.log("✅ Planos preventivos gerados:", data);
  return true;
}

/** Cria OS (NBR 5674) e normaliza campos para passar nos CHECKs */
export async function createOS(payload: {
  // básicos
  titulo: string;
  descricao?: string | null;
  responsavel?: string | null;
  ativo_id?: string | null;
  condominio_id?: string | null;
  tipo_manutencao?: string | null; // "preventiva" | "corretiva" | "preditiva"
  prioridade?: string | null;      // "baixa" | "media" | "alta" | "urgente"
  data_prevista?: string | null;   // "YYYY-MM-DD"

  // identificação / origem
  solicitante_nome?: string | null;
  solicitante_contato?: string | null;
  aprovador_nome?: string | null;
  origem?: string | null;

  // escopo / checklist / recursos
  escopo?: string | null;
  checklist?: Array<{ item: string; obrigatorio?: boolean }>;
  materiais?: Array<{ descricao: string; qtd: number; unidade?: string }>;
  equipe?: Array<{ funcao: string; nome?: string; carga_horas?: number }>;

  // segurança / PT
  risco_nivel?: "baixo" | "medio" | "alto" | null;
  riscos_identificados?: string | null;
  epi_lista?: string[];            // ex.: ["capacete","luvas"]
  pt_numero?: string | null;
  pt_tipo?: string | null;

  // prazos / SLA
  sla_inicio?: string | null;      // "YYYY-MM-DD"
  sla_fim?: string | null;         // "YYYY-MM-DD"

  // custos
  custo_estimado?: number | null;
  custo_materiais?: number | null;
  custo_total?: number | null;

  // fornecedor
  fornecedor_nome?: string | null;
  fornecedor_contato?: string | null;

  // aceite / validação
  aceite_responsavel?: string | null;
  aceite_data?: string | null;     // "YYYY-MM-DD"
  validacao_obs?: string | null;

  // registros / evidências (se já quiser salvar)
  fotos_antes?: Array<{ path: string; legenda?: string }>;
  fotos_depois?: Array<{ path: string; legenda?: string }>;
}) {
  const prioridadeNorm = normalizeOsPrioridade(payload.prioridade) ?? null;
  const tipoNorm = normalizeTipoManutencao(payload.tipo_manutencao) ?? null;
  const dataPrev = toISODateOnly(payload.data_prevista);

  const safeInsert: any = {
    titulo: payload.titulo,
    descricao: payload.descricao ?? null,
    responsavel: payload.responsavel ?? null,
    ativo_id: payload.ativo_id ?? null,
    condominio_id: payload.condominio_id ?? null,
    status: osDbEncodeStatus("aberta"),
    prioridade: prioridadeNorm,
    tipo_manutencao: tipoNorm,
    data_prevista: dataPrev,
  };

  const { data, error } = await supabase
    .from("os")
    .insert(safeInsert)
    .select()
    .single();

  if (error) throw error;

  const extraPatch: any = {};

  // identificação / origem
  if (payload.solicitante_nome != null) extraPatch.solicitante_nome = payload.solicitante_nome;
  if (payload.solicitante_contato != null) extraPatch.solicitante_contato = payload.solicitante_contato;
  if (payload.aprovador_nome != null) extraPatch.aprovador_nome = payload.aprovador_nome;
  if (payload.origem != null) extraPatch.origem = payload.origem;

  // escopo / checklist / recursos
  if (payload.escopo != null) extraPatch.escopo = payload.escopo;
  if (payload.checklist != null) extraPatch.checklist = payload.checklist;     // JSONB
  if (payload.materiais != null) extraPatch.materiais = payload.materiais;     // JSONB
  if (payload.equipe != null) extraPatch.equipe = payload.equipe;             // JSONB

  // segurança / PT
  if (payload.risco_nivel != null) extraPatch.risco_nivel = payload.risco_nivel;
  if (payload.riscos_identificados != null) extraPatch.riscos_identificados = payload.riscos_identificados;
  if (payload.epi_lista != null) extraPatch.epi_lista = payload.epi_lista;     // JSONB
  if (payload.pt_numero != null) extraPatch.pt_numero = payload.pt_numero;
  if (payload.pt_tipo != null) extraPatch.pt_tipo = payload.pt_tipo;

  // prazos / SLA
  if (payload.sla_inicio != null) extraPatch.sla_inicio = toISODateOnly(payload.sla_inicio);
  if (payload.sla_fim != null) extraPatch.sla_fim = toISODateOnly(payload.sla_fim);

  // custos
  if (typeof payload.custo_estimado !== "undefined") extraPatch.custo_estimado = payload.custo_estimado ?? null;
  if (typeof payload.custo_materiais !== "undefined") extraPatch.custo_materiais = payload.custo_materiais ?? null;
  if (typeof payload.custo_total !== "undefined") extraPatch.custo_total = payload.custo_total ?? null;

  // fornecedor
  if (payload.fornecedor_nome != null) extraPatch.fornecedor_nome = payload.fornecedor_nome;
  if (payload.fornecedor_contato != null) extraPatch.fornecedor_contato = payload.fornecedor_contato;

  // aceite / validação
  if (payload.aceite_responsavel != null) extraPatch.aceite_responsavel = payload.aceite_responsavel;
  if (payload.aceite_data != null) extraPatch.aceite_data = toISODateOnly(payload.aceite_data);
  if (payload.validacao_obs != null) extraPatch.validacao_obs = payload.validacao_obs;

  // evidências (JSONB)
  if (payload.fotos_antes != null) extraPatch.fotos_antes = payload.fotos_antes;
  if (payload.fotos_depois != null) extraPatch.fotos_depois = payload.fotos_depois;

  if (Object.keys(extraPatch).length) {
    try {
      await supabase.from("os").update(extraPatch).eq("id", (data as any).id);
    } catch (e) {
      console.warn("Campos extras (opcionais) não aplicados:", (e as any)?.message);
    }
  }

  const r: any = data;
  return {
    ...r,
    status: osNormalizeStatus(r.status),
    data_abertura: r.data_abertura ?? r.created_at ?? null,
  } as OSRow;
}

export async function updateOS(
  id: string,
  patch: Partial<{
    // básicos
    titulo: string;
    descricao: string | null;
    responsavel: string | null;
    status: OSStatus | string;
    ativo_id: string | null;
    prioridade: "baixa" | "media" | "alta" | "urgente" | string | null;
    tipo_manutencao: "preventiva" | "corretiva" | "preditiva" | string | null;
    data_prevista: string | null; // "YYYY-MM-DD"

    // identificação / origem
    solicitante_nome: string | null;
    solicitante_contato: string | null;
    aprovador_nome: string | null;
    origem: string | null;

    // escopo / checklist / recursos
    escopo: string | null;
    checklist: Array<{ item: string; obrigatorio?: boolean }> | null;
    materiais: Array<{ descricao: string; qtd: number; unidade?: string }> | null;
    equipe: Array<{ funcao: string; nome?: string; carga_horas?: number }> | null;

    // segurança / PT
    risco_nivel: "baixo" | "medio" | "alto" | null | string;
    riscos_identificados: string | null;
    epi_lista: string[] | null;
    pt_numero: string | null;
    pt_tipo: string | null;

    // prazos / SLA
    sla_inicio: string | null; // "YYYY-MM-DD"
    sla_fim: string | null;    // "YYYY-MM-DD"

    // custos
    custo_estimado: number | null;
    custo_materiais: number | null;
    custo_total: number | null;

    // fornecedor
    fornecedor_nome: string | null;
    fornecedor_contato: string | null;

    // aceite / validação
    aceite_responsavel: string | null;
    aceite_data: string | null; // "YYYY-MM-DD"
    validacao_obs: string | null;

    // evidências
    fotos_antes: Array<{ path: string; legenda?: string }> | null;
    fotos_depois: Array<{ path: string; legenda?: string }> | null;
  }>
) {
  const upd: any = {};

  // básicos
  if (typeof patch.titulo !== "undefined") upd.titulo = patch.titulo ?? null;
  if (typeof patch.descricao !== "undefined") upd.descricao = patch.descricao ?? null;
  if (typeof patch.responsavel !== "undefined") upd.responsavel = patch.responsavel ?? null;
  if (typeof patch.ativo_id !== "undefined") upd.ativo_id = patch.ativo_id ?? null;

  if (typeof patch.status !== "undefined")
    upd.status = osDbEncodeStatus(patch.status as OSStatus);

  if (typeof patch.prioridade !== "undefined")
    upd.prioridade = normalizeOsPrioridade(patch.prioridade as string) ?? null;

  if (typeof patch.tipo_manutencao !== "undefined")
    upd.tipo_manutencao = normalizeTipoManutencao(patch.tipo_manutencao as string) ?? null;

  if (typeof patch.data_prevista !== "undefined")
    upd.data_prevista = toISODateOnly(patch.data_prevista ?? null);

  // identificação / origem
  if (typeof patch.solicitante_nome !== "undefined") upd.solicitante_nome = patch.solicitante_nome;
  if (typeof patch.solicitante_contato !== "undefined") upd.solicitante_contato = patch.solicitante_contato;
  if (typeof patch.aprovador_nome !== "undefined") upd.aprovador_nome = patch.aprovador_nome;
  if (typeof patch.origem !== "undefined") upd.origem = patch.origem;

  // escopo / checklist / recursos (JSONB)
  if (typeof patch.escopo !== "undefined") upd.escopo = patch.escopo;
  if (typeof patch.checklist !== "undefined") upd.checklist = patch.checklist ?? null;
  if (typeof patch.materiais !== "undefined") upd.materiais = patch.materiais ?? null;
  if (typeof patch.equipe !== "undefined") upd.equipe = patch.equipe ?? null;

  // segurança / PT
  if (typeof patch.risco_nivel !== "undefined") upd.risco_nivel = patch.risco_nivel ?? null;
  if (typeof patch.riscos_identificados !== "undefined") upd.riscos_identificados = patch.riscos_identificados ?? null;
  if (typeof patch.epi_lista !== "undefined") upd.epi_lista = patch.epi_lista ?? null;
  if (typeof patch.pt_numero !== "undefined") upd.pt_numero = patch.pt_numero ?? null;
  if (typeof patch.pt_tipo !== "undefined") upd.pt_tipo = patch.pt_tipo ?? null;

  // prazos / SLA
  if (typeof patch.sla_inicio !== "undefined") upd.sla_inicio = toISODateOnly(patch.sla_inicio ?? null);
  if (typeof patch.sla_fim !== "undefined")    upd.sla_fim    = toISODateOnly(patch.sla_fim ?? null);

  // custos
  if (typeof patch.custo_estimado !== "undefined") upd.custo_estimado = patch.custo_estimado ?? null;
  if (typeof patch.custo_materiais !== "undefined") upd.custo_materiais = patch.custo_materiais ?? null;
  if (typeof patch.custo_total !== "undefined") upd.custo_total = patch.custo_total ?? null;

  // fornecedor
  if (typeof patch.fornecedor_nome !== "undefined") upd.fornecedor_nome = patch.fornecedor_nome ?? null;
  if (typeof patch.fornecedor_contato !== "undefined") upd.fornecedor_contato = patch.fornecedor_contato ?? null;

  // aceite / validação
  if (typeof patch.aceite_responsavel !== "undefined") upd.aceite_responsavel = patch.aceite_responsavel ?? null;
  if (typeof patch.aceite_data !== "undefined") upd.aceite_data = toISODateOnly(patch.aceite_data ?? null);
  if (typeof patch.validacao_obs !== "undefined") upd.validacao_obs = patch.validacao_obs ?? null;

  // evidências
  if (typeof patch.fotos_antes !== "undefined") upd.fotos_antes = patch.fotos_antes ?? null;
  if (typeof patch.fotos_depois !== "undefined") upd.fotos_depois = patch.fotos_depois ?? null;

  upd.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("os")
    .update(upd)
    .eq("id", id)
    .select("*")
    .limit(1);

  if (error) throw error;

  const r: any = (data ?? [])[0];
  return {
    ...r,
    status: osNormalizeStatus(r.status),
    data_abertura: r.data_abertura ?? r.created_at ?? null,
  } as OSRow;
}

/** Atribui executor por nome/contato e coloca status em 'em andamento' */
export async function assignOSExecutor(
  id: string,
  executorNome: string,
  executorContato: string | null
) {
  const upd: any = {
    responsavel: executorNome || null,
    updated_at: new Date().toISOString(),
    status: osDbEncodeStatus("em andamento"),
  };

  try { upd.executor_nome = executorNome; } catch {}
  try { upd.executor_contato = executorContato; } catch {}

  const { data, error } = await supabase
    .from("os")
    .update(upd)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  const r: any = data;
  return { ...r, status: osNormalizeStatus(r.status) } as OSRow;
}

/** Atualiza o status da OS (marca data_fechamento quando concluir) */
export async function setOSStatus(id: string, status: OSStatus) {
  const patch: any = { status: osDbEncodeStatus(status), updated_at: new Date().toISOString() };
  if (status === "concluida") patch.data_fechamento = new Date().toISOString();

  const { data, error } = await supabase
    .from("os")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  const r: any = data;
  return { ...r, status: osNormalizeStatus(r.status) } as OSRow;
}

/** Validação: aprovado -> concluída; reprovado -> em andamento (guarda observações se existir) */
export async function validateOS(
  id: string,
  aprovado: boolean,
  observacoes?: string | null
) {
  const next: OSStatus = aprovado ? "concluida" : "em andamento";
  const patch: any = {
    status: osDbEncodeStatus(next),
    updated_at: new Date().toISOString(),
  };
  try { patch.observacoes_validacao = observacoes ?? null; } catch {}

  const { data, error } = await supabase
    .from("os")
    .update(patch)
    .eq("id", id)
    .select("*")
    .limit(1);

  if (error) throw error;
  const r: any = (data ?? [])[0];
  return { ...r, status: osNormalizeStatus(r.status) } as OSRow;
}

export async function deleteOS(id: string): Promise<void> {
  const { error } = await supabase.from("os").delete().eq("id", id);
  if (error) throw error;
}

/** Upload do PDF da OS (bucket 'os_docs') */
export async function uploadOSPdf(
  id: string,
  file: File
): Promise<{ path: string; url: string | null }> {
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
  const key = `${id}/${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("os_docs")
    .upload(key, file, {
      upsert: true,
      contentType: file.type || "application/pdf",
    });
  if (upErr) throw upErr;

  try {
    await supabase.from("os").update({ pdf_path: key }).eq("id", id);
  } catch {
    // coluna opcional
  }

  const { data: signed } = await supabase.storage
    .from("os_docs")
    .createSignedUrl(key, 60 * 60);

  return { path: key, url: signed?.signedUrl ?? null };
}

/** Gerar OS a partir da manutenção/plano (usado pelo Ativos.tsx) */
export async function createOSFromManut(manut: {
  id: string;
  titulo: string;
  ativo_id?: string | null;
  vencimento?: string | null;
}) {
  const descricao = `OS gerada automaticamente a partir de "${manut.titulo}" (venc.: ${
    manut.vencimento ?? "—"
  })`;
  return createOS({
    titulo: `OS – ${manut.titulo}`,
    descricao,
    ativo_id: manut.ativo_id ?? null,
    origem: "manutencao",
  });
}

/* ===========================
 * CONFIGURAÇÕES DO CONDOMÍNIO
 * =========================== */

export type CondoConfig = {
  id: string;
  nome: string | null;
  unidades: number | null;
  endereco: string | null;
  updated_at?: string | null;
};

export type AtivoTipoRow = {
  id: string;
  nome: string;
  slug: string | null;
  is_conformidade: boolean;
  conf_tipo: ConfTipo | null;
  periodicidade_default: string | null;
  created_at?: string | null;
};

export type LocalRow = {
  id: string;
  nome: string;
  created_at?: string | null;
};

export async function getCondoConfig(): Promise<CondoConfig | null> {
  const { data, error, status } = await supabase
    .from("condominio_config")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && status !== 406) throw error;
  return data ?? null;
}

export async function upsertCondoConfig(patch: Partial<CondoConfig>) {
  const current = await getCondoConfig();
  if (!current) {
    const { data, error } = await supabase
      .from("condominio_config")
      .insert([
        {
          nome: patch.nome ?? null,
          unidades: patch.unidades ?? null,
          endereco: patch.endereco ?? null,
          updated_at: new Date().toISOString(),
        } as any,
      ])
      .select()
      .single();
    if (error) throw error;
    return data as CondoConfig;
  }
  const { data, error } = await supabase
    .from("condominio_config")
    .update({
      nome:
        typeof patch.nome !== "undefined" ? patch.nome : current.nome,
      unidades:
        typeof patch.unidades !== "undefined"
          ? patch.unidades
          : current.unidades,
      endereco:
        typeof patch.endereco !== "undefined"
          ? patch.endereco
          : current.endereco,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select()
    .single();
  if (error) throw error;
  return data as CondoConfig;
}

export type ManutTemplate = {
  id: string;
  sistema: string;
  titulo_plano: string;
  descricao?: string | null;
  periodicidade: string;
  responsavel?: string | null;
  checklist?: any;
  created_at?: string | null;
};

export async function listManutTemplates(
  sistema?: string
): Promise<ManutTemplate[]> {
  let q = supabase
    .from("manut_templates")
    .select("*")
    .order("sistema", { ascending: true })
    .order("titulo_plano", { ascending: true });
  if (sistema && sistema.trim()) {
    q = q.ilike("sistema", sistema.trim().toLowerCase());
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ManutTemplate[];
}

export async function upsertManutTemplate(
  payload: Partial<ManutTemplate> & {
    sistema: string;
    titulo_plano: string;
    periodicidade: string;
  }
) {
  const base = {
    sistema: payload.sistema.trim().toLowerCase(),
    titulo_plano: payload.titulo_plano.trim(),
    descricao: payload.descricao ?? null,
    periodicidade: payload.periodicidade as any,
    responsavel: payload.responsavel ?? null,
    checklist: payload.checklist ?? [],
  };

  if (payload.id) {
    const { data, error } = await supabase
      .from("manut_templates")
      .update(base)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as ManutTemplate;
  } else {
    const { data, error } = await supabase
      .from("manut_templates")
      .insert(base)
      .select()
      .single();
    if (error) throw error;
    return data as ManutTemplate;
  }
}

export async function deleteManutTemplate(id: string) {
  const { error } = await supabase
    .from("manut_templates")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function listAtivoTipos(): Promise<AtivoTipoRow[]> {
  const { data, error } = await supabase
    .from("ativo_tipos")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    ...d,
    conf_tipo: (d.conf_tipo as any) ?? null,
  })) as AtivoTipoRow[];
}

export async function createAtivoTipo(payload: {
  nome: string;
  is_conformidade?: boolean;
  conf_tipo?: ConfTipo | null;
  periodicidade_default?: string | null;
}) {
  const { data, error } = await supabase
    .from("ativo_tipos")
    .insert({
      nome: payload.nome,
      slug: slugify(payload.nome),
      is_conformidade: !!payload.is_conformidade,
      conf_tipo: payload.conf_tipo ?? null,
      periodicidade_default: payload.periodicidade_default ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as AtivoTipoRow;
}

export async function updateAtivoTipo(
  id: string,
  patch: Partial<
    Pick<
      AtivoTipoRow,
      "nome" | "is_conformidade" | "conf_tipo" | "periodicidade_default"
    >
  >
) {
  const update: any = {
    ...(typeof patch.nome !== "undefined"
      ? { nome: patch.nome, slug: slugify(patch.nome ?? "") }
      : {}),
    ...(typeof patch.is_conformidade !== "undefined"
      ? { is_conformidade: patch.is_conformidade }
      : {}),
    ...(typeof patch.conf_tipo !== "undefined"
      ? { conf_tipo: patch.conf_tipo ?? null }
      : {}),
    ...(typeof patch.periodicidade_default !== "undefined"
      ? { periodicidade_default: patch.periodicidade_default ?? null }
      : {}),
  };
  const { data, error } = await supabase
    .from("ativo_tipos")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as AtivoTipoRow;
}

export async function deleteAtivoTipo(id: string) {
  const { error } = await supabase
    .from("ativo_tipos")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function getAtivoTipoMeta(
  tipo: string
): Promise<AtivoTipoRow | null> {
  const s = (tipo || "").trim();
  if (!s) return null;
  const slug = slugify(s);

  {
    const { data, error } = await supabase
      .from("ativo_tipos")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error && (error as any).code !== "PGRST116") throw error;
    if (data) return data as AtivoTipoRow;
  }

  const { data, error } = await supabase
    .from("ativo_tipos")
    .select("*")
    .ilike("nome", s)
    .maybeSingle();
  if (error && (error as any).code !== "PGRST116") throw error;
  return (data as AtivoTipoRow) ?? null;
}

export async function isConformidadeForTipo(
  tipo: string
): Promise<{ is: boolean; conf_tipo: ConfTipo | null }> {
  const meta = await getAtivoTipoMeta(tipo);
  if (!meta) return { is: false, conf_tipo: null };
  return { is: !!meta.is_conformidade, conf_tipo: meta.conf_tipo ?? null };
}

export async function listLocais(): Promise<LocalRow[]> {
  const { data, error } = await supabase
    .from("locais")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createLocal(nome: string) {
  const { data, error } = await supabase
    .from("locais")
    .insert({ nome })
    .select()
    .single();
  if (error) throw error;
  return data as LocalRow;
}

export async function updateLocal(id: string, nome: string) {
  const { data, error } = await supabase
    .from("locais")
    .update({ nome })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as LocalRow;
}

export async function deleteLocal(id: string) {
  const { error } = await supabase.from("locais").delete().eq("id", id);
  if (error) throw error;
}

export async function listTemplatesBySistema(sistema: string) {
  const s = sistema.toLowerCase().trim();
  const { data, error } = await supabase
    .from("manut_templates")
    .select("*")
    .eq("sistema", s);
  if (error) throw error;
  return data ?? [];
}

export async function listManutencaoAnexos(
  manutencaoId: string
): Promise<Array<{ name: string; key: string; url: string }>> {
  const { data, error } = await supabase.storage
    .from("manutencoes")
    .list(manutencaoId, {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    });

  if (error) return [];

  const files = data ?? [];
  const items = await Promise.all(
    files.map(async (f) => {
      const key = `${manutencaoId}/${f.name}`;
      const { data: signed } = await supabase.storage
        .from("manutencoes")
        .createSignedUrl(key, 60 * 60);
      return { name: f.name, key, url: signed?.signedUrl ?? "" };
    })
  );

  return items.filter((x) => !!x.url);
}

export async function getManutencaoAnexoUrl(
  key: string,
  seconds = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("manutencoes")
    .createSignedUrl(key, seconds);
  if (error) throw error;
  return data.signedUrl;
}
