-- FASE 1: CORREÇÃO DO BUG DE UPDATE EM CONFORMIDADE_ITENS

-- Adicionar política RLS de UPDATE para conformidade_itens
CREATE POLICY "Síndicos, zeladores e admins podem atualizar conformidade"
ON public.conformidade_itens
FOR UPDATE
USING (
  condominio_id IN (
    SELECT uc.condominio_id
    FROM usuarios_condominios uc
    JOIN usuarios u ON uc.usuario_id = u.id
    WHERE u.auth_user_id = auth.uid()
    AND uc.papel IN ('sindico', 'zelador', 'admin')
  )
);