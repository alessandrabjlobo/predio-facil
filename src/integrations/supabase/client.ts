import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL?.toString();
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.toString();

if (!url || !anon) {
  // Mensagem clara no console para diagnóstico
  console.error(
    [
      '❌ Supabase não configurado.',
      `VITE_SUPABASE_URL: ${url ?? '(undefined)'}`,
      `VITE_SUPABASE_ANON_KEY: ${anon ? '(present)' : '(undefined)'}`,
      'Defina essas envs no Lovable (Settings → Environment) e redeploy.'
    ].join('\n')
  );
  // Impede inicializar com valores inválidos
  throw new Error('Supabase URL/Anon key missing');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
