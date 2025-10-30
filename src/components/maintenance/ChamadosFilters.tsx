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
import { Search, X } from "lucide-react";
import { useState } from "react";

interface ChamadosFiltersProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (values: string[]) => void;
  onPrioridadeChange: (values: string[]) => void;
  onCriticidadeChange: (values: string[]) => void;
  selectedStatus: string[];
  selectedPrioridade: string[];
  selectedCriticidade: string[];
}

const STATUS_OPTIONS = [
  { value: "aberto", label: "Aberto" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "fechado", label: "Fechado" },
];

const PRIORIDADE_OPTIONS = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const CRITICIDADE_OPTIONS = [
  { value: "P1", label: "P1 - Crítica" },
  { value: "P2", label: "P2 - Alta" },
  { value: "P3", label: "P3 - Média" },
  { value: "P4", label: "P4 - Baixa" },
];

export function ChamadosFilters({
  onSearchChange,
  onStatusChange,
  onPrioridadeChange,
  onCriticidadeChange,
  selectedStatus,
  selectedPrioridade,
  selectedCriticidade,
}: ChamadosFiltersProps) {
  const [search, setSearch] = useState("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const toggleFilter = (
    value: string,
    selected: string[],
    onChange: (values: string[]) => void
  ) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    onSearchChange("");
    onStatusChange([]);
    onPrioridadeChange([]);
    onCriticidadeChange([]);
  };

  const hasFilters =
    search ||
    selectedStatus.length > 0 ||
    selectedPrioridade.length > 0 ||
    selectedCriticidade.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou categoria..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value=""
          onValueChange={(v) => toggleFilter(v, selectedStatus, onStatusChange)}
        >
          <SelectTrigger className="w-[150px]">
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

        <Select
          value=""
          onValueChange={(v) =>
            toggleFilter(v, selectedPrioridade, onPrioridadeChange)
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            {PRIORIDADE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value=""
          onValueChange={(v) =>
            toggleFilter(v, selectedCriticidade, onCriticidadeChange)
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Criticidade" />
          </SelectTrigger>
          <SelectContent>
            {CRITICIDADE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {(selectedStatus.length > 0 ||
        selectedPrioridade.length > 0 ||
        selectedCriticidade.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {selectedStatus.map((s) => (
            <Badge key={s} variant="secondary">
              Status: {STATUS_OPTIONS.find((o) => o.value === s)?.label}
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
          {selectedPrioridade.map((p) => (
            <Badge key={p} variant="secondary">
              Prioridade:{" "}
              {PRIORIDADE_OPTIONS.find((o) => o.value === p)?.label}
              <button
                onClick={() =>
                  onPrioridadeChange(selectedPrioridade.filter((v) => v !== p))
                }
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCriticidade.map((c) => (
            <Badge key={c} variant="secondary">
              Criticidade:{" "}
              {CRITICIDADE_OPTIONS.find((o) => o.value === c)?.label}
              <button
                onClick={() =>
                  onCriticidadeChange(selectedCriticidade.filter((v) => v !== c))
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
