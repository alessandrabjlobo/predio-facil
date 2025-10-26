import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Building2,
  LayoutDashboard,
  Users,
  Package,
  Settings,
  LogOut,
  ShieldCheck,
  ClipboardList,
  FileText,
  ChevronDown,
  Calendar,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useCondominiosDoUsuario } from "@/hooks/useCondominiosDoUsuario";
import { getCurrentCondominioId, setCurrentCondominioId } from "@/lib/tenant";
import { Button } from "@/components/ui/button";

type NavItem = { name: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

interface SidebarProps {
  collapsed: boolean;
}

const uniqueById = <T extends { condominio_id?: any; id?: any }>(arr: T[]) => {
  return Array.from(
    new Map(arr.map((x, i) => [String(x.condominio_id ?? x.id ?? i), x])).values()
  );
};

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const [userName, setUserName] = useState<string>("Usuário");

  const { rows, loading } = useCondominiosDoUsuario();
  const rowsDedupe = useMemo(() => uniqueById(rows || []), [rows]);
  const ids = useMemo(
    () => rowsDedupe.map((r) => String(r.condominio_id)),
    [rowsDedupe]
  );

  const [current, setCurrent] = useState<string | null>(getCurrentCondominioId());

  const navigationGroups: NavGroup[] = useMemo(() => {
    if (role === "owner" || role === "admin") {
      return [
        {
          label: "Painel",
          items: [{ name: "Dashboard", href: "/admin", icon: LayoutDashboard }],
        },
        {
          label: "Gestão",
          items: [
            { name: "Condomínios", href: "/admin?tab=condominios", icon: Building2 },
            { name: "Usuários", href: "/admin?tab=usuarios", icon: Users },
          ],
        },
        {
          label: "Operacional",
          items: [
            { name: "Ativos", href: "/ativos", icon: Package },
            { name: "Planos", href: "/preventivas", icon: ClipboardList },
            { name: "Ordens de Serviço", href: "/os", icon: ClipboardList },
            { name: "Conformidade", href: "/conformidade", icon: ShieldCheck },
          ],
        },
        {
          label: "Sistema",
          items: [
            { name: "Relatórios", href: "/relatorios", icon: FileText },
            { name: "Configurações", href: "/config", icon: Settings },
          ],
        },
      ];
    }

    if (role === "sindico") {
      return [
        {
          label: "Painel",
          items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }],
        },
        {
          label: "Operacional",
          items: [
            { name: "Ordens de Serviço", href: "/os", icon: ClipboardList },
            { name: "Conformidade", href: "/conformidade", icon: ShieldCheck },
            { name: "Agenda", href: "/agenda", icon: Calendar },
          ],
        },
        {
          label: "Gestão",
          items: [
            { name: "Ativos", href: "/ativos", icon: Package },
            { name: "Relatórios", href: "/relatorios", icon: FileText },
          ],
        },
        {
          label: "Sistema",
          items: [{ name: "Configurações", href: "/config", icon: Settings }],
        },
      ];
    }

    return [
      { label: "Painel", items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }] }
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
      if (!current || (ids.length && !ids.includes(String(current)))) {
        const fallback = ids[0] ?? null;
        if (fallback) {
          setCurrent(fallback);
          setCurrentCondominioId(fallback);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ids.join(","), current]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-white border-r border-border flex flex-col transition-all duration-300 h-screen sticky top-0`}
    >
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
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navigationGroups.map((group) => (
          <Section key={group.label} label={group.label} collapsed={collapsed} items={group.items} />
        ))}
      </nav>

      {/* Rodapé */}
      <div className="p-4 border-t border-border space-y-3">
        {/* Seletor de condomínio */}
        {!collapsed && role !== "owner" && role !== "admin" && (
          <div className="mb-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Condomínio
            </label>
            <div className="relative">
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground appearance-none pr-8"
                disabled={loading || rowsDedupe.length === 0}
                value={current ?? ""}
                onChange={(e) => {
                  setCurrent(e.target.value);
                  setCurrentCondominioId(e.target.value);
                }}
              >
                {rowsDedupe.map((r, idx) => (
                  <option key={`${r.condominio_id}-${idx}`} value={String(r.condominio_id)}>
                    {r.condominios?.nome ?? r.condominio_id}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}

        {/* Usuário */}
        {!collapsed && (
          <div className="mb-3">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        )}

        {/* Sair */}
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

function Section({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  if (!items.length) return null;
  return (
    <div>
      {!collapsed && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </h3>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.href}
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
  );
}
