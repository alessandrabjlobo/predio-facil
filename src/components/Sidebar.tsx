import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  Wrench,
  Users,
  Package,
  Settings,
  LogOut,
  ShieldCheck,
  ClipboardList,
  FileText,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useCondominiosDoUsuario } from "@/hooks/useCondominiosDoUsuario";
import { getCurrentCondominioId, setCurrentCondominioId } from "@/lib/tenant";

type NavItem = { name: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const [userName, setUserName] = useState<string>("Usuário");
  const { rows, loading } = useCondominiosDoUsuario();
  const ids = useMemo(() => rows.map(r => r.condominio_id), [rows]);
  const [current, setCurrent] = useState<string | null>(getCurrentCondominioId());

  const navigationGroups: NavGroup[] = useMemo(() => {
    if (role === "owner") {
      return [
        {
          label: "Dashboard",
          items: [
            { name: "Painel do Dono", href: "/owner", icon: LayoutDashboard },
            { name: "Condomínios", href: "/owner/condominios", icon: Building2 },
            { name: "Usuários", href: "/owner/usuarios", icon: Users },
          ],
        },
      ];
    }

    if (role === "admin") {
      return [
        {
          label: "Dashboard",
          items: [{ name: "Visão Geral", href: "/", icon: LayoutDashboard }],
        },
        {
          label: "Operacional",
          items: [
            { name: "Usuários", href: "/usuarios", icon: Users },
            { name: "Relatórios", href: "/relatorios", icon: FileText },
          ],
        },
        {
          label: "Ativos",
          items: [{ name: "Gestão de Ativos", href: "/ativos", icon: Package }],
        },
        {
          label: "Configurações",
          items: [{ name: "Configurações", href: "/configuracoes", icon: Settings }],
        },
      ];
    }

    if (role === "sindico") {
      return [
        {
          label: "Dashboard",
          items: [{ name: "Visão Geral", href: "/", icon: LayoutDashboard }],
        },
        {
          label: "Operacional",
          items: [
            { name: "Ordens de Serviço", href: "/os", icon: ClipboardList },
            { name: "Conformidades", href: "/conformidade", icon: ShieldCheck },
            { name: "Chamados", href: "/chamados", icon: Wrench },
          ],
        },
        {
          label: "Ativos",
          items: [{ name: "Gestão de Ativos", href: "/ativos", icon: Package }],
        },
        {
          label: "Configurações",
          items: [
            { name: "Relatórios", href: "/relatorios", icon: FileText },
            { name: "Configurações", href: "/configuracoes", icon: Settings },
          ],
        },
      ];
    }

    if (role === "funcionario" || role === "zelador") {
      return [
        {
          label: "Dashboard",
          items: [{ name: "Visão Geral", href: "/", icon: LayoutDashboard }],
        },
        {
          label: "Operacional",
          items: [
            { name: "Chamados", href: "/chamados", icon: Wrench },
          ],
        },
        {
          label: "Ativos",
          items: [{ name: "Ativos", href: "/ativos", icon: Package }],
        },
      ];
    }

    return [
      {
        label: "Dashboard",
        items: [{ name: "Visão Geral", href: "/", icon: LayoutDashboard }],
      },
    ];
  }, [role]);

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

  useEffect(() => {
    if (!loading) {
      if (!current || (ids.length && !ids.includes(current))) {
        const fallback = ids[0] ?? null;
        if (fallback) {
          setCurrent(fallback);
          setCurrentCondominioId(fallback);
        }
      }
    }
  }, [loading, ids.join(","), current]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const currentCondoName = rows.find(r => r.condominio_id === current)?.condominios?.nome || "Selecione";

  return (
    <div
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-white shadow-sm border-r flex flex-col transition-all duration-300`}
    >
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-primary flex-shrink-0" />
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-foreground">CondoMaintain</h1>
              <p className="text-xs text-muted-foreground">Gestão de Manutenções</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === "/"}
                  className={({ isActive }) =>
                    `flex items-center ${
                      collapsed ? "justify-center" : "space-x-3"
                    } px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t space-y-3">
        {/* Condominium Selector */}
        {!collapsed && role !== "owner" && (
          <div className="mb-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Condomínio
            </label>
            <div className="relative">
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground appearance-none pr-8"
                disabled={loading || rows.length === 0}
                value={current ?? ""}
                onChange={(e) => {
                  setCurrent(e.target.value);
                  setCurrentCondominioId(e.target.value);
                }}
              >
                {rows.map((r) => (
                  <option key={r.condominio_id} value={r.condominio_id}>
                    {r.condominios?.nome ?? r.condominio_id}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}

        {/* User Info */}
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {role === "owner"
                ? "Dono do Sistema"
                : role === "admin"
                ? "Administrador"
                : role === "sindico"
                ? "Síndico"
                : role === "funcionario" || role === "zelador"
                ? "Funcionário"
                : "Usuário"}
            </p>
          </div>
        )}

        {/* Logout Button */}
        <button
          className={`w-full flex items-center ${
            collapsed ? "justify-center" : "gap-2"
          } rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors`}
          onClick={handleLogout}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}
