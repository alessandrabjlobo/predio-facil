// src/components/CondominioSwitcher.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMeusCondominios } from "@/hooks/useMeusCondominios";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { useMemo } from "react";
// (opcional) se você usa react-query internamente nos hooks
import { useQueryClient } from "@tanstack/react-query";

export const CondominioSwitcher = () => {
  const { lista, isLoading, setPrincipal, isError } = useMeusCondominios();
  const { condominio } = useCondominioAtual();
  const queryClient = useQueryClient();

  // id atual: prioriza do contexto; fallback para o marcado como principal na lista
  const currentId = useMemo(() => {
    if (condominio?.id) return condominio.id;
    const principal = (lista || []).find((l: any) => l.is_principal);
    return principal?.condominio_id ?? principal?.condominios?.id ?? "";
  }, [condominio?.id, lista]);

  if (isLoading) {
    return (
      <div className="min-w-[220px] h-9 inline-flex items-center justify-center text-xs text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (isError || !lista || lista.length === 0) {
    return (
      <div className="min-w-[220px] h-9 inline-flex items-center justify-center text-xs text-red-600">
        Erro ao carregar condomínios
      </div>
    );
  }

  const onlyOne = lista.length === 1;

  return (
    <div className="min-w-[220px]">
      <Select
        value={currentId || undefined}
        onValueChange={(value) => {
          // Atualiza o principal no backend
          setPrincipal.mutate(value, {
            onSuccess: async () => {
              // ❗️OPÇÃO A (recomendada): invalidar caches que dependem do condomínio
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["meus-condominios"] }),
                queryClient.invalidateQueries({ queryKey: ["condominio-atual"] }),
                queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
                queryClient.invalidateQueries({ queryKey: ["os"] }),
                queryClient.invalidateQueries({ queryKey: ["ativos"] }),
                queryClient.invalidateQueries({ queryKey: ["manutencoes"] }),
              ]);

              // Se o seu useCondominioAtual não re-lê sozinho o principal,
              // você pode forçar um refresh suave:
              // window.location.reload();
            },
          });
        }}
        disabled={onlyOne}
      >
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder="Selecionar condomínio" />
        </SelectTrigger>
        <SelectContent>
          {lista.map((item: any) => (
            <SelectItem key={item.condominio_id} value={item.condominio_id}>
              {item.condominios?.nome || "Condomínio"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
