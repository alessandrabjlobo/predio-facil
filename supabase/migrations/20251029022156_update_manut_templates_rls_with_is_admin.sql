/*
  # Update RLS policies for manut_templates to use is_admin()

  1. Security Changes
    - Drop existing admin policies
    - Create new policies using is_admin() function
    - SELECT: Allow all authenticated users to view templates
    - INSERT/UPDATE/DELETE: Restrict to admin users only

  2. Policies
    - "Anyone authenticated can view templates" (SELECT) - All authenticated users
    - "Admin can insert templates" (INSERT) - Admin only
    - "Admin can update templates" (UPDATE) - Admin only
    - "Admin can delete templates" (DELETE) - Admin only

  Important: Idempotent - uses DROP IF EXISTS before creating
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Todos podem ver templates de manutenção" ON public.manut_templates;
DROP POLICY IF EXISTS "Admins podem inserir templates" ON public.manut_templates;
DROP POLICY IF EXISTS "Admins podem atualizar templates" ON public.manut_templates;
DROP POLICY IF EXISTS "Admins podem deletar templates" ON public.manut_templates;

-- Create new policies using is_admin()
CREATE POLICY "Anyone authenticated can view templates"
  ON public.manut_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert templates"
  ON public.manut_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can update templates"
  ON public.manut_templates
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin can delete templates"
  ON public.manut_templates
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
