import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

/**
 * Importante: NÃO renderize <BrowserRouter> aqui.
 * O Router único fica em src/main.tsx.
 */
export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(collapsed));
  }, [collapsed]);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <div className="min-h-screen bg-gray-50 flex w-full">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col">
        <Header onToggleCollapse={toggleCollapse} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
