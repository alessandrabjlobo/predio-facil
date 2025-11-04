// FILE: src/utils/os-normalize.ts
export function normalizeOsFormValues(input: {
  tipo_manutencao?: string | null;
  prioridade?: string | null;
  data_prevista?: string | null;
}) {
  const tipo = (input.tipo_manutencao || "").toLowerCase().trim();
  const prioridade = (input.prioridade || "").toLowerCase().trim();

  const tipoOk =
    tipo === "preventiva" || tipo === "corretiva" || tipo === "preditiva"
      ? tipo
      : "preventiva";

  const prioOk =
    prioridade === "baixa" ||
    prioridade === "media" ||
    prioridade === "alta" ||
    prioridade === "urgente"
      ? prioridade
      : "media";

  const data = (input.data_prevista || "").trim();
  const dataOk = /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null;

  return {
    tipo_manutencao: tipoOk,
    prioridade: prioOk,
    data_prevista: dataOk,
  };
}
