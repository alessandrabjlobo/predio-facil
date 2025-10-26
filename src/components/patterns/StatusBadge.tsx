import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";

type Status = "verde" | "amarelo" | "vermelho" | "em_dia" | "atencao" | "atrasado" | "pendente" | "em_execucao" | "concluida" | "cancelada";

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = {
    verde: { icon: CheckCircle2, className: "bg-success/10 text-success border-success/20", text: "Em dia" },
    em_dia: { icon: CheckCircle2, className: "bg-success/10 text-success border-success/20", text: "Em dia" },
    amarelo: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20", text: "Atenção" },
    atencao: { icon: Clock, className: "bg-warning/10 text-warning border-warning/20", text: "Atenção" },
    vermelho: { icon: AlertTriangle, className: "bg-danger/10 text-danger border-danger/20", text: "Atrasado" },
    atrasado: { icon: AlertTriangle, className: "bg-danger/10 text-danger border-danger/20", text: "Atrasado" },
    pendente: { icon: Clock, className: "bg-muted text-muted-foreground border-border", text: "Pendente" },
    em_execucao: { icon: Clock, className: "bg-primary/10 text-primary border-primary/20", text: "Em Execução" },
    concluida: { icon: CheckCircle2, className: "bg-success/10 text-success border-success/20", text: "Concluída" },
    cancelada: { icon: XCircle, className: "bg-muted text-muted-foreground border-border", text: "Cancelada" },
  };

  const { icon: Icon, className, text } = config[status] || config.pendente;

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label || text}
    </Badge>
  );
}
