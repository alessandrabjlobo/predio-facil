-- Criar bucket de armazenamento para anexos de manutenções (sem 'ao' no final)
INSERT INTO storage.buckets (id, name, public)
VALUES ('manutencoes', 'manutencoes', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para o bucket manutencoes
CREATE POLICY "Usuários podem fazer upload em manutencoes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'manutencoes' AND
  (storage.foldername(name))[1] IN (
    SELECT m.id::text 
    FROM manutencoes m
    JOIN ativos a ON a.id = m.ativo_id
    JOIN usuarios_condominios uc ON uc.condominio_id = a.condominio_id
    JOIN usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem ver anexos de suas manutenções"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'manutencoes' AND
  (storage.foldername(name))[1] IN (
    SELECT m.id::text 
    FROM manutencoes m
    JOIN ativos a ON a.id = m.ativo_id
    JOIN usuarios_condominios uc ON uc.condominio_id = a.condominio_id
    JOIN usuarios u ON u.id = uc.usuario_id
    WHERE u.auth_user_id = auth.uid()
  )
);