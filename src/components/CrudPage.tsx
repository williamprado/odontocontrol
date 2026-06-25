// Helper genérico para criar páginas CRUD ligadas ao Supabase.
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { FormDialog } from "@/components/FormDialog";
import { SimpleForm, type Field } from "@/components/SimpleForm";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CrudPage<T extends Record<string, any>>({
  table, title, description, columns, fields, searchKeys, defaults,
}: {
  table: string;
  title: string;
  description?: string;
  columns: Column<T>[];
  fields: Field[];
  searchKeys?: (keyof T)[];
  defaults?: Partial<T>;
}) {
  const { clinicaId } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: [table, clinicaId],
    enabled: !!clinicaId,
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select("*").eq("clinica_id", clinicaId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as T[];
    },
  });

  const save = async (v: any) => {
    setBusy(true);
    try {
      if (edit?.id) {
        const { error } = await supabase.from(table as any).update(v).eq("id", edit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert({ ...v, clinica_id: clinicaId });
        if (error) throw error;
      }
      toast.success("Salvo");
      setOpen(false); setEdit(null);
      qc.invalidateQueries({ queryKey: [table, clinicaId] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir?")) return;
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: [table, clinicaId] }); }
  };

  const cols: Column<T>[] = [
    ...columns,
    { key: "_actions", header: "", className: "w-24 text-right", render: (r: any) => (
      <div className="flex justify-end gap-1">
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEdit(r); setOpen(true); }}><Pencil className="size-4" /></Button>
        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); remove(r.id); }}><Trash2 className="size-4" /></Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title={title} description={description} actions={
        <Button onClick={() => { setEdit(defaults ?? {}); setOpen(true); }}><Plus className="size-4 mr-1" />Novo</Button>
      } />
      <DataTable rows={rows as any} columns={cols as any} searchKeys={searchKeys as any} />
      <FormDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }} title={edit?.id ? "Editar" : "Novo"} wide>
        <SimpleForm fields={fields} initial={edit ?? {}} onSubmit={save} busy={busy} />
      </FormDialog>
    </>
  );
}
