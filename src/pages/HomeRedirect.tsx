import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setCurrentCondominioId } from "@/lib/tenant";

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

      // Buscar condomínio principal e papel
      const { data: vinculos } = await supabase
        .from("usuarios_condominios")
        .select("papel, condominio_id, is_principal")
        .eq("usuario_id", perfil.id)
        .order("is_principal", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!vinculos) {
        // Sem vínculo a condomínio, redireciona para chamados genérico
        navigate("/chamados");
        return;
      }

      // Salvar condomínio atual no localStorage
      setCurrentCondominioId(vinculos.condominio_id);

      const papel = vinculos.papel ?? "morador";

      // Redirecionar baseado no papel
      if (papel === "sindico" || papel === "admin") {
        navigate("/dashboard/sindico");
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
