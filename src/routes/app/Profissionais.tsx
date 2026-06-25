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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Phone, IdCard, Pencil, Trash2, CalendarDays } from "lucide-react";
import { brl, initials } from "@/lib/format";
import { addDays, format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/app/Profissionais")({ component: Page });

const ESPS = ["clinico_geral", "ortodontia", "endodontia", "periodontia", "implantodontia", "odontopediatria", "protese", "cirurgia", "estetica", "outra"];

function Page() {
  const { clinicaId } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(ws, i));
  const from = format(weekDays[0], "yyyy-MM-dd");
  const to = format(weekDays[6], "yyyy-MM-dd");

  const { data: rows = [] } = useQuery({
    queryKey: ["profissional", clinicaId], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("profissional").select("*").eq("clinica_id", clinicaId!).order("nome")).data ?? [],
  });
  const { data: cons = [] } = useQuery({
    queryKey: ["prof-cons", clinicaId, from, to], enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("consulta").select("profissional_id,data,status,valor_total").eq("clinica_id", clinicaId!).gte("data", from).lte("data", to)).data ?? [],
  });

  const save = async (v: any) => {
    setBusy(true);
    try {
      if (edit?.id) {
        const { error } = await supabase.from("profissional").update(v).eq("id", edit.id); if (error) throw error;
      } else {
        const { error } = await supabase.from("profissional").insert({ ...v, clinica_id: clinicaId, ativo: true }); if (error) throw error;
      }
      toast.success("Salvo"); setOpen(false); setEdit(null);
      qc.invalidateQueries({ queryKey: ["profissional", clinicaId] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir?")) return;
    const { error } = await supabase.from("profissional").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["profissional", clinicaId] }); }
  };

  const filtered = rows.filter((r: any) => !q || (r.nome + " " + r.especialidade + " " + (r.cro_numero ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Profissionais" description="Equipe clínica com KPIs e agenda" actions={
        <Button onClick={() => { setEdit({ percentual_repasse: 50 }); setOpen(true); }}><Plus className="size-4 mr-1" />Novo</Button>
      } />
      <Input placeholder="Buscar nome, especialidade, CRO..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md mb-4" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r: any) => {
          const meus = cons.filter((c: any) => c.profissional_id === r.id);
          const realizadas = meus.filter((c: any) => c.status === "realizada").length;
          const fat = meus.filter((c: any) => c.status === "realizada").reduce((a: number, c: any) => a + Number(c.valor_total ?? 0), 0);
          const noShow = meus.filter((c: any) => c.status === "faltou").length;
          return (
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="size-14"><AvatarFallback className="bg-primary text-primary-foreground">{initials(r.nome)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.nome}</div>
                    <div className="text-xs text-muted-foreground capitalize">{r.especialidade?.replace("_", " ") ?? "—"}</div>
                    <div className="flex gap-1 mt-1">
                      {r.ativo ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                      {r.cro_numero && <Badge variant="outline"><IdCard className="size-3 mr-1" />CRO {r.cro_numero}/{r.cro_uf}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {r.telefone && <div className="flex items-center gap-1"><Phone className="size-3" />{r.telefone}</div>}
                  {r.email && <div className="flex items-center gap-1"><Mail className="size-3" />{r.email}</div>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                  <Kpi label="Semana" value={meus.length} />
                  <Kpi label="Realizadas" value={realizadas} />
                  <Kpi label="Faturado" value={brl(fat)} />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><CalendarDays className="size-3" />Semana</div>
                  <div className="flex gap-1">
                    {weekDays.map((d) => {
                      const day = format(d, "yyyy-MM-dd");
                      const n = meus.filter((c: any) => c.data === day).length;
                      return (
                        <div key={day} className="flex-1 text-center">
                          <div className="text-[10px] text-muted-foreground">{format(d, "EEEEEE", { locale: ptBR })}</div>
                          <div className={`h-7 rounded text-xs font-medium flex items-center justify-center ${n > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{n}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Repasse {r.percentual_repasse}% · No-shows: {noShow}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEdit(r); setOpen(true); }}><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">Nenhum profissional.</div>}
      </div>

      <FormDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }} title={edit?.id ? "Editar profissional" : "Novo profissional"} wide>
        <SimpleForm
          initial={edit ?? {}}
          busy={busy}
          onSubmit={save}
          fields={[
            { name: "nome", label: "Nome", required: true, col: 2 },
            { name: "especialidade", label: "Especialidade", type: "select", options: ESPS.map(e => ({ value: e, label: e.replace("_", " ") })) },
            { name: "cro_numero", label: "CRO Nº" },
            { name: "cro_uf", label: "CRO UF" },
            { name: "telefone", label: "Telefone", type: "tel" },
            { name: "email", label: "Email", type: "email" },
            { name: "percentual_repasse", label: "Repasse %", type: "number", step: "0.01" },
          ]}
        />
      </FormDialog>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: any }) {
  return <div><div className="text-base font-bold text-primary">{value}</div><div className="text-[10px] uppercase text-muted-foreground">{label}</div></div>;
}
