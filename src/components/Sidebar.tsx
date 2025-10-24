// src/components/Sidebar.tsx
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2,
  Home,
  Wrench,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Calendar,
  ClipboardList,
  Store,
  FileText,
  CheckSquare,
  TrendingUp,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

type NavItem = { name: string; href: string; icon: LucideIcon };

export default function Sidebar() {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();
  const [userName, setUserName] = useState<string>("Usuário");
  const [condoName, setCondoName] = useState<string>("Condomínio");

  const navigation: NavItem[] = useMemo(() => {
    const base = [
      { name: "Início", href: "/", icon: Home },
      { name: "Agenda", href: "/agenda", icon: Calendar },
    ];

    if (role === "owner") {
      return [
        { name: "Painel do Dono", href: "/owner", icon: Home },
        { name: "Condomínios", href: "/owner/condominios", icon: Building2 },
        { name: "Usuários", href: "/owner/usuarios", icon: Users },
      ];
    }

    if (role === "admin") {
      return [
        ...base,
        { name: "Usuários", href: "/usuarios", icon: Users },
        { name: "Ativos", href: "/ativos", icon: Package },
        { name: "Relatórios", href: "/relatorios", icon: FileText },
        { name: "Configurações", href: "/configuracoes", icon: Settings },
      ];
    }

    if (role === "sindico") {
      return [
        ...base,
        { name: "Chamados", href: "/chamados", icon: Wrench },
        { name: "Ordens de Serviço", href: "/os", icon: ClipboardList },
        { name: "Ativos", href: "/ativos", icon: Package },
        { name: "Preventivas", href: "/preventivas", icon: Calendar },
        { name: "Conformidade", href: "/conformidade", icon: ShieldCheck },
        { name: "Fornecedores", href: "/marketplace", icon: Store },
        { name: "Relatórios", href: "/relatorios", icon: FileText },
      ];
    }

    if (role === "funcionario" || role === "zelador") {
      return [
        ...base,
        { name: "Minhas Tarefas", href: "/minhas-tarefas", icon: CheckSquare },
        { name: "Chamados", href: "/chamados", icon: Wrench },
        { name: "Ativos", href: "/ativos", icon: Package },
      ];
    }

    if (role === "fornecedor") {
      return [
        ...base,
        { name: "Oportunidades", href: "/oportunidades", icon: TrendingUp },
        { name: "Minha Equipe", href: "/minha-equipe", icon: Users },
        { name: "Serviços", href: "/servicos", icon: Briefcase },
      ];
    }

    return base;
  }, [role]);

  const hasConfigInNav = navigation.some((n) => n.href === "/configuracoes");

  useMemo(() => {
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

      const cond =
        (user?.user_metadata?.condominio as string) ||
        (user?.user_metadata?.condominio_nome as string) ||
        "Seu Condomínio";
      setCondoName(cond);
    })();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="w-64 bg-white shadow-sm border-r flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-blue-600" />
        <div>
            <h1 className="text-xl font-bold text-gray-900">CondoMaint</h1>
            <p className="text-xs text-gray-500">
              {role === "owner" ? "Painel do Dono" : "Sistema de Manutenção"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500">
            {role === "owner"
              ? "Dono do Sistema"
              : role === "admin"
              ? "Administrador"
              : role === "sindico"
              ? "Síndico"
              : role === "funcionario" || role === "zelador"
              ? "Funcionário"
              : role === "fornecedor"
              ? "Fornecedor"
              : "Usuário"}
          </p>
          {role !== "owner" && <p className="text-xs text-gray-500">{condoName}</p>}
        </div>

        <div className="space-y-2">
          {/* Botão extra de Configurações no rodapé apenas se NÃO existe no menu principal */}
          {role !== "owner" && !hasConfigInNav && (
            <NavLink to="/configuracoes" className="w-full">
              <div className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100">
                <Settings className="h-4 w-4" />
                Configurações
              </div>
            </NavLink>
          )}

          <button
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
