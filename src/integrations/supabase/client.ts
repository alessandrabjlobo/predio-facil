import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
   import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

// Fallback to dummy values if env vars missing (graceful degradation)
const finalUrl = url || "https://placeholder.supabase.co";
const finalKey = key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder";

const host = new URL(finalUrl).host;
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

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: STORAGE_KEY,
  },
});
