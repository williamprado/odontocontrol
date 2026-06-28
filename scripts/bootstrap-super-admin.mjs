import pg from "pg";
import { createClient } from "@supabase/supabase-js";

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

    console.log("[bootstrap-admin] Nenhum Super Admin cadastrado na lista global. Iniciando bootstrap...");

    // 2) Tentar registrar o usuário no Supabase Auth caso SERVICE_ROLE esteja disponível
    let supabaseUserId = null;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey && serviceRoleKey !== "CHANGE_ME" && serviceRoleKey.length > 20) {
      console.log("[bootstrap-admin] Configuração do Supabase Auth Admin detectada. Verificando cadastro...");
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Tenta listar usuários cadastrados para evitar duplicidade
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error("[bootstrap-admin] Erro ao listar usuários do Supabase Auth:", listError.message);
      } else {
        const existingUser = users.find((u) => u.email?.toLowerCase().trim() === adminEmail);
        if (existingUser) {
          supabaseUserId = existingUser.id;
          console.log("[bootstrap-admin] Usuário já existente no Supabase Auth.");
        } else {
          // Criar novo usuário
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { must_change_password: true },
          });

          if (createError) {
            console.error("[bootstrap-admin] Erro ao criar usuário no Supabase Auth:", createError.message);
          } else if (newUser?.user) {
            supabaseUserId = newUser.user.id;
            console.log("[bootstrap-admin] Usuário criado com sucesso no Supabase Auth.");
          }
        }
      }
    } else {
      console.log(
        "[bootstrap-admin] Aviso: SUPABASE_SERVICE_ROLE_KEY não configurada. A criação da credencial no Supabase Auth deverá ser realizada manualmente."
      );
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

    // 4) Garantir que o membro de equipe exista localmente
    const memberRes = await pool.query("SELECT id, user_id FROM public.membro_equipe WHERE LOWER(email) = $1 LIMIT 1", [
      adminEmail,
    ]);

    if (memberRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO public.membro_equipe 
          (clinica_id, user_id, nome, email, role, ativo, must_change_password) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [clinicaId, supabaseUserId, "Super Admin", adminEmail, "owner", true, true]
      );
      console.log("[bootstrap-admin] Membro de equipe Super Admin criado no PostgreSQL.");
    } else {
      const existingMember = memberRes.rows[0];
      if (!existingMember.user_id && supabaseUserId) {
        await pool.query("UPDATE public.membro_equipe SET user_id = $1 WHERE id = $2", [
          supabaseUserId,
          existingMember.id,
        ]);
        console.log("[bootstrap-admin] user_id do membro local atualizado.");
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
    console.error("[bootstrap-admin] Falha crítica durante a execução do bootstrap:", err);
    await pool.end();
    process.exit(1);
  }
}

bootstrap();
