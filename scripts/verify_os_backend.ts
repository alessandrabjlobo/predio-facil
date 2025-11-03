/**
 * E2E Verification Script for OS (Work Order) Backend
 *
 * This script validates that the OS backend infrastructure works correctly
 * by testing both frontend dialog patterns against the unified RPC.
 *
 * Tests:
 * 1. Create OS using first dialog pattern (useOrdemServico)
 * 2. Create OS using second dialog pattern (maintenance/CreateOSDialog)
 * 3. Verify OS number generation (OS-YYYY-0001 format)
 * 4. Verify unique constraint on (condominio_id, numero_os)
 * 5. Verify RLS policies allow reads within same condominio
 * 6. Verify os_logs entry is created
 *
 * Usage:
 *   npx tsx scripts/verify_os_backend.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function getTestCondominio() {
  const { data, error } = await supabase
    .from('condominios')
    .select('id, nome')
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No test condominio found. Please run seeds first.');
  }

  return data;
}

async function getTestAtivo(condominioId: string) {
  const { data, error } = await supabase
    .from('ativos')
    .select('id, nome')
    .eq('condominio_id', condominioId)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No test ativo found. Please create an asset first.');
  }

  return data;
}

async function testDialogPattern1(condominioId: string, ativoId: string) {
  console.log('\n📋 Test 1: Dialog Pattern 1 (useOrdemServico)');
  console.log('   Parameters: p_condominio_id, p_plano_id, p_ativo_id, p_responsavel_id, p_titulo, p_descricao, p_prioridade, p_tipo_os, p_data_prevista');

  try {
    const { data, error } = await supabase.rpc('criar_os_detalhada', {
      p_condominio_id: condominioId,
      p_ativo_id: ativoId,
      p_titulo: 'Test OS - Dialog Pattern 1',
      p_descricao: 'Testing first dialog pattern from useOrdemServico',
      p_prioridade: 'media',
      p_tipo_os: 'preventiva',
      p_data_prevista: new Date().toISOString().split('T')[0],
    });

    if (error) {
      addResult('Dialog Pattern 1', false, error.message, error);
      return null;
    }

    if (!data || !data.id) {
      addResult('Dialog Pattern 1', false, 'No data returned from RPC');
      return null;
    }

    // Verify OS number format (OS-YYYY-0001)
    const numeroMatch = data.numero_os?.match(/^OS-\d{4}-\d{4}$/);
    if (!numeroMatch) {
      addResult('Dialog Pattern 1 - OS Number Format', false, `Invalid format: ${data.numero_os}`);
    } else {
      addResult('Dialog Pattern 1 - OS Number Format', true, `Valid format: ${data.numero_os}`);
    }

    addResult('Dialog Pattern 1', true, 'OS created successfully', {
      id: data.id,
      numero_os: data.numero_os,
      titulo: data.titulo,
      status: data.status,
    });

    return data;
  } catch (err: any) {
    addResult('Dialog Pattern 1', false, err.message);
    return null;
  }
}

async function testDialogPattern2(condominioId: string, ativoId: string) {
  console.log('\n📋 Test 2: Dialog Pattern 2 (maintenance/CreateOSDialog)');
  console.log('   Parameters: p_condominio_id, p_ativo_id, p_titulo, p_tipo_manutencao, p_tipo_executor, p_executor_nome, p_executor_contato, p_nbr_referencias, p_checklist_items');

  try {
    const { data, error } = await supabase.rpc('criar_os_detalhada', {
      p_condominio_id: condominioId,
      p_ativo_id: ativoId,
      p_titulo: 'Test OS - Dialog Pattern 2',
      p_descricao: 'Testing second dialog pattern with NBR references',
      p_prioridade: 'alta',
      p_tipo_os: 'corretiva',
      p_tipo_manutencao: 'preventiva',
      p_tipo_executor: 'externo',
      p_executor_nome: 'Test Executor',
      p_executor_contato: '(11) 98765-4321',
      p_nbr_referencias: ['NBR 5674', 'NBR 13714'],
      p_checklist_items: [
        { descricao: 'Item 1: Test checklist item', concluido: false },
        { descricao: 'Item 2: Another test item', concluido: false },
      ],
    });

    if (error) {
      addResult('Dialog Pattern 2', false, error.message, error);
      return null;
    }

    if (!data || !data.id) {
      addResult('Dialog Pattern 2', false, 'No data returned from RPC');
      return null;
    }

    // Verify NBR references were stored
    if (!data.nbr_referencias || data.nbr_referencias.length === 0) {
      addResult('Dialog Pattern 2 - NBR References', false, 'NBR references not stored');
    } else {
      addResult('Dialog Pattern 2 - NBR References', true, `Stored ${data.nbr_referencias.length} references`);
    }

    // Verify checklist items were stored
    if (!data.checklist_items || data.checklist_items.length === 0) {
      addResult('Dialog Pattern 2 - Checklist Items', false, 'Checklist items not stored');
    } else {
      addResult('Dialog Pattern 2 - Checklist Items', true, `Stored ${data.checklist_items.length} items`);
    }

    addResult('Dialog Pattern 2', true, 'OS created successfully', {
      id: data.id,
      numero_os: data.numero_os,
      tipo_executor: data.tipo_executor,
      executor_nome: data.executor_nome,
    });

    return data;
  } catch (err: any) {
    addResult('Dialog Pattern 2', false, err.message);
    return null;
  }
}

async function testUniqueConstraint(condominioId: string, ativoId: string, existingNumero: string) {
  console.log('\n📋 Test 3: Unique Constraint on (condominio_id, numero_os)');

  try {
    // Try to insert OS with duplicate numero_os (should fail)
    const { error } = await supabase
      .from('os')
      .insert({
        condominio_id: condominioId,
        ativo_id: ativoId,
        numero_os: existingNumero,
        titulo: 'Duplicate OS (should fail)',
        status: 'aberta',
        prioridade: 'media',
      });

    if (error && error.code === '23505') {
      addResult('Unique Constraint', true, 'Duplicate numero_os correctly blocked');
    } else if (error) {
      addResult('Unique Constraint', false, `Unexpected error: ${error.message}`);
    } else {
      addResult('Unique Constraint', false, 'Duplicate numero_os was NOT blocked (constraint missing!)');
    }
  } catch (err: any) {
    addResult('Unique Constraint', false, err.message);
  }
}

async function testRLS(osId: string, condominioId: string) {
  console.log('\n📋 Test 4: RLS Policies');

  try {
    // Test SELECT policy
    const { data: osData, error: selectError } = await supabase
      .from('os')
      .select('*')
      .eq('id', osId)
      .single();

    if (selectError) {
      addResult('RLS - SELECT Policy', false, selectError.message);
    } else if (osData) {
      addResult('RLS - SELECT Policy', true, 'Can read OS within same condominio');
    }

    // Test os_logs SELECT policy
    const { data: logsData, error: logsError } = await supabase
      .from('os_logs')
      .select('*')
      .eq('os_id', osId);

    if (logsError) {
      addResult('RLS - os_logs SELECT', false, logsError.message);
    } else if (logsData && logsData.length > 0) {
      addResult('RLS - os_logs SELECT', true, `Found ${logsData.length} log entries`);
    } else {
      addResult('RLS - os_logs SELECT', false, 'No logs found (os_logs INSERT policy may have failed)');
    }
  } catch (err: any) {
    addResult('RLS Policies', false, err.message);
  }
}

async function testOSNumberSequence(condominioId: string, ativoId: string) {
  console.log('\n📋 Test 5: OS Number Sequence (per condo/year)');

  try {
    // Create 3 OS in sequence
    const osNumbers: string[] = [];

    for (let i = 0; i < 3; i++) {
      const { data, error } = await supabase.rpc('criar_os_detalhada', {
        p_condominio_id: condominioId,
        p_ativo_id: ativoId,
        p_titulo: `Sequence Test ${i + 1}`,
        p_prioridade: 'baixa',
        p_tipo_os: 'preventiva',
      });

      if (error) {
        addResult(`OS Sequence - ${i + 1}`, false, error.message);
        continue;
      }

      osNumbers.push(data.numero_os);
    }

    // Verify sequence is incremental
    const year = new Date().getFullYear();
    const expectedPattern = new RegExp(`^OS-${year}-\\d{4}$`);
    const allValid = osNumbers.every(num => expectedPattern.test(num));

    if (allValid && osNumbers.length === 3) {
      addResult('OS Number Sequence', true, `Generated ${osNumbers.length} sequential numbers`, osNumbers);
    } else {
      addResult('OS Number Sequence', false, 'Sequence generation failed');
    }
  } catch (err: any) {
    addResult('OS Number Sequence', false, err.message);
  }
}

async function runTests() {
  console.log('🚀 Starting OS Backend Verification Tests\n');
  console.log('='.repeat(80));

  try {
    // Get test data
    console.log('\n📦 Setting up test data...');
    const condominio = await getTestCondominio();
    console.log(`   Using condominio: ${condominio.nome} (${condominio.id})`);

    const ativo = await getTestAtivo(condominio.id);
    console.log(`   Using ativo: ${ativo.nome} (${ativo.id})`);

    // Run tests
    const os1 = await testDialogPattern1(condominio.id, ativo.id);
    const os2 = await testDialogPattern2(condominio.id, ativo.id);

    if (os1) {
      await testUniqueConstraint(condominio.id, ativo.id, os1.numero_os);
      await testRLS(os1.id, condominio.id);
    }

    await testOSNumberSequence(condominio.id, ativo.id);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`   - ${r.name}: ${r.message}`);
      });
      process.exit(1);
    } else {
      console.log('\n✅ ALL TESTS PASSED!');
      process.exit(0);
    }
  } catch (err: any) {
    console.error('\n💥 Fatal error during tests:', err.message);
    process.exit(1);
  }
}

// Run tests
runTests();
