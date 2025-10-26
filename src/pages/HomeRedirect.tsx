import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export default function HomeRedirect() {
  const { role, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (role === "owner" || role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "sindico") {
      navigate("/dashboard/sindico", { replace: true });
    } else {
      // morador/sem papel definido: direciona para a visão do síndico (somente leitura)
      navigate("/dashboard/sindico", { replace: true });
    }
  }, [role, loading, navigate]);

  return <div className="p-8 text-center text-muted-foreground">Carregando…</div>;
}
