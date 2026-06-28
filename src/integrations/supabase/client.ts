import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { executeDbQuery } from "@/lib/query.server";
import type { ASTFilter } from "@/lib/query.types";

// 1) Initialize the real Supabase client for auth/storage delegation
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://example.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "CHANGE_ME";

const realSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 2) Define the Mock Builder mimicking postgrest interface
class LocalPostgresQueryBuilder {
  private table: string;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private selects: string = "*";
  private filters: ASTFilter[] = [];
  private orderCol: string | null = null;
  private orderOpts: { ascending?: boolean } = {};
  private limitCount: number | null = null;
  private payload: any = null;
  private singleResult: boolean = false;
  private maybeSingleResult: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = "*") {
    this.action = "select";
    this.selects = columns;
    return this;
  }

  insert(values: any) {
    this.action = "insert";
    this.payload = values;
    return this;
  }

  update(values: any) {
    this.action = "update";
    this.payload = values;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: "neq", column, value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: "gte", column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ type: "lte", column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: "in", column, value: values });
    return this;
  }

  order(column: string, opts: { ascending?: boolean } = {}) {
    this.orderCol = column;
    this.orderOpts = opts;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleResult = true;
    return this;
  }

  // Support thenable behavior (allowing `await builder`)
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    try {
      // Execute database query through Server Function
      const res = await executeDbQuery({
        data: {
          action: this.action,
          table: this.table,
          selects: this.selects,
          filters: this.filters,
          orderCol: this.orderCol,
          orderOpts: this.orderOpts,
          limitCount: this.limitCount,
          values: this.payload,
        }
      });

      if (res.error) {
        return { data: null, error: res.error };
      }

      const rows = res.data ?? [];

      if (this.singleResult) {
        if (rows.length === 0) {
          return {
            data: null,
            error: {
              message: "JSON object requested, no rows returned",
              code: "PGRST116",
            },
          };
        }
        return { data: rows[0], error: null };
      }

      if (this.maybeSingleResult) {
        return { data: rows.length > 0 ? rows[0] : null, error: null };
      }

      return { data: rows, error: null };
    } catch (err: any) {
      console.error("[LocalPostgresQueryBuilder Execute error]", err);
      return {
        data: null,
        error: {
          message: err?.message || "Local PostgreSQL proxy query failed.",
          code: "500",
        },
      };
    }
  }
}

// 3) Export the compatible client object
export const supabase = {
  auth: realSupabase.auth,
  from: (table: string) => new LocalPostgresQueryBuilder(table),
};
