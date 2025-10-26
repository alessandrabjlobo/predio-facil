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
import TenantIndex from "@/pages/TenantIndex";
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
import Manutencoes from "@/pages/Manutencoes"; // ✅ novo import

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
              {/* Rotas públicas */}
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

              {/* Rotas protegidas */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<TenantIndex />} />

                {/* Admin Master (apenas owner) */}
                <Route
                  path="admin"
                  element={
                    <RequireOwner>
                      <AdminMaster />
                    </RequireOwner>
                  }
                />

                {/* Condomínio Detalhe */}
                <Route path="condominios/:id" element={<CondominioDetalhe />} />

                {/* Ativo Detalhe */}
                <Route path="ativos/:id" element={<AtivoDetalhe />} />

                {/* Síndico/Admin de condomínio */}
                <Route
                  path="dashboard/sindico"
                  element={
                    <RequireRole allowed={["sindico", "admin"]}>
                      <Dashboard />
                    </RequireRole>
                  }
                />

                {/* ✅ Nova rota: Manutenções */}
                <Route
                  path="manutencoes"
                  element={
                    <RequireRole allowed={["sindico", "admin"]}>
                      <Manutencoes />
                    </RequireRole>
                  }
                />

                {/* Módulos */}
                <Route path="ativos" element={<Ativos />} />
                <Route path="os" element={<OS />} />
                <Route path="conformidade" element={<Conformidade />} />
                <Route path="preventivas" element={<Preventivas />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="config" element={<Configuracoes />} />
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
