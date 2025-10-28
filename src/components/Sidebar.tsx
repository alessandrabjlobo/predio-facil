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
    <div className={`${collapsed ? "w-16" : "w-64"} bg-white border-r border-border flex flex-col transition-all duration-300 h-screen sticky top-0`}>
      {/* Logo */}
      <div className="h-16 px-6 border-b border-border flex items-center">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold">CondoMaintain</h1>
              <p className="text-xs text-muted-foreground">NBR 5674</p>
            </div>
          )}
        </div>
      </div>

      {/* Navegação */}
      {renderNavigation()}

      {/* Rodapé - sem seletor de condomínio (evita duplicidade com Header) */}
      <div className="p-4 border-t border-border space-y-3">
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={`w-full ${collapsed ? 'justify-center' : 'justify-start'} text-destructive hover:text-destructive hover:bg-destructive/10`}
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </div>
    </div>
  );
}
