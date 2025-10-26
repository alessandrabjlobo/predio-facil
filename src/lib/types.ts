// src/lib/types.ts
/**
 * Tipos centralizados do sistema
 */

// Papel do usuário dentro de um condomínio
export type Papel =
  | "sindico"
  | "admin"
  | "funcionario"
  | "zelador"
  | "morador"
  | "fornecedor"
  | "conselho";

// Role do usuário no sistema (inclui owner)
export type UserRole =
  | "owner"
  | "sindico"
  | "admin"
  | "funcionario"
  | "zelador"
  | "fornecedor"
  | "morador"
  | "conselho"
  | null;

export type Status = "aberto" | "em_andamento" | "concluido" | "cancelado";
export type Prioridade = "baixa" | "media" | "alta" | "urgente";

export type ManutTipo = "preventiva" | "preditiva" | "corretiva";
export type ExecStatus =
  | "pendente"
  | "em_execucao"
  | "concluida"
  | "cancelada";

export type ConfTipo =
  | "elevadores"
  | "spda"
  | "incendio"
  | "reservatorios"
  | "pmoc"
  | "inspecao_predial"
  | "eletrica"
  | "gas"
  | "brigada";

export type Semaforo = "verde" | "amarelo" | "vermelho";

export type ConfAcao = "criacao" | "edicao" | "exclusao" | "validacao" | "anexar" | "resolver" | "remarcar";
