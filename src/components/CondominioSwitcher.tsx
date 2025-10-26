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
import { useState } from "react";

export function CondominioSwitcher() {
  const { lista, isLoading, setPrincipal } = useMeusCondominios();
  const [open, setOpen] = useState(false);

  const principal = lista?.find((c: any) => c.is_principal);
  const condominioAtual = principal?.condominios;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {isLoading ? (
              "Carregando..."
            ) : condominioAtual ? (
              condominioAtual.nome
            ) : (
              "Selecione um condomínio"
            )}
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
                onSelect={() => {
                  setPrincipal.mutate(item.condominio_id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    item.is_principal ? "opacity-100" : "opacity-0"
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
