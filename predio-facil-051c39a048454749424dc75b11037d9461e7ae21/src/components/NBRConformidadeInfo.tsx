import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Calendar, CheckCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function NBRConformidadeInfo() {
  const sistemas = [
    {
      nome: "SPDA (Para-raios)",
      requisitos: [
        {
          tipo: "Inspeção Anual de SPDA",
          periodicidade: "1 ano",
          documentos: ["Laudo técnico", "ART", "Relatório fotográfico"],
          normas: "NBR 5419 - Proteção contra descargas atmosféricas",
          items: [
            "Verificação visual de todos os captores",
            "Medição de resistência de aterramento (deve ser ≤ 10Ω)",
            "Inspeção de cabos de descida",
            "Verificação de conexões e emendas",
            "Teste de continuidade elétrica do sistema",
            "Verificação de oxid ação e corrosão",
            "Emissão de laudo técnico assinado por engenheiro"
          ]
        }
      ]
    },
    {
      nome: "Piscina",
      requisitos: [
        {
          tipo: "Tratamento e Análise de Água",
          periodicidade: "Diário (tratamento) / Semanal (análise)",
          documentos: ["Planilha de controle", "Laudo laboratorial semanal"],
          normas: "Portaria CVS 12/2015 e NBR 10818",
          items: [
            "Medição de pH (deve estar entre 7,2 e 7,8)",
            "Medição de cloro residual livre (1,0 a 3,0 mg/L)",
            "Análise de turbidez da água",
            "Controle de temperatura",
            "Limpeza de filtros",
            "Análise bacteriológica semanal (laboratório)",
            "Registro em planilha de controle diário"
          ]
        }
      ]
    },
    {
      nome: "Porta Corta-Fogo",
      requisitos: [
        {
          tipo: "Inspeção Semestral de Portas Corta-Fogo",
          periodicidade: "6 meses",
          documentos: ["Laudo técnico", "Relatório fotográfico", "Checklist"],
          normas: "NBR 11742 - Porta corta-fogo para saída de emergência",
          items: [
            "Verificação de abertura e fechamento automático",
            "Teste de mola de retorno (fechamento em até 15 segundos)",
            "Inspeção de dobradiças e ferragens",
            "Verificação de intumescente (borracha expansiva)",
            "Teste de travamento da barra antipânico",
            "Verificação de sinalizações e identificações",
            "Inspeção de vedação e integridade da porta"
          ]
        }
      ]
    },
    {
      nome: "Elevador",
      requisitos: [
        {
          tipo: "Manutenção Mensal",
          periodicidade: "30 dias",
          documentos: ["Laudo técnico", "Fotos", "Nota Fiscal"],
          normas: "NBR 16042 e NR-12",
          items: [
            "Teste de todos os dispositivos de segurança",
            "Verificação de desgaste das guias",
            "Inspeção do sistema de freios",
            "Verificação de cabos de tração",
            "Teste de comunicação de emergência"
          ]
        },
        {
          tipo: "Manutenção Trimestral",
          periodicidade: "90 dias",
          documentos: ["Laudo técnico", "Fotos"],
          normas: "NBR 16042",
          items: [
            "Verificação completa do sistema de segurança",
            "Medição de isolamento elétrico",
            "Inspeção de rolamentos",
            "Verificação de nivelamento",
            "Teste de velocidade"
          ]
        },
        {
          tipo: "Manutenção Anual",
          periodicidade: "365 dias",
          documentos: ["Laudo técnico", "ART", "Nota Fiscal"],
          normas: "NBR 16042",
          items: [
            "Inspeção completa de todos os componentes",
            "Teste de carga",
            "Verificação de todos os dispositivos de segurança",
            "Atualização de registros",
            "Emissão de laudo técnico"
          ]
        }
      ]
    },
    {
      nome: "Sistema Hidráulico",
      requisitos: [
        {
          tipo: "Limpeza de Reservatório",
          periodicidade: "6 meses",
          documentos: ["Laudo bacteriológico", "Fotos", "Nota Fiscal"],
          normas: "Portaria 2914/2011 Ministério da Saúde",
          items: [
            "Esvaziamento do reservatório",
            "Limpeza completa com produtos adequados",
            "Desinfecção com cloro",
            "Coleta de amostra para análise bacteriológica",
            "Emissão de laudo de qualidade da água"
          ]
        },
        {
          tipo: "Manutenção de Bombas",
          periodicidade: "1 mês",
          documentos: ["Fotos", "Checklist"],
          normas: "NBR 5626",
          items: [
            "Verificação de funcionamento",
            "Inspeção de vazamentos",
            "Lubrificação de componentes",
            "Teste de pressão",
            "Verificação de ruídos anormais"
          ]
        }
      ]
    },
    {
      nome: "Sistema Elétrico",
      requisitos: [
        {
          tipo: "Manutenção de Quadros Elétricos",
          periodicidade: "1 ano",
          documentos: ["Laudo técnico", "Termografia", "ART"],
          normas: "NR-10 e NBR 5410",
          items: [
            "Termografia de componentes",
            "Verificação de aperto de conexões",
            "Limpeza interna completa",
            "Teste de disjuntores e dispositivos",
            "Medição de isolamento",
            "Emissão de laudo técnico"
          ]
        },
        {
          tipo: "Teste de Gerador",
          periodicidade: "1 mês",
          documentos: ["Relatório", "Fotos"],
          normas: "NBR 13434",
          items: [
            "Teste de partida automática",
            "Verificação de nível de óleo",
            "Verificação de nível de combustível",
            "Inspeção visual de vazamentos",
            "Teste de transferência de carga"
          ]
        }
      ]
    },
    {
      nome: "Central de Gás",
      requisitos: [
        {
          tipo: "Inspeção de Central de Gás",
          periodicidade: "1 mês",
          documentos: ["Laudo", "Fotos"],
          normas: "NBR 13523",
          items: [
            "Verificação de vazamentos com detector",
            "Inspeção de válvulas",
            "Teste de manômetros",
            "Verificação de ventilação",
            "Inspeção de tubulações"
          ]
        }
      ]
    },
    {
      nome: "Sistema de Combate a Incêndio",
      requisitos: [
        {
          tipo: "Inspeção de Extintores",
          periodicidade: "1 mês",
          documentos: ["Etiqueta de inspeção"],
          normas: "NBR 12962",
          items: [
            "Verificação de estado do lacre",
            "Inspeção visual do equipamento",
            "Verificação de pressão do manômetro",
            "Verificação de data de validade da carga"
          ]
        },
        {
          tipo: "Recarga de Extintores",
          periodicidade: "1 ano (ou conforme vencimento)",
          documentos: ["Nota Fiscal", "Certificado de recarga"],
          normas: "NBR 12962",
          items: [
            "Recarga completa do extintor",
            "Teste hidrostático (quando aplicável)",
            "Emissão de certificado",
            "Aplicação de nova etiqueta"
          ]
        },
        {
          tipo: "Teste de Hidrantes e Sprinklers",
          periodicidade: "6 meses",
          documentos: ["Laudo técnico", "Fotos"],
          normas: "NBR 13714",
          items: [
            "Teste de vazão",
            "Verificação de pressão",
            "Inspeção de mangueiras",
            "Teste de alarmes",
            "Verificação de válvulas"
          ]
        }
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Requisitos de Conformidade NBR 5674
        </CardTitle>
        <CardDescription>
          Documentação obrigatória e comprovações necessárias para manutenção predial
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            O que a NBR 5674 exige?
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            A NBR 5674 estabelece requisitos para o sistema de gestão de manutenção de edificações, 
            garantindo a preservação da vida útil e segurança das construções. A norma exige manutenção de 
            <strong> TODOS os sistemas da edificação</strong>. Abaixo listamos os mais críticos e frequentemente auditados.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p><strong>Organização:</strong> Todas as manutenções devem ser planejadas e documentadas</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p><strong>Comprovação:</strong> Laudos técnicos, ARTs e notas fiscais devem ser mantidos</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p><strong>Periodicidade:</strong> Manutenções devem seguir prazos estabelecidos por normas</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p><strong>Responsabilidade:</strong> Profissionais habilitados devem executar e assinar laudos</p>
            </div>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {sistemas.map((sistema, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{sistema.nome}</span>
                  <Badge variant="outline">{sistema.requisitos.length} requisitos</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {sistema.requisitos.map((req, reqIdx) => (
                    <Card key={reqIdx}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{req.tipo}</CardTitle>
                            <CardDescription className="mt-1">
                              {req.normas}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {req.periodicidade}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h5 className="text-sm font-semibold mb-2">Documentos Necessários:</h5>
                          <div className="flex gap-2 flex-wrap">
                            {req.documentos.map((doc, docIdx) => (
                              <Badge key={docIdx} variant="outline">
                                <FileText className="h-3 w-3 mr-1" />
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-semibold mb-2">Itens Verificados:</h5>
                          <ul className="space-y-1">
                            {req.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mt-4">
          <h4 className="font-semibold mb-2 text-orange-900 dark:text-orange-100">
            ⚠️ Importante
          </h4>
          <ul className="space-y-1 text-sm text-orange-800 dark:text-orange-200">
            <li>• Todos os laudos devem ser assinados por profissionais habilitados (engenheiros com CREA)</li>
            <li>• As ARTs (Anotações de Responsabilidade Técnica) devem ser recolhidas no CREA</li>
            <li>• Documentação deve ficar arquivada por no mínimo 5 anos</li>
            <li>• Em fiscalização, a falta de documentação pode gerar multas e interdições</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
