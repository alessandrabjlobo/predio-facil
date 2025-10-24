// Wrapper to ensure Supabase env vars are always present at runtime
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const url = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://epzyiotfdrqesllqmgtz.supabase.co';
const key =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwenlpb3RmZHJxZXNsbHFtZ3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzU1NTIsImV4cCI6MjA3NjcxMTU1Mn0.QUpFl5zkSsG9kfq0t4Lr6wtAbzlm-Il9zxLtXCtfKTE';

if (!url) {
  // Provide a clearer error to help debug if something goes wrong
  // eslint-disable-next-line no-console
  console.error('Supabase URL missing. import.meta.env:', (import.meta as any).env);
  throw new Error('VITE_SUPABASE_URL is not configured');
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
