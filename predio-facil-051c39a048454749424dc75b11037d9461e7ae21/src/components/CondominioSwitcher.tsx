import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMeusCondominios } from "@/hooks/useMeusCondominios";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";

export const CondominioSwitcher = () => {
  const { lista, isLoading, setPrincipal } = useMeusCondominios();
  const { condominio } = useCondominioAtual();

  if (isLoading || !lista || lista.length <= 1) return null;

  const currentId = condominio?.id || lista.find((l: any) => l.is_principal)?.condominios?.id;

  return (
    <div className="min-w-[220px]">
      <Select
        value={currentId}
        onValueChange={(value) => setPrincipal.mutate(value)}
      >
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder="Selecionar condomínio" />
        </SelectTrigger>
        <SelectContent>
          {lista.map((item: any) => (
            <SelectItem key={item.condominio_id} value={item.condominio_id}>
              {item.condominios?.nome || 'Condomínio'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
