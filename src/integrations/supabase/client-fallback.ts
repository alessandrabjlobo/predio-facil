// Runtime-safe Supabase client fallback
// This file ensures the app still works even if Vite env injection fails in some previews.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Prefer Vite envs; gracefully fall back to literals (publishable) as a last resort
const url =
  import.meta.env.VITE_SUPABASE_URL ||
  (globalThis as any).VITE_SUPABASE_URL ||
  "https://epzyiotfdrqesllqmgtz.supabase.co";

const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (globalThis as any).VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwenlpb3RmZHJxZXNsbHFtZ3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzU1NTIsImV4cCI6MjA3NjcxMTU1Mn0.QUpFl5zkSsG9kfq0t4Lr6wtAbzlm-Il9zxLtXCtfKTE";

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
