import { useState } from "react";
import { Camera, MessageSquare, Clock, CheckCircle, Upload, Play, Square, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";

interface ServicoProps {
  id: string;
  titulo: string;
  descricao: string;
  progresso: number;
  status: string;
  apartamento: string;
  solicitante: string;
  horario_inicio?: string;
  horario_pausa?: string;
  tempo_trabalhado?: number; // em minutos
}

export default function AtualizarProgresso({ 
  servico = {
    id: "1",
    titulo: "Reparo vazamento - Apto 304",
    descricao: "Vazamento no banheiro, torneira da pia",
    progresso: 30,
    status: "em_andamento",
    apartamento: "304",
    solicitante: "Maria Santos",
    horario_inicio: "2024-01-15T09:30:00",
    tempo_trabalhado: 45
  }
}: { servico?: ServicoProps }) {
  const [progresso, setProgresso] = useState([servico.progresso]);
  const [comentario, setComentario] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [servicoIniciado, setServicoIniciado] = useState(!!servico.horario_inicio);
  const [servicoPausado, setServicoPausado] = useState(false);
  const [tempoInicio, setTempoInicio] = useState<Date | null>(
    servico.horario_inicio ? new Date(servico.horario_inicio) : null
  );

  const etapas = [
    { valor: 0, label: "Não iniciado", cor: "bg-gray-400" },
    { valor: 25, label: "Diagnóstico", cor: "bg-blue-400" },
    { valor: 50, label: "Materiais obtidos", cor: "bg-yellow-400" },
    { valor: 75, label: "Execução", cor: "bg-orange-400" },
    { valor: 100, label: "Concluído", cor: "bg-green-400" }
  ];

  const getEtapaAtual = (valor: number) => {
    return etapas.find(etapa => valor >= etapa.valor) || etapas[0];
  };

  const formatarTempo = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  const calcularTempoTrabalhado = () => {
    if (!tempoInicio) return 0;
    const agora = new Date();
    const diffMs = agora.getTime() - tempoInicio.getTime();
    return Math.floor(diffMs / (1000 * 60)); // em minutos
  };

  const iniciarServico = () => {
    const agora = new Date();
    setTempoInicio(agora);
    setServicoIniciado(true);
    // Aqui salvaria no banco: horario_inicio
  };

  const pausarServico = () => {
    setServicoPausado(!servicoPausado);
    // Aqui salvaria no banco: horario_pausa
  };

  const handleFotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFotos(prev => [...prev, ...files]);
  };

  const podeFinalizarServico = () => {
    return progresso[0] === 100 && fotos.length > 0;
  };

  const finalizarServico = () => {
    if (!podeFinalizarServico()) return;
    
    const horarioConclusao = new Date();
    const tempoTotal = calcularTempoTrabalhado();
    
    // Aqui salvaria no banco
    console.log({
      servicoId: servico.id,
      progresso: 100,
      status: 'concluido',
      horario_conclusao: horarioConclusao.toISOString(),
      tempo_total_minutos: tempoTotal,
      fotos_conclusao: fotos,
      comentario_final: comentario
    });
  };

  const atualizarServico = () => {
    console.log({
      servicoId: servico.id,
      progresso: progresso[0],
      comentario,
      fotos,
      timestamp: new Date().toISOString(),
      tempo_trabalhado: calcularTempoTrabalhado()
    });
  };

  return (
    <div className="bg-white min-h-screen p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Atualizar Progresso
          </CardTitle>
          <CardDescription>
            {servico.titulo} - {servico.apartamento}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Controle de Tempo */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Controle de Tempo</h4>
                <Badge variant={servicoIniciado ? "default" : "secondary"}>
                  {servicoIniciado ? "Em Andamento" : "Não Iniciado"}
                </Badge>
              </div>
              
              {!servicoIniciado ? (
                <Button onClick={iniciarServico} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Serviço
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Início:</p>
                      <p className="font-medium">
                        {tempoInicio?.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tempo Trabalhado:</p>
                      <p className="font-medium text-blue-600">
                        {formatarTempo(calcularTempoTrabalhado())}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={pausarServico} 
                    variant={servicoPausado ? "default" : "outline"}
                    className="w-full"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {servicoPausado ? "Retomar Serviço" : "Pausar Serviço"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Serviço */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">{servico.titulo}</h3>
            <p className="text-sm text-gray-600 mb-2">{servico.descricao}</p>
            <p className="text-sm text-gray-500">Solicitante: {servico.solicitante}</p>
          </div>

          {/* Progresso Atual */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Progresso Atual</h4>
              <Badge variant="secondary">{progresso[0]}%</Badge>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${getEtapaAtual(progresso[0]).cor}`}
                style={{ width: `${progresso[0]}%` }}
              />
            </div>
            
            <p className="text-sm text-gray-600">
              Etapa: {getEtapaAtual(progresso[0]).label}
            </p>
          </div>

          {/* Atualizar Progresso */}
          {servicoIniciado && (
            <div className="space-y-4">
              <h4 className="font-medium">Atualizar Progresso</h4>
              
              <div className="space-y-2">
                <Slider
                  value={progresso}
                  onValueChange={setProgresso}
                  max={100}
                  step={25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  {etapas.map(etapa => (
                    <span key={etapa.valor}>{etapa.valor}%</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {etapas.slice(1).map(etapa => (
                  <Button
                    key={etapa.valor}
                    variant={progresso[0] >= etapa.valor ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProgresso([etapa.valor])}
                    className="text-xs"
                  >
                    {etapa.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Comentário */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentário {progresso[0] === 100 && "(Obrigatório para finalizar)"}
            </h4>
            <Textarea
              placeholder="Descreva o que foi feito, materiais usados, próximos passos..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              required={progresso[0] === 100}
            />
          </div>

          {/* Upload de Fotos */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos do Progresso
              {progresso[0] === 100 && (
                <Badge variant="destructive" className="text-xs">
                  Obrigatório para finalizar
                </Badge>
              )}
            </h4>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFotoUpload}
                className="hidden"
                id="foto-upload"
              />
              <label htmlFor="foto-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Clique para adicionar fotos ou arraste aqui
                </p>
              </label>
            </div>

            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(foto)}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => setFotos(prev => prev.filter((_, i) => i !== index))}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerta para Finalização */}
          {progresso[0] === 100 && !podeFinalizarServico() && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Para finalizar o serviço é obrigatório:
                <ul className="list-disc list-inside mt-1">
                  {fotos.length === 0 && <li>Adicionar pelo menos 1 foto</li>}
                  {!comentario && <li>Adicionar comentário final</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Botão Principal */}
          {servicoIniciado && (
            <Button 
              onClick={progresso[0] === 100 ? finalizarServico : atualizarServico}
              className="w-full"
              size="lg"
              disabled={progresso[0] === 100 && !podeFinalizarServico()}
            >
              {progresso[0] === 100 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Serviço
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Atualizar Progresso
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}