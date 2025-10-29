#!/usr/bin/env node

/**
 * ADMIN MASTER USER CREATION SCRIPT
 * ==================================
 *
 * This script creates the admin master user in Supabase Auth using the Service Role key.
 *
 * Requirements:
 * - SUPABASE_URL in .env
 * - SUPABASE_SERVICE_ROLE in .env (requires admin privileges)
 *
 * Usage:
 *   npx tsx scripts/create_admin_master.ts
 *   OR
 *   node --loader ts-node/esm scripts/create_admin_master.ts
 *
 * Output:
 *   - Prints auth_user_id to console
 *   - Saves auth_user_id to scripts/.admin_master.json
 *
 * Note: After running this script, execute supabase/admin_master.sql to complete setup
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Admin user credentials
const ADMIN_EMAIL = 'alessandrabastojansen@gmail.com';
const ADMIN_PASSWORD = 'Vl2301;;';
const ADMIN_NAME = 'Alessandra Basto Jansen';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  log('\n============================================================', colors.cyan);
  log('Admin Master User Creation Script', colors.cyan);
  log('============================================================\n', colors.cyan);

  // Check environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl) {
    log('❌ Error: SUPABASE_URL or VITE_SUPABASE_URL not found in environment', colors.red);
    log('Please add it to your .env file', colors.yellow);
    process.exit(1);
  }

  if (!supabaseServiceRole) {
    log('❌ Error: SUPABASE_SERVICE_ROLE not found in environment', colors.red);
    log('', colors.reset);
    log('This script requires the Service Role key for admin operations.', colors.yellow);
    log('', colors.reset);
    log('To obtain the Service Role key:', colors.yellow);
    log('1. Go to your Supabase project dashboard', colors.yellow);
    log('2. Navigate to Settings → API', colors.yellow);
    log('3. Copy the "service_role" key (NOT the anon key)', colors.yellow);
    log('4. Add to .env: SUPABASE_SERVICE_ROLE=your_service_role_key', colors.yellow);
    log('', colors.reset);
    log('⚠️  WARNING: Keep the Service Role key secure. Never commit it to version control.', colors.red);
    log('', colors.reset);
    log('Alternative: Create the user manually via Supabase Dashboard:', colors.blue);
    log('  Authentication → Add User → Email: ' + ADMIN_EMAIL, colors.blue);
    log('  Mark "Confirm Email" checkbox, then run supabase/admin_master.sql', colors.blue);
    process.exit(1);
  }

  log('Configuration:', colors.blue);
  log(`  Supabase URL: ${supabaseUrl}`, colors.reset);
  log(`  Admin Email: ${ADMIN_EMAIL}`, colors.reset);
  log('');

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Check if user already exists
    log('Checking if user already exists...', colors.yellow);

    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      log(`❌ Error checking existing users: ${listError.message}`, colors.red);
      throw listError;
    }

    const existingUser = existingUsers?.users?.find((u) => u.email === ADMIN_EMAIL);

    let authUserId: string;

    if (existingUser) {
      authUserId = existingUser.id;
      log(`✓ User already exists (ID: ${authUserId})`, colors.green);

      // Check if email is confirmed
      if (!existingUser.email_confirmed_at) {
        log('User email not confirmed. Confirming now...', colors.yellow);

        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authUserId,
          { email_confirm: true }
        );

        if (updateError) {
          log(`❌ Error confirming email: ${updateError.message}`, colors.red);
        } else {
          log('✓ Email confirmed', colors.green);
        }
      } else {
        log('✓ Email already confirmed', colors.green);
      }
    } else {
      // Create new user
      log('Creating new user...', colors.yellow);

      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: {
          nome: ADMIN_NAME,
          name: ADMIN_NAME,
        },
      });

      if (createError) {
        log(`❌ Error creating user: ${createError.message}`, colors.red);
        throw createError;
      }

      if (!data.user) {
        throw new Error('User creation succeeded but no user data returned');
      }

      authUserId = data.user.id;
      log(`✓ User created successfully (ID: ${authUserId})`, colors.green);
    }

    // Save auth_user_id to file
    const outputPath = join(process.cwd(), 'scripts', '.admin_master.json');
    const outputData = {
      auth_user_id: authUserId,
      email: ADMIN_EMAIL,
      created_at: new Date().toISOString(),
    };

    writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
    log(`✓ Auth user ID saved to scripts/.admin_master.json`, colors.green);

    // Final instructions
    log('', colors.reset);
    log('============================================================', colors.cyan);
    log('✓ Auth user setup completed successfully!', colors.green);
    log('============================================================', colors.cyan);
    log('', colors.reset);
    log('Next steps:', colors.blue);
    log('1. Run the SQL script to link the user to the database:', colors.reset);
    log('   psql -f supabase/admin_master.sql', colors.yellow);
    log('   OR use Supabase SQL Editor to execute:', colors.yellow);
    log('   supabase/admin_master.sql', colors.yellow);
    log('', colors.reset);
    log('2. Login credentials:', colors.blue);
    log(`   Email: ${ADMIN_EMAIL}`, colors.reset);
    log(`   Password: ${ADMIN_PASSWORD}`, colors.reset);
    log('', colors.reset);
    log('⚠️  IMPORTANT SECURITY NOTICE:', colors.red);
    log('Change the password immediately in PRODUCTION!', colors.red);
    log('Default password is for initial setup only.', colors.red);
    log('============================================================', colors.cyan);
    log('', colors.reset);

  } catch (error) {
    log('', colors.reset);
    log('❌ Script failed with error:', colors.red);
    log(error instanceof Error ? error.message : String(error), colors.red);
    log('', colors.reset);
    log('For manual user creation:', colors.blue);
    log('1. Go to Supabase Dashboard → Authentication → Add User', colors.reset);
    log(`2. Email: ${ADMIN_EMAIL}`, colors.reset);
    log(`3. Password: ${ADMIN_PASSWORD}`, colors.reset);
    log('4. Check "Confirm Email"', colors.reset);
    log('5. Run supabase/admin_master.sql', colors.reset);
    process.exit(1);
  }
}

main();
