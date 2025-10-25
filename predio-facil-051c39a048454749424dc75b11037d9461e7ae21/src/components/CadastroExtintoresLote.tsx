import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useExtintores } from "@/hooks/useExtintores";
import { useAtivoTipos } from "@/hooks/useAtivoTipos";
import { Flame } from "lucide-react";

export const CadastroExtintoresLote = () => {
  const [open, setOpen] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [prefixo, setPrefixo] = useState("EXT");
  const [numeroInicial, setNumeroInicial] = useState(1);
  const [extintorTipo, setExtintorTipo] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [fabricante, setFabricante] = useState("");
  const [dataInstalacao, setDataInstalacao] = useState("");
  const [validadeCarga, setValidadeCarga] = useState("");
  const [validadeHidrostatico, setValidadeHidrostatico] = useState("");
  const [zona, setZona] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const { createExtintoresLote } = useExtintores();
  const { tipos } = useAtivoTipos();

  const extintorTipoId = tipos?.find(t => t.nome === "Extintor de Incêndio")?.id;

  const gerarPreview = () => {
    const preview = [];
    for (let i = 0; i < quantidade; i++) {
      const numeroSequencial = (numeroInicial + i).toString().padStart(3, '0');
      preview.push({
        identificador: `${prefixo}-${numeroSequencial}`,
        tipo: extintorTipo,
        capacidade,
        zona,
      });
    }
    return preview;
  };

  const handleSubmit = () => {
    if (!extintorTipoId) {
      return;
    }

    createExtintoresLote.mutate(
      {
        quantidade,
        prefixo,
        numeroInicial,
        extintor_tipo: extintorTipo,
        extintor_capacidade: capacidade,
        fabricante,
        data_instalacao: dataInstalacao,
        validade_carga: validadeCarga,
        validade_teste_hidrostatico: validadeHidrostatico,
        zona_localizacao: zona,
        tipo_id: extintorTipoId,
        requer_conformidade: true,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setShowPreview(false);
          // Reset form
          setQuantidade(1);
          setPrefixo("EXT");
          setNumeroInicial(1);
          setExtintorTipo("");
          setCapacidade("");
          setFabricante("");
          setDataInstalacao("");
          setValidadeCarga("");
          setValidadeHidrostatico("");
          setZona("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Flame className="mr-2 h-5 w-5" />
          Cadastrar Lote de Extintores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro em Lote de Extintores</DialogTitle>
          <DialogDescription>
            Cadastre múltiplos extintores de uma vez com numeração automática
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6">
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Identificação</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prefixo">Prefixo</Label>
                  <Input
                    id="prefixo"
                    value={prefixo}
                    onChange={(e) => setPrefixo(e.target.value)}
                    placeholder="EXT-T1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroInicial">Número Inicial</Label>
                  <Input
                    id="numeroInicial"
                    type="number"
                    min="1"
                    value={numeroInicial}
                    onChange={(e) => setNumeroInicial(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Dados Comuns</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo do Extintor</Label>
                  <Select value={extintorTipo} onValueChange={setExtintorTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PQS">PQS (Pó Químico Seco)</SelectItem>
                      <SelectItem value="CO2">CO2 (Gás Carbônico)</SelectItem>
                      <SelectItem value="Água Pressurizada">Água Pressurizada</SelectItem>
                      <SelectItem value="Espuma">Espuma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidade">Capacidade</Label>
                  <Select value={capacidade} onValueChange={setCapacidade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a capacidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4kg">4kg</SelectItem>
                      <SelectItem value="6kg">6kg</SelectItem>
                      <SelectItem value="8kg">8kg</SelectItem>
                      <SelectItem value="12kg">12kg</SelectItem>
                      <SelectItem value="4L">4L</SelectItem>
                      <SelectItem value="10L">10L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fabricante">Fabricante</Label>
                  <Input
                    id="fabricante"
                    value={fabricante}
                    onChange={(e) => setFabricante(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zona">Zona/Localização</Label>
                  <Input
                    id="zona"
                    value={zona}
                    onChange={(e) => setZona(e.target.value)}
                    placeholder="Ex: Torre 1 - Térreo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataInstalacao">Data de Instalação</Label>
                  <Input
                    id="dataInstalacao"
                    type="date"
                    value={dataInstalacao}
                    onChange={(e) => setDataInstalacao(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validadeCarga">Validade da Carga</Label>
                  <Input
                    id="validadeCarga"
                    type="date"
                    value={validadeCarga}
                    onChange={(e) => setValidadeCarga(e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="validadeHidrostatico">Validade do Teste Hidrostático</Label>
                  <Input
                    id="validadeHidrostatico"
                    type="date"
                    value={validadeHidrostatico}
                    onChange={(e) => setValidadeHidrostatico(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowPreview(true)}>
                Visualizar Preview
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Preview dos Extintores</h3>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identificador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Capacidade</TableHead>
                      <TableHead>Zona</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gerarPreview().map((ext, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{ext.identificador}</TableCell>
                        <TableCell>{ext.tipo}</TableCell>
                        <TableCell>{ext.capacidade}</TableCell>
                        <TableCell>{ext.zona}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={createExtintoresLote.isPending}>
                {createExtintoresLote.isPending ? "Cadastrando..." : "Confirmar Cadastro"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
