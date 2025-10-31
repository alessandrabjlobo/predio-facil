// src/components/CondominioSwitcher.tsx
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMeusCondominios } from "@/hooks/useMeusCondominios";
import { useEffect, useMemo, useState } from "react";
import { getCurrentCondominioId, setCurrentCondominioId } from "@/lib/tenant";

export function CondominioSwitcher() {
  const { lista, isLoading, setPrincipal } = useMeusCondominios();

  // id atualmente selecionado via localStorage (responde na hora)
  const [selectedId, setSelectedId] = useState<string | null>(getCurrentCondominioId());
  const [open, setOpen] = useState(false);

  // fallback para principal quando não há nada salvo
  const principal = useMemo(() => lista?.find((c: any) => c.is_principal), [lista]);

  useEffect(() => {
    if (!selectedId && principal?.condominio_id) {
      setSelectedId(principal.condominio_id);
      setCurrentCondominioId(principal.condominio_id);
    }
  }, [principal, selectedId]);

  const condominioAtual = useMemo(() => {
    const viaSelecionado = lista?.find((i: any) => i.condominio_id === selectedId);
    return viaSelecionado?.condominios ?? principal?.condominios ?? null;
  }, [lista, selectedId, principal]);

  const handleSelect = (condominio_id: string) => {
    // 1) atualiza UI imediatamente e persiste no localStorage
    setSelectedId(condominio_id);
    setCurrentCondominioId(condominio_id);
    setOpen(false);

    // 2) avisa o app para refetch onde necessário
    window.dispatchEvent(new Event("condominio:changed"));

    // 3) opcional: mantém compatibilidade com “principal” no banco
    //    (se as policies estiverem ok e você quiser refletir lá)
    // setPrincipal.mutate(condominio_id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {isLoading ? "Carregando..." : (condominioAtual?.nome ?? "Selecione um condomínio")}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar condomínio..." />
          <CommandEmpty>Nenhum condomínio encontrado.</CommandEmpty>
          <CommandGroup>
            {lista?.map((item: any) => (
              <CommandItem
                key={item.condominio_id}
                value={item.condominios?.nome}
                onSelect={() => handleSelect(item.condominio_id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    (item.condominio_id === selectedId) ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.condominios?.nome}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
