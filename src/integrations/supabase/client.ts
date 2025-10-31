import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  // Log útil pra depurar em produção
  console.warn('ENV CHECK:', { VITE_SUPABASE_URL: url, hasKey: !!anon })
}

export const supabase = createClient(url!, anon!)
