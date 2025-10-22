// supabase/functions/create-customer/index.ts
// Deno + Supabase Edge Function

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  // "https://seu-dominio.com"
]);

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

function onlyDigits(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  try {
    // Segredos (defina com: supabase secrets set SERVICE_ROLE_KEY="..." PROJECT_URL="...")
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
    const PROJECT_URL = Deno.env.get("PROJECT_URL");
    if (!SERVICE_ROLE_KEY || !PROJECT_URL) {
      return new Response(
        JSON.stringify({ error: "Faltam secrets SERVICE_ROLE_KEY e/ou PROJECT_URL" }),
        { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Exigir JWT do usuário (o front envia Authorization: Bearer <access_token>)
    const auth = req.headers.get("authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Corpo
    const body = await req.json();
    const name: string = (body?.name ?? "").trim();
    const email: string = (body?.email ?? "").trim().toLowerCase();
    const condoName: string = (body?.condoName ?? "").trim();
    const address: string | null = (body?.address ?? null);
    const cpf: string = onlyDigits(body?.cpf ?? "");

    if (!name || !email || !condoName || !cpf) {
      return new Response(
        JSON.stringify({ error: "name, email, condoName e cpf são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Admin client (service role)
    const admin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
      db: { schema: "public" },
      global: { headers: { "x-client-info": "edge:create-customer" } },
    });

    // 1) Criar/pegar condomínio (aceita mesmo nome; se quiser, crie unique index por slug)
    let condoId: string;
    {
      const { data: existingCondo, error: selCondoErr } = await admin
        .from("condominios")
        .select("id")
        .ilike("nome", condoName)
        .maybeSingle();

      if (selCondoErr) {
        console.error("select condominio erro:", selCondoErr);
        return new Response(JSON.stringify({ error: selCondoErr.message }), {
          status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      if (existingCondo?.id) {
        condoId = existingCondo.id as string;
      } else {
        const { data: newCondo, error: insCondoErr } = await admin
          .from("condominios")
          .insert({ nome: condoName, endereco: address })
          .select("id")
          .single();

        if (insCondoErr) {
          console.error("insert condominio erro:", insCondoErr);
          return new Response(JSON.stringify({ error: insCondoErr.message }), {
            status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          });
        }
        condoId = newCondo.id as string;
      }
    }

    // 2) Convidar e/ou gerar Magic Link se o e-mail já existir
    let userId: string | null = null;
    let invited = false;
    let magiclinkSent = false;
    let magicLink: string | null = null;

    // tenta enviar convite
    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { name, cpf, condoName, address },
    });

    if (!inviteErr && inviteData?.user?.id) {
      invited = true;
      userId = inviteData.user.id;
    } else {
      // Fallback: usuário já existe -> gera Magic Link e segue o fluxo
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { data: { name, cpf, condoName, address } },
      });

      if (linkErr) {
        // se falhar até o magic link, retorne erro real
        console.error("generateLink erro:", linkErr);
        return new Response(JSON.stringify({ error: linkErr.message }), {
          status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      magiclinkSent = true;
      magicLink = linkData?.properties?.action_link ?? null;
      userId = linkData?.user?.id ?? null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Não foi possível obter userId." }), {
        status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // 3) Garantir pessoa em `usuarios` **pelo CPF** (unifica mesmo com e-mails diferentes)
    // Tenta achar pelo CPF; se não houver, tenta por auth_user_id.
    let usuarioId: string | null = null;

    const { data: byCpf, error: byCpfErr } = await admin
      .from("usuarios")
      .select("id, auth_user_id, cpf")
      .eq("cpf", cpf)
      .maybeSingle();

    if (byCpfErr) {
      console.error("select usuarios by cpf erro:", byCpfErr);
      return new Response(JSON.stringify({ error: byCpfErr.message }), {
        status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      });
    }

    if (byCpf?.id) {
      // já existe pessoa com esse CPF -> garante vinculação ao auth_user_id e atualiza dados
      const { data: up, error: upErr } = await admin
        .from("usuarios")
        .update({ auth_user_id: userId, email, nome: name })
        .eq("id", byCpf.id)
        .select("id")
        .single();

      if (upErr) {
        console.error("update usuarios erro:", upErr);
        return new Response(JSON.stringify({ error: upErr.message }), {
          status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }
      usuarioId = up.id as string;
    } else {
      // não tem CPF ainda; vê se existe pelo auth_user_id
      const { data: byAuth, error: byAuthErr } = await admin
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (byAuthErr) {
        console.error("select usuarios by auth_user_id erro:", byAuthErr);
        return new Response(JSON.stringify({ error: byAuthErr.message }), {
          status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      if (byAuth?.id) {
        // atualiza para incluir CPF
        const { data: up2, error: up2Err } = await admin
          .from("usuarios")
          .update({ cpf, email, nome: name })
          .eq("id", byAuth.id)
          .select("id")
          .single();

        if (up2Err) {
          console.error("update usuarios(add cpf) erro:", up2Err);
          return new Response(JSON.stringify({ error: up2Err.message }), {
            status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          });
        }
        usuarioId = up2.id as string;
      } else {
        // cria novo registro da pessoa
        const { data: insU, error: insUErr } = await admin
          .from("usuarios")
          .insert({ auth_user_id: userId, email, nome: name, cpf })
          .select("id")
          .single();

        if (insUErr) {
          console.error("insert usuarios erro:", insUErr);
          return new Response(JSON.stringify({ error: insUErr.message }), {
            status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          });
        }
        usuarioId = insU.id as string;
      }
    }

    // 4) Vincular usuário ao condomínio como 'admin' (idempotente pela PK composta)
    {
      const { error: linkErr } = await admin
        .from("usuarios_condominios")
        .upsert({
          usuario_id: usuarioId,
          condominio_id: condoId,
          papel: "admin",
          is_principal: true,
        });

      if (linkErr) {
        console.error("upsert usuarios_condominios erro:", linkErr);
        return new Response(JSON.stringify({ error: linkErr.message }), {
          status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }
    }

    // 5) Ativos básicos (insere uma vez por condomínio)
    {
      const { data: anyAtivo, error: selAtivoErr } = await admin
        .from("ativos")
        .select("id")
        .eq("condominio_id", condoId)
        .limit(1);

      if (selAtivoErr) {
        console.error("select ativos erro:", selAtivoErr);
        return new Response(JSON.stringify({ error: selAtivoErr.message }), {
          status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
        });
      }

      const jaTemAtivos = (anyAtivo && anyAtivo.length > 0);
      if (!jaTemAtivos) {
        const basicos = [
          { condominio_id: condoId, nome: "Conta padrão", tipo: "conta" },
          { condominio_id: condoId, nome: "Centro de custo geral", tipo: "centro_custo" },
          { condominio_id: condoId, nome: "Fornecedor genérico", tipo: "fornecedor" },
        ];
        const { error: insAtivosErr } = await admin.from("ativos").insert(basicos);
        if (insAtivosErr) {
          console.error("insert ativos básicos erro:", insAtivosErr);
          return new Response(JSON.stringify({ error: insAtivosErr.message }), {
            status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" },
          });
        }
      }
    }

    // OK
    return new Response(
      JSON.stringify({
        ok: true,
        invited,
        magiclinkSent,
        magicLink,
        userId,
        usuarioId,
        condoId,
        condoName,
        email,
        cpf,
        address,
      }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-customer error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
