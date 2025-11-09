import { createClient } from '@supabase/supabase-js';

const url = (
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
  import.meta.env.VITE_SUPABASE_URL ??
  (import.meta.env.VITE_SUPABASE_PROJECT_ID
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
    : undefined)
)?.toString();
const anon = (
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)?.toString();

if (!url || !anon) {
  // Mensagem clara no console para diagnóstico
  console.error(
    [
      '❌ Backend não configurado (Supabase).',
      `NEXT_PUBLIC_SUPABASE_URL: ${import.meta.env.NEXT_PUBLIC_SUPABASE_URL ?? '(undefined)'}`,
      `VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ?? '(undefined)'}`,
      `VITE_SUPABASE_PROJECT_ID: ${import.meta.env.VITE_SUPABASE_PROJECT_ID ?? '(undefined)'}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY: ${import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '(present)' : '(undefined)'}`,
      `VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '(present)' : '(undefined)'}`,
      `VITE_SUPABASE_PUBLISHABLE_KEY: ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '(present)' : '(undefined)'}`,
      'Defina as envs públicas no painel (Settings → Environment) e redeploy.',
    ].join('\n')
  );
  // Impede inicializar com valores inválidos
  throw new Error('Supabase URL/Anon key missing');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
