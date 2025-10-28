import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Wrench,
  ClipboardList,
  Calendar,
  ShieldCheck,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

type NavItem = { name: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

interface SindicoSidebarProps {
  collapsed: boolean;
  isActive: (href: string) => boolean;
}

export function SindicoSidebar({ collapsed, isActive }: SindicoSidebarProps) {
  const navigationGroups: NavGroup[] = [
    {
      label: "Painel",
      items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }],
    },
    {
      label: "Gestão de Ativos",
      items: [
        { name: "Ativos", href: "/manutencao-predial?tab=ativos", icon: Package },
      ],
    },
    {
      label: "Manutenção Predial",
      items: [
        { name: "Planos Preventivos", href: "/manutencao-predial?tab=planos", icon: Wrench },
        { name: "Ordens de Serviço", href: "/manutencao-predial?tab=os", icon: ClipboardList },
        { name: "Agenda", href: "/manutencao-predial?tab=agenda", icon: Calendar },
        { name: "Conformidade", href: "/manutencao-predial?tab=relatorios", icon: ShieldCheck },
      ],
    },
    {
      label: "Sistema",
      items: [
        { name: "Relatórios", href: "/relatorios", icon: FileText },
        { name: "Configurações", href: "/configuracoes", icon: Settings },
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
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
