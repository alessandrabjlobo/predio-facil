-- Fix foreign key constraints for safe user deletion
-- Update os table foreign key to allow NULL on delete
ALTER TABLE public.os 
  DROP CONSTRAINT IF EXISTS os_executante_id_fkey,
  ADD CONSTRAINT os_executante_id_fkey 
    FOREIGN KEY (executante_id) 
    REFERENCES public.usuarios(id) 
    ON DELETE SET NULL;

ALTER TABLE public.os 
  DROP CONSTRAINT IF EXISTS os_solicitante_id_fkey,
  ADD CONSTRAINT os_solicitante_id_fkey 
    FOREIGN KEY (solicitante_id) 
    REFERENCES public.usuarios(id) 
    ON DELETE SET NULL;

-- Update other tables with usuario references
ALTER TABLE public.conformidade_itens 
  DROP CONSTRAINT IF EXISTS conformidade_itens_executado_por_fkey,
  ADD CONSTRAINT conformidade_itens_executado_por_fkey 
    FOREIGN KEY (executado_por) 
    REFERENCES public.usuarios(id) 
    ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ativos_condominio_id ON public.ativos(condominio_id);
CREATE INDEX IF NOT EXISTS idx_ativos_tipo_id ON public.ativos(tipo_id);
CREATE INDEX IF NOT EXISTS idx_planos_manutencao_condominio_id ON public.planos_manutencao(condominio_id);
CREATE INDEX IF NOT EXISTS idx_planos_manutencao_ativo_id ON public.planos_manutencao(ativo_id);
CREATE INDEX IF NOT EXISTS idx_os_condominio_id ON public.os(condominio_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON public.os(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_condominios_usuario_id ON public.usuarios_condominios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_condominios_condominio_id ON public.usuarios_condominios(condominio_id);