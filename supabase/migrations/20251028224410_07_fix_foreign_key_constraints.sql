/*
  # Fix Foreign Key Constraints for Safe User Deletion
  
  Updates foreign key constraints on os table to allow safe user deletion
  without breaking service orders.
*/

-- Fix os.executante_id constraint
ALTER TABLE public.os 
DROP CONSTRAINT IF EXISTS os_executante_id_fkey;

ALTER TABLE public.os
ADD CONSTRAINT os_executante_id_fkey 
FOREIGN KEY (executante_id) 
REFERENCES public.usuarios(id) 
ON DELETE SET NULL;

-- Fix os.solicitante_id constraint
ALTER TABLE public.os 
DROP CONSTRAINT IF EXISTS os_solicitante_id_fkey;

ALTER TABLE public.os
ADD CONSTRAINT os_solicitante_id_fkey 
FOREIGN KEY (solicitante_id) 
REFERENCES public.usuarios(id) 
ON DELETE SET NULL;

-- Fix os.validado_por constraint
ALTER TABLE public.os 
DROP CONSTRAINT IF EXISTS os_validado_por_fkey;

ALTER TABLE public.os
ADD CONSTRAINT os_validado_por_fkey 
FOREIGN KEY (validado_por) 
REFERENCES public.usuarios(id) 
ON DELETE SET NULL;

-- Add missing cidade column to condominios if not exists
ALTER TABLE public.condominios 
ADD COLUMN IF NOT EXISTS cidade TEXT;
