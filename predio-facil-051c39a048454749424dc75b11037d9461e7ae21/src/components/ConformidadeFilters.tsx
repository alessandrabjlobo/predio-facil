import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Filter } from "lucide-react";

interface ConformidadeFiltersProps {
  sistemas: string[];
  sistemaFiltro: string;
  setSistemaFiltro: (value: string) => void;
  statusFiltro: string;
  setStatusFiltro: (value: string) => void;
  ordenacao: string;
  setOrdenacao: (value: string) => void;
}

export const ConformidadeFilters = ({
  sistemas,
  sistemaFiltro,
  setSistemaFiltro,
  statusFiltro,
  setStatusFiltro,
  ordenacao,
  setOrdenacao,
}: ConformidadeFiltersProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sistema">Sistema</Label>
            <Select value={sistemaFiltro} onValueChange={setSistemaFiltro}>
              <SelectTrigger id="sistema">
                <SelectValue placeholder="Todos os sistemas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os sistemas</SelectItem>
                {sistemas.map((sistema) => (
                  <SelectItem key={sistema} value={sistema}>
                    {sistema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="verde">✅ Em Dia</SelectItem>
                <SelectItem value="amarelo">⚠️ Próximas</SelectItem>
                <SelectItem value="vermelho">❌ Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordenacao">Ordenar por</Label>
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger id="ordenacao">
                <SelectValue placeholder="Próximo vencimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proximo">Próximo vencimento</SelectItem>
                <SelectItem value="ultimo">Último executado</SelectItem>
                <SelectItem value="nome">Nome do ativo</SelectItem>
                <SelectItem value="sistema">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
