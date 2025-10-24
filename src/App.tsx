// src/App.tsx
import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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

// Ordens de Serviço
import OS from "@/pages/OS";
import OSNovo from "@/pages/OSNovo";

// Agenda unificada
import Agenda from "@/pages/agenda";

// ✅ Novas páginas do fluxo multi-tenant/owner
import OwnerPage from "@/pages/Owner";                     // Painel do Dono
import SetPasswordPage from "@/pages/SetPassword";         // Definir senha após convite
import TenantIndex from "@/pages/TenantIndex";             // Redireciona owner para /owner; demais para Dashboard
import CondominiosCadastroPage from "@/pages/CondominiosCadastro"; // Cadastro de condomínios (owner)

export default function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
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

        {/* ⚠️ Não usar PublicOnlyRoute aqui: o usuário chega autenticado via link do e-mail */}
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

          {/* ✅ Dono do Sistema */}
          <Route path="owner" element={<OwnerPage />} />
          <Route path="owner/condominios" element={<CondominiosCadastroPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
