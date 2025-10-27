-- Fix user management RLS policies
-- Allow admins to manage all users and their roles

-- 1. usuarios table: admins can manage all users
DROP POLICY IF EXISTS "Admins podem gerenciar todos os usuários" ON public.usuarios;
CREATE POLICY "Admins podem gerenciar todos os usuários"
ON public.usuarios
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid()
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- 2. user_roles table: admins can manage all roles
DROP POLICY IF EXISTS "Admins podem gerenciar roles" ON public.user_roles;
CREATE POLICY "Admins podem gerenciar roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid()
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- 3. usuarios_condominios table: admins can manage all links
DROP POLICY IF EXISTS "Admins podem gerenciar vínculos" ON public.usuarios_condominios;
CREATE POLICY "Admins podem gerenciar vínculos"
ON public.usuarios_condominios
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid()
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- 4. Allow users to update their own usuarios_condominios (para mudança de principal)
DROP POLICY IF EXISTS "Usuários podem atualizar seus vínculos" ON public.usuarios_condominios;
CREATE POLICY "Usuários podem atualizar seus vínculos"
ON public.usuarios_condominios
FOR UPDATE
USING (
  usuario_id IN (
    SELECT id FROM public.usuarios
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  usuario_id IN (
    SELECT id FROM public.usuarios
    WHERE auth_user_id = auth.uid()
  )
);

-- 5. Create/update trigger to ensure single principal per user
DROP TRIGGER IF EXISTS trg_uc_single_principal ON public.usuarios_condominios;
DROP FUNCTION IF EXISTS public.fn_uc_single_principal();

CREATE OR REPLACE FUNCTION public.fn_uc_single_principal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se marcando como principal, desmarcar todos os outros do mesmo usuário
  IF NEW.is_principal = true THEN
    UPDATE public.usuarios_condominios
    SET is_principal = false
    WHERE usuario_id = NEW.usuario_id
      AND condominio_id != NEW.condominio_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_uc_single_principal
BEFORE INSERT OR UPDATE ON public.usuarios_condominios
FOR EACH ROW
EXECUTE FUNCTION public.fn_uc_single_principal();