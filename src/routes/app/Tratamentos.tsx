import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import { SimpleForm } from "@/components/SimpleForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Activity, Stethoscope } from "lucide-react";
import { brl, dateBR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/Tratamentos")({ component: Page });

const STATUS = [
  { value: "planejado", label: "Planejado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const stageWeight: Record<string, number> = { planejado: 10, em_andamento: 60, concluido: 100, cancelado: 0 };

function Page() {
  const { clinicaId } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [filtro, setFiltro] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: ["tratamento", clinicaId], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("tratamento").select("*").eq("clinica_id", clinicaId!).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: pacs = [] } = useQuery({
    queryKey: ["pac-lite", clinicaId], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("paciente").select("id,nome").eq("clinica_id", clinicaId!).order("nome")).data ?? [],
  });
  const { data: profs = [] } = useQuery({
    queryKey: ["prof-lite", clinicaId], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("profissional").select("id,nome").eq("clinica_id", clinicaId!).eq("ativo", true)).data ?? [],
  });

  const save = async (v: any) => {
    setBusy(true);
    try {
      const pac = pacs.find((p: any) => p.id === v.paciente_id);
      const prof = profs.find((p: any) => p.id === v.profissional_id);
      const payload = { ...v, paciente_nome: pac?.nome, profissional_nome: prof?.nome };
      if (edit?.id) {
        const { error } = await supabase.from("tratamento").update(payload).eq("id", edit.id); if (error) throw error;
      } else {
        const { error } = await supabase.from("tratamento").insert({ ...payload, clinica_id: clinicaId }); if (error) throw error;
      }
      toast.success("Salvo"); setOpen(false); setEdit(null);
      qc.invalidateQueries({ queryKey: ["tratamento", clinicaId] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir?")) return;
    const { error } = await supabase.from("tratamento").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["tratamento", clinicaId] }); }
  };

  const advance = async (r: any) => {
    const next = r.status === "planejado" ? "em_andamento" : r.status === "em_andamento" ? "concluido" : r.status;
    if (next === r.status) return;
    const payload: any = { status: next };
    if (next === "concluido") payload.data_conclusao = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("tratamento").update(payload).eq("id", r.id);
    if (error) toast.error(error.message);
    else { toast.success(`Status: ${next}`); qc.invalidateQueries({ queryKey: ["tratamento", clinicaId] }); }
  };

  const filtered = useMemo(() => rows.filter((r: any) => !filtro || (r.paciente_nome + " " + r.descricao + " " + (r.dente ?? "")).toLowerCase().includes(filtro.toLowerCase())), [rows, filtro]);

  return (
    <>
      <PageHeader title="Tratamentos" description="Planos com etapas e progresso" actions={
        <Button onClick={() => { setEdit({ status: "planejado", data_inicio: new Date().toISOString().slice(0, 10) }); setOpen(true); }}><Plus className="size-4 mr-1" />Novo</Button>
      } />
      <Input placeholder="Buscar..." className="max-w-md mb-4" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((r: any) => {
          const pct = stageWeight[r.status] ?? 0;
          const etapas = (r.descricao ?? "").split(/[;\n]+/).map((s: string) => s.trim()).filter(Boolean);
          const done = r.status === "concluido" ? etapas.length : r.status === "em_andamento" ? Math.ceil(etapas.length / 2) : 0;
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate flex items-center gap-1"><Stethoscope className="size-4 text-primary" />{r.paciente_nome}</div>
                    <div className="text-xs text-muted-foreground">Dente: {r.dente ?? "—"} · {r.profissional_nome ?? "—"}</div>
                  </div>
                  <Badge>{r.status}</Badge>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Progresso</span><span className="font-medium">{pct}%</span></div>
                  <Progress value={pct} className="h-2" />
                </div>
                {etapas.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">Etapas</div>
                    {etapas.slice(0, 6).map((e: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`size-4 rounded-full flex items-center justify-center text-[10px] ${i < done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>{i < done ? "✓" : i + 1}</span>
                        <span className={i < done ? "line-through text-muted-foreground" : ""}>{e}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t text-sm">
                  <div><span className="text-muted-foreground text-xs">Valor</span><div className="font-semibold">{brl(r.valor_total)}</div></div>
                  <div className="text-xs text-muted-foreground text-right"><div>{dateBR(r.data_inicio)}</div><div>→ {dateBR(r.data_conclusao)}</div></div>
                </div>
                <div className="flex gap-1 justify-end">
                  {r.status !== "concluido" && r.status !== "cancelado" && <Button size="sm" variant="outline" onClick={() => advance(r)}><Activity className="size-3 mr-1" />Avançar</Button>}
                  <Button size="icon" variant="ghost" onClick={() => { setEdit(r); setOpen(true); }}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="size-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">Nenhum tratamento.</div>}
      </div>

      <FormDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }} title={edit?.id ? "Editar tratamento" : "Novo tratamento"} wide>
        <SimpleForm
          initial={edit ?? {}}
          busy={busy}
          onSubmit={save}
          fields={[
            { name: "paciente_id", label: "Paciente", type: "select", required: true, col: 2, options: pacs.map((p: any) => ({ value: p.id, label: p.nome })) },
            { name: "profissional_id", label: "Profissional", type: "select", options: profs.map((p: any) => ({ value: p.id, label: p.nome })) },
            { name: "status", label: "Status", type: "select", options: STATUS },
            { name: "data_inicio", label: "Início", type: "date" },
            { name: "data_conclusao", label: "Conclusão", type: "date" },
            { name: "dente", label: "Dente/Local" },
            { name: "valor_total", label: "Valor total", type: "number", step: "0.01" },
            { name: "descricao", label: "Etapas (separar por ; ou nova linha)", type: "textarea", col: 2, required: true },
            { name: "observacoes", label: "Observações", type: "textarea", col: 2 },
          ]}
        />
      </FormDialog>
    </>
  );
}
