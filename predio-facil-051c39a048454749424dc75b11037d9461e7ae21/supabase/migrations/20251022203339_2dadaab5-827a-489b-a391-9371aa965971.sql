-- Remover política antiga que pode estar causando conflito
DROP POLICY IF EXISTS "Admins podem criar relações usuário-condomínio" ON usuarios_condominios;

-- Garantir que a política via has_role_auth permite qualquer usuário autenticado
-- (a função has_role_auth já faz a verificação interna)
DROP POLICY IF EXISTS "Admins podem criar relacoes via has_role_auth" ON usuarios_condominios;

CREATE POLICY "Admins podem criar vinculos de usuarios em condominios"
ON usuarios_condominios 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role_auth(auth.uid(), 'admin'::app_role)
);