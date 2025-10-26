// FILE: src/pages/AdminMaster.tsx
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { KPICards } from "@/components/patterns/KPICards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  UserPlus,
  Settings,
  Download,
  PlusCircle,
} from "lucide-react";

import { useCondominios } from "@/hooks/useCondominios";
import { useUsuarios } from "@/hooks/useUsuarios";

function Empty({ text }: { text: string }) {
  return (
    <div className="p-6 text-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}

export default function AdminMaster() {
  const [activeTab, setActiveTab] = useState("condominios");

  // Hooks de dados
  const {
    condominios,
    isLoading: condominiosLoading,
    createCondominio, // mutate
  } = useCondominios();

  const { usuarios, isLoading: usuariosLoading } = useUsuarios();

  // KPIs
  const totalCondominios = condominios?.length || 0;
  const totalUsuarios = usuarios?.length || 0;
  const totalSindicos = (usuarios || []).filter(
    (u: any) => String(u.papel || "").toLowerCase() === "sindico"
  ).length;

  const kpis = [
    { label: "Total de Condomínios", value: totalCondominios, icon: Building2 },
    { label: "Total de Usuários", value: totalUsuarios, icon: Users },
    { label: "Síndicos Ativos", value: totalSindicos, icon: UserPlus },
    { label: "Conformidades Críticas", value: 0, icon: Settings },
  ];

  // Filtros locais
  const [qConds, setQConds] = useState("");
  const [qUsers, setQUsers] = useState("");

  const condsFiltered = useMemo(() => {
    const t = qConds.trim().toLowerCase();
    if (!t) return condominios || [];
    return (condominios || []).filter((c: any) => {
      const nome = (c.nome ?? "").toLowerCase();
      const end = (c.endereco ?? "").toLowerCase();
      const id = (c.id ?? "").toLowerCase();
      return nome.includes(t) || end.includes(t) || id.includes(t);
    });
  }, [condominios, qConds]);

  const usersFiltered = useMemo(() => {
    const t = qUsers.trim().toLowerCase();
    if (!t) return usuarios || [];
    return (usuarios || []).filter((u: any) => {
      const nome = (u.nome ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const papel = (u.papel ?? "").toLowerCase();
      return nome.includes(t) || email.includes(t) || papel.includes(t);
    });
  }, [usuarios, qUsers]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Painel Administrativo"
        subtitle="Gerencie condomínios, síndicos, usuários e templates de manutenção"
        actions={
          <>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Download className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              onClick={async () => {
                const nome = prompt("Nome do novo condomínio:");
                if (!nome) return;
                try {
                  await createCondominio.mutateAsync({ nome });
                } catch (e: any) {
                  alert(e?.message || "Falha ao criar condomínio");
                }
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Condomínio
            </Button>
          </>
        }
      />

      <KPICards data={kpis} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="condominios">
            <Building2 className="h-4 w-4 mr-2" />
            Condomínios
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <UserPlus className="h-4 w-4 mr-2" />
            Síndicos & Usuários
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="h-4 w-4 mr-2" />
            Templates de Manutenção
          </TabsTrigger>
        </TabsList>

        {/* CONDOMÍNIOS */}
        <TabsContent value="condominios" className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Input
              placeholder="Buscar condomínio (nome/endereço/id)…"
              value={qConds}
              onChange={(e) => setQConds(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={() => setQConds("")}>
              Limpar
            </Button>
          </div>

          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="[&>th]:p-2 text-left">
                  <th>Nome</th>
                  <th>Endereço</th>
                  <th>Síndico(s)</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {condominiosLoading ? (
                  <tr>
                    <td colSpan={4}>
                      <Empty text="Carregando…" />
                    </td>
                  </tr>
                ) : condsFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <Empty text="Nenhum condomínio encontrado." />
                    </td>
                  </tr>
                ) : (
                  condsFiltered.map((c: any) => (
                    <tr key={c.id} className="border-t [&>td]:p-2">
                      <td>
                        <a
                          className="text-primary hover:underline"
                          href={`/condominios/${c.id}`}
                        >
                          {c.nome ?? "—"}
                        </a>
                      </td>
                      <td>{c.endereco ?? "—"}</td>
                      <td className="text-xs">
                        {(c.usuarios_condominios ?? [])
                          .filter(
                            (uc: any) =>
                              String(uc.papel || "").toLowerCase() === "sindico"
                          )
                          .map(
                            (uc: any) =>
                              uc.usuarios?.nome || uc.usuarios?.email || "—"
                          )
                          .join(", ") || "—"}
                      </td>
                      <td className="text-xs text-muted-foreground">{c.id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* USUÁRIOS */}
        <TabsContent value="usuarios" className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Input
              placeholder="Buscar usuário (nome/e-mail/papel)…"
              value={qUsers}
              onChange={(e) => setQUsers(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={() => setQUsers("")}>
              Limpar
            </Button>
          </div>

          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="[&>th]:p-2 text-left">
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Papel</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {usuariosLoading ? (
                  <tr>
                    <td colSpan={4}>
                      <Empty text="Carregando…" />
                    </td>
                  </tr>
                ) : usersFiltered.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <Empty text="Nenhum usuário encontrado." />
                    </td>
                  </tr>
                ) : (
                  usersFiltered.map((u: any) => (
                    <tr key={u.id} className="border-t [&>td]:p-2">
                      <td>{u.nome ?? "—"}</td>
                      <td>{u.email ?? "—"}</td>
                      <td className="capitalize">{u.papel ?? "—"}</td>
                      <td>
                        {u.created_at
                          ? new Date(u.created_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="mt-6">
          <div className="p-6 border rounded">
            <p className="text-sm text-muted-foreground">
              A edição de templates está em{" "}
              <strong>Configurações → Templates de Manutenção</strong>.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
