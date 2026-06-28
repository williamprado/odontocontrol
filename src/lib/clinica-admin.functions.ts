import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function gerarSenha(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const symbols = "!@#$%&*";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  s += symbols[Math.floor(Math.random() * symbols.length)];
  s += Math.floor(Math.random() * 10).toString();
  return s.split("").sort(() => Math.random() - 0.5).join("");
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
  .inputValidator((d) => novaClinicaSchema.parse(d))
  .handler(async ({ data }) => {
    const { resolveRequestContext } = await import("./db-query.server");
    const context = await resolveRequestContext();
    if (!context.userId || !context.isSuperAdmin) {
      throw new Error("Não autorizado: Apenas Super Admin pode criar clínicas.");
    }

    const { query } = await import("./db.server");
    const { auth } = await import("./auth.server");

    const senha = gerarSenha();

    // 1) Criar usuário no Better Auth
    console.log("[createClinicaWithOwner] Criando conta no Better Auth...");
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: data.email_admin,
        password: senha,
        name: data.nome_admin,
      },
    });

    if (!signUpResult || !signUpResult.user) {
      throw new Error("Erro ao criar conta no Better Auth.");
    }

    const userId = signUpResult.user.id;

    // 2) Criar clinica no banco de dados local
    const endDoc = data.endereco 
      ? { ...data.endereco, whatsapp: data.whatsapp ?? null, especialidades: data.especialidades ?? [], dia_vencimento: data.dia_vencimento }
      : { whatsapp: data.whatsapp ?? null, especialidades: data.especialidades ?? [], dia_vencimento: data.dia_vencimento };

    console.log("[createClinicaWithOwner] Inserindo clínica no PostgreSQL...");
    const cRes = await query(
      `INSERT INTO public.clinica 
         (nome, slug, cor_primaria, telefone, cro_responsavel, endereco, owner_nome, owner_email, plano, valor_mensal, mrr, status, status_cobranca)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, slug`,
      [
        data.nome,
        data.slug || null,
        data.cor_principal || "#0EA5E9",
        data.telefone || null,
        data.cro_clinica || null,
        JSON.stringify(endDoc),
        data.nome_admin,
        data.email_admin,
        data.plano,
        data.valor_mensal,
        data.valor_mensal,
        "ativo",
        "ativo",
      ]
    );

    const c = cRes.rows[0];

    // 3) Associar membro admin no banco de dados local
    console.log("[createClinicaWithOwner] Inserindo membro admin no PostgreSQL...");
    await query(
      `INSERT INTO public.membro_equipe 
         (clinica_id, user_id, nome, email, role, ativo, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [c.id, userId, data.nome_admin, data.email_admin, "admin", true, true]
    );

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
  .inputValidator((d) => z.object({ clinica_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { resolveRequestContext } = await import("./db-query.server");
    const context = await resolveRequestContext();
    if (!context.userId || !context.isSuperAdmin) {
      throw new Error("Não autorizado: Apenas Super Admin pode resetar senhas.");
    }

    const { query } = await import("./db.server");
    const { auth } = await import("./auth.server");

    // Buscar o admin ativo desta clinica
    const membroRes = await query(
      `SELECT user_id, email FROM public.membro_equipe 
       WHERE clinica_id = $1 AND role IN ('owner', 'admin') AND ativo = true 
       ORDER BY created_at ASC LIMIT 1`,
      [data.clinica_id]
    );

    const membro = membroRes.rows[0];
    if (!membro || !membro.user_id) {
      throw new Error("Administrador ativo desta clínica não foi encontrado no banco local.");
    }

    const novaSenha = gerarSenha();

    // Redefinir senha via Better Auth API
    console.log("[resetarSenhaAdmin] Atualizando senha no Better Auth...");
    await auth.api.setUserPassword({
      body: {
        userId: membro.user_id,
        newPassword: novaSenha,
      },
    });

    // Marcar como must_change_password no membro local
    await query(
      "UPDATE public.membro_equipe SET must_change_password = true WHERE user_id = $1",
      [membro.user_id]
    );

    return { email: membro.email, nova_senha: novaSenha };
  });

export const enviarEmail = createServerFn({ method: "POST" })
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
    return { success: true, stub: true };
  });
