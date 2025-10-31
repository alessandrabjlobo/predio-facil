// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!url || !key) {
  console.warn("Supabase ENV missing", {
    VITE_SUPABASE_URL: url,
    hasKey: Boolean(key),
  });
}

export const supabase = createClient(url, key);
