// src/pages/SignUp.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

type Role = "sindico" | "funcionario" | "morador" | "fornecedor";

export default function SignUp() {
  const nav = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [papel, setPapel] = useState<Role>("morador");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function validar(): string | null {
    if (!nome.trim()) return "Informe seu nome.";
    if (!email.trim()) return "Informe seu e-mail.";
    const okEmail = /\S+@\S+\.\S+/.test(email);
    if (!okEmail) return "E-mail inválido.";
    if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    if (senha !== confirmSenha) return "As senhas não conferem.";
    return null;
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    const msg = validar();
    if (msg) {
      setErro(msg);
      return;
    }

    setLoading(true);
    try {
      // Cria conta no Supabase e grava metadados (nome/papel)
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome, papel }, // fica salvo como user_metadata (útil se confirmação de e-mail estiver ativa)
          emailRedirectTo: window.location.origin, // ajuste se tiver rota dedicada
        },
      });
      if (error) throw error;

      const authUserId = data.user?.id || null;
      const temSessao = !!data.session;

      // Tenta criar/atualizar perfil na tabela "usuarios" se já houver sessão (projetos sem confirmação por e-mail)
      if (temSessao && authUserId) {
        const { error: upsertErr } = await supabase
          .from("usuarios")
          .upsert(
            {
              auth_user_id: authUserId,
              email,
              nome,
              papel,
            },
            { onConflict: "auth_user_id" }
          );
        if (upsertErr) {
          // Não impede o fluxo — perfil poderá ser criado no primeiro login via getOrCreatePerfil()
          console.warn("Falha ao upsert do perfil (usuarios). Será criado no primeiro login.", upsertErr.message);
        }
      }

      // Mensagem amigável dependendo do fluxo de confirmação
      if (temSessao) {
        // Sessão criada imediatamente: pode seguir para o app
        alert("Conta criada com sucesso! Você já pode usar o sistema.");
        nav("/", { replace: true });
      } else {
        // Comum quando confirmação por e-mail está habilitada
        alert("Conta criada! Verifique seu e-mail para confirmar o cadastro. Depois, faça login.");
        nav("/login", { replace: true });
      }
    } catch (err: any) {
      setErro(err?.message ?? "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Criar conta</h1>
        <p className="text-sm text-gray-500 mb-6">
          Cadastre-se para acessar o sistema do condomínio.
        </p>

        {erro && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={registrar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                onClick={() => setMostrarSenha((s) => !s)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input
              type={mostrarSenha ? "text" : "password"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              placeholder="Repita a senha"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              value={papel}
              onChange={(e) => setPapel(e.target.value as Role)}
            >
              <option value="sindico">Síndico</option>
              <option value="funcionario">Funcionário</option>
              <option value="morador">Morador</option>
              <option value="fornecedor">Fornecedor</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Isso personaliza o seu menu e permissões dentro do sistema.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          Já tem conta?{" "}
          <Link to="/login" className="text-gray-900 font-medium underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
