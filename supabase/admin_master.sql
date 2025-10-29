-- ============================================================================
-- ADMIN MASTER USER SETUP - FULLY IDEMPOTENT WITH MERGE-STYLE UPSERT
-- ============================================================================
--
-- This script creates/links the admin master user:
-- Email: alessandrabastojansen@gmail.com
-- Password: Vl2301;; (must be changed in production)
--
-- Requirements:
-- 1. User must exist in auth.users (create via Dashboard or Service Role script)
-- 2. Script is fully idempotent and defensive (safe to rerun)
-- 3. Uses SELECT + INSERT/UPDATE pattern (MERGE-style upsert)
-- 4. Handles missing tables/columns gracefully with NOTICE messages
--
-- Note: We use 'admin' role (app_role enum), not 'admin_master'
-- ============================================================================

DO $$
DECLARE
  v_auth_user_id UUID;
  v_user_id UUID;
  v_user_email TEXT := 'alessandrabastojansen@gmail.com';
  v_user_nome TEXT := 'Alessandra Basto Jansen';
  v_exists BOOLEAN;
BEGIN
  -- ============================================================================
  -- STEP 1: Resolve auth_user_id from auth.users
  -- ============================================================================

  BEGIN
    SELECT id INTO v_auth_user_id
    FROM auth.users
    WHERE email = v_user_email
    LIMIT 1;

    IF v_auth_user_id IS NULL THEN
      RAISE NOTICE '❌ Auth user not found: %', v_user_email;
      RAISE NOTICE 'ℹ️  Please create the user first:';
      RAISE NOTICE '    Option 1: Run scripts/create_admin_master.ts (requires Service Role key)';
      RAISE NOTICE '    Option 2: Use Supabase Dashboard → Authentication → Add User';
      RAISE NOTICE '              Email: %', v_user_email;
      RAISE NOTICE '              Password: Vl2301;;';
      RAISE NOTICE '              ☑ Confirm Email: Yes';
      RAISE NOTICE '';
      RAISE NOTICE 'After creating the user, run this script again.';
      RETURN;
    END IF;

    RAISE NOTICE '✓ Found auth user: % (id: %)', v_user_email, v_auth_user_id;

  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE '❌ Table auth.users not accessible';
      RAISE NOTICE 'This script must be run with appropriate permissions';
      RETURN;
  END;

  -- ============================================================================
  -- STEP 2: Upsert into public.usuarios (MERGE-style)
  -- ============================================================================

  BEGIN
    -- Check if user already exists
    SELECT id, (id IS NOT NULL) INTO v_user_id, v_exists
    FROM public.usuarios
    WHERE auth_user_id = v_auth_user_id
    LIMIT 1;

    IF v_exists THEN
      -- User exists, update it
      UPDATE public.usuarios
      SET email = v_user_email,
          nome = v_user_nome
      WHERE id = v_user_id;

      RAISE NOTICE '✓ Updated user profile in public.usuarios (id: %)', v_user_id;
    ELSE
      -- User doesn't exist, insert it
      INSERT INTO public.usuarios (auth_user_id, email, nome)
      VALUES (v_auth_user_id, v_user_email, v_user_nome)
      RETURNING id INTO v_user_id;

      RAISE NOTICE '✓ Created user profile in public.usuarios (id: %)', v_user_id;
    END IF;

  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE '❌ Table public.usuarios not found';
      RAISE NOTICE 'See docs/mapping_needed.md for schema information';
      RETURN;
    WHEN undefined_column THEN
      RAISE NOTICE '❌ Column mismatch in public.usuarios';
      RAISE NOTICE 'See docs/mapping_needed.md for schema information';
      RETURN;
  END;

  -- ============================================================================
  -- STEP 3: Assign admin role in public.user_roles (MERGE-style)
  -- ============================================================================

  BEGIN
    -- Check if role already exists
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = v_user_id
      AND role = 'admin'::app_role
    ) INTO v_exists;

    IF NOT v_exists THEN
      -- Role doesn't exist, insert it
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user_id, 'admin'::app_role);

      RAISE NOTICE '✓ Assigned role ''admin'' in public.user_roles';
    ELSE
      RAISE NOTICE '✓ Role ''admin'' already exists in public.user_roles';
    END IF;

  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE '❌ Table public.user_roles not found';
      RAISE NOTICE 'See docs/mapping_needed.md for schema information';
      RETURN;
    WHEN undefined_column THEN
      RAISE NOTICE '❌ Column mismatch in public.user_roles';
      RAISE NOTICE 'See docs/mapping_needed.md for schema information';
      RETURN;
    WHEN invalid_text_representation THEN
      RAISE NOTICE '❌ Role ''admin'' not valid for app_role enum';
      RAISE NOTICE 'See docs/mapping_needed.md for enum values';
      RETURN;
  END;

  -- ============================================================================
  -- STEP 4: Check for usuarios.papel column (non-breaking flag)
  -- ============================================================================

  BEGIN
    -- Attempt to set papel to 'admin_master' if column exists
    -- This is a non-breaking flag for future use
    EXECUTE format('UPDATE public.usuarios SET papel = %L WHERE id = %L',
                   'admin_master', v_user_id);

    RAISE NOTICE '✓ Set papel = ''admin_master'' in public.usuarios (optional flag)';

  EXCEPTION
    WHEN undefined_column THEN
      RAISE NOTICE 'ℹ️  Column usuarios.papel does not exist (this is expected)';
      RAISE NOTICE 'Role assignment completed via user_roles table only';
    WHEN invalid_text_representation THEN
      RAISE NOTICE 'ℹ️  Column usuarios.papel exists but does not accept ''admin_master'' (enum constraint)';
      RAISE NOTICE 'This is expected. See docs/mapping_needed.md for recommendations.';
  END;

  -- ============================================================================
  -- FINAL SUCCESS MESSAGE
  -- ============================================================================

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✓ Admin master user setup completed successfully!';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'User: % (%)', v_user_email, v_user_nome;
  RAISE NOTICE 'Auth ID: %', v_auth_user_id;
  RAISE NOTICE 'Profile ID: %', v_user_id;
  RAISE NOTICE 'Role: admin';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  SECURITY REMINDER:';
  RAISE NOTICE 'Change the password in PRODUCTION immediately!';
  RAISE NOTICE 'Default password is for initial setup only.';
  RAISE NOTICE '============================================================';

END $$;
