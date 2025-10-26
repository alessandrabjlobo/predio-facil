-- Corrigir as views existentes para usar security_invoker
ALTER VIEW ativo_historico_manutencao SET (security_invoker = on);
ALTER VIEW conformidade_historico_auditoria SET (security_invoker = on);