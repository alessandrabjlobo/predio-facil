import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useCondominioAtual } from "@/hooks/useCondominioAtual";

/**
 * Importante: NÃO renderize <BrowserRouter> aqui.
 * O Router único fica em src/main.tsx.
 */
export default function Layout({ children }: { children?: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(collapsed));
  }, [collapsed]);

  const toggleCollapse = () => setCollapsed(!collapsed);

  // 🔑 Quando o condomínio mudar, o `key` abaixo força o remount da árvore,
  // garantindo que páginas e hooks recarreguem dados do condomínio selecionado.
  const { condominio } = useCondominioAtual();
  const condoKey = condominio?.id ?? "no-condo";

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col" key={condoKey}>
        <Header onToggleCollapse={toggleCollapse} />
        <main className="flex-1 overflow-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
