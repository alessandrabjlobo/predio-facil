// src/types/domain.ts
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
  endereco?: string | null;
}

export type CondominiosDict = Record<UUID, Condominio>;

/**
 * Converte dicionário (objeto indexado por id) para array,
 * para uso seguro em .map() na UI (Selects, tabelas, etc.).
 */
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
  executor_id?: UUID | null; // se adotar nome unificado
  created_at?: string;
}
