-- Função para gerar número sequencial de OS
CREATE OR REPLACE FUNCTION public.generate_os_numero(p_condominio_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ano TEXT := TO_CHAR(NOW(), 'YYYY');
  v_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM os
  WHERE condominio_id = p_condominio_id
    AND EXTRACT(YEAR FROM data_abertura) = EXTRACT(YEAR FROM NOW());
  
  RETURN 'OS-' || v_ano || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$;

-- Adicionar RLS policy para permitir inserção de OS
CREATE POLICY "Síndicos e zeladores podem inserir OS"
ON os
FOR INSERT
TO authenticated
WITH CHECK (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND uc.papel IN ('sindico', 'zelador', 'admin')
  )
);