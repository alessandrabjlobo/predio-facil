import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Building2, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "./navigation/AdminSidebar";
import { SindicoSidebar } from "./navigation/SindicoSidebar";
import { FuncionarioSidebar } from "./navigation/FuncionarioSidebar";
import { FornecedorSidebar } from "./navigation/FornecedorSidebar";
import { MoradorSidebar } from "./navigation/MoradorSidebar";

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useUserRole();
  const [userName, setUserName] = useState<string>("Usuário");

  useEffect(() => {
    (async () => {
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp.user;

      if (user?.id) {
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("nome")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        const nm =
          perfil?.nome ||
          (user?.user_metadata?.nome as string) ||
          (user?.user_metadata?.name as string) ||
          user?.email?.split("@")[0] ||
          "Usuário";
        setUserName(nm);
      }
    })();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const isActive = (href: string) => {
    const currentPath = location.pathname;
    const currentSearch = new URLSearchParams(location.search);
    const [hrefPath, hrefQuery] = href.split('?');

    // Exact match for root and admin
    if (hrefPath === "/" || hrefPath === "/admin") return currentPath === hrefPath;

    // If link uses tab param, require both path and tab to match
    if (hrefQuery && hrefQuery.includes('tab=')) {
      const params = new URLSearchParams(hrefQuery);
      const tab = params.get('tab');
      return currentPath === hrefPath && currentSearch.get('tab') === tab;
    }

    // Default: startsWith for nested routes
    return currentPath.startsWith(hrefPath);
  };

  // Render appropriate sidebar based on role
  const renderNavigation = () => {
    switch (role) {
      case "owner":
      case "admin":
        return <AdminSidebar collapsed={collapsed} isActive={isActive} />;
      case "sindico":
        return <SindicoSidebar collapsed={collapsed} isActive={isActive} />;
      case "funcionario":
      case "zelador":
        return <FuncionarioSidebar collapsed={collapsed} isActive={isActive} />;
      case "fornecedor":
        return <FornecedorSidebar collapsed={collapsed} isActive={isActive} />;
      case "morador":
        return <MoradorSidebar collapsed={collapsed} isActive={isActive} />;
      default:
        return null;
    }
  };

  return (
    <div className={`${collapsed ? "w-16" : "w-64"} bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 h-screen sticky top-0 shadow-lg`}>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-accent/30">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          {!collapsed && <span className="font-bold text-lg">Prédio Fácil</span>}
        </div>
      </div>

      {/* Navegação */}
      {renderNavigation()}

      {/* Footer: User info */}
      <div className="mt-auto border-t border-sidebar-accent/30 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{userName || "Usuário"}</div>
              <div className="text-xs opacity-80 truncate capitalize">{role || "..."}</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        )}
      </div>
    </div>
  );
}
