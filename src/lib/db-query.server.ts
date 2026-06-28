import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { query } from "./db.server";
import { DB_TABLES } from "./db-whitelist.server";
import type { QueryAST } from "./query.types";

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
  const authHeader = request?.headers?.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { userId: null, email: null, clinicaId: null, isSuperAdmin: false, isAnonymous: true };
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token || token.split(".").length !== 3) {
    return { userId: null, email: null, clinicaId: null, isSuperAdmin: false, isAnonymous: true };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing Supabase configuration environment variables.");
  }

  const tempSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await tempSupabase.auth.getClaims(token);
  if (error || !data?.claims || !data.claims.sub) {
    return { userId: null, email: null, clinicaId: null, isSuperAdmin: false, isAnonymous: true };
  }

  const userId = data.claims.sub;
  const email = data.claims.email;

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
