-- ==========================================
-- FIX: Infinite recursion in RLS policies
-- ==========================================

-- 1. DROP políticas problemáticas em usuarios
DROP POLICY IF EXISTS "Admins podem gerenciar todos os usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem SELECT todos os usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem UPDATE todos os usuários" ON public.usuarios;
DROP POLICY IF EXISTS "Admins podem DELETE todos os usuários" ON public.usuarios;

-- 2. RECRIAR políticas em usuarios usando has_role_auth()
CREATE POLICY "Admins podem SELECT todos os usuários"
ON public.usuarios
FOR SELECT
USING (public.has_role_auth(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem UPDATE todos os usuários"
ON public.usuarios
FOR UPDATE
USING (public.has_role_auth(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role_auth(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem DELETE todos os usuários"
ON public.usuarios
FOR DELETE
USING (public.has_role_auth(auth.uid(), 'admin'::app_role));

-- 3. DROP políticas problemáticas em user_roles
DROP POLICY IF EXISTS "Admins podem gerenciar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem SELECT todas as roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem INSERT roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem DELETE roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem UPDATE roles" ON public.user_roles;

-- 4. RECRIAR políticas em user_roles usando has_role_auth()
CREATE POLICY "Admins podem SELECT todas as roles"
ON public.user_roles
FOR SELECT
USING (public.has_role_auth(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem INSERT roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role_auth(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem UPDATE roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role_auth(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role_auth(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem DELETE roles"
ON public.user_roles
FOR DELETE
USING (public.has_role_auth(auth.uid(), 'admin'::app_role));

-- 5. DROP políticas problemáticas em usuarios_condominios
DROP POLICY IF EXISTS "Admins podem gerenciar vínculos" ON public.usuarios_condominios;
DROP POLICY IF EXISTS "Admins podem SELECT todos os vínculos" ON public.usuarios_condominios;
DROP POLICY IF EXISTS "Admins podem INSERT vínculos" ON public.usuarios_condominios;
DROP POLICY IF EXISTS "Admins podem UPDATE vínculos" ON public.usuarios_condominios;
DROP POLICY IF EXISTS "Admins podem DELETE vínculos" ON public.usuarios_condominios;

-- 6. RECRIAR políticas em usuarios_condominios usando has_role_auth()
CREATE POLICY "Admins podem SELECT todos os vínculos"
ON public.usuarios_condominios
FOR SELECT
USING (public.has_role_auth(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem INSERT vínculos"
ON public.usuarios_condominios
FOR INSERT
WITH CHECK (public.has_role_auth(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem UPDATE vínculos"
ON public.usuarios_condominios
FOR UPDATE
USING (public.has_role_auth(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role_auth(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem DELETE vínculos"
ON public.usuarios_condominios
FOR DELETE
USING (public.has_role_auth(auth.uid(), 'admin'::app_role));

-- 7. Garantir política para usuários editarem seus próprios vínculos
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