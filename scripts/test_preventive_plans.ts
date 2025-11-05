#!/usr/bin/env tsx
/**
 * Test script for preventive plans auto-generation
 *
 * Tests:
 * 1. Creating a new ativo triggers plan creation
 * 2. RPC criar_planos_preventivos works with INTERVAL periodicidade
 * 3. Idempotency: no duplicates on repeated runs
 * 4. Plans have correct periodicidade format
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function log(message: string, color?: 'green' | 'red' | 'yellow') {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
  };
  const c = color ? colors[color] : colors.reset;
  console.log(`${c}${message}${colors.reset}`);
}

async function authenticateAdmin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'alessandrabastojansen@gmail.com',
    password: 'Vl2301;;',
  });

  if (error) throw new Error(`Auth failed: ${error.message}`);
  return data.user.id;
}

async function test1_CreateAtivoGeneratesPlans() {
  log('\n📦 Test 1: Create ativo and verify plan generation', 'yellow');

  try {
    // Get or create a test condominio
    const { data: condos } = await supabase
      .from('condominios')
      .select('id')
      .limit(1);

    let condominioId;
    if (condos && condos.length > 0) {
      condominioId = condos[0].id;
    } else {
      const { data: newCondo, error: e } = await supabase
        .from('condominios')
        .insert({ nome: 'Test Condo - Plans' })
        .select()
        .single();
      if (e) throw e;
      condominioId = newCondo.id;
    }

    // Get the tipo_id for 'Bombas de Incêndio'
    const { data: bombaTipo } = await supabase
      .from('ativo_tipos')
      .select('id')
      .eq('nome', 'Bombas de Incêndio')
      .maybeSingle();

    let tipoId = bombaTipo?.id;
    if (!tipoId) {
      const { data: firstTipo } = await supabase
        .from('ativo_tipos')
        .select('id, nome')
        .limit(1)
        .single();
      tipoId = firstTipo?.id;
      console.log(`  Using first available tipo: ${firstTipo?.nome}`);
    }

    // Create a test ativo (should trigger auto-plan generation via trigger)
    const { data: ativo, error: eAtivo } = await supabase
      .from('ativos')
      .insert({
        nome: `Test Ativo ${Date.now()}`,
        tipo_id: tipoId,
        condominio_id: condominioId,
      })
      .select()
      .single();

    if (eAtivo) throw eAtivo;

    // Wait a bit for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if plans were created
    const { data: planos, error: ePlanos } = await supabase
      .from('planos_manutencao')
      .select('*')
      .eq('ativo_id', ativo.id);

    if (ePlanos) throw ePlanos;

    if (planos && planos.length > 0) {
      results.push({
        name: 'Create ativo generates plans',
        passed: true,
        details: `Created ${planos.length} plan(s) for ativo '${ativo.nome}'`,
      });
      log(`✓ Created ${planos.length} plan(s)`, 'green');
      log(`  Titles: ${planos.map(p => p.titulo).join(', ')}`);
      return { ativoId: ativo.id, condominioId, planos };
    } else {
      results.push({
        name: 'Create ativo generates plans',
        passed: false,
        error: 'No plans created for ativo',
      });
      log('✗ No plans created', 'red');
      return null;
    }
  } catch (e: any) {
    results.push({
      name: 'Create ativo generates plans',
      passed: false,
      error: e.message,
    });
    log(`✗ ${e.message}`, 'red');
    return null;
  }
}

async function test2_RpcCreatesPlans(condominioId: string) {
  log('\n📦 Test 2: RPC criar_planos_preventivos', 'yellow');

  try {
    // Call RPC directly
    const { data, error } = await supabase.rpc('criar_planos_preventivos', {
      p_condominio_id: condominioId,
    });

    if (error) throw error;

    log(`✓ RPC returned: ${data} plans created`, 'green');
    results.push({
      name: 'RPC criar_planos_preventivos works',
      passed: true,
      details: `RPC returned ${data} plans created`,
    });
    return data;
  } catch (e: any) {
    results.push({
      name: 'RPC criar_planos_preventivos works',
      passed: false,
      error: e.message,
    });
    log(`✗ ${e.message}`, 'red');
    return null;
  }
}

async function test3_CheckPeriodicidadeFormat(ativoId: string) {
  log('\n📦 Test 3: Verify periodicidade is INTERVAL format', 'yellow');

  try {
    const { data: planos, error } = await supabase
      .from('planos_manutencao')
      .select('titulo, periodicidade')
      .eq('ativo_id', ativoId);

    if (error) throw error;

    if (planos && planos.length > 0) {
      const sample = planos[0];
      log(`  Sample plan: "${sample.titulo}"`, 'green');
      log(`  Periodicidade: ${sample.periodicidade}`);

      // Check if it looks like interval (e.g., "3 mons", "1 mon", "00:00:00")
      const isInterval = sample.periodicidade &&
        (sample.periodicidade.includes('mon') ||
         sample.periodicidade.includes('day') ||
         sample.periodicidade.includes(':'));

      if (isInterval) {
        results.push({
          name: 'Periodicidade is INTERVAL format',
          passed: true,
          details: `Format: ${sample.periodicidade}`,
        });
        log(`✓ Correct INTERVAL format`, 'green');
      } else {
        results.push({
          name: 'Periodicidade is INTERVAL format',
          passed: false,
          error: `Unexpected format: ${sample.periodicidade}`,
        });
        log(`✗ Unexpected format: ${sample.periodicidade}`, 'red');
      }
    } else {
      results.push({
        name: 'Periodicidade is INTERVAL format',
        passed: false,
        error: 'No plans to check',
      });
      log('✗ No plans to check', 'red');
    }
  } catch (e: any) {
    results.push({
      name: 'Periodicidade is INTERVAL format',
      passed: false,
      error: e.message,
    });
    log(`✗ ${e.message}`, 'red');
  }
}

async function test4_Idempotency(condominioId: string) {
  log('\n📦 Test 4: Idempotency (no duplicates on rerun)', 'yellow');

  try {
    // Count plans before
    const { data: before, error: e1 } = await supabase
      .from('planos_manutencao')
      .select('id', { count: 'exact', head: true })
      .eq('condominio_id', condominioId);

    if (e1) throw e1;

    const countBefore = (before as any)?.count || 0;

    // Run RPC again
    const { data: created } = await supabase.rpc('criar_planos_preventivos', {
      p_condominio_id: condominioId,
    });

    // Count plans after
    const { data: after, error: e2 } = await supabase
      .from('planos_manutencao')
      .select('id', { count: 'exact', head: true })
      .eq('condominio_id', condominioId);

    if (e2) throw e2;

    const countAfter = (after as any)?.count || 0;

    if (created === 0 && countAfter === countBefore) {
      results.push({
        name: 'Idempotency verified',
        passed: true,
        details: `No duplicates. Count before: ${countBefore}, after: ${countAfter}`,
      });
      log(`✓ No duplicates created`, 'green');
      log(`  Count before: ${countBefore}, after: ${countAfter}`);
    } else {
      results.push({
        name: 'Idempotency verified',
        passed: false,
        error: `Expected 0 new plans, got ${created}. Before: ${countBefore}, After: ${countAfter}`,
      });
      log(`✗ Duplicates may have been created`, 'red');
    }
  } catch (e: any) {
    results.push({
      name: 'Idempotency verified',
      passed: false,
      error: e.message,
    });
    log(`✗ ${e.message}`, 'red');
  }
}

async function main() {
  console.log('🚀 Starting Preventive Plans Test Suite\n');
  console.log('='.repeat(60));

  try {
    await authenticateAdmin();
    log('✓ Authenticated as admin', 'green');

    const test1Result = await test1_CreateAtivoGeneratesPlans();
    if (test1Result) {
      await test2_RpcCreatesPlans(test1Result.condominioId);
      await test3_CheckPeriodicidadeFormat(test1Result.ativoId);
      await test4_Idempotency(test1Result.condominioId);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    results.forEach(r => {
      const icon = r.passed ? '✓' : '✗';
      const color = r.passed ? 'green' : 'red';
      log(`${icon} ${r.name}`, color);
      if (r.details) log(`  ${r.details}`);
      if (r.error) log(`  Error: ${r.error}`);
    });

    console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(60));

    process.exit(failed > 0 ? 1 : 0);
  } catch (e: any) {
    log(`\n❌ Test suite failed: ${e.message}`, 'red');
    process.exit(1);
  }
}

main();
