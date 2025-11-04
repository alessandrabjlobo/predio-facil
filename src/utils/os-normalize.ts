// src/utils/os-normalize.ts
export function normalizeOsFormValues(v: {
  tipo_manutencao?: string | null;
  prioridade?: string | null;
  data_prevista?: string | null | Date;
}) {
  const clean = (s?: string | null) =>
    (s ?? "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .trim();

  const tipo = (() => {
    const k = clean(v.tipo_manutencao);
    if (k.startsWith("prev")) return "preventiva";
    if (k.startsWith("corr")) return "corretiva";
    if (k.startsWith("pred")) return "preditiva";
    return null;
  })();

  const prioridade = (() => {
    const k = clean(v.prioridade);
    if (k.includes("urg")) return "urgente";
    if (k.includes("alta")) return "alta";
    if (k.includes("med")) return "media";
    if (k.includes("baix")) return "baixa";
    return null;
  })();

  const toYmd = (d: any) => {
    if (!d) return null;
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
  };

  return {
    tipo_manutencao: tipo,
    prioridade,
    data_prevista: toYmd(v.data_prevista),
  };
}
