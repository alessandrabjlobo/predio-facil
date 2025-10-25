-- Permitir admins criarem e gerenciarem condomínios
CREATE POLICY "Admins podem criar condomínios"
ON condominios FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins podem atualizar condomínios"
ON condominios FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Permitir admins gerenciarem relações usuários-condomínios
CREATE POLICY "Admins podem criar relações usuário-condomínio"
ON usuarios_condominios FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins podem atualizar relações usuário-condomínio"
ON usuarios_condominios FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins podem deletar relações usuário-condomínio"
ON usuarios_condominios FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Permitir admins visualizarem todos os usuários
CREATE POLICY "Admins podem ver todos os usuários"
ON usuarios FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN usuarios u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid() AND ur.role = 'admin'
  )
);