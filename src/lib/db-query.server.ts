import { getRequest } from "@tanstack/react-start/server";
import { query } from "./db.server";
import { DB_TABLES } from "./db-whitelist.server";
import type { QueryAST } from "./query.types";
import { auth } from "./auth.server";

// Helper to escape identifiers safely and validate them
function escapeIdentifier(id: string): string {
  if (!/^[a-zA-Z0-9_]+$/.test(id)) {
    throw new Error(`Invalid identifier: ${id}`);
  }
  return `"${id}"`;
}

// Resolver for context, tenant, and Super Admin authorization
export async function resolveRequestContext() {
  const request = getRequest();
  if (!request) {
    return { userId: null, email: null, clinicaId: null, isSuperAdmin: false, isAnonymous: true };
  }

  // 1) Verify session using Better Auth
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !session.user || !session.user.id) {
    return { userId: null, email: null, clinicaId: null, isSuperAdmin: false, isAnonymous: true };
  }

  const userId = session.user.id;
  const email = session.user.email;


  // 1) Verify if Super Admin
  let isSuperAdmin = false;
  try {
    const configRes = await query("SELECT super_admin_emails FROM app_config LIMIT 1");
    if (configRes.rows.length > 0) {
      const admins = configRes.rows[0].super_admin_emails ?? [];
      if (email && admins.includes(email)) {
        isSuperAdmin = true;
      }
    }
  } catch (err) {
    console.error("[Auth Resolver] Error fetching app_config for admin check", err);
  }

  // 2) Verify clinica_id from membro_equipe
  let clinicaId: string | null = null;
  try {
    const memberRes = await query(
      "SELECT clinica_id FROM membro_equipe WHERE user_id = $1 AND ativo = true LIMIT 1",
      [userId]
    );
    if (memberRes.rows.length > 0) {
      clinicaId = memberRes.rows[0].clinica_id;
    }
  } catch (err) {
    console.error("[Auth Resolver] Error checking membro_equipe", err);
  }

  return {
    userId,
    email,
    clinicaId,
    isSuperAdmin,
    isAnonymous: false,
  };
}

