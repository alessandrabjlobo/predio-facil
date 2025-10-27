import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtivoTipos } from "@/hooks/useAtivoTipos";
import { useAtivos } from "@/hooks/useAtivos";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { Loader2, PlusCircle, Building2, Settings as SettingsIcon, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AtivoDetalhes } from "@/components/AtivoDetalhes";
import { NBRConformidadeInfo } from "@/components/NBRConformidadeInfo";
import { CadastroExtintoresLote } from "@/components/CadastroExtintoresLote";
import { CondominioManutencoes } from "./configuracoes/CondominioManutencoes";
import { GerenciarAtivos } from "@/components/GerenciarAtivos";

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tipos, isLoading: tiposLoading } = useAtivoTipos();
  const { ativos, isLoading: ativosLoading } = useAtivos();
  const { createAtivo } = useAtivos();
  const { condominio, loading: condominioLoading } = useCondominioAtual();
  
  const [activeTab, setActiveTab] = useState("settings");
  const [open, setOpen] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [tipoSelecionado, setTipoSelecionado] = useState("");
  const [ativoSelecionado, setAtivoSelecionado] = useState<string | null>(null);
  
  // Estados do formulário estendido
  const [formData, setFormData] = useState({
    torre: "",
    andar: "",
    local: "",
    tipo_uso: "",
    fabricante: "",
    modelo: "",
    numero_serie: "",
    data_instalacao: "",
  });

  // Mostrar mensagem se não há condomínio associado
  if (!authLoading && !condominioLoading && !condominio) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Condomínio Não Encontrado</CardTitle>
              <CardDescription>
                Você precisa estar associado a um condomínio para cadastrar ativos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Como administrador, você pode criar um novo condomínio na página Admin e depois se associar a ele.
              </p>
              <Button onClick={() => navigate("/admin")}>
                Ir para Admin
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleCadastroRapido = async () => {
    if (!tipoSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de ativo",
        variant: "destructive",
      });
      return;
    }

    const tipo = tipos?.find(t => t.id === tipoSelecionado);
    if (!tipo) return;

    // Determinar se requer conformidade baseado no tipo
    const requer_conformidade = tipo.is_conformidade || false;

    try {
      for (let i = 1; i <= quantidade; i++) {
        await createAtivo.mutateAsync({
          nome: quantidade > 1 ? `${tipo.nome} ${i}` : tipo.nome,
          tipo_id: tipo.id,
          descricao: `Cadastrado via wizard de configuração`,
          requer_conformidade,
          ...formData, // Incluir todos os dados do formulário
        });
      }

      toast({
        title: "Sucesso",
        description: `${quantidade} ${tipo.nome}(s) cadastrado(s) com sucesso!`,
      });
      
      setOpen(false);
      setTipoSelecionado("");
      setQuantidade(1);
      setFormData({
        torre: "",
        andar: "",
        local: "",
        tipo_uso: "",
        fabricante: "",
        modelo: "",
        numero_serie: "",
        data_instalacao: "",
      });
    } catch (error) {
      console.error("Erro ao cadastrar ativos:", error);
    }
  };

  // Agrupar ativos por tipo
  const ativosPorTipo = ativos?.reduce((acc, ativo) => {
    const tipoNome = ativo.ativo_tipos?.nome || "Outros";
    if (!acc[tipoNome]) {
      acc[tipoNome] = [];
    }
    acc[tipoNome].push(ativo);
    return acc;
  }, {} as Record<string, typeof ativos>);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground mt-2">
              Configure os ativos do seu condomínio e os planos de manutenção conforme NBR 5674
            </p>
          </div>

          {/* Gerenciar Ativos */}
          <GerenciarAtivos />

          {/* Card de Configurações de Manutenção */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <SettingsIcon className="h-5 w-5" />
                Personalização de Templates de Manutenção
              </CardTitle>
              <CardDescription>
                Customize os planos de manutenção para este condomínio, adicionando checklists e documentos extras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CondominioManutencoes />
            </CardContent>
          </Card>

          {/* Card de Cadastro Rápido de Extintores */}
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                <Building2 className="h-5 w-5" />
                Cadastro Rápido de Extintores
              </CardTitle>
              <CardDescription>
                Cadastre múltiplos extintores de uma vez com numeração automática e conformidade NBR 5674
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CadastroExtintoresLote />
            </CardContent>
          </Card>

          {/* Informações sobre NBR 5674 */}
          <NBRConformidadeInfo />
        </div>

        {/* Dialog de Detalhes do Ativo */}
        {ativoSelecionado && (
          <AtivoDetalhes
            ativoId={ativoSelecionado}
            open={!!ativoSelecionado}
            onOpenChange={(open) => !open && setAtivoSelecionado(null)}
          />
        )}
      </main>
    </div>
  );
};

export default Settings;
