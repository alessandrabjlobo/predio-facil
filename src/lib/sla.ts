// src/lib/sla.ts
/**
 * SLA mapping per Brazilian NBR 5674 maintenance criticality levels
 */
export const SLA_MAP: Record<"A" | "B" | "C", number> = {
  A: 4,  // Critical: 4 hours
  B: 24, // High: 24 hours  
  C: 72, // Normal: 72 hours
};

/**
 * Gets SLA hours from criticality level
 */
export const slaFromCrit = (c: "A" | "B" | "C" | null | undefined): number | undefined => {
  return c ? SLA_MAP[c] : undefined;
};

/**
 * Calculates SLA deadline from a start date and criticality
 */
export const calculateSLADeadline = (
  startDate: Date,
  criticidade: "A" | "B" | "C"
): Date => {
  const hours = SLA_MAP[criticidade];
  const deadline = new Date(startDate);
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
};

/**
 * Checks if SLA is breached
 */
export const isSLABreached = (
  slaDeadline: Date | string,
  completionDate?: Date | string | null
): boolean => {
  const deadline = typeof slaDeadline === "string" ? new Date(slaDeadline) : slaDeadline;
  const completion = completionDate 
    ? (typeof completionDate === "string" ? new Date(completionDate) : completionDate)
    : new Date();
  
  return completion > deadline;
};
