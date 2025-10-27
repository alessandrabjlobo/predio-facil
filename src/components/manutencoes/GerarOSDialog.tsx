import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GerarOSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manutencao: any;
}

export function GerarOSDialog({ open, onOpenChange, manutencao }: GerarOSDialogProps) {
  const [titulo, setTitulo] = useState(manutencao?.titulo || "");
  const [descricao, setDescricao] = useState(manutencao?.descricao || "");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manutencao) return;

    setLoading(true);
    try {
      // Buscar condomínio do ativo
      const { data: ativo } = await supabase
        .from("ativos")
        .select("condominio_id")
        .eq("id", manutencao.ativo_id)
        .single();

      if (!ativo) throw new Error("Ativo não encontrado");

      // Criar OS
      const { data: os, error } = await supabase
        .from("ordens_servico" as any)
        .insert({
          titulo,
          descricao,
          condominio_id: ativo.condominio_id,
          ativo_id: manutencao.ativo_id,
          manutencao_id: manutencao.id,
          status: "aberta",
          prioridade: "media",
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "OS criada com sucesso!" });
      onOpenChange(false);
      navigate(`/os?id=${(os as any).id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao criar OS",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Ordem de Serviço</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Título da OS</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
            />
          </div>

          <div className="text-xs text-muted-foreground">
            <p><strong>Ativo:</strong> {manutencao?.ativos?.nome || "—"}</p>
            <p><strong>Manutenção:</strong> {manutencao?.titulo}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar OS"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
