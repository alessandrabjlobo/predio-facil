import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CondominioSwitcher } from "@/components/CondominioSwitcher";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Propriedades esperadas pelo Layout
 */
export default function Header({
  onToggleCollapse,
}: {
  onToggleCollapse?: () => void;
}) {
  // (opcional) se quiser esconder o switcher para o dono do produto (owner),
  // detecta o papel principal aqui. Caso não precise, pode remover este bloco.
  const [papel, setPapel] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: usuario } = await supabase
          .from("usuarios")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!usuario) return;

        const { data: relacao } = await supabase
          .from("usuarios_condominios")
          .select("papel")
          .eq("usuario_id", usuario.id)
          .eq("is_principal", true)
          .maybeSingle();

        setPapel(relacao?.papel ?? null);
      } catch {
        // silencioso
      }
    })();
  }, []);

  return (
    <header className="h-14 border-b bg-white px-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-9 w-9 p-0"
          onClick={onToggleCollapse}
          aria-label="Alternar sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Seletor global: aparece quando o usuário tem 2+ condomínios.
           O próprio CondominioSwitcher já retorna null quando não houver lista
           ou só houver 1 condomínio. */}
        {/* Se quiser esconder do owner, descomente a checagem: papel !== 'owner' && */}
        <CondominioSwitcher />
      </div>

      <div className="flex items-center gap-2">
        {/* coloque aqui seus itens do lado direito (perfil, tema, etc.) */}
      </div>
    </header>
  );
}
