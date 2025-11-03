export const SLA_MAP: Record<"A" | "B" | "C", number> = {
  A: 4,
  B: 24,
  C: 72,
};

export const slaFromCrit = (c: "A" | "B" | "C" | null | undefined) =>
  c ? SLA_MAP[c] : undefined;
