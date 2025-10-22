// src/lib/date.ts
export const ymd = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export const addDays = (base: Date, n: number) => {
  const dd = new Date(base);
  dd.setDate(dd.getDate() + n);
  return dd;
};

export const firstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const lastDayOfMonth  = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export const startOfWeekMon = (d: Date) => {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const out = new Date(d);
  out.setDate(d.getDate() - diff);
  out.setHours(0, 0, 0, 0);
  return out;
};
