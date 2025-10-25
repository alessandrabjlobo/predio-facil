-- Corrigir a foreign key da tabela user_roles
-- A tabela user_roles deve referenciar usuarios(id) e não auth.users(id)

-- Primeiro, remover a constraint antiga
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Adicionar a nova constraint correta que referencia a tabela usuarios
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.usuarios(id) 
ON DELETE CASCADE;

-- Adicionar um índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Verificar que a função has_role_auth está correta (ela já está correta)
-- Ela faz JOIN entre user_roles e usuarios usando user_id = usuarios.id
-- e filtra por auth_user_id