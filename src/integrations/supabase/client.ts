import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables");
}

const host = new URL(url).host;
const STORAGE_KEY = `sb-${host}-auth-token`;
const PROJECT_REF = host.split(".")[0];
const REF_KEY = "supabase_project_ref";

// Se o ref do projeto mudou, limpa tokens antigos e reseta.
try {
  const prevRef = localStorage.getItem(REF_KEY);
  if (prevRef && prevRef !== PROJECT_REF) {
    localStorage.removeItem(STORAGE_KEY);
  }
  localStorage.setItem(REF_KEY, PROJECT_REF);
} catch { /* ignore */ }

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: STORAGE_KEY,
  },
});
