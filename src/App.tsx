// src/App.tsx
import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RequireRole from "@/components/RequireRole";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";

// Páginas existentes
import Dashboard from "@/pages/Dashboard";
import Chamados from "@/pages/Chamados";
import NovoTicket from "@/components/NovoTicket";
import ChamadoDetalhe from "@/pages/ChamadoDetalhe";
import Marketplace from "@/pages/Marketplace";
import Ativos from "@/pages/Ativos";
import Relatorios from "@/pages/Relatorios";
import DashboardFuncionario from "@/pages/DashboardFuncionario";
import DashboardFornecedor from "@/pages/DashboardFornecedor";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import Conformidade from "@/pages/Conformidade";
import ConfiguracoesPage from "@/pages/Configuracoes";
import Preventivas from "@/pages/Preventivas";
import DashboardAdmin from "@/pages/DashboardAdmin";
import Fornecedores from "@/pages/Fornecedores";
import Programacao from "@/pages/Programacao";

// Ordens de Serviço
import OS from "@/pages/OS";
import OSNovo from "@/pages/OSNovo";

// Agenda unificada
import Agenda from "@/pages/agenda";

// Novas páginas do fluxo multi-tenant/owner
import OwnerPage from "@/pages/Owner";
import SetPasswordPage from "@/pages/SetPassword";
import TenantIndex from "@/pages/TenantIndex";
import CondominiosCadastroPage from "@/pages/CondominiosCadastro";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
            <Routes>
              {/* ================= Rotas públicas ================= */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <SignUp />
                  </PublicOnlyRoute>
                }
              />

              {/* Definir senha após convite */}
              <Route path="/auth/set-password" element={<SetPasswordPage />} />

              {/* ================= Rotas protegidas ================= */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Index: roteamento inteligente baseado no papel */}
                <Route index element={<TenantIndex />} />

                {/* Dashboards específicos por papel */}
                <Route path="dashboard">
                  <Route path="sindico" element={<Dashboard />} />
                  <Route 
                    path="admin" 
                    element={
                      <RequireRole allowed={["admin", "sindico"]}>
                        <DashboardAdmin />
                      </RequireRole>
                    } 
                  />
                  <Route 
                    path="funcionario" 
                    element={
                      <RequireRole allowed={["funcionario", "zelador", "sindico", "admin"]}>
                        <DashboardFuncionario />
                      </RequireRole>
                    } 
                  />
                  <Route 
                    path="fornecedor" 
                    element={
                      <RequireRole allowed={["fornecedor", "sindico", "admin"]}>
                        <DashboardFornecedor />
                      </RequireRole>
                    } 
                  />
                </Route>

                {/* Módulos principais */}
                <Route path="agenda" element={<Agenda />} />
                <Route path="chamados" element={<Chamados />} />
                <Route path="chamados/novo" element={<NovoTicket />} />
                <Route path="chamados/:id" element={<ChamadoDetalhe />} />
                <Route path="marketplace" element={<Marketplace />} />
                <Route path="ativos" element={<Ativos />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="configuracoes" element={<ConfiguracoesPage />} />
                <Route path="preventivas" element={<Preventivas />} />

                {/* Conformidade */}
                <Route
                  path="conformidade"
                  element={
                    <RequireRole allowed={["sindico", "funcionario", "conselho"]}>
                      <Conformidade />
                    </RequireRole>
                  }
                />

                {/* Ordens de Serviço */}
                <Route path="os" element={<OS />} />
                <Route path="os/novo" element={<OSNovo />} />

                {/* Fornecedores e Programação */}
                <Route path="fornecedores" element={<Fornecedores />} />
                <Route path="programacao" element={<Programacao />} />

                {/* Dono do Sistema */}
                <Route path="owner" element={<OwnerPage />} />
                <Route path="owner/condominios" element={<CondominiosCadastroPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toaster />
        <ShadcnToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
