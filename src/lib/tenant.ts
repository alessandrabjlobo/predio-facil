// src/lib/tenant.ts
const KEY = 'currentCondominioId';

export function getCurrentCondominioId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch { return null; }
}
export function setCurrentCondominioId(id: string) {
  try {
    localStorage.setItem(KEY, id);
  } catch {}
}
