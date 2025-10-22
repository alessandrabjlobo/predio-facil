import { Wrench, Clock, CheckCircle, AlertTriangle, User, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export default function DashboardFuncionario() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Olá, Carlos Oliveira
        </h2>
        <p className="text-gray-600">
          Funcionário - Hidráulica Silva Ltda | Residencial Vista Verde
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              1 urgente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Iniciada às 09:30
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Meta: 3 por dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              Baseado em 23 avaliações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarefa Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              Tarefa Atual
            </CardTitle>
            <CardDescription>
              Serviço em andamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">Reparo vazamento - Apto 304</p>
                  <p className="text-xs text-gray-500 mt-1">Iniciado às 09:30</p>
                  <p className="text-xs text-gray-600 mt-1">Solicitante: Maria Santos</p>
                  <p className="text-xs text-gray-600">Empresa: Hidráulica Silva Ltda</p>
                </div>
                <Badge variant="default">Em Andamento</Badge>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Progresso</span>
                  <span className="text-xs text-gray-600">70%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '70%'}}></div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button size="sm" className="flex-1">
                  Atualizar Progresso
                </Button>
                <Button size="sm" variant="outline">
                  Finalizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximas Tarefas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Próximas Tarefas
            </CardTitle>
            <CardDescription>
              Atribuídas pela sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div className="flex-1">
                <p className="font-medium text-sm">Troca de registro - Apto 201</p>
                <p className="text-xs text-gray-500">Agendado para 14:00</p>
                <p className="text-xs text-gray-600 mt-1">Solicitante: Ana Costa</p>
              </div>
              <div className="text-right">
                <Badge variant="destructive">Urgente</Badge>
                <Button size="sm" className="mt-2 w-full">
                  Iniciar
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex-1">
                <p className="font-medium text-sm">Limpeza filtro piscina</p>
                <p className="text-xs text-gray-500">Agendado para amanhã 08:00</p>
                <p className="text-xs text-gray-600 mt-1">Área comum</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">Programada</Badge>
                <Button size="sm" variant="outline" className="mt-2 w-full">
                  Ver Detalhes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comunicação com Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Comunicação
            </CardTitle>
            <CardDescription>
              Mensagens da Hidráulica Silva Ltda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Nova atribuição</p>
                <span className="text-xs text-gray-500">há 2 horas</span>
              </div>
              <p className="text-xs text-gray-600">
                "Carlos, foi atribuído a você o reparo no Apto 304. Prioridade alta."
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Feedback positivo</p>
                <span className="text-xs text-gray-500">ontem</span>
              </div>
              <p className="text-xs text-gray-600">
                "Parabéns pelo excelente trabalho no Ed. Central!"
              </p>
            </div>
            
            <Button size="sm" variant="outline" className="w-full">
              Enviar Mensagem para Empresa
            </Button>
          </CardContent>
        </Card>

        {/* Últimas Avaliações */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback dos Clientes</CardTitle>
            <CardDescription>
              Avaliações recentes dos seus serviços
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Instalação chuveiro - Ed. Central</p>
                <div className="flex text-yellow-400">
                  {"★".repeat(5)}
                </div>
              </div>
              <p className="text-xs text-gray-600">"Trabalho impecável, muito profissional!"</p>
              <p className="text-xs text-gray-500 mt-1">João Silva - há 1 dia</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Reparo torneira - Apto 105</p>
                <div className="flex text-yellow-400">
                  {"★".repeat(4)}{"☆"}
                </div>
              </div>
              <p className="text-xs text-gray-600">"Rápido e eficiente."</p>
              <p className="text-xs text-gray-500 mt-1">Pedro Lima - há 3 dias</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}