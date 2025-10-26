-- Adicionar campos de executor à tabela os
ALTER TABLE os ADD COLUMN IF NOT EXISTS tipo_executor text CHECK (tipo_executor IN ('interno', 'externo'));
ALTER TABLE os ADD COLUMN IF NOT EXISTS executor_cnpj text;
ALTER TABLE os ADD COLUMN IF NOT EXISTS executor_empresa text;