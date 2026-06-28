import pg from "pg";
import { auth } from "../src/lib/auth.server.ts";

async function bootstrap() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[bootstrap-admin] Erro: DATABASE_URL não configurada.");
    process.exit(1);
  }

  const adminEmail = (process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@admin.com").toLowerCase().trim();
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || "@Admin.com";

  console.log("[bootstrap-admin] Conectando ao banco de dados...");
  const pool = new pg.Pool({ connectionString: dbUrl });

  try {
    // 1) Verificar se o Super Admin já existe em app_config
    const configRes = await pool.query("SELECT id, super_admin_emails FROM public.app_config LIMIT 1");
    let hasConfig = configRes.rows.length > 0;
    let superAdmins = hasConfig ? configRes.rows[0].super_admin_emails || [] : [];
    let configId = hasConfig ? configRes.rows[0].id : null;

    if (superAdmins.includes(adminEmail)) {
      console.log("[bootstrap-admin] Super Admin já está configurado na tabela app_config. Nada a fazer.");
      await pool.end();
      process.exit(0);
    }

    console.log("[bootstrap-admin] Nenhum Super Admin cadastrado. Iniciando bootstrap 100% local...");

    // 2) Criar usuário no Better Auth via API Programática (criptografa a senha automaticamente)
    let betterAuthUserId = null;
    try {
      console.log("[bootstrap-admin] Criando credenciais no Better Auth...");
      
      // Procura se o usuário já existe na tabela de usuários do Better Auth
      const userRes = await pool.query('SELECT id FROM public."user" WHERE email = $1 LIMIT 1', [adminEmail]);
      
      if (userRes.rows.length > 0) {
        betterAuthUserId = userRes.rows[0].id;
        console.log("[bootstrap-admin] Usuário já existente no Better Auth.");
      } else {
        const response = await auth.api.signUpEmail({
          body: {
            email: adminEmail,
            password: adminPassword,
            name: "Super Admin",
          },
        });
        
        if (response && response.user) {
          betterAuthUserId = response.user.id;
          console.log("[bootstrap-admin] Usuário cadastrado no Better Auth com sucesso.");
        } else {
          throw new Error("Resposta inválida da API de cadastro do Better Auth.");
        }
      }
    } catch (authError) {
      console.error("[bootstrap-admin] Erro ao criar conta no Better Auth:", authError.message);
      throw authError;
    }

    // 3) Garantir que exista uma clínica padrão no banco local
    const clinicaRes = await pool.query("SELECT id FROM public.clinica LIMIT 1");
    let clinicaId = null;

    if (clinicaRes.rows.length === 0) {
      const insertClinica = await pool.query(
        "INSERT INTO public.clinica (nome, slug, ativa) VALUES ($1, $2, $3) RETURNING id",
        ["Clínica OdontoControl", "clinica-odontocontrol", true]
      );
      clinicaId = insertClinica.rows[0].id;
      console.log("[bootstrap-admin] Clínica padrão de bootstrap criada no PostgreSQL.");
    } else {
      clinicaId = clinicaRes.rows[0].id;
    }

    // 4) Garantir que o membro de equipe exista localmente vinculado ao Better Auth user ID
    const memberRes = await pool.query("SELECT id, user_id FROM public.membro_equipe WHERE LOWER(email) = $1 LIMIT 1", [
      adminEmail,
    ]);

    if (memberRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO public.membro_equipe 
          (clinica_id, user_id, nome, email, role, ativo, must_change_password) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [clinicaId, betterAuthUserId, "Super Admin", adminEmail, "owner", true, true]
      );
      console.log("[bootstrap-admin] Membro de equipe Super Admin criado no PostgreSQL.");
    } else {
      const existingMember = memberRes.rows[0];
      if (existingMember.user_id !== betterAuthUserId) {
        await pool.query("UPDATE public.membro_equipe SET user_id = $1 WHERE id = $2", [
          betterAuthUserId,
          existingMember.id,
        ]);
        console.log("[bootstrap-admin] user_id do membro local atualizado para Better Auth user ID.");
      } else {
        console.log("[bootstrap-admin] Membro local já configurado no PostgreSQL.");
      }
    }

    // 5) Atualizar a tabela app_config com o e-mail do super admin
    if (hasConfig) {
      await pool.query(
        "UPDATE public.app_config SET super_admin_emails = array_append(array_remove(super_admin_emails, $1), $1) WHERE id = $2",
        [adminEmail, configId]
      );
    } else {
      await pool.query("INSERT INTO public.app_config (super_admin_emails) VALUES (ARRAY[$1])", [adminEmail]);
    }
    console.log("[bootstrap-admin] Lista de super_admin_emails atualizada com sucesso em app_config.");

    console.log("[bootstrap-admin] Bootstrap de Super Admin concluído com sucesso.");
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("[bootstrap-admin] Falha crítica durante a execução do bootstrap:", err.message);
    await pool.end();
    process.exit(1);
  }
}

bootstrap();
