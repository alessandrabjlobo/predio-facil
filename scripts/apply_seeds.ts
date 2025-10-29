#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const sql = readFileSync('supabase/seed_manut_templates.sql', 'utf-8');

  // Split by semicolon but keep multi-line strings intact
  const statements = sql
    .split(/;(?=\s*(?:INSERT|--|\s*$))/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.includes('INSERT'));

  console.log(`Found ${statements.length} INSERT statements`);

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
      if (error) {
        // Try direct execute if RPC doesn't work
        console.warn('RPC failed, trying direct...');
        failed++;
      } else {
        success++;
      }
    } catch (e) {
      console.error('Failed:', e);
      failed++;
    }
  }

  console.log(`Success: ${success}, Failed: ${failed}`);

  // Verify count
  const { count } = await supabase
    .from('manut_templates')
    .select('*', { count: 'exact', head: true });

  console.log(`Total templates in DB: ${count}`);
}

main().catch(console.error);
