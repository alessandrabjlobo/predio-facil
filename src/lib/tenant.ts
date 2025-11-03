const KEY = 'currentCondominioId';

export function getCurrentCondominioId(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && v.trim() ? v : null;
  } catch { return null; }
}

export function setCurrentCondominioId(id: string | null) {
  try {
    if (id && id.trim()) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {}
  // avisa a app inteira SEMPRE que houve troca
  window.dispatchEvent(new Event("condominio:changed"));
}
