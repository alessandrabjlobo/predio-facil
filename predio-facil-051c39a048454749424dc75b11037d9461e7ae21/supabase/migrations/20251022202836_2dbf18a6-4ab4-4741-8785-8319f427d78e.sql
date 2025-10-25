-- Permitir admins inserirem relacoes via has_role_auth (robustez)
CREATE POLICY "Admins podem criar relacoes via has_role_auth"
ON usuarios_condominios FOR INSERT TO authenticated
WITH CHECK (has_role_auth(auth.uid(), 'admin'::app_role));

-- Permitir usuários atualizarem suas próprias relações (para trocar condomínio principal)
CREATE POLICY "Usuarios podem atualizar suas proprias relacoes"
ON usuarios_condominios FOR UPDATE TO authenticated
USING (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  usuario_id IN (
    SELECT id FROM usuarios WHERE auth_user_id = auth.uid()
  )
);

-- Garantir unicidade de is_principal por usuario
CREATE OR REPLACE FUNCTION public.ensure_single_principal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_principal IS TRUE THEN
    UPDATE usuarios_condominios
    SET is_principal = FALSE
    WHERE usuario_id = NEW.usuario_id
      AND condominio_id <> NEW.condominio_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_uc_single_principal ON usuarios_condominios;
CREATE TRIGGER trg_uc_single_principal
BEFORE INSERT OR UPDATE ON usuarios_condominios
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_principal();