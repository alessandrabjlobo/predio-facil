// Tipos centrais do domínio — importe estes em hooks, componentes e serviços.

export type UUID = string;

export type AppRole =
  | "admin"
  | "admin_master"
  | "sindico"
  | "zelador"
  | "morador"
  | "fornecedor";

export interface Condominio {
  id: UUID;
  nome: string;
  cnpj?: string | null;
  // ...estenda conforme sua base
}

/**
 * IMPORTANTE:
 * - No store, mantenha um DICIONÁRIO (objeto) indexado por id (lookup O(1)).
 * - Telas que listam devem chamar `toArray(dict)` em vez de assumir array.
 */
export type CondominiosDict = Record<UUID, Condominio>;

export const toArray = <T>(dict: Record<string, T> | undefined | null): T[] =>
  dict ? Object.values(dict) : [];

export interface OrdemServico {
  id: UUID;
  condominio_id: UUID;
  ativo_id?: UUID | null;
  origem: "preventiva" | "chamado" | "legal";
  tipo: "preventiva" | "preditiva" | "corretiva" | "legal";
  criticidade: "A" | "B" | "C";
  prioridade?: string | null;
  descricao?: string | null;
  sla_horas?: number | null;
  status: "aberta" | "em_execucao" | "em_aceite" | "fechada";
  created_by?: UUID | null;
  executor_id?: UUID | null; // <— usado em assignExecutor
  created_at?: string;
}
