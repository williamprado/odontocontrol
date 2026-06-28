export interface ASTFilter {
  type: "eq" | "neq" | "gte" | "lte" | "in";
  column: string;
  value: any;
}

export interface QueryAST {
  action: "select" | "insert" | "update" | "delete";
  table: string;
  selects?: string;
  filters?: ASTFilter[];
  orderCol?: string | null;
  orderOpts?: { ascending?: boolean };
  limitCount?: number | null;
  values?: any;
}
