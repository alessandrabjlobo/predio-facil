import { describe, it, expect } from "vitest";
import { normalizeOsFormValues } from "../src/utils/os-normalize";

describe("normalizeOsFormValues", () => {
  it("normalizes tipo_manutencao and prioridade with accents/emojis", () => {
    const r = normalizeOsFormValues({
      tipo_manutencao: "Preventíva",
      prioridade: "🟡 Média",
      data_prevista: "2025-11-04",
    });
    expect(r.tipo_manutencao).toBe("preventiva");
    expect(r.prioridade).toBe("media");
    expect(r.data_prevista).toBe("2025-11-04");
  });

  it("converts Date to YYYY-MM-DD", () => {
    const d = new Date("2025-11-04T12:00:00Z");
    const r = normalizeOsFormValues({ data_prevista: d as any });
    expect(r.data_prevista).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("handles corretiva and preditiva types", () => {
    expect(normalizeOsFormValues({ tipo_manutencao: "Corretíva" }).tipo_manutencao).toBe("corretiva");
    expect(normalizeOsFormValues({ tipo_manutencao: "Preditiva" }).tipo_manutencao).toBe("preditiva");
  });

  it("handles all priority levels", () => {
    expect(normalizeOsFormValues({ prioridade: "🟢 Baixa" }).prioridade).toBe("baixa");
    expect(normalizeOsFormValues({ prioridade: "🟠 Alta" }).prioridade).toBe("alta");
    expect(normalizeOsFormValues({ prioridade: "🔴 Urgente" }).prioridade).toBe("urgente");
  });

  it("returns null for invalid values", () => {
    const r = normalizeOsFormValues({
      tipo_manutencao: "invalid",
      prioridade: "invalid",
      data_prevista: "invalid-date",
    });
    expect(r.tipo_manutencao).toBeNull();
    expect(r.prioridade).toBeNull();
    expect(r.data_prevista).toBeNull();
  });
});
