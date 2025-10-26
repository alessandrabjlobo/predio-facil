import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export default function TenantIndex() {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  switch (role) {
    case "owner":
      return <Navigate to="/admin" replace />;
    case "sindico":
    case "admin":
      return <Navigate to="/dashboard/sindico" replace />;
    case "funcionario":
    case "zelador":
      return <Navigate to="/dashboard/sindico" replace />;
    case "fornecedor":
      return <Navigate to="/dashboard/sindico" replace />;
    default:
      return <Navigate to="/dashboard/sindico" replace />;
  }
}
