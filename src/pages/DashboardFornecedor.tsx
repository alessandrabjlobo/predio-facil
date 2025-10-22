import React from "react";
import { DollarSign, FileText, Star, TrendingUp, Calendar, MapPin, Clock, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

export default function DashboardFornecedor() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Bem-vindo, Hidráulica Silva Ltda
        </h2>
        <p className="text-gray-600">
          CNPJ: 12.345.678/0001-90 - Fornecedor Verificado ✓
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Ativas</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3 aguardando resposta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              3 em campo hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 15.800</div>
            <p className="text-xs text-muted-foreground">
              +18% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.9</div>
            <p className="text-xs text-muted-foreground">
              Baseado em 127 avaliações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funcionários em Campo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Funcionários em Campo
            </CardTitle>
            <CardDescription>
              Equipe executando serviços hoje
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">Carlos Oliveira</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    Residencial Vista Verde - Apto 304
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Reparo vazamento - Iniciado 09:30</p>
                </div>
                <Badge variant="default">Em Andamento</Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{width: '100px'}}>
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '70%'}}></div>
                  </div>
                  <span className="text-xs text-gray-500">70%</span>
                </div>
                <Button size="sm" variant="outline">Acompanhar</Button>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">João Santos</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    Ed. Central - Apto 1205
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Instalação chuveiro - Iniciado 08:00</p>
                </div>
                <Badge variant="secondary">Finalizando</Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{width: '100px'}}>
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '90%'}}></div>
                  </div>
                  <span className="text-xs text-gray-500">90%</span>
                </div>
                <Button size="sm" variant="outline">Contatar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gerenciar Equipe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Gerenciar Equipe
            </CardTitle>
            <CardDescription>
              Funcionários cadastrados na sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  CO
                </div>
                <div>
                  <p className="font-medium text-sm">Carlos Oliveira</p>
                  <p className="text-xs text-gray-500">Técnico Hidráulico</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default">Ativo</Badge>
                <Button size="sm" variant="outline">Editar</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  JS
                </div>
                <div>
                  <p className="font-medium text-sm">João Santos</p>
                  <p className="text-xs text-gray-500">Técnico Geral</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default">Ativo</Badge>
                <Button size="sm" variant="outline">Editar</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  MS
                </div>
                <div>
                  <p className="font-medium text-sm">Maria Silva</p>
                  <p className="text-xs text-gray-500">Eletricista</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Disponível</Badge>
                <Button size="sm" variant="outline">Editar</Button>
              </div>
            </div>
            
            <Button className="w-full mt-4">
              + Cadastrar Novo Funcionário
            </Button>
          </CardContent>
        </Card>

        {/* Novas Oportunidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Novas Oportunidades
            </CardTitle>
            <CardDescription>
              Solicitações que combinam com seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">Reparo vazamento - Residencial Vista Verde</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    2.3 km de distância
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Urgente - Vazamento no banheiro do apartamento 304</p>
                </div>
                <Badge variant="destructive">Urgente</Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm font-medium text-green-600">Orçamento: R$ 200-400</p>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">Ver Detalhes</Button>
                  <Button size="sm">Enviar Proposta</Button>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">Manutenção preventiva - Condomínio Jardins</p>
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    5.1 km de distância
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Revisão sistema hidráulico completo</p>
                </div>
                <Badge variant="secondary">Média</Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm font-medium text-blue-600">Orçamento: R$ 800-1200</p>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">Ver Detalhes</Button>
                  <Button size="sm">Enviar Proposta</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Propostas Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Propostas Aguardando
            </CardTitle>
            <CardDescription>
              Aguardando resposta dos síndicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">Troca de registros - Ed. Copacabana</p>
                  <p className="text-xs text-gray-500">Enviada há 2 dias</p>
                  <p className="text-xs text-gray-600 mt-1">Sua proposta: R$ 650,00</p>
                </div>
                <Badge variant="secondary">Analisando</Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">3 propostas concorrendo</p>
                <Button size="sm" variant="outline">Acompanhar</Button>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">Instalação bomba - Residencial Flores</p>
                  <p className="text-xs text-gray-500">Enviada ontem</p>
                  <p className="text-xs text-gray-600 mt-1">Sua proposta: R$ 1.200,00</p>
                </div>
                <Badge variant="outline">Nova</Badge>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">5 propostas concorrendo</p>
                <Button size="sm" variant="outline">Revisar Proposta</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agenda de Serviços */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Próximos Serviços
            </CardTitle>
            <CardDescription>
              Serviços agendados para esta semana
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Reparo torneira - Vista Verde</p>
                <Badge variant="default">Hoje</Badge>
              </div>
              <p className="text-xs text-gray-500">14:00 - Apto 201 - Carlos Oliveira</p>
              <p className="text-xs text-gray-600">Valor: R$ 180,00</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Instalação chuveiro - Ed. Central</p>
                <Badge variant="outline">Amanhã</Badge>
              </div>
              <p className="text-xs text-gray-500">09:00 - Apto 1205 - João Santos</p>
              <p className="text-xs text-gray-600">Valor: R$ 320,00</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">Manutenção bomba - Jardins</p>
                <Badge variant="secondary">Sex 19/01</Badge>
              </div>
              <p className="text-xs text-gray-500">08:00 - Casa de máquinas - Maria Silva</p>
              <p className="text-xs text-gray-600">Valor: R$ 450,00</p>
            </div>
          </CardContent>
        </Card>

        {/* Desempenho da Equipe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Desempenho da Equipe
            </CardTitle>
            <CardDescription>
              Estatísticas dos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Serviços Concluídos</p>
                <p className="text-xs text-gray-500">Pela equipe</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">47</p>
                <p className="text-xs text-green-600">+12% vs mês anterior</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Avaliação Média</p>
                <p className="text-xs text-gray-500">Dos funcionários</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">4.7</p>
                <p className="text-xs text-blue-600">Meta: &gt; 4.5</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Tempo Médio</p>
                <p className="text-xs text-gray-500">Por serviço</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">2.1h</p>
                <p className="text-xs text-purple-600">Dentro do esperado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}