import { createClient } from '@supabase/supabase-js';

// Use ONLY external Supabase project - no fallbacks
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  const isDev = import.meta.env.DEV;
  if (isDev) {
    console.error('❌ Supabase configuration missing:', {
      url: url ? 'OK' : 'MISSING',
      anon: anon ? 'OK' : 'MISSING'
    });
  }
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
