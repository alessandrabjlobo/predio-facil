import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function NBRKnowledgeBase() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <CardTitle>Base de Conhecimento NBR 5674</CardTitle>
        </div>
        <CardDescription>
          Norma Brasileira de Manutenção de Edificações - Requisitos e Procedimentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="escopo">
            <AccordionTrigger>1. Escopo e Aplicação</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                <p>A NBR 5674 estabelece os requisitos para o sistema de gestão da manutenção de edificações.</p>
                <h4>Objetivo:</h4>
                <ul>
                  <li>Preservar características e desempenho da edificação</li>
                  <li>Atender requisitos de segurança dos usuários</li>
                  <li>Manter ou recuperar a capacidade funcional e suas características</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="papeis">
            <AccordionTrigger>2. Papéis e Responsabilidades</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                <h4>Responsáveis:</h4>
                <ul>
                  <li><strong>Proprietário/Síndico:</strong> Responsável pela gestão e execução da manutenção</li>
                  <li><strong>Gestor de Manutenção:</strong> Elabora e executa o plano de manutenção</li>
                  <li><strong>Terceiros Especializados:</strong> Executam serviços específicos</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="inventario">
            <AccordionTrigger>3. Inventário e Criticidade</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                <p>Identificação de todos os sistemas, equipamentos e elementos da edificação.</p>
                <h4>Níveis de Criticidade:</h4>
                <ul>
                  <li><strong>Crítico:</strong> Afeta segurança ou operação essencial</li>
                  <li><strong>Importante:</strong> Afeta conforto ou funcionalidade</li>
                  <li><strong>Normal:</strong> Manutenção regular</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="planejamento">
            <AccordionTrigger>4. Tipos de Manutenção</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                <h4>Preventiva:</h4>
                <p>Ações programadas para prevenir falhas e deterioração.</p>
                
                <h4>Corretiva:</h4>
                <p>Ações para corrigir falhas ou desempenho insatisfatório.</p>
                
                <h4>Preditiva:</h4>
                <p>Monitoramento de condições para prever necessidade de intervenção.</p>
                
                <h4>Emergencial:</h4>
                <p>Ações imediatas para risco iminente à segurança.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="periodicidades">
            <AccordionTrigger>5. Periodicidades Recomendadas</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                <h4>SPDA (Sistema de Proteção contra Descargas Atmosféricas):</h4>
                <p>Inspeção visual: anual | Medição de resistência: anual</p>
                
                <h4>Elevadores:</h4>
                <p>Manutenção preventiva: mensal | Inspeção de segurança: semestral</p>
                
                <h4>Incêndio:</h4>
                <p>Extintores: mensal (visual), anual (recarga/teste) | Hidrantes: semestral</p>
                
                <h4>Reservatórios:</h4>
                <p>Limpeza: semestral | Inspeção estrutural: anual</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="registros">
            <AccordionTrigger>6. Registros e Rastreabilidade</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                <p>Todos os serviços de manutenção devem ser registrados, incluindo:</p>
                <ul>
                  <li>Data e horário da execução</li>
                  <li>Responsável pela execução</li>
                  <li>Descrição dos serviços realizados</li>
                  <li>Materiais e peças utilizadas</li>
                  <li>Evidências fotográficas</li>
                  <li>Laudos técnicos quando aplicável</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="kpis">
            <AccordionTrigger>7. KPIs e Indicadores</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                <h4>Indicadores Principais:</h4>
                <ul>
                  <li>Taxa de conformidade (% itens em dia)</li>
                  <li>Tempo médio entre falhas (MTBF)</li>
                  <li>Tempo médio de reparo (MTTR)</li>
                  <li>Custo de manutenção / valor patrimonial</li>
                  <li>Backlog de manutenção</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="requisitos">
            <AccordionTrigger>9. Requisitos Legais e Inspeções Mandatórias</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                <h4>Inspeções Obrigatórias:</h4>
                <ul>
                  <li>AVCB (Auto de Vistoria do Corpo de Bombeiros) - anual</li>
                  <li>SPDA - anual</li>
                  <li>Elevadores - mensal (NR-12)</li>
                  <li>Inspeção Predial - a cada 5 anos (recomendado)</li>
                  <li>GLP (Gás Liquefeito de Petróleo) - conforme norma local</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="documentacao">
            <AccordionTrigger>15. Documentação Mínima Obrigatória</AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none">
                <h4>Documentos Essenciais:</h4>
                <ul>
                  <li>Manual do Proprietário</li>
                  <li>Plantas as-built</li>
                  <li>ARTs/RRTs de projetos e execução</li>
                  <li>Laudos técnicos periódicos</li>
                  <li>Certificados de garantia</li>
                  <li>Registro de manutenções executadas</li>
                  <li>AVCB vigente</li>
                  <li>Licenças de operação de equipamentos</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
