import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Buscar perfil do usuário
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!perfil) {
        navigate("/login");
        return;
      }

      // Verificar se é owner (admin global)
      const { data: globalRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", perfil.id);

      const isOwner = (globalRoles ?? []).some(r => r.role === "admin");
      if (isOwner) {
        navigate("/admin");
        return;
      }

      // Verificar papel no condomínio principal
      const { data: vinculos } = await supabase
        .from("usuarios_condominios")
        .select("papel, is_principal")
        .eq("usuario_id", perfil.id)
        .order("is_principal", { ascending: false })
        .limit(1)
        .maybeSingle();

      const papel = vinculos?.papel ?? "morador";

      if (papel === "sindico" || papel === "admin") {
        navigate("/dashboard");
      } else if (papel === "zelador" || papel === "funcionario") {
        navigate("/manutencoes");
      } else {
        navigate("/chamados");
      }
    })();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
}
