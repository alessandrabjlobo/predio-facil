import { Star, MapPin, Phone, Mail, Award, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  categoria: string;
  avaliacao: number;
  totalAvaliacoes: number;
  localizacao: string;
  telefone: string;
  email: string;
  especialidades: string[];
  premium: boolean;
  tempoResposta: string;
  precoMedio: string;
  foto?: string;
}

const fornecedoresMock: Fornecedor[] = [
  {
    id: "1",
    nome: "HidroTech Soluções",
    cnpj: "12.345.678/0001-90",
    categoria: "Hidráulica",
    avaliacao: 4.8,
    totalAvaliacoes: 127,
    localizacao: "São Paulo, SP",
    telefone: "(11) 99999-9999",
    email: "contato@hidrotech.com.br",
    especialidades: ["Vazamentos", "Instalações", "Desentupimento"],
    premium: true,
    tempoResposta: "2h",
    precoMedio: "R$ 150-300"
  },
  {
    id: "2",
    nome: "EletroMax Serviços",
    cnpj: "98.765.432/0001-10",
    categoria: "Elétrica",
    avaliacao: 4.6,
    totalAvaliacoes: 89,
    localizacao: "São Paulo, SP",
    telefone: "(11) 88888-8888",
    email: "eletromax@email.com",
    especialidades: ["Instalações", "Manutenção", "Emergência 24h"],
    premium: false,
    tempoResposta: "4h",
    precoMedio: "R$ 100-250"
  },
  {
    id: "3",
    nome: "CleanPro Limpeza",
    cnpj: "11.222.333/0001-44",
    categoria: "Limpeza",
    avaliacao: 4.9,
    totalAvaliacoes: 203,
    localizacao: "São Paulo, SP",
    telefone: "(11) 77777-7777",
    email: "cleanpro@email.com",
    especialidades: ["Limpeza Geral", "Caixa D'água", "Pós-obra"],
    premium: true,
    tempoResposta: "1h",
    precoMedio: "R$ 80-200"
  }
];

export default function MarketplaceFornecedores() {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? "text-yellow-400 fill-current" 
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Marketplace de Fornecedores
        </h1>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input 
            placeholder="Buscar fornecedores..." 
            className="max-w-sm"
          />
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hidraulica">Hidráulica</SelectItem>
              <SelectItem value="eletrica">Elétrica</SelectItem>
              <SelectItem value="elevador">Elevador</SelectItem>
              <SelectItem value="limpeza">Limpeza</SelectItem>
              <SelectItem value="jardinagem">Jardinagem</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Avaliação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 estrelas</SelectItem>
              <SelectItem value="4">4+ estrelas</SelectItem>
              <SelectItem value="3">3+ estrelas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Fornecedores */}
      <div className="space-y-6">
        {fornecedoresMock.map((fornecedor) => (
          <Card key={fornecedor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Informações principais */}
                <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={fornecedor.foto} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                      {fornecedor.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {fornecedor.nome}
                      </h3>
                      {fornecedor.premium && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                          <Award className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 mb-2">
                      {renderStars(fornecedor.avaliacao)}
                      <span className="text-sm text-gray-600 ml-2">
                        {fornecedor.avaliacao} ({fornecedor.totalAvaliacoes} avaliações)
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {fornecedor.especialidades.map((esp, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {esp}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {fornecedor.localizacao}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Responde em {fornecedor.tempoResposta}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {fornecedor.telefone}
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">Preço médio: {fornecedor.precoMedio}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Ações */}
                <div className="flex flex-col space-y-2 lg:ml-4">
                  <Button className="w-full lg:w-auto">
                    Solicitar Orçamento
                  </Button>
                  <Button variant="outline" className="w-full lg:w-auto">
                    Ver Perfil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Call to Action para Fornecedores */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            É fornecedor? Cadastre-se agora!
          </h3>
          <p className="text-blue-700 mb-4">
            Conecte-se com centenas de condomínios e aumente seus negócios
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Cadastrar Empresa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}