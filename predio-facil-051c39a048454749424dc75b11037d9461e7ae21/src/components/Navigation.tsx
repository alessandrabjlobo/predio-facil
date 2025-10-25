import { LayoutDashboard, Wrench, Building2, ClipboardCheck, LogOut, Settings, Shield, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { CondominioSwitcher } from "./CondominioSwitcher";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { role } = useUserRole();
  
  const isOnIndexPage = location.pathname === "/";

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "maintenance", label: "Manutenções", icon: Wrench },
    { id: "assets", label: "Ativos", icon: Building2 },
    { id: "planos", label: "Planos", icon: Calendar },
    { id: "os", label: "OS", icon: ClipboardCheck },
    { id: "compliance", label: "Conformidades", icon: ClipboardCheck },
    { id: "settings", label: "Configurações", icon: Settings, route: "/settings" },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">CondoMaintain</h1>
              <p className="text-xs text-muted-foreground">Gestão de Manutenções</p>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            <CondominioSwitcher />
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  onClick={() => {
                    if (tab.route) {
                      navigate(tab.route);
                    } else if (isOnIndexPage) {
                      onTabChange(tab.id);
                    } else {
                      navigate("/", { state: { activeTab: tab.id } });
                    }
                  }}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Button>
              );
            })}
            {role === "admin" && (
              <Button
                variant={activeTab === "admin" ? "default" : "ghost"}
                onClick={() => navigate("/admin")}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
