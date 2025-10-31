import { createClient } from "@supabase/supabase-js";

// NÃO USE PROJECT_ID NEM FALLBACKS.
// O build deve falhar em dev se as envs não existirem.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Supabase ENV missing.", {
    VITE_SUPABASE_URL: url,
    hasKey: Boolean(key),
  });
  // Opcional: lance um erro pra evitar cair em qualquer fallback antigo
  throw new Error("Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(url, key);
