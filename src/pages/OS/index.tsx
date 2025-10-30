import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wrench, Plus } from "lucide-react";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";
import { CondominioSwitcher } from "@/components/CondominioSwitcher";
import { OSFilters } from "@/components/maintenance/OSFilters";
import { OSDrawer } from "@/components/maintenance/OSDrawer";
import { EmptyState } from "@/components/patterns/EmptyState";
import { KPICards } from "@/components/patterns/KPICards";
import { fetchOSList, fetchOSResumo } from "@/lib/queries/maintenance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    aberta: "bg-blue-100 text-blue-800",
    em_andamento: "bg-yellow-100 text-yellow-800",
    aguardando_validacao: "bg-purple-100 text-purple-800",
    concluida: "bg-green-100 text-green-800",
    cancelada: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export default function OSPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { condominio } = useCondominioAtual();

  const [osList, setOsList] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filtros e paginação
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState<string[]>(
    searchParams.get("status")?.split(",").filter(Boolean) || []
  );
  const [dateRange, setDateRange] = useState({
    start: searchParams.get("dataInicio") || "",
    end: searchParams.get("dataFim") || "",
  });
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "0")
  );
  const [pageSize] = useState(20);

  const debouncedSearch = useDebounce(search, 300);

  // Atualizar URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (selectedStatus.length) params.set("status", selectedStatus.join(","));
    if (dateRange.start) params.set("dataInicio", dateRange.start);
    if (dateRange.end) params.set("dataFim", dateRange.end);
    if (currentPage > 0) params.set("page", currentPage.toString());

    setSearchParams(params);
  }, [
    debouncedSearch,
    selectedStatus,
    dateRange,
    currentPage,
    setSearchParams,
  ]);

  // Buscar resumo (KPIs)
  useEffect(() => {
    if (!condominio?.id) {
      setResumo(null);
      return;
    }

    fetchOSResumo(condominio.id)
      .then(({ data, error }) => {
        if (error) throw error;
        setResumo(data?.[0] || null);
      })
      .catch((err) => {
        console.error("Erro ao carregar resumo de OS:", err);
        setResumo(null);
      });
  }, [condominio?.id]);

  // Buscar lista de OS
  useEffect(() => {
    if (!condominio?.id) {
      setOsList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchOSList(
      condominio.id,
      {
        search: debouncedSearch,
        status: selectedStatus,
        dataInicio: dateRange.start,
        dataFim: dateRange.end,
      },
      currentPage,
      pageSize
    )
      .then(({ data, error, count }) => {
        if (error) throw error;
        setOsList(data || []);
        setTotalCount(count || 0);
      })
      .catch((err) => {
        console.error("Erro ao carregar OS:", err);
        setOsList([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [
    condominio?.id,
    debouncedSearch,
    selectedStatus,
    dateRange,
    currentPage,
    pageSize,
  ]);

  const handleRowClick = (os: any) => {
    setSelectedOS(os);
    setDrawerOpen(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const kpiData = resumo
    ? [
        { label: "Total de OS", value: resumo.total_os || 0 },
        { label: "Abertas", value: resumo.abertas || 0 },
        { label: "Em Andamento", value: resumo.em_andamento || 0 },
        { label: "Concluídas", value: resumo.concluidas || 0 },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Gerencie e acompanhe todas as ordens de serviço"
        icon={Wrench}
        actions={
          <>
            <CondominioSwitcher />
            <Button onClick={() => navigate("/os/novo")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova OS
            </Button>
          </>
        }
      />

      {/* KPIs */}
      {resumo && <KPICards data={kpiData} />}

      <OSFilters
        onSearchChange={setSearch}
        onStatusChange={setSelectedStatus}
        onDateRangeChange={(start, end) => setDateRange({ start, end })}
        selectedStatus={selectedStatus}
        dateRange={dateRange}
      />

      <Card>
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : osList.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-12 w-12 text-muted-foreground" />}
            title="Nenhuma OS encontrada"
            description="Não há ordens de serviço com os filtros selecionados."
            action={{
              label: "Nova OS",
              onClick: () => navigate("/os/novo"),
            }}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Chamado</TableHead>
                  <TableHead>Condomínio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início Previsto</TableHead>
                  <TableHead>Fim Previsto</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {osList.map((os) => (
                  <TableRow
                    key={os.id}
                    onClick={() => handleRowClick(os)}
                    className="cursor-pointer hover:bg-accent/50"
                  >
                    <TableCell className="font-medium">{os.numero || "-"}</TableCell>
                    <TableCell>{os.chamado_titulo || "Sem título"}</TableCell>
                    <TableCell>{os.condominio_nome}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(os.status)}>
                        {os.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {os.inicio_prev
                        ? format(new Date(os.inicio_prev), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {os.fim_prev
                        ? format(new Date(os.fim_prev), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {os.custo_total !== null && os.custo_total !== undefined
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(os.custo_total)
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        className={
                          currentPage === 0
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum =
                        totalPages <= 5
                          ? i
                          : Math.max(
                              0,
                              Math.min(currentPage - 2, totalPages - 5)
                            ) + i;

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        className={
                          currentPage >= totalPages - 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card>

      <OSDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} os={selectedOS} />
    </div>
  );
}
