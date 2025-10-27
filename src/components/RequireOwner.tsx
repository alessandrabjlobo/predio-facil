import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Componente que restringe acesso apenas para owner (dono do sistema)
 */
export default function RequireOwner({ children }: { children: React.ReactNode }) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Allow both "owner" and "admin" to access
  if (role !== "owner" && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
