import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { demoConsultas, demoProfissionais } from "@/lib/demo-seed";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/demo/Agenda")({ component: Page });

const HORAS = Array.from({ length: 13 }).map((_, i) => `${String(7 + i).padStart(2, "0")}:00`);
const PROF_COLOR: Record<string, string> = {};
demoProfissionais.forEach((p) => (PROF_COLOR[p.id] = p.cor));

const ST: Record<string, string> = {
  agendada:   "bg-slate-50 border-slate-300",
  confirmada: "bg-sky-50 border-sky-400",
  concluida:  "bg-emerald-50 border-emerald-400",
  cancelada:  "bg-red-50 border-red-300 opacity-60",
  faltou:     "bg-amber-50 border-amber-400",
};

function Page() {
  const [date, setDate] = useState(new Date());
  const [prof, setProf] = useState<string>("all");

  const consultasDia = useMemo(() => {
    const ymd = format(date, "yyyy-MM-dd");
    return demoConsultas.filter((c) => c.data === ymd && (prof === "all" || c.profissional_id === prof));
  }, [date, prof]);

  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Agenda"
        description={format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        actions={<Button className="gradient-primary text-white shadow-premium"><Plus className="size-4 mr-1.5" />Nova consulta</Button>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white rounded-lg border p-1 shadow-card">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(subDays(date, 1))}><ChevronLeft className="size-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8" onClick={() => setDate(new Date())}>Hoje</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="size-4" /></Button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setProf("all")} className={`px-3 py-1.5 text-xs font-medium rounded-md border ${prof === "all" ? "gradient-primary text-white border-transparent" : "bg-white"}`}>Todos</button>
          {demoProfissionais.map((p) => (
            <button key={p.id} onClick={() => setProf(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border flex items-center gap-2 ${prof === p.id ? "gradient-primary text-white border-transparent" : "bg-white"}`}>
              <span className="size-2 rounded-full" style={{ background: p.cor }}></span>
              {p.nome.split(" ").slice(-1)[0]}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="dia">
        <TabsList>
          <TabsTrigger value="dia">Dia</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
        </TabsList>

        <TabsContent value="dia" className="mt-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-0 overflow-hidden">
              <div className="grid grid-cols-[80px_1fr]">
                {HORAS.map((h) => {
                  const consH = consultasDia.filter((c) => c.hora.startsWith(h.slice(0, 2)));
                  return (
                    <div key={h} className="contents">
                      <div className="border-b border-r px-3 py-2 text-xs font-mono text-muted-foreground bg-muted/20">{h}</div>
                      <div className="border-b p-2 min-h-[68px] space-y-1.5">
                        {consH.map((c) => (
                          <div key={c.id} className={`text-xs p-2 rounded-md border-l-4 ${ST[c.status] ?? ST.agendada}`} style={{ borderLeftColor: PROF_COLOR[c.profissional_id] }}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">{c.hora}</span>
                              <span className="font-semibold truncate">{c.paciente_nome}</span>
                              <Badge variant="outline" className="text-[10px] ml-auto">{c.status}</Badge>
                            </div>
                            <div className="text-muted-foreground mt-0.5 truncate">{c.procedimento} · {c.profissional_nome}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semana" className="mt-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-0 overflow-x-auto">
              <div className="grid grid-cols-[80px_repeat(6,minmax(140px,1fr))] min-w-[900px]">
                <div className="border-b border-r p-2 bg-muted/20"></div>
                {weekDays.map((d) => (
                  <div key={d.toISOString()} className={`border-b border-r p-2 text-center ${isSameDay(d, new Date()) ? "bg-primary/10" : "bg-muted/20"}`}>
                    <div className="text-xs uppercase text-muted-foreground">{format(d, "EEE", { locale: ptBR })}</div>
                    <div className="text-lg font-bold">{format(d, "dd")}</div>
                  </div>
                ))}
                {HORAS.map((h) => (
                  <div key={h} className="contents">
                    <div className="border-b border-r px-2 py-1 text-[10px] font-mono text-muted-foreground bg-muted/20">{h}</div>
                    {weekDays.map((d) => {
                      const ymd = format(d, "yyyy-MM-dd");
                      const cons = demoConsultas.filter((c) => c.data === ymd && c.hora.startsWith(h.slice(0, 2)) && (prof === "all" || c.profissional_id === prof));
                      return (
                        <div key={ymd + h} className="border-b border-r p-1 min-h-[56px] space-y-1">
                          {cons.map((c) => (
                            <div key={c.id} className={`text-[10px] px-1.5 py-1 rounded border-l-2 ${ST[c.status]} truncate`} style={{ borderLeftColor: PROF_COLOR[c.profissional_id] }}>
                              <div className="font-bold">{c.hora} · {c.paciente_nome.split(" ")[0]}</div>
                              <div className="text-muted-foreground truncate">{c.procedimento}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
