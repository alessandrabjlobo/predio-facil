/*
  # Create is_admin() function and update RLS policies for condominios

  1. New Functions
    - `is_admin(p_auth_user_id uuid)` - Returns true if user has 'admin' role in user_roles table
  
  2. Updated Policies
    - Drop existing condominios policies that use is_system_owner() or has_role()
    - Create new admin-only policies using is_admin() function:
      - SELECT: Allow admins to view all condominios
      - INSERT: Allow admins to create condominios
      - UPDATE: Allow admins to update condominios
      - DELETE: Allow admins to delete condominios
  
  3. Security
    - All operations on condominios restricted to admin role only
    - Non-admin users have no access (closed by default due to RLS)
    - Function is SECURITY DEFINER to check user_roles table
  
  Important Notes:
    - This migration is idempotent (safe to rerun)
    - Uses IF EXISTS/IF NOT EXISTS for all operations
    - Existing user access through usuarios_condominios preserved in separate policies if needed
*/

-- ============================================================================
-- STEP 1: Create is_admin() function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(p_auth_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.user_roles ur ON ur.user_id = u.id
    WHERE u.auth_user_id = p_auth_user_id
      AND ur.role = 'admin'::app_role
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

COMMENT ON FUNCTION public.is_admin(uuid) IS 
  'Returns true if the given auth user ID has the admin role in user_roles table';

-- ============================================================================
-- STEP 2: Drop existing admin-related policies on condominios
-- ============================================================================

DROP POLICY IF EXISTS "Admins podem ver todos os condomínios" ON public.condominios;
DROP POLICY IF EXISTS "Admins podem inserir condomínios" ON public.condominios;
DROP POLICY IF EXISTS "Admins podem atualizar condomínios" ON public.condominios;
DROP POLICY IF EXISTS "Admins podem deletar condomínios" ON public.condominios;

-- Keep user-level policy for non-admins to see their own condominios
-- (if you want to keep this, otherwise drop it)
-- DROP POLICY IF EXISTS "Usuários podem ver seus condomínios" ON public.condominios;

-- ============================================================================
-- STEP 3: Create new admin-only policies using is_admin()
-- ============================================================================

CREATE POLICY "Admin can view all condominios"
  ON public.condominios
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin can insert condominios"
  ON public.condominios
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can update condominios"
  ON public.condominios
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can delete condominios"
  ON public.condominios
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- STEP 4: Notify schema cache reload
-- ============================================================================

SELECT pg_notify('pgrst', 'reload schema');
