import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function gerarSenha(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const symbols = "!@#$%&*";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  s += symbols[Math.floor(Math.random() * symbols.length)];
  s += Math.floor(Math.random() * 10).toString();
  return s.split("").sort(() => Math.random() - 0.5).join("");
}

async function assertSuperAdmin(supabase: any, email: string | undefined) {
  if (!email) throw new Error("Não autenticado");
  const { data: cfg } = await supabase.from("app_config").select("super_admin_emails").limit(1).maybeSingle();
  const admins: string[] = (cfg?.super_admin_emails as string[]) ?? [];
  if (!admins.includes(email)) throw new Error("Apenas Super Admin pode executar esta ação");
}

const novaClinicaSchema = z.object({
  nome: z.string().min(2).max(120),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/).optional().or(z.literal("")),
  cor_principal: z.string().max(20).optional(),
  telefone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  endereco: z.object({
    cep: z.string().max(15).optional(),
    rua: z.string().max(200).optional(),
    numero: z.string().max(20).optional(),
    bairro: z.string().max(100).optional(),
    cidade: z.string().max(100).optional(),
    uf: z.string().max(2).optional(),
  }).optional(),
  cro_clinica: z.string().max(50).optional(),
  especialidades: z.array(z.string().max(80)).max(20).optional(),
  plano: z.enum(["starter", "pro", "premium"]).default("starter"),
  valor_mensal: z.number().min(0).max(99999).default(0),
  dia_vencimento: z.number().int().min(1).max(31).default(10),
  email_admin: z.string().email().max(255),
  nome_admin: z.string().min(2).max(120),
});

export const createClinicaWithOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => novaClinicaSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, claims } = context as any;
    const callerEmail = claims?.email as string | undefined;
    await assertSuperAdmin(supabase, callerEmail);

    const senha = gerarSenha();

    // 1) cria usuário Auth via admin (auto-confirmado)
    const { data: created, error: eUser } = await supabaseAdmin.auth.admin.createUser({
      email: data.email_admin,
      password: senha,
      email_confirm: true,
      user_metadata: { nome: data.nome_admin },
    });
    if (eUser) throw new Error(eUser.message);
    const userId = created.user!.id;

    // 2) cria clinica
    const { data: c, error: eC } = await supabaseAdmin.from("clinica").insert({
      nome: data.nome,
      slug: data.slug || null,
      cor_primaria: data.cor_principal || "#0EA5E9",
      telefone: data.telefone || null,
      cro_responsavel: data.cro_clinica || null,
      endereco: data.endereco ? { ...data.endereco, whatsapp: data.whatsapp ?? null, especialidades: data.especialidades ?? [], dia_vencimento: data.dia_vencimento } : { whatsapp: data.whatsapp ?? null, especialidades: data.especialidades ?? [], dia_vencimento: data.dia_vencimento },
      owner_nome: data.nome_admin,
      owner_email: data.email_admin,
      plano: data.plano,
      valor_mensal: data.valor_mensal,
      mrr: data.valor_mensal,
      status: "ativo",
      status_cobranca: "ativo",
    }).select("*").single();
    if (eC) {
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      throw new Error(eC.message);
    }

    // 3) associa membro admin
    const { error: eM } = await supabaseAdmin.from("membro_equipe").insert({
      clinica_id: c.id,
      user_id: userId,
      nome: data.nome_admin,
      email: data.email_admin,
      role: "admin",
      ativo: true,
      must_change_password: true,
    });
    if (eM) throw new Error(eM.message);

    const linkPublico = `/agendar/${c.slug}`;
    return {
      clinica_id: c.id,
      email_admin: data.email_admin,
      senha_gerada: senha,
      slug_publico: c.slug,
      link_publico_completo: linkPublico,
    };
  });

export const resetarSenhaAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ clinica_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, claims } = context as any;
    await assertSuperAdmin(supabase, claims?.email);

    const { data: membro } = await supabaseAdmin
      .from("membro_equipe")
      .select("user_id, email")
      .eq("clinica_id", data.clinica_id)
      .in("role", ["owner", "admin"])
      .eq("ativo", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!membro?.user_id) throw new Error("Admin desta clínica não encontrado");

    const novaSenha = gerarSenha();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(membro.user_id, { password: novaSenha });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("membro_equipe").update({ must_change_password: true }).eq("user_id", membro.user_id);

    return { email: membro.email as string, nova_senha: novaSenha };
  });

// =====================================================================
// TODO: aluno que clonar deve conectar sua propria conta Resend aqui.
// Esta funcao eh um STUB - apenas registra no console e retorna sucesso.
// Para ativar emails de verdade:
//   1) Criar conta gratuita em https://resend.com
//   2) Verificar dominio em Resend > Domains
//   3) Copiar a API key
//   4) Adicionar RESEND_API_KEY como secret no Lovable Cloud
//   5) Descomentar o bloco fetch abaixo
// =====================================================================
export const enviarEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      to: z.string().email(),
      subject: z.string().min(1).max(200),
      template: z.string().min(1).max(50),
      data: z.record(z.string(), z.unknown()).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    console.log("[enviarEmail STUB]", JSON.stringify(data, null, 2));
    // const apiKey = process.env.RESEND_API_KEY;
    // if (apiKey) {
    //   const res = await fetch("https://api.resend.com/emails", {
    //     method: "POST",
    //     headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    //     body: JSON.stringify({ from: "OdontoControl <noreply@seudominio.com>", to: data.to, subject: data.subject, html: renderTemplate(data.template, data.data) }),
    //   });
    //   if (!res.ok) throw new Error(await res.text());
    //   return { success: true, stub: false };
    // }
    return { success: true, stub: true };
  });
