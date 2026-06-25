import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends Record<string, any>>({
  rows, columns, searchKeys, onRowClick, empty = "Nenhum registro.",
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  onRowClick?: (row: T) => void;
  empty?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = !q || !searchKeys?.length ? rows : rows.filter((r) =>
    searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="space-y-3">
      {searchKeys?.length ? (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="pl-9" />
        </div>
      ) : null}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">{empty}</TableCell></TableRow>
            ) : filtered.map((row, i) => (
              <TableRow key={(row as any).id ?? i}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "cursor-pointer" : ""}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render ? c.render(row) : (row[c.key] ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