export async function executeDbQueryImpl(ast: QueryAST) {
  try {
    const { action, table, selects = "*", filters = [], orderCol = null, orderOpts = {}, limitCount = null, values = null } = ast;

    // 1) Whitelist validation
    const tableConfig = DB_TABLES[table];
    if (!tableConfig) {
      return { data: null, error: { message: `Table "${table}" is not whitelisted.`, code: "403" } };
    }

    if (!tableConfig.allowedOperations.includes(action)) {
      return { data: null, error: { message: `Action "${action}" is not allowed on table "${table}".`, code: "403" } };
    }

    // 2) Resolve request context (authentication / tenant scopes)
    const context = await resolveRequestContext();

    // 3) Apply security & multi-tenant business rules
    const activeFilters = [...filters];
    let activeValues = values ? { ...values } : null;

    if (!context.isSuperAdmin && tableConfig.requireTenantScope) {
      if (context.isAnonymous) {
        // Anonymous Access (Guest booking/scheduling flow)
        if (!tableConfig.publicRules?.[action as keyof typeof tableConfig.publicRules]) {
          return { data: null, error: { message: "Unauthorized anonymous access.", code: "401" } };
        }

        if (table === "clinica" && action === "select") {
          const hasSlugFilter = activeFilters.some(f => f.column === "slug" && f.type === "eq");
          if (!hasSlugFilter) {
            return { data: null, error: { message: "Anonymous users can only search clinics by slug.", code: "403" } };
          }
        } else if ((table === "profissional" || table === "procedimento") && action === "select") {
          const hasClinicaFilter = activeFilters.some(f => f.column === "clinica_id" && f.type === "eq");
          if (!hasClinicaFilter) {
            return { data: null, error: { message: "Anonymous queries on catalog tables require filtering by clinica_id.", code: "403" } };
          }
          // Force active = true
          activeFilters.push({ type: "eq", column: "ativo", value: true });
        } else if (table === "consulta" && action === "insert") {
          if (activeValues?.status !== "agendada") {
            return { data: null, error: { message: "Anonymous users can only schedule new appointments (status='agendada').", code: "403" } };
          }
        }
      } else {
        // Authenticated User access
        if (!context.clinicaId) {
          return { data: null, error: { message: "User is not associated with an active clinic.", code: "403" } };
        }

        const tenantColumn = tableConfig.tenantColumn ?? "clinica_id";

        if (action === "select" || action === "update" || action === "delete") {
          // Remove any existing filters on tenantColumn and inject correct tenant filter
          const index = activeFilters.findIndex(f => f.column === tenantColumn);
          if (index !== -1) activeFilters.splice(index, 1);
          activeFilters.push({ type: "eq", column: tenantColumn, value: context.clinicaId });
        } else if (action === "insert") {
          activeValues[tenantColumn] = context.clinicaId;
        }
      }
    }

    // Validate all input columns against the whitelist
    if (activeValues) {
      for (const col of Object.keys(activeValues)) {
        if (!tableConfig.allowedColumns.includes(col)) {
          return { data: null, error: { message: `Column "${col}" is not allowed in table "${table}".`, code: "400" } };
        }
      }
    }

    for (const filter of activeFilters) {
      if (!tableConfig.allowedColumns.includes(filter.column)) {
        return { data: null, error: { message: `Filter column "${filter.column}" is not allowed.`, code: "400" } };
      }
    }

    if (orderCol && !tableConfig.allowedColumns.includes(orderCol)) {
      return { data: null, error: { message: `Order column "${orderCol}" is not allowed.`, code: "400" } };
    }

    // 4) Build SQL Statement
    let sql = "";
    const queryParams: any[] = [];
    let pCount = 1;

    const addParam = (val: any) => {
      queryParams.push(val);
      return `$${pCount++}`;
    };

    const compileWhere = () => {
      if (activeFilters.length === 0) return "";
      const clauses: string[] = [];
      for (const filter of activeFilters) {
        const col = escapeIdentifier(filter.column);
        if (filter.value === null) {
          if (filter.type === "eq") clauses.push(`${col} IS NULL`);
          else if (filter.type === "neq") clauses.push(`${col} IS NOT NULL`);
        } else {
          if (filter.type === "eq") {
            clauses.push(`${col} = ${addParam(filter.value)}`);
          } else if (filter.type === "neq") {
            clauses.push(`${col} <> ${addParam(filter.value)}`);
          } else if (filter.type === "gte") {
            clauses.push(`${col} >= ${addParam(filter.value)}`);
          } else if (filter.type === "lte") {
            clauses.push(`${col} <= ${addParam(filter.value)}`);
          } else if (filter.type === "in") {
            clauses.push(`${col} = ANY(${addParam(filter.value)})`);
          }
        }
      }
      return clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
    };

    if (action === "select") {
      let compiledCols = "*";
      if (selects !== "*") {
        const parsedCols = selects
          .split(",")
          .map(c => c.trim())
          .filter(Boolean);
        for (const col of parsedCols) {
          if (!tableConfig.allowedColumns.includes(col)) {
            return { data: null, error: { message: `Select column "${col}" is not allowed.`, code: "400" } };
          }
        }
        compiledCols = parsedCols.map(escapeIdentifier).join(", ");
      }

      sql = `SELECT ${compiledCols} FROM ${escapeIdentifier(table)}`;
      sql += compileWhere();

      if (orderCol) {
        sql += ` ORDER BY ${escapeIdentifier(orderCol)} ${orderOpts.ascending ? "ASC" : "DESC"}`;
      }

      if (limitCount !== null) {
        sql += ` LIMIT ${parseInt(limitCount.toString())}`;
      }
    } else if (action === "insert") {
      const cols = Object.keys(activeValues);
      const colNames = cols.map(escapeIdentifier).join(", ");
      const valPlaceholders = cols.map(c => addParam(activeValues[c])).join(", ");

      sql = `INSERT INTO ${escapeIdentifier(table)} (${colNames}) VALUES (${valPlaceholders}) RETURNING *`;
    } else if (action === "update") {
      const cols = Object.keys(activeValues);
      const setClauses = cols.map(c => `${escapeIdentifier(c)} = ${addParam(activeValues[c])}`).join(", ");
      sql = `UPDATE ${escapeIdentifier(table)} SET ${setClauses}`;
      sql += compileWhere();
      sql += " RETURNING *";
    } else if (action === "delete") {
      sql = `DELETE FROM ${escapeIdentifier(table)}`;
      sql += compileWhere();
      sql += " RETURNING *";
    }

    // 5) Execute SQL Query against Postgres
    const result = await query(sql, queryParams);
    return {
      data: result.rows,
      error: null,
      count: result.rowCount,
      status: 200,
      statusText: "OK",
    };
  } catch (err: any) {
    console.error("[executeDbQueryImpl Error]", err);
    return {
      data: null,
      error: { message: err?.message || "Internal database query execution error.", code: err?.code || "500" },
      count: 0,
      status: 500,
      statusText: "Internal Server Error",
    };
  }
}

export async function syncAuthUserImpl() {
  try {
    const context = await resolveRequestContext();
    if (context.isAnonymous || !context.userId || !context.email) {
      return { success: false, error: "Não autenticado ou sessão inválida." };
    }

    const email = context.email.toLowerCase().trim();

    // 1) Procura o membro_equipe correspondente ao e-mail autenticado
    const findRes = await query(
      "SELECT id, clinica_id, user_id, nome, email, role, ativo, must_change_password FROM membro_equipe WHERE LOWER(email) = $1 LIMIT 1",
      [email]
    );

    if (findRes.rows.length === 0) {
      return { success: false, error: "Cadastro do membro não localizado." };
    }

    const member = findRes.rows[0];

    // 2) Sincroniza o user_id se estiver em branco
    if (!member.user_id) {
      await query(
        "UPDATE membro_equipe SET user_id = $1, updated_at = now() WHERE id = $2",
        [context.userId, member.id]
      );
      member.user_id = context.userId;
      console.log(`[syncAuthUserImpl] user_id vinculado com sucesso para o email ${email}`);
    } else if (member.user_id !== context.userId) {
      // Conflito de IDs
      return { success: false, error: "Conflito: Este e-mail já está associado a outra credencial." };
    }

    return { success: true, member };
  } catch (err: any) {
    console.error("[syncAuthUserImpl Error]", err);
    return { success: false, error: err?.message || "Erro de sincronização de login." };
  }
}

export async function markPasswordChangedImpl() {
  try {
    const context = await resolveRequestContext();
    if (!context.userId) {
      return { success: false, error: "Não autenticado." };
    }
    await query("UPDATE public.membro_equipe SET must_change_password = false WHERE user_id = $1", [context.userId]);
    return { success: true };
  } catch (err: any) {
    console.error("[markPasswordChangedImpl Error]", err);
    return { success: false, error: err?.message || "Erro ao atualizar status da senha." };
  }
}


