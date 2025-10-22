import React from "react";
import { FileText, Clock, User, MapPin, DollarSign, Camera, CheckCircle, Calendar, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

interface RelatorioServicoProps {
  servico?: {
    id: string;
    numero_os: string;
    titulo: string;
    descricao: string;
    tipo_servico: string;
    prioridade: string;
    status: string;
    
    // Localização
    condominio: string;
    endereco: string;
    apartamento: string;
    solicitante: {
      nome: string;
      telefone: string;
      email: string;
    };
    
    // Fornecedor e Funcionário
    fornecedor: {
      nome: string;
      cnpj: string;
      telefone: string;
      email: string;
    };
    funcionario: {
      nome: string;
      telefone: string;
      especialidade: string;
    };
    
    // Datas e Horários
    data_solicitacao: string;
    data_agendamento: string;
    horario_inicio: string;
    horario_conclusao: string;
    tempo_total_horas: number;
    
    // Valores
    valor_orcado: number;
    valor_materiais: number;
    valor_mao_obra: number;
    valor_total: number;
    forma_pagamento: string;
    
    // Materiais
    materiais_utilizados: Array<{
      item: string;
      quantidade: number;
      valor_unitario: number;
      valor_total: number;
    }>;
    
    // Progresso e Fotos
    historico_progresso: Array<{
      timestamp: string;
      progresso: number;
      comentario: string;
      funcionario: string;
    }>;
    fotos_antes: string[];
    fotos_durante: string[];
    fotos_depois: string[];
    
    // Avaliação
    avaliacao: {
      nota: number;
      comentario: string;
      data: string;
    };
    
    // Observações
    observacoes_tecnicas: string;
    observacoes_cliente: string;
    garantia_meses: number;
  };
}

export default function RelatorioServico({ 
  servico = {
    id: "srv_001",
    numero_os: "OS-2024-001",
    titulo: "Reparo vazamento - Apto 304",
    descricao: "Vazamento na torneira da pia do banheiro principal",
    tipo_servico: "Hidráulica",
    prioridade: "Alta",
    status: "Concluído",
    
    condominio: "Residencial Vista Verde",
    endereco: "Rua das Flores, 123 - Jardim Botânico",
    apartamento: "304",
    solicitante: {
      nome: "Maria Santos",
      telefone: "(11) 99999-9999",
      email: "maria.santos@email.com"
    },
    
    fornecedor: {
      nome: "Hidráulica Silva Ltda",
      cnpj: "12.345.678/0001-90",
      telefone: "(11) 3333-3333",
      email: "contato@hidraulicasilva.com.br"
    },
    funcionario: {
      nome: "Carlos Oliveira",
      telefone: "(11) 98888-8888",
      especialidade: "Técnico Hidráulico"
    },
    
    data_solicitacao: "2024-01-15T08:30:00",
    data_agendamento: "2024-01-15T09:00:00",
    horario_inicio: "2024-01-15T09:30:00",
    horario_conclusao: "2024-01-15T12:15:00",
    tempo_total_horas: 2.75,
    
    valor_orcado: 280.00,
    valor_materiais: 85.00,
    valor_mao_obra: 195.00,
    valor_total: 280.00,
    forma_pagamento: "PIX",
    
    materiais_utilizados: [
      { item: "Torneira monocomando", quantidade: 1, valor_unitario: 45.00, valor_total: 45.00 },
      { item: "Vedação de borracha", quantidade: 2, valor_unitario: 8.00, valor_total: 16.00 },
      { item: "Fita veda rosca", quantidade: 1, valor_unitario: 12.00, valor_total: 12.00 },
      { item: "Cola para PVC", quantidade: 1, valor_unitario: 12.00, valor_total: 12.00 }
    ],
    
    historico_progresso: [
      { timestamp: "2024-01-15T09:30:00", progresso: 0, comentario: "Serviço iniciado", funcionario: "Carlos Oliveira" },
      { timestamp: "2024-01-15T10:00:00", progresso: 25, comentario: "Diagnóstico realizado - torneira com defeito", funcionario: "Carlos Oliveira" },
      { timestamp: "2024-01-15T10:30:00", progresso: 50, comentario: "Materiais separados e área preparada", funcionario: "Carlos Oliveira" },
      { timestamp: "2024-01-15T11:45:00", progresso: 75, comentario: "Torneira substituída, testando funcionamento", funcionario: "Carlos Oliveira" },
      { timestamp: "2024-01-15T12:15:00", progresso: 100, comentario: "Serviço concluído com sucesso", funcionario: "Carlos Oliveira" }
    ],
    
    fotos_antes: ["foto1.jpg", "foto2.jpg"],
    fotos_durante: ["foto3.jpg", "foto4.jpg", "foto5.jpg"],
    fotos_depois: ["foto6.jpg", "foto7.jpg"],
    
    avaliacao: {
      nota: 5,
      comentario: "Excelente trabalho! Muito profissional e rápido.",
      data: "2024-01-15T12:30:00"
    },
    
    observacoes_tecnicas: "Torneira antiga apresentava desgaste interno. Substituição foi a melhor opção. Sistema hidráulico do apartamento em bom estado.",
    observacoes_cliente: "Cliente muito satisfeito com o atendimento. Solicitou orçamento para troca do chuveiro.",
    garantia_meses: 6
  }
}: RelatorioServicoProps) {
  
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-2xl">Relatório de Serviço</CardTitle>
            </div>
            <CardDescription className="text-lg">
              {servico.numero_os} - {servico.titulo}
            </CardDescription>
            <div className="flex justify-center mt-4">
              <Badge variant={servico.status === 'Concluído' ? 'default' : 'secondary'} className="text-sm px-4 py-1">
                {servico.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Informações Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Dados do Serviço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Tipo de Serviço</p>
                <p className="font-medium">{servico.tipo_servico}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Descrição</p>
                <p className="font-medium">{servico.descricao}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prioridade</p>
                <Badge variant={servico.prioridade === 'Alta' ? 'destructive' : 'secondary'}>
                  {servico.prioridade}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Condomínio</p>
                <p className="font-medium">{servico.condominio}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Endereço</p>
                <p className="font-medium">{servico.endereco}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Apartamento</p>
                <p className="font-medium">{servico.apartamento}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pessoas Envolvidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Solicitante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{servico.solicitante.nome}</p>
              <p className="text-sm text-gray-600">{servico.solicitante.telefone}</p>
              <p className="text-sm text-gray-600">{servico.solicitante.email}</p>
            </CardContent>
          </Card>

          {/* Fornecedor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{servico.fornecedor.nome}</p>
              <p className="text-sm text-gray-600">CNPJ: {servico.fornecedor.cnpj}</p>
              <p className="text-sm text-gray-600">{servico.fornecedor.telefone}</p>
              <p className="text-sm text-gray-600">{servico.fornecedor.email}</p>
            </CardContent>
          </Card>

          {/* Funcionário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Técnico Responsável
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{servico.funcionario.nome}</p>
              <p className="text-sm text-gray-600">{servico.funcionario.especialidade}</p>
              <p className="text-sm text-gray-600">{servico.funcionario.telefone}</p>
            </CardContent>
          </Card>
        </div>

        {/* Cronograma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cronograma de Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Solicitação</p>
                <p className="font-medium">{formatarData(servico.data_solicitacao)}</p>
                <p className="text-sm text-gray-500">{formatarHora(servico.data_solicitacao)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Agendamento</p>
                <p className="font-medium">{formatarData(servico.data_agendamento)}</p>
                <p className="text-sm text-gray-500">{formatarHora(servico.data_agendamento)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Início</p>
                <p className="font-medium">{formatarData(servico.horario_inicio)}</p>
                <p className="text-sm text-gray-500">{formatarHora(servico.horario_inicio)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conclusão</p>
                <p className="font-medium">{formatarData(servico.horario_conclusao)}</p>
                <p className="text-sm text-gray-500">{formatarHora(servico.horario_conclusao)}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="text-center">
              <p className="text-sm text-gray-600">Tempo Total de Execução</p>
              <p className="text-2xl font-bold text-blue-600">{servico.tempo_total_horas}h</p>
            </div>
          </CardContent>
        </Card>

        {/* Materiais Utilizados */}
        <Card>
          <CardHeader>
            <CardTitle>Materiais Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qtd</th>
                    <th className="text-right py-2">Valor Unit.</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {servico.materiais_utilizados.map((material, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{material.item}</td>
                      <td className="text-center py-2">{material.quantidade}</td>
                      <td className="text-right py-2">{formatarMoeda(material.valor_unitario)}</td>
                      <td className="text-right py-2 font-medium">{formatarMoeda(material.valor_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-medium">
                    <td colSpan={3} className="py-2 text-right">Total Materiais:</td>
                    <td className="text-right py-2">{formatarMoeda(servico.valor_materiais)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Valor Orçado:</span>
                <span className="font-medium">{formatarMoeda(servico.valor_orcado)}</span>
              </div>
              <div className="flex justify-between">
                <span>Materiais:</span>
                <span className="font-medium">{formatarMoeda(servico.valor_materiais)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mão de Obra:</span>
                <span className="font-medium">{formatarMoeda(servico.valor_mao_obra)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">{formatarMoeda(servico.valor_total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Forma de Pagamento:</span>
                <span>{servico.forma_pagamento}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Progresso */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {servico.historico_progresso.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {item.progresso}%
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm">{item.comentario}</p>
                      <span className="text-xs text-gray-500">
                        {formatarData(item.timestamp)} {formatarHora(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Por: {item.funcionario}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fotos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Registro Fotográfico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Antes do Serviço ({servico.fotos_antes.length} fotos)</h4>
              <div className="grid grid-cols-4 gap-2">
                {servico.fotos_antes.map((foto, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    Foto {index + 1}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Durante a Execução ({servico.fotos_durante.length} fotos)</h4>
              <div className="grid grid-cols-4 gap-2">
                {servico.fotos_durante.map((foto, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    Foto {index + 1}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Após Conclusão ({servico.fotos_depois.length} fotos)</h4>
              <div className="grid grid-cols-4 gap-2">
                {servico.fotos_depois.map((foto, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    Foto {index + 1}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avaliação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Avaliação do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Nota:</span>
                <div className="flex text-yellow-400">
                  {"★".repeat(servico.avaliacao.nota)}{"☆".repeat(5 - servico.avaliacao.nota)}
                </div>
                <span className="font-medium">{servico.avaliacao.nota}/5</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Comentário:</p>
                <p className="font-medium">{servico.avaliacao.comentario}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data da Avaliação:</p>
                <p className="text-sm">{formatarData(servico.avaliacao.data)} {formatarHora(servico.avaliacao.data)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações Técnicas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{servico.observacoes_tecnicas}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{servico.observacoes_cliente}</p>
            </CardContent>
          </Card>
        </div>

        {/* Garantia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Garantia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{servico.garantia_meses} meses</p>
              <p className="text-sm text-gray-600">
                Garantia válida até {new Date(new Date(servico.horario_conclusao).setMonth(new Date(servico.horario_conclusao).getMonth() + servico.garantia_meses)).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Relatório gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline">
                  Enviar por Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}