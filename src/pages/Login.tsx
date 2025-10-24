// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreatePerfil, type Papel } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    // Se já estiver logado, manda para o dashboard
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav("/", { replace: true });
    });
  }, [nav]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (error) throw error;

      await getOrCreatePerfil();

      // Obter papel do usuário a partir de usuarios_condominios
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      let papelUsuario: Papel | null = null;
      if (usuario?.id) {
        const { data: relacao } = await supabase
          .from("usuarios_condominios")
          .select("papel")
          .eq("usuario_id", usuario.id)
          .eq("is_principal", true)
          .maybeSingle();
        
        papelUsuario = (relacao?.papel as Papel) ?? null;
      }

      // 🔽 Redireciona SEM considerar 'from', baseado no papel
      const destinoPorPapel: Record<Papel, string> = {
        sindico: "/",
        admin: "/",
        funcionario: "/funcionario",
        zelador: "/funcionario",
        fornecedor: "/fornecedor",
        morador: "/",
        conselho: "/",
      };
      const destino = papelUsuario ? (destinoPorPapel[papelUsuario] ?? "/") : "/";

      nav(destino, { replace: true });
    } catch (err: any) {
      setErro(err?.message ?? "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Entrar</h1>
        <p className="text-sm text-gray-500 mb-6">Acesse sua conta do condomínio.</p>

        {erro && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-lg bg-gray-900 text-white hover:opacity-95"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          Não tem conta?{" "}
          <Link to="/signup" className="text-gray-900 font-medium underline">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
