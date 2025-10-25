-- Adicionar campos específicos para extintores de incêndio
ALTER TABLE ativos 
ADD COLUMN IF NOT EXISTS extintor_tipo TEXT,
ADD COLUMN IF NOT EXISTS extintor_capacidade TEXT,
ADD COLUMN IF NOT EXISTS validade_carga DATE,
ADD COLUMN IF NOT EXISTS validade_teste_hidrostatico DATE,
ADD COLUMN IF NOT EXISTS zona_localizacao TEXT;