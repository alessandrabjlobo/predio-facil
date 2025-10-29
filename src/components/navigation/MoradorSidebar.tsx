import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  Bell,
  User,
  type LucideIcon,
} from "lucide-react";

type NavItem = { name: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

interface MoradorSidebarProps {
  collapsed: boolean;
  isActive: (href: string) => boolean;
}

export function MoradorSidebar({ collapsed, isActive }: MoradorSidebarProps) {
  const navigationGroups: NavGroup[] = [
    {
      label: "Meus Serviços",
      items: [
        { name: "Minhas Solicitações", href: "/morador/solicitacoes", icon: MessageSquare },
        { name: "Notificações", href: "/morador/notificacoes", icon: Bell },
      ],
    },
    {
      label: "Configurações",
      items: [{ name: "Perfil", href: "/morador/perfil", icon: User }],
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
