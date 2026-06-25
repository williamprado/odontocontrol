import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { FormDialog } from "@/components/FormDialog";
import { SimpleForm } from "@/components/SimpleForm";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/Equipe")({ component: Page });

const ROLES = [
  { value: "owner", label: "Owner" }, { value: "admin", label: "Admin" },
  { value: "dentista", label: "Dentista" }, { value: "recepcionista", label: "Recepcionista" },
  { value: "auxiliar", label: "Auxiliar" }, { value: "financeiro", label: "Financeiro" },
];

function Page() {
  const { clinicaId } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["equipe", clinicaId], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("membro_equipe").select("*").eq("clinica_id", clinicaId!).order("nome")).data ?? [],
  });

  const save = async (v: any) => {
    setBusy(true);
    try {
      if (edit?.id) {
        const { error } = await supabase.from("membro_equipe").update({ nome: v.nome, role: v.role, ativo: v.ativo !== false }).eq("id", edit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("membro_equipe").insert({ clinica_id: clinicaId!, nome: v.nome, email: v.email, role: v.role, ativo: true });
        if (error) throw error;
        toast.info("Membro adicionado. Peça para ele criar conta com este email.");
      }
      toast.success("Salvo"); setOpen(false); setEdit(null);
      qc.invalidateQueries({ queryKey: ["equipe", clinicaId] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Equipe" description="Membros e permissões" actions={
        <Button onClick={() => { setEdit({}); setOpen(true); }}><Plus className="size-4 mr-1" />Novo membro</Button>
      } />
      <DataTable
        rows={rows as any[]}
        searchKeys={["nome" as any, "email" as any]}
        columns={[
          { key: "nome", header: "Nome" },
          { key: "email", header: "Email" },
          { key: "role", header: "Cargo", render: (r: any) => <Badge>{r.role}</Badge> },
          { key: "ativo", header: "Status", render: (r: any) => r.ativo ? <Badge variant="default">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge> },
          { key: "_a", header: "", className: "w-16 text-right", render: (r: any) => (
            <Button size="icon" variant="ghost" onClick={() => { setEdit(r); setOpen(true); }}><Pencil className="size-4" /></Button>
          )},
        ]}
      />
      <FormDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }} title={edit?.id ? "Editar membro" : "Novo membro"}>
        <SimpleForm
          initial={edit ?? { role: "recepcionista" }}
          busy={busy}
          onSubmit={save}
          fields={[
            { name: "nome", label: "Nome", required: true, col: 2 },
            { name: "email", label: "Email", type: "email", required: !edit?.id, col: 2 },
            { name: "role", label: "Cargo", type: "select", required: true, col: 2, options: ROLES },
          ]}
        />
      </FormDialog>
    </>
  );
}
