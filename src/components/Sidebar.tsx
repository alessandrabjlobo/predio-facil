// src/components/Sidebar.tsx
import { useEffect, useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Role = "sindico" | "funcionario" | "morador" | "fornecedor" | "conselho" | "unknown";
type NavItem = { name: string; href: string; icon: LucideIcon };

const baseNav: NavItem[] = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Chamados", href: "/chamados", icon: Wrench },
];

const navSindico: NavItem[] = [
  ...baseNav,
  { name: "Marketplace", href: "/marketplace", icon: Building2 },
  { name: "Fornecedores", href: "/fornecedor", icon: Users }, // ajuste se sua rota real for /fornecedores
  { name: "Ativos", href: "/ativos", icon: Package },
  { name: "Conformidade", href: "/conformidade", icon: ShieldCheck },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

const navFuncionario: NavItem[] = [
  ...baseNav,
  { name: "Ativos", href: "/ativos", icon: Package },
  { name: "Conformidade", href: "/conformidade", icon: ShieldCheck },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

const navConselho: NavItem[] = [
  ...baseNav,
  { name: "Conformidade", href: "/conformidade", icon: ShieldCheck },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

const navMorador: NavItem[] = [...baseNav];
const navFornecedor: NavItem[] = [...baseNav];

// ✅ Menu específico do Dono do Sistema (Owner)
const navOwner: NavItem[] = [
  { name: "Painel do Dono", href: "/owner", icon: Settings },
  { name: "Cadastrar Condomínios", href: "/owner/condominios", icon: Building2 },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("unknown");
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("Usuário");
  const [condoName, setCondoName] = useState<string>("Condomínio");

  useEffect(() => {
    (async () => {
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp.user;

      // descobre se é owner
      const { data: ownerFlag } = await supabase.rpc("is_system_owner");
      setIsOwner(!!ownerFlag);

      if (user?.id) {
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("nome, papel")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        const papel: Role =
          (perfil?.papel as Role) ||
          (user?.user_metadata?.papel as Role) ||
          (user?.user_metadata?.role as Role) ||
          "morador";
        setRole(papel);

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

  // ✅ se for Owner, ignora o papel do usuário e mostra SOMENTE o menu do Owner
  const navigation: NavItem[] = isOwner
    ? navOwner
    : role === "sindico"
    ? navSindico
    : role === "funcionario"
    ? navFuncionario
    : role === "conselho"
    ? navConselho
    : role === "fornecedor"
    ? navFornecedor
    : navMorador;

  const hasConfigInNav = navigation.some((n) => n.href === "/configuracoes");

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
              {isOwner ? "Painel do Dono" : "Sistema de Manutenção"}
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
            {isOwner
              ? "Dono do Sistema"
              : role === "unknown"
              ? "Usuário"
              : role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
          {!isOwner && <p className="text-xs text-gray-500">{condoName}</p>}
        </div>

        <div className="space-y-2">
          {/* Botão extra de Configurações no rodapé apenas se NÃO existe no menu principal (para não-owners) */}
          {!isOwner && !hasConfigInNav && (
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
