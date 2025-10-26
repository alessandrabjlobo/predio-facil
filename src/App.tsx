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
import RequireOwner from "@/components/RequireOwner";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";

// Páginas
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import SetPasswordPage from "@/pages/SetPassword";
import TenantIndex from "@/pages/TenantIndex"; // pode remover se não usar
import AdminMaster from "@/pages/AdminMaster";
import Dashboard from "@/pages/Dashboard";
import Ativos from "@/pages/Ativos";
import OS from "@/pages/OS";
import Conformidade from "@/pages/Conformidade";
import Configuracoes from "@/pages/Configuracoes";
import Preventivas from "@/pages/Preventivas";
import Relatorios from "@/pages/Relatorios";
import CondominioDetalhe from "@/pages/CondominioDetalhe";
import AtivoDetalhe from "@/pages/AtivoDetalhe";
import HomeRedirect from "@/pages/HomeRedirect";
// (opcional) página de manutenções do síndico
// import Manutencoes from "@/pages/Manutencoes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
            <Routes>
              {/* Públicas */}
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
              <Route path="/auth/set-password" element={<SetPasswordPage />} />

              {/* Protegidas */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* 🔁 Decisor de dashboard por papel */}
                <Route index element={<HomeRedirect />} />

                {/* Admin Master (dono do sistema) */}
                <Route
                  path="admin"
                  element={
                    <RequireOwner>
                      <AdminMaster />
                    </RequireOwner>
                  }
                />

                {/* Dashboard do síndico */}
                <Route
                  path="dashboard/sindico"
                  element={
                    <RequireRole allowed={["sindico", "admin"]}>
                      <Dashboard />
                    </RequireRole>
                  }
                />

                {/* Demais módulos */}
                <Route path="condominios/:id" element={<CondominioDetalhe />} />
                <Route path="ativos/:id" element={<AtivoDetalhe />} />
                <Route path="ativos" element={<Ativos />} />
                <Route path="os" element={<OS />} />
                <Route path="conformidade" element={<Conformidade />} />
                <Route path="preventivas" element={<Preventivas />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="config" element={<Configuracoes />} />

                {/* (opcional) Manutenções na visão do síndico */}
                {/* <Route
                  path="manutencoes"
                  element={
                    <RequireRole allowed={["sindico", "admin"]}>
                      <Manutencoes />
                    </RequireRole>
                  }
                /> */}
              </Route>

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
