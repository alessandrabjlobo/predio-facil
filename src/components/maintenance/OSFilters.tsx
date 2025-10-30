import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Calendar } from "lucide-react";
import { useState } from "react";

interface OSFiltersProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (values: string[]) => void;
  onDateRangeChange: (start: string, end: string) => void;
  selectedStatus: string[];
  dateRange: { start: string; end: string };
}

const STATUS_OPTIONS = [
  { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "aguardando_validacao", label: "Aguardando Validação" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

export function OSFilters({
  onSearchChange,
  onStatusChange,
  onDateRangeChange,
  selectedStatus,
  dateRange,
}: OSFiltersProps) {
  const [search, setSearch] = useState("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const toggleStatus = (value: string) => {
    if (selectedStatus.includes(value)) {
      onStatusChange(selectedStatus.filter((v) => v !== value));
    } else {
      onStatusChange([...selectedStatus, value]);
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    onSearchChange("");
    onStatusChange([]);
    onDateRangeChange("", "");
  };

  const hasFilters =
    search || selectedStatus.length > 0 || dateRange.start || dateRange.end;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título do chamado..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value="" onValueChange={toggleStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 items-center">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange(e.target.value, dateRange.end)}
            className="w-[140px]"
            placeholder="Data início"
          />
          <span className="text-muted-foreground">até</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange(dateRange.start, e.target.value)}
            className="w-[140px]"
            placeholder="Data fim"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {selectedStatus.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {selectedStatus.map((s) => (
            <Badge key={s} variant="secondary">
              {STATUS_OPTIONS.find((o) => o.value === s)?.label}
              <button
                onClick={() =>
                  onStatusChange(selectedStatus.filter((v) => v !== s))
                }
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
