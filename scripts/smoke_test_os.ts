#!/usr/bin/env tsx
/**
 * Smoke Test for OS Backend
 *
 * Quick verification that:
 * 1. Supabase client connects
 * 2. Can read condominios table
 * 3. Can read ativos table
 * 4. RPC criar_os_detalhada exists and can be called
 * 5. OS number is generated correctly
 *
 * Usage:
 *   npx tsx scripts/smoke_test_os.ts
 *
 * Environment Variables (must be set):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Missing env vars');
  console.error('   Required: VITE_SUPABASE_URL');
  console.error('   Required: SUPABASE_SERVICE_ROLE_KEY (for testing) or VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('🔧 Connecting to Supabase...');
console.log(`   Mode: ${isServiceRole ? 'Service Role (bypasses RLS)' : 'Anon Key (respects RLS)'}`);
const supabase = createClient(url, key);

async function smokeTest() {
  try {
    // Test 0: Authenticate as admin
    console.log('\n📦 Test 0: Authenticate');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alessandrabastojansen@gmail.com',
      password: 'Vl2301;;',
    });

    if (authError) {
      console.error('❌ Failed to authenticate:', authError.message);
      return false;
    }

    console.log('✅ Authenticated as admin');
    console.log(`   User ID: ${authData.user.id}`);

    // Test 1: Read condominios
    console.log('\n📦 Test 1: Read condominios');
    const { data: condominios, error: e1 } = await supabase
      .from('condominios')
      .select('id, nome')
      .limit(1);

    if (e1) {
      console.error('❌ Failed to read condominios:', e1.message);
      return false;
    }

    if (!condominios || condominios.length === 0) {
      console.log('⚠️  No condominios found. Run seeds first.');
      return false;
    }

    const condo = condominios[0];
    console.log(`✅ Found condominio: ${condo.nome} (${condo.id})`);

    // Test 2: Read ativos
    console.log('\n📦 Test 2: Read ativos for condominio');
    const { data: ativos, error: e2 } = await supabase
      .from('ativos')
      .select('id, nome')
      .eq('condominio_id', condo.id)
      .limit(1);

    if (e2) {
      console.error('❌ Failed to read ativos:', e2.message);
      return false;
    }

    if (!ativos || ativos.length === 0) {
      console.log('⚠️  No ativos found for this condominio. Creating one...');

      // Try to create a test ativo
      const { data: newAtivo, error: e2b } = await supabase
        .from('ativos')
        .insert({
          condominio_id: condo.id,
          nome: 'Test Asset - Smoke Test',
          tipo_id: null,
        })
        .select('id, nome')
        .single();

      if (e2b) {
        console.error('❌ Failed to create test ativo:', e2b.message);
        return false;
      }

      console.log(`✅ Created test ativo: ${newAtivo.nome}`);
      ativos.push(newAtivo);
    }

    const ativo = ativos[0];
    console.log(`✅ Found ativo: ${ativo.nome} (${ativo.id})`);

    // Test 3: Call criar_os_detalhada RPC
    console.log('\n📦 Test 3: Call criar_os_detalhada RPC');
    const { data: os, error: e3 } = await supabase.rpc('criar_os_detalhada', {
      p_condominio_id: condo.id,
      p_ativo_id: ativo.id,
      p_titulo: `Smoke Test OS - ${new Date().toISOString()}`,
      p_descricao: 'Automated smoke test for OS backend',
      p_prioridade: 'baixa',
      p_tipo_os: 'corretiva',
    });

    if (e3) {
      console.error('❌ Failed to create OS:', e3.message);
      console.error('   Details:', e3);
      return false;
    }

    if (!os || !os.id) {
      console.error('❌ No OS returned from RPC');
      return false;
    }

    console.log(`✅ Created OS: ${os.numero_os}`);
    console.log(`   ID: ${os.id}`);
    console.log(`   Title: ${os.titulo}`);
    console.log(`   Status: ${os.status}`);
    console.log(`   Priority: ${os.prioridade}`);

    // Test 4: Verify OS number format
    console.log('\n📦 Test 4: Verify OS number format');
    const numFormat = /^OS-\d{4}-\d{4}$/;
    if (!numFormat.test(os.numero_os)) {
      console.error(`❌ Invalid OS number format: ${os.numero_os}`);
      return false;
    }
    console.log(`✅ OS number format correct: ${os.numero_os}`);

    // Test 5: Read the created OS back
    console.log('\n📦 Test 5: Read created OS');
    const { data: readOS, error: e5 } = await supabase
      .from('os')
      .select('id, numero_os, titulo, status')
      .eq('id', os.id)
      .single();

    if (e5) {
      console.error('❌ Failed to read OS:', e5.message);
      return false;
    }

    console.log(`✅ Successfully read OS: ${readOS.numero_os}`);

    return true;

  } catch (err: any) {
    console.error('❌ Smoke test failed:', err.message);
    return false;
  }
}

console.log('🚀 Starting OS Backend Smoke Test');
console.log('=' .repeat(60));

smokeTest()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ SMOKE TEST PASSED');
      process.exit(0);
    } else {
      console.log('❌ SMOKE TEST FAILED');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
