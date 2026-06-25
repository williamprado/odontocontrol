import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { OrcamentoSheet } from "@/components/OrcamentoSheet";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { brl, dateBR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/Orcamentos")({ component: Page });

function Page() {
  const { clinicaId } = useAuth();
  const qc = useQueryClient();
  const [sel, setSel] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["orcamento", clinicaId], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("orcamento").select("*").eq("clinica_id", clinicaId!).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: pacs = [] } = useQuery({
    queryKey: ["pac-lite", clinicaId], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("paciente").select("id,nome").eq("clinica_id", clinicaId!).order("nome")).data ?? [],
  });
  const { data: procs = [] } = useQuery({
    queryKey: ["proc-lite", clinicaId], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("procedimento").select("id,nome,valor").eq("clinica_id", clinicaId!).eq("ativo", true).order("nome")).data ?? [],
  });

  const openNew = () => { setSel({ status: "pendente", data: new Date().toISOString().slice(0, 10), parcelas: 1, desconto_pct: 0, itens: [] }); setOpen(true); };
  const openOne = (r: any) => { setSel(r); setOpen(true); };

  const remove = async (id: string) => {
    if (!confirm("Excluir?")) return;
    const { error } = await supabase.from("orcamento").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["orcamento", clinicaId] }); }
  };

  return (
    <>
      <PageHeader title="Orçamentos" description="Planos financeiros com aprovação e PDF" actions={
        <Button onClick={openNew}><Plus className="size-4 mr-1" />Novo</Button>
      } />
      <DataTable
        rows={rows as any[]}
        searchKeys={["numero" as any, "paciente_nome" as any]}
        columns={[
          { key: "numero", header: "Nº" },
          { key: "paciente_nome", header: "Paciente" },
          { key: "data", header: "Data", render: (r: any) => dateBR(r.data) },
          { key: "validade", header: "Validade", render: (r: any) => dateBR(r.validade) },
          { key: "total_com_desconto", header: "Total", render: (r: any) => brl(r.total_com_desconto ?? r.total) },
          { key: "parcelas", header: "Parcelas", render: (r: any) => `${r.parcelas}x` },
          { key: "status", header: "Status", render: (r: any) => <Badge>{r.status}</Badge> },
          { key: "_a", header: "", className: "w-24 text-right", render: (r: any) => (
            <div className="flex justify-end gap-1">
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); openOne(r); }}><Eye className="size-4" /></Button>
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); remove(r.id); }}><Trash2 className="size-4" /></Button>
            </div>
          )},
        ]}
        onRowClick={(r: any) => openOne(r)}
      />
      <OrcamentoSheet
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) setSel(null); }}
        orcamento={sel}
        procs={procs as any[]}
        pacs={pacs as any[]}
        onSaved={() => qc.invalidateQueries({ queryKey: ["orcamento", clinicaId] })}
      />
    </>
  );
}
