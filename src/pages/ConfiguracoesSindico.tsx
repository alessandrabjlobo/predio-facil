import { PageHeader } from "@/components/patterns/PageHeader";
import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ConfiguracoesSindico() {
  const { condominio } = useCondominioAtual();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    cidade: "",
    uf: "",
    cnpj: "",
    unidades: "",
  });

  useEffect(() => {
    if (condominio) {
      setFormData({
        nome: condominio.nome || "",
        endereco: (condominio as any).endereco || "",
        cidade: (condominio as any).cidade || "",
        uf: (condominio as any).uf || "",
        cnpj: (condominio as any).cnpj || "",
        unidades: (condominio as any).unidades?.toString() || "",
      });
    }
  }, [condominio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("condominios")
        .update({
          nome: formData.nome,
          endereco: formData.endereco || null,
          cidade: formData.cidade || null,
          uf: formData.uf || null,
          cnpj: formData.cnpj || null,
          unidades: formData.unidades ? parseInt(formData.unidades) : null,
        })
        .eq("id", condominio?.id);

      if (error) throw error;
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao atualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Configurações"
        subtitle="Gerencie as informações do condomínio"
        icon={Settings}
      />

      <Card>
        <CardHeader>
          <CardTitle>Informações do Condomínio</CardTitle>
          <CardDescription>
            Atualize os dados cadastrais do condomínio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome do Condomínio *</Label>
                <Input
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div>
                <Label>UF</Label>
                <Input
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                  maxLength={2}
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
              </div>
              <div>
                <Label>Número de Unidades</Label>
                <Input
                  type="number"
                  value={formData.unidades}
                  onChange={(e) => setFormData({ ...formData, unidades: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
