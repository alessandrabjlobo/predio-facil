// src/components/NovoTicket.tsx
import { useState } from "react";
import { Camera, MapPin, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { createChamado, uploadAnexo, type Prioridade } from "@/lib/api";

interface NovoTicketProps {
  onClose?: () => void;
}

export default function NovoTicket({ onClose }: NovoTicketProps) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<{
    titulo: string;
    descricao: string;
    local: string;
    prioridade: Prioridade;
    categoria?: string;
    fotos: File[];
  }>({
    titulo: "",
    descricao: "",
    local: "",
    prioridade: "baixa",
    categoria: undefined,
    fotos: [],
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function safe<T extends string | undefined>(v: T) {
    // Para o Radix: undefined = sem seleção (usa placeholder). Nunca passe "".
    return v && v.length ? v : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!formData.titulo.trim()) {
      setErro("Informe um título.");
      return;
    }
    if (!formData.descricao.trim()) {
      setErro("Descreva o problema.");
      return;
    }

    setSalvando(true);
    try {
      // Agora enviando local e categoria (se existir) além dos campos básicos
      const novo = await createChamado({
        titulo: formData.titulo,
        descricao: formData.descricao,
        prioridade: formData.prioridade,
        local: formData.local || null,
        categoria: formData.categoria || null,
        // quando houver: condominio_id, ativo_id...
      });

      // Upload de anexos para o bucket 'anexos'
      if (formData.fotos.length) {
        await Promise.all(
          formData.fotos.map(async (f) => {
            try {
              await uploadAnexo(novo.id, f);
            } catch (err) {
              console.warn("Falha ao subir anexo:", f.name, err);
            }
          })
        );
      }

      navigate("/chamados", { replace: true });
    } catch (err: any) {
      setErro(err?.message ?? "Erro ao salvar chamado");
    } finally {
      setSalvando(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        fotos: [...prev.fotos, ...Array.from(e.target.files)],
      }));
    }
  }

  const prioridades: { value: Prioridade; label: string; dot: string }[] = [
    { value: "baixa", label: "Baixa", dot: "bg-gray-300" },
    { value: "media", label: "Média", dot: "bg-sky-400" },
    { value: "alta", label: "Alta", dot: "bg-orange-400" },
    { value: "urgente", label: "Urgente", dot: "bg-rose-500" },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/chamados")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Chamado de Manutenção</h1>
          <p className="text-gray-600">Descreva o problema para que possamos resolver rapidamente</p>
        </div>
      </div>

      <div className="max-w-2xl">
        {erro && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Problema *</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Vazamento no banheiro do apto 304"
                  value={formData.titulo}
                  onChange={(e) => setFormData((p) => ({ ...p, titulo: e.target.value }))}
                  required
                />
              </div>

              {/* Local */}
              <div className="space-y-2">
                <Label htmlFor="local">Localização</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="local"
                    placeholder="Ex: Apartamento 304, Garagem, Área comum"
                    className="pl-10"
                    value={formData.local}
                    onChange={(e) => setFormData((p) => ({ ...p, local: e.target.value }))}
                  />
                </div>
              </div>

              {/* Categoria e Prioridade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={safe(formData.categoria)}
                    onValueChange={(value) => setFormData((p) => ({ ...p, categoria: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hidraulica">Hidráulica</SelectItem>
                      <SelectItem value="eletrica">Elétrica</SelectItem>
                      <SelectItem value="elevador">Elevador</SelectItem>
                      <SelectItem value="portaria">Portaria/Acesso</SelectItem>
                      <SelectItem value="limpeza">Limpeza</SelectItem>
                      <SelectItem value="jardinagem">Jardinagem</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade *</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value) =>
                      setFormData((p) => ({ ...p, prioridade: value as Prioridade }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                            <span>{p.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição Detalhada *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o problema com o máximo de detalhes possível..."
                  rows={4}
                  value={formData.descricao}
                  onChange={(e) => setFormData((p) => ({ ...p, descricao: e.target.value }))}
                  required
                />
              </div>

              {/* Upload de Fotos */}
              <div className="space-y-2">
                <Label>Fotos do Problema</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Adicione fotos para ajudar na identificação do problema
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="fotos"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("fotos")?.click()}
                    >
                      Selecionar Fotos
                    </Button>
                  </div>
                </div>

                {/* Preview das fotos */}
                {formData.fotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.fotos.map((foto, index) => (
                      <Badge key={index} variant="secondary">
                        {foto.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={salvando}>
                  {salvando ? "Abrindo..." : "Abrir Chamado"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/chamados")}
                  disabled={salvando}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
