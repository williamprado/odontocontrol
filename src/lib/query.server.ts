import { createServerFn } from "@tanstack/react-start";
import type { QueryAST } from "./query.types";

export const executeDbQuery = createServerFn({ method: "POST" })
  .validator((d: QueryAST) => d)
  .handler(async ({ data: ast }) => {
    // Dynamic import to keep server-only Node modules (like 'pg' and '@tanstack/react-start/server')
    // out of the static import path of client components.
    const { executeDbQueryImpl } = await import("./db-query.server");
    return await executeDbQueryImpl(ast);
  });
