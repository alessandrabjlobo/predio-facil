// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

const URL =
  import.meta.env.VITE_SUPABASE_URL
  ?? (import.meta.env.VITE_SUPABASE_PROJECT_ID
        ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
        : undefined);

const KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY
  ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!URL || !KEY) {
  console.warn("Supabase ENV missing", { URL, hasKey: Boolean(KEY) });
}

export const supabase = createClient(URL!, KEY!);
