-- Adicionar políticas RLS para UPDATE e DELETE em ativos (apenas síndicos e admins)

-- Política para UPDATE em ativos
CREATE POLICY "Síndicos e admins podem atualizar ativos"
ON public.ativos
FOR UPDATE
USING (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND uc.papel IN ('sindico', 'admin')
  )
);

-- Política para DELETE em ativos
CREATE POLICY "Síndicos e admins podem excluir ativos"
ON public.ativos
FOR DELETE
USING (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND uc.papel IN ('sindico', 'admin')
  )
);