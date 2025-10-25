-- Helper function to check role using auth.uid() without causing recursion
CREATE OR REPLACE FUNCTION public.has_role_auth(_auth_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = _auth_user_id
      AND ur.role = _role
  );
$$;

-- Fix recursive policy on usuarios
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON public.usuarios;

CREATE POLICY "Admins podem ver todos os usuários"
ON public.usuarios
FOR SELECT
USING (public.has_role_auth(auth.uid(), 'admin'));