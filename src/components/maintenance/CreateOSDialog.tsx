import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";

interface CreateOSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ativo?: any;
  plano?: any;
  onSuccess?: () => void;
}

export function CreateOSDialog({
  open,
  onOpenChange,
  ativo,
  plano,
}: CreateOSDialogProps) {
  const navigate = useNavigate();
  const { condominio } = useCondominioAtual();

  useEffect(() => {
    if (open && ativo) {
      onOpenChange(false);

      const params = new URLSearchParams();

      if (plano) {
        params.set("title", plano.titulo || `Manutenção - ${ativo.nome}`);
        params.set("origin", "plan");
        if (plano.descricao) params.set("description", plano.descricao);
        if (plano.prioridade) params.set("priority", plano.prioridade);
        if (plano.id) params.set("plan", plano.id);
        if (plano.vencimento) {
          const dueDate = new Date(plano.vencimento);
          if (!isNaN(dueDate.getTime())) {
            params.set("due", format(dueDate, "yyyy-MM-dd"));
          }
        }
      } else {
        params.set("title", `Manutenção - ${ativo.nome}`);
        params.set("origin", "manual");
      }

      params.set("asset", ativo.id);

      if (condominio?.id) {
        params.set("condo", condominio.id);
      }

      navigate(`/os/new?${params.toString()}`);
    }
  }, [open, ativo, plano, condominio, navigate, onOpenChange]);

  return null;
}
