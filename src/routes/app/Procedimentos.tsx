import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import { SimpleForm } from "@/components/SimpleForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Clock } from "lucide-react";
import { brl } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/Procedimentos")({ component: Page });

function Page() {
  const { clinicaId } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["procedimento", clinicaId], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("procedimento").select("*").eq("clinica_id", clinicaId!).order("nome")).data ?? [],
  });

  const save = async (v: any) => {
    setBusy(true);
    try {
      if (edit?.id) {
        const { error } = await supabase.from("procedimento").update(v).eq("id", edit.id); if (error) throw error;
      } else {
        const { error } = await supabase.from("procedimento").insert({ ...v, clinica_id: clinicaId, ativo: true }); if (error) throw error;
      }
      toast.success("Salvo"); setOpen(false); setEdit(null);
      qc.invalidateQueries({ queryKey: ["procedimento", clinicaId] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir?")) return;
    const { error } = await supabase.from("procedimento").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["procedimento", clinicaId] }); }
  };

  const cats = Array.from(new Set(rows.map((r: any) => r.categoria).filter(Boolean))) as string[];
  const filtered = rows.filter((r: any) => {
    const m = !q || (r.nome + " " + (r.codigo_tuss ?? "") + " " + (r.categoria ?? "") + " " + (r.especialidade ?? "")).toLowerCase().includes(q.toLowerCase());
    return m && (!cat || r.categoria === cat);
  });

  return (
    <>
      <PageHeader title="Procedimentos" description="Catálogo com código TUSS e tabela de valores" actions={
        <Button onClick={() => { setEdit({ duracao_minutos: 60, valor: 0 }); setOpen(true); }}><Plus className="size-4 mr-1" />Novo</Button>
      } />
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative max-w-md flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar nome, código TUSS, categoria..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button size="sm" variant={cat === "" ? "default" : "outline"} onClick={() => setCat("")}>Todas</Button>
          {cats.map((c) => <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)}>{c}</Button>)}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{r.nome}</div>
                  <div className="text-xs text-muted-foreground">{r.categoria ?? "—"} · {r.especialidade ?? "—"}</div>
                </div>
                {r.codigo_tuss && <Badge variant="outline" className="font-mono text-[10px]">TUSS {r.codigo_tuss}</Badge>}
              </div>
              {r.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{r.descricao}</p>}
              <div className="flex justify-between items-end pt-2 border-t">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3" />{r.duracao_minutos}min</div>
                <div className="text-lg font-bold text-primary">{brl(r.valor)}</div>
              </div>
              <div className="flex gap-1 justify-end">
                <Button size="icon" variant="ghost" onClick={() => { setEdit(r); setOpen(true); }}><Pencil className="size-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="size-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">Nenhum procedimento.</div>}
      </div>

      <FormDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }} title={edit?.id ? "Editar procedimento" : "Novo procedimento"} wide>
        <SimpleForm
          initial={edit ?? {}}
          busy={busy}
          onSubmit={save}
          fields={[
            { name: "nome", label: "Nome", required: true, col: 2 },
            { name: "categoria", label: "Categoria" },
            { name: "especialidade", label: "Especialidade" },
            { name: "codigo_tuss", label: "Código TUSS" },
            { name: "duracao_minutos", label: "Duração (min)", type: "number" },
            { name: "valor", label: "Valor (R$)", type: "number", step: "0.01", required: true, col: 2 },
            { name: "descricao", label: "Descrição", type: "textarea", col: 2 },
          ]}
        />
      </FormDialog>
    </>
  );
}
