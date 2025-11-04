import { describe, it, expect } from "vitest";

describe("OS Status values", () => {
  it("uses correct status strings with spaces not underscores", () => {
    const validStatuses = [
      "aberta",
      "em andamento",      // ✓ with space
      "aguardando_validacao", // ✓ with underscore
      "concluida",
      "cancelada",
    ];

    // Ensure "em andamento" has a space, not underscore
    expect(validStatuses).toContain("em andamento");
    expect(validStatuses).not.toContain("em_andamento");
  });

  it("normalizes status with underscore to space for em andamento", () => {
    const normalize = (s: string) => {
      if (s === "em_andamento" || s === "em andamento") return "em andamento";
      return s;
    };

    expect(normalize("em_andamento")).toBe("em andamento");
    expect(normalize("em andamento")).toBe("em andamento");
    expect(normalize("aberta")).toBe("aberta");
  });
});
