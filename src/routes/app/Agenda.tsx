import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { FormDialog } from "@/components/FormDialog";
import { SimpleForm } from "@/components/SimpleForm";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { addDays, addMonths, format, startOfMonth, startOfWeek, endOfMonth, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/app/Agenda")({ component: Page });

const statusColors: Record<string, string> = {
  agendada: "bg-blue-100 text-blue-800 border-blue-300",
  confirmada: "bg-emerald-100 text-emerald-800 border-emerald-300",
  realizada: "bg-purple-100 text-purple-800 border-purple-300",
  cancelada: "bg-red-100 text-red-800 border-red-300",
  faltou: "bg-amber-100 text-amber-800 border-amber-300",
};

type View = "dia" | "semana" | "mes";

function Page() {
  const { clinicaId } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<View>("semana");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const { from, to, days } = computeRange(view, anchor);

  const { data: cons = [] } = useQuery({
    queryKey: ["consultas", clinicaId, from, to],
    enabled: !!clinicaId,
    queryFn: async () => (await supabase.from("consulta").select("*").eq("clinica_id", clinicaId!).gte("data", from).lte("data", to).order("hora")).data ?? [],
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
      const payload = { ...v, paciente_nome: pac?.nome, profissional_nome: prof?.nome, duracao_minutos: Number(v.duracao_minutos ?? 60) };
      if (edit?.id) {
        const { error } = await supabase.from("consulta").update(payload).eq("id", edit.id); if (error) throw error;
      } else {
        const { error } = await supabase.from("consulta").insert({ ...payload, clinica_id: clinicaId }); if (error) throw error;
      }
      toast.success("Salvo"); setOpen(false); setEdit(null);
      qc.invalidateQueries({ queryKey: ["consultas", clinicaId] });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const onDrag = async (r: DropResult) => {
    if (!r.destination || r.destination.droppableId === r.source.droppableId) return;
    const id = r.draggableId;
    const novaData = r.destination.droppableId;
    const { error } = await supabase.from("consulta").update({ data: novaData }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Reagendado para " + format(new Date(novaData + "T12:00"), "dd/MM")); qc.invalidateQueries({ queryKey: ["consultas", clinicaId] }); }
  };

  const step = (n: number) => {
    if (view === "dia") setAnchor(addDays(anchor, n));
    else if (view === "semana") setAnchor(addDays(anchor, n * 7));
    else setAnchor(addMonths(anchor, n));
  };

  return (
    <>
      <PageHeader title="Agenda" description="Calendário inteligente · arraste para reagendar" actions={
        <div className="flex flex-wrap gap-2 items-center">
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as View)} size="sm">
            <ToggleGroupItem value="dia">Dia</ToggleGroupItem>
            <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
            <ToggleGroupItem value="mes">Mês</ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" size="icon" onClick={() => step(-1)}><ChevronLeft className="size-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(new Date())}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={() => step(1)}><ChevronRight className="size-4" /></Button>
          <Button onClick={() => { setEdit({ data: format(anchor, "yyyy-MM-dd"), duracao_minutos: 60, status: "agendada", tipo: "consulta" }); setOpen(true); }}><Plus className="size-4 mr-1" />Nova</Button>
        </div>
      } />

      <div className="text-sm text-muted-foreground mb-3 font-medium">
        {view === "dia" && format(anchor, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        {view === "semana" && `Semana de ${format(days[0], "dd/MM")} – ${format(days[days.length - 1], "dd/MM/yyyy")}`}
        {view === "mes" && format(anchor, "MMMM 'de' yyyy", { locale: ptBR })}
      </div>

      <DragDropContext onDragEnd={onDrag}>
        <div className={
          view === "dia" ? "grid grid-cols-1 gap-3" :
          view === "semana" ? "grid grid-cols-1 md:grid-cols-7 gap-3" :
          "grid grid-cols-7 gap-1.5"
        }>
          {days.map((d) => {
            const day = format(d, "yyyy-MM-dd");
            const items = cons.filter((c: any) => c.data === day);
            const isMes = view === "mes";
            const isHoje = day === format(new Date(), "yyyy-MM-dd");
            return (
              <Droppable droppableId={day} key={day}>
                {(prov, snap) => (
                  <Card ref={prov.innerRef} {...prov.droppableProps}
                    className={`p-2 ${isMes ? "min-h-[100px]" : "min-h-[260px]"} ${isHoje ? "ring-2 ring-primary" : ""} ${snap.isDraggingOver ? "bg-accent/60" : ""}`}>
                    <div className="text-xs uppercase text-muted-foreground">{format(d, isMes ? "EEEEEE" : "EEE", { locale: ptBR })}</div>
                    <div className={`font-semibold mb-2 ${isMes ? "text-sm" : ""}`}>{format(d, "dd/MM")}</div>
                    <div className="space-y-1.5">
                      {items.length === 0 && !isMes && <div className="text-xs text-muted-foreground">Sem consultas</div>}
                      {items.map((c: any, idx: number) => (
                        <Draggable draggableId={c.id} index={idx} key={c.id}>
                          {(p, s) => (
                            <div ref={p.innerRef} {...p.draggableProps}
                              onClick={() => { setEdit(c); setOpen(true); }}
                              className={`text-xs border rounded p-1.5 cursor-pointer hover:shadow ${statusColors[c.status]} ${s.isDragging ? "shadow-xl rotate-2" : ""}`}>
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{c.hora?.slice(0, 5)}</span>
                                <span {...p.dragHandleProps}><GripVertical className="size-3 opacity-60" /></span>
                              </div>
                              {!isMes && <div className="truncate">{c.paciente_nome}</div>}
                              {!isMes && <div className="opacity-70 truncate">{c.profissional_nome}</div>}
                              {isMes && <div className="truncate">{c.paciente_nome}</div>}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {prov.placeholder}
                    </div>
                  </Card>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <div className="flex gap-3 text-xs mt-4 text-muted-foreground flex-wrap">
        {Object.entries(statusColors).map(([k, c]) => <span key={k} className={`px-2 py-0.5 rounded border ${c}`}>{k}</span>)}
      </div>

      <FormDialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }} title={edit?.id ? "Editar consulta" : "Nova consulta"} wide>
        <SimpleForm
          initial={edit ?? {}}
          busy={busy}
          onSubmit={save}
          fields={[
            { name: "paciente_id", label: "Paciente", type: "select", required: true, col: 2, options: pacs.map((p: any) => ({ value: p.id, label: p.nome })) },
            { name: "profissional_id", label: "Profissional", type: "select", required: true, col: 2, options: profs.map((p: any) => ({ value: p.id, label: p.nome })) },
            { name: "data", label: "Data", type: "date", required: true },
            { name: "hora", label: "Hora", type: "time", required: true },
            { name: "duracao_minutos", label: "Duração (min)", type: "number" },
            { name: "tipo", label: "Tipo", type: "select", options: [
              { value: "consulta", label: "Consulta" }, { value: "retorno", label: "Retorno" },
              { value: "procedimento", label: "Procedimento" }, { value: "emergencia", label: "Emergência" },
            ]},
            { name: "status", label: "Status", type: "select", options: [
              { value: "agendada", label: "Agendada" }, { value: "confirmada", label: "Confirmada" },
              { value: "realizada", label: "Realizada" }, { value: "cancelada", label: "Cancelada" }, { value: "faltou", label: "Faltou" },
            ]},
            { name: "valor_total", label: "Valor", type: "number", step: "0.01" },
            { name: "observacoes", label: "Observações", type: "textarea", col: 2 },
            { name: "prontuario", label: "Prontuário", type: "textarea", col: 2 },
          ]}
        />
      </FormDialog>
    </>
  );
}

function computeRange(view: View, anchor: Date) {
  if (view === "dia") {
    const d = anchor; const day = format(d, "yyyy-MM-dd");
    return { from: day, to: day, days: [d] };
  }
  if (view === "semana") {
    const ws = startOfWeek(anchor, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(ws, i));
    return { from: format(days[0], "yyyy-MM-dd"), to: format(days[6], "yyyy-MM-dd"), days };
  }
  const ms = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const me = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cur = ms;
  while (cur <= me) { days.push(cur); cur = addDays(cur, 1); }
  return { from: format(days[0], "yyyy-MM-dd"), to: format(days[days.length - 1], "yyyy-MM-dd"), days };
}
