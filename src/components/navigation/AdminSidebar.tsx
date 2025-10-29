import { NavLink } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  Users,
  Package,
  Settings,
  FileText,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type NavItem = { name: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

interface AdminSidebarProps {
  collapsed: boolean;
  isActive: (href: string) => boolean;
}

export function AdminSidebar({ collapsed, isActive }: AdminSidebarProps) {
  const navigationGroups: NavGroup[] = [
    {
      label: "Painel",
      items: [{ name: "Dashboard", href: "/admin", icon: LayoutDashboard }],
    },
    {
      label: "Gestão",
      items: [
        { name: "Condomínios", href: "/admin/condominios", icon: Building2 },
        { name: "Usuários", href: "/admin/usuarios", icon: Users },
      ],
    },
    {
      label: "Biblioteca Global",
      items: [
        { name: "Tipos de Ativos", href: "/admin/asset-library", icon: Package },
        { name: "Templates NBR", href: "/admin/maintenance-templates", icon: Wrench },
      ],
    },
    {
      label: "Sistema",
      items: [
        { name: "Relatórios", href: "/admin/relatorios", icon: FileText },
        { name: "Configurações", href: "/config", icon: Settings },
      ],
    },
  ];

  return (
    <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
      {navigationGroups.map((group) => (
        <Section
          key={group.label}
          label={group.label}
          collapsed={collapsed}
          items={group.items}
          isActive={isActive}
        />
      ))}
    </nav>
  );
}

function Section({
  label,
  items,
  collapsed,
  isActive,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  isActive: (href: string) => boolean;
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
            className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-muted"
            }`}
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
