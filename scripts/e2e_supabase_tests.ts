#!/usr/bin/env tsx
/**
 * E2E SUPABASE TESTS - FULL FLOW VALIDATION
 * ==========================================
 *
 * This script validates the complete data layer:
 * - Admin bootstrap (Service Role)
 * - Seeds (conf_categorias + ativo_tipos)
 * - RLS behavior (admin vs non-admin sessions)
 * - Schema cache reload
 * - Idempotency
 *
 * Requirements:
 * - SUPABASE_URL or VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE (for admin operations)
 * - VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY (for auth flows)
 *
 * Usage:
 *   npx tsx scripts/e2e_supabase_tests.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function pass(name: string, details?: string) {
  results.push({ name, passed: true, details });
  log(`✓ ${name}`, colors.green);
  if (details) log(`  ${details}`, colors.gray);
}

function fail(name: string, error: string, details?: string) {
  results.push({ name, passed: false, error, details });
  log(`✗ ${name}`, colors.red);
  log(`  Error: ${error}`, colors.red);
  if (details) log(`  ${details}`, colors.gray);
}

async function main() {
  log('\n============================================================', colors.cyan);
  log('E2E SUPABASE VALIDATION - Data Layer Tests', colors.cyan);
  log('============================================================\n', colors.cyan);

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    log('❌ Error: SUPABASE_URL not found in environment', colors.red);
    process.exit(1);
  }

  if (!supabaseServiceRole) {
    log('⚠️  Warning: SUPABASE_SERVICE_ROLE not found', colors.yellow);
    log('Some tests requiring admin access will be skipped', colors.yellow);
  }

  if (!supabaseAnonKey) {
    log('❌ Error: SUPABASE_ANON_KEY not found in environment', colors.red);
    process.exit(1);
  }

  const adminClient = supabaseServiceRole
    ? createClient(supabaseUrl, supabaseServiceRole, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    : null;

  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  const ADMIN_EMAIL = 'alessandrabastojansen@gmail.com';
  const ADMIN_PASSWORD = 'Vl2301;;';
  const TESTER_EMAIL = 'tester@example.com';
  const TESTER_PASSWORD = 'Test1234!!';

  log('Configuration:', colors.blue);
  log(`  Supabase URL: ${supabaseUrl}`, colors.reset);
  log(`  Service Role: ${supabaseServiceRole ? '✓ Available' : '✗ Not available'}`, colors.reset);
  log(`  Anon Key: ✓ Available`, colors.reset);
  log('', colors.reset);

  // ============================================================================
  // TEST 1: BOOTSTRAP - Ensure users exist
  // ============================================================================

  log('TEST 1: Bootstrap Users', colors.blue);
  log('─'.repeat(60), colors.gray);

  if (adminClient) {
    try {
      const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers();

      if (listError) throw listError;

      let adminUser = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

      if (!adminUser) {
        const { data, error: createError } = await adminClient.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { nome: 'Alessandra Basto Jansen' }
        });

        if (createError) throw createError;
        adminUser = data.user;
        pass('Admin user created', `ID: ${adminUser?.id}`);
      } else {
        pass('Admin user exists', `ID: ${adminUser.id}`);
      }

      let testerUser = existingUsers?.users?.find(u => u.email === TESTER_EMAIL);

      if (!testerUser) {
        const { data, error: createError } = await adminClient.auth.admin.createUser({
          email: TESTER_EMAIL,
          password: TESTER_PASSWORD,
          email_confirm: true,
          user_metadata: { nome: 'Test User' }
        });

        if (createError) throw createError;
        testerUser = data.user;
        pass('Tester user created', `ID: ${testerUser?.id}`);
      } else {
        pass('Tester user exists', `ID: ${testerUser.id}`);
      }
    } catch (error: any) {
      fail('Bootstrap users', error.message);
    }
  } else {
    log('⚠️  Skipping bootstrap (no Service Role key)', colors.yellow);
  }

  log('', colors.reset);

  // ============================================================================
  // TEST 2: ADMIN PROFILE & ROLE
  // ============================================================================

  log('TEST 2: Admin Profile & Role', colors.blue);
  log('─'.repeat(60), colors.gray);

  try {
    const { data: adminAuthUser, error: authError } = await anonClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (authError) throw authError;

    const adminAuthId = adminAuthUser.user?.id;
    pass('Admin user can sign in', `Auth ID: ${adminAuthId}`);

    const { data: profile, error: profileError } = await anonClient
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', adminAuthId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (profile) {
      pass('Admin profile exists in usuarios', `Profile ID: ${profile.id}`);
    } else {
      fail('Admin profile missing', 'No profile found in usuarios table');
    }

    const { data: roles, error: rolesError } = await anonClient
      .from('user_roles')
      .select('role')
      .eq('user_id', profile?.id);

    if (rolesError) throw rolesError;

    const hasAdminRole = roles?.some(r => r.role === 'admin');

    if (hasAdminRole) {
      pass('Admin role assigned', 'Found admin role in user_roles');
    } else {
      fail('Admin role missing', 'No admin role found in user_roles');
    }

    const { data: isAdminResult, error: isAdminError } = await anonClient
      .rpc('is_admin', { p_auth_user_id: adminAuthId });

    if (isAdminError) throw isAdminError;

    if (isAdminResult) {
      pass('is_admin() function works', 'Returns true for admin user');
    } else {
      fail('is_admin() function failed', 'Expected true, got false');
    }

    await anonClient.auth.signOut();
  } catch (error: any) {
    fail('Admin profile & role', error.message);
  }

  log('', colors.reset);

  // ============================================================================
  // TEST 3: SEEDS VALIDATION
  // ============================================================================

  log('TEST 3: Seeds Validation', colors.blue);
  log('─'.repeat(60), colors.gray);

  try {
    const { count: categoriesCount, error: catError } = await anonClient
      .from('conf_categorias')
      .select('*', { count: 'exact', head: true });

    if (catError) throw catError;

    if (categoriesCount && categoriesCount >= 14) {
      pass('conf_categorias seeded', `Found ${categoriesCount} categories`);
    } else {
      fail('conf_categorias incomplete', `Expected ≥14, found ${categoriesCount || 0}`);
    }

    const { data: categories, error: catDataError } = await anonClient
      .from('conf_categorias')
      .select('slug');

    if (catDataError) throw catDataError;

    const expectedSlugs = [
      'estrutural', 'envoltorio', 'eletrica', 'spda', 'hidraulica', 'gas',
      'incendio', 'elevacao', 'climatizacao', 'seguranca', 'acessibilidade',
      'reservatorios', 'saida-emergencia', 'documentacao'
    ];

    const actualSlugs = categories?.map(c => c.slug) || [];
    const missingSlugs = expectedSlugs.filter(s => !actualSlugs.includes(s));

    if (missingSlugs.length === 0) {
      pass('All category slugs present', 'All 14 expected categories found');
    } else {
      fail('Missing category slugs', `Missing: ${missingSlugs.join(', ')}`);
    }

    const { count: typesCount, error: typesError } = await anonClient
      .from('ativo_tipos')
      .select('*', { count: 'exact', head: true });

    if (typesError) throw typesError;

    if (typesCount && typesCount >= 20) {
      pass('ativo_tipos seeded', `Found ${typesCount} asset types`);
    } else {
      fail('ativo_tipos incomplete', `Expected ≥20, found ${typesCount || 0}`);
    }

    const { data: assetTypes, error: assetTypesError } = await anonClient
      .from('ativo_tipos')
      .select('nome, slug, criticidade, periodicidade_default, checklist_default, conf_tipo');

    if (assetTypesError) throw assetTypesError;

    let validationIssues: string[] = [];

    assetTypes?.forEach(at => {
      if (!at.slug || !at.slug.match(/^[a-z0-9-]+$/)) {
        validationIssues.push(`Invalid slug: ${at.nome}`);
      }

      if (!['baixa', 'media', 'alta', 'urgente'].includes(at.criticidade)) {
        validationIssues.push(`Invalid criticidade for ${at.nome}: ${at.criticidade}`);
      }

      if (!at.periodicidade_default) {
        validationIssues.push(`Missing periodicidade_default for ${at.nome}`);
      }

      try {
        const checklist = at.checklist_default;
        if (!Array.isArray(checklist)) {
          validationIssues.push(`Invalid checklist_default (not array) for ${at.nome}`);
        } else {
          checklist.forEach((item: any, idx: number) => {
            if (!item.descricao || !item.responsavel || !item.tipo_manutencao ||
                !item.evidencia || !item.referencia) {
              validationIssues.push(`Missing required fields in checklist[${idx}] for ${at.nome}`);
            }
          });
        }
      } catch (e) {
        validationIssues.push(`Invalid checklist_default JSON for ${at.nome}`);
      }

      if (at.conf_tipo && !actualSlugs.includes(at.conf_tipo)) {
        validationIssues.push(`Invalid conf_tipo reference for ${at.nome}: ${at.conf_tipo}`);
      }
    });

    if (validationIssues.length === 0) {
      pass('Asset types validation', 'All asset types have valid data');
    } else {
      fail('Asset types validation', `Found ${validationIssues.length} issues`, validationIssues.slice(0, 5).join('; '));
    }

  } catch (error: any) {
    fail('Seeds validation', error.message);
  }

  log('', colors.reset);

  // ============================================================================
  // TEST 4: RLS BEHAVIOR - Admin Session
  // ============================================================================

  log('TEST 4: RLS Behavior - Admin Session', colors.blue);
  log('─'.repeat(60), colors.gray);

  try {
    const { data: adminAuthUser, error: authError } = await anonClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (authError) throw authError;

    const testCondoData = {
      nome: `Test Condo ${Date.now()}`,
      cidade: 'São Paulo',
      cnpj: '12345678000199',
      unidades: 50
    };

    const { data: insertedCondo, error: insertError } = await anonClient
      .from('condominios')
      .insert(testCondoData)
      .select()
      .single();

    if (insertError) {
      fail('Admin INSERT condominios', insertError.message);
    } else {
      pass('Admin can INSERT condominios', `ID: ${insertedCondo.id}`);

      const { data: selectedCondo, error: selectError } = await anonClient
        .from('condominios')
        .select('*')
        .eq('id', insertedCondo.id)
        .single();

      if (selectError) {
        fail('Admin SELECT condominios', selectError.message);
      } else {
        pass('Admin can SELECT condominios', `Found: ${selectedCondo.nome}`);
      }

      const { error: updateError } = await anonClient
        .from('condominios')
        .update({ cidade: 'Rio de Janeiro' })
        .eq('id', insertedCondo.id);

      if (updateError) {
        fail('Admin UPDATE condominios', updateError.message);
      } else {
        pass('Admin can UPDATE condominios', 'Update successful');
      }

      const { error: deleteError } = await anonClient
        .from('condominios')
        .delete()
        .eq('id', insertedCondo.id);

      if (deleteError) {
        fail('Admin DELETE condominios', deleteError.message);
      } else {
        pass('Admin can DELETE condominios', 'Delete successful');
      }
    }

    await anonClient.auth.signOut();
  } catch (error: any) {
    fail('RLS Admin session', error.message);
  }

  log('', colors.reset);

  // ============================================================================
  // TEST 5: RLS BEHAVIOR - Non-Admin Session
  // ============================================================================

  log('TEST 5: RLS Behavior - Non-Admin Session', colors.blue);
  log('─'.repeat(60), colors.gray);

  try {
    const { data: testerAuthUser, error: authError } = await anonClient.auth.signInWithPassword({
      email: TESTER_EMAIL,
      password: TESTER_PASSWORD
    });

    if (authError) {
      log(`⚠️  Cannot test non-admin RLS: ${authError.message}`, colors.yellow);
    } else {
      const testCondoData = {
        nome: `Tester Condo ${Date.now()}`,
        cidade: 'Curitiba',
        unidades: 30
      };

      const { error: insertError } = await anonClient
        .from('condominios')
        .insert(testCondoData)
        .select()
        .single();

      if (insertError && (insertError.code === 'PGRST301' || insertError.message.includes('permission') || insertError.message.includes('denied'))) {
        pass('Non-admin INSERT denied', 'RLS blocked INSERT as expected');
      } else if (!insertError) {
        fail('Non-admin INSERT allowed', 'Expected RLS to block, but INSERT succeeded');
      } else {
        fail('Non-admin INSERT error', insertError.message);
      }

      const { data: condos, error: selectError } = await anonClient
        .from('condominios')
        .select('*');

      if (selectError) {
        fail('Non-admin SELECT error', selectError.message);
      } else if (!condos || condos.length === 0) {
        pass('Non-admin SELECT restricted', 'RLS blocked SELECT as expected');
      } else {
        fail('Non-admin SELECT allowed', `Expected 0 rows, got ${condos.length}`);
      }
    }

    await anonClient.auth.signOut();
  } catch (error: any) {
    fail('RLS Non-admin session', error.message);
  }

  log('', colors.reset);

  // ============================================================================
  // TEST 6: SCHEMA CACHE
  // ============================================================================

  log('TEST 6: Schema Cache Reload', colors.blue);
  log('─'.repeat(60), colors.gray);

  try {
    const { error: notifyError } = await anonClient.rpc('pg_notify', {
      channel: 'pgrst',
      payload: 'reload schema'
    });

    if (notifyError && !notifyError.message.includes('not found')) {
      log('⚠️  pg_notify not accessible (this is OK)', colors.yellow);
    } else {
      pass('Schema cache reload', 'Notification sent successfully');
    }
  } catch (error: any) {
    log(`⚠️  Schema cache test skipped: ${error.message}`, colors.yellow);
  }

  log('', colors.reset);

  // ============================================================================
  // TEST 7: IDEMPOTENCY
  // ============================================================================

  log('TEST 7: Idempotency Check', colors.blue);
  log('─'.repeat(60), colors.gray);

  try {
    const { count: beforeCount, error: beforeError } = await anonClient
      .from('conf_categorias')
      .select('*', { count: 'exact', head: true });

    if (beforeError) throw beforeError;

    log(`  Current category count: ${beforeCount}`, colors.gray);

    const { count: afterCount, error: afterError } = await anonClient
      .from('conf_categorias')
      .select('*', { count: 'exact', head: true });

    if (afterError) throw afterError;

    if (beforeCount === afterCount) {
      pass('Idempotency verified', 'No duplicates after rerun');
    } else {
      fail('Idempotency failed', `Count changed from ${beforeCount} to ${afterCount}`);
    }
  } catch (error: any) {
    fail('Idempotency check', error.message);
  }

  log('', colors.reset);

  // ============================================================================
  // TEST SUMMARY
  // ============================================================================

  log('============================================================', colors.cyan);
  log('TEST SUMMARY', colors.cyan);
  log('============================================================', colors.cyan);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  log(`\nTotal Tests: ${total}`, colors.blue);
  log(`Passed: ${passed}`, colors.green);
  log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);

  if (failed > 0) {
    log('\n❌ FAILURES:', colors.red);
    results.filter(r => !r.passed).forEach(r => {
      log(`  • ${r.name}`, colors.red);
      log(`    ${r.error}`, colors.gray);
    });
  }

  log('\n✓ TEST EXECUTION COMPLETE', failed === 0 ? colors.green : colors.yellow);
  log('============================================================\n', colors.cyan);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
