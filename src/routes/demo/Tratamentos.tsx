import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { demoTratamentos } from "@/lib/demo-seed";
import { brl, dateBR } from "@/lib/format";
import { Search, Play, Pause, Check, Eye, Activity } from "lucide-react";

export const Route = createFileRoute("/demo/Tratamentos")({ component: Page });

const ST: Record<string, { txt: string; cls: string }> = {
  em_andamento: { txt: "Em andamento", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pausado:      { txt: "Pausado",      cls: "bg-amber-100 text-amber-700 border-amber-200" },
  iniciado:     { txt: "Iniciado",     cls: "bg-sky-100 text-sky-700 border-sky-200" },
  concluido:    { txt: "Concluído",    cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

function Page() {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");

  const rows = useMemo(() => demoTratamentos.filter((t) => {
    if (filtro !== "todos" && t.status !== filtro) return false;
    if (q && !t.paciente_nome.toLowerCase().includes(q.toLowerCase()) && !t.descricao.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, filtro]);

  const totals = {
    todos:        demoTratamentos.length,
    em_andamento: demoTratamentos.filter(t=>t.status==="em_andamento").length,
    pausado:      demoTratamentos.filter(t=>t.status==="pausado").length,
    iniciado:     demoTratamentos.filter(t=>t.status==="iniciado").length,
    concluido:    demoTratamentos.filter(t=>t.status==="concluido").length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Tratamentos" description={`${demoTratamentos.length} planos de tratamento ativos`} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar paciente ou tratamento..." className="pl-9 bg-white" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["todos","em_andamento","pausado","iniciado","concluido"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                filtro === s ? "gradient-primary text-white border-transparent shadow-premium" : "bg-white hover:bg-muted/50"
              }`}
            >
              {s === "todos" ? "Todos" : ST[s]?.txt} · {totals[s as keyof typeof totals]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((t) => {
          const st = ST[t.status] ?? ST.em_andamento;
          return (
            <Card key={t.id} className="border-0 shadow-card shadow-card-hover gradient-card">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {t.paciente_nome.split(" ").slice(0,2).map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{t.paciente_nome}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.profissional_nome}</div>
                  </div>
                  <Badge variant="outline" className={st.cls}>{st.txt}</Badge>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="size-4 text-primary" />
                    {t.descricao}
                  </div>
                  {t.dente && t.dente !== "—" && <div className="text-xs text-muted-foreground mt-0.5">Dente: {t.dente}</div>}
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Valor estimado</div>
                    <div className="text-xl font-extrabold text-primary">{brl(t.valor_total)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Início</div>
                    <div className="text-xs font-medium">{dateBR(t.data_inicio)}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progresso · {t.etapas_concluidas}/{t.etapas_total} etapas</span>
                    <span className="font-bold">{t.progresso}%</span>
                  </div>
                  <Progress value={t.progresso} className="h-2" />
                  {t.proxima_etapa && (
                    <div className="text-[11px] text-muted-foreground mt-2">Próxima: {t.proxima_etapa}</div>
                  )}
                </div>

                <div className="mt-4 flex gap-1.5">
                  {t.status === "em_andamento" && (<>
                    <Button size="sm" variant="outline" className="flex-1"><Pause className="size-3.5 mr-1" />Pausar</Button>
                    <Button size="sm" className="flex-1 gradient-primary text-white"><Check className="size-3.5 mr-1" />Concluir</Button>
                  </>)}
                  {t.status === "pausado" && (
                    <Button size="sm" className="flex-1 gradient-primary text-white"><Play className="size-3.5 mr-1" />Continuar</Button>
                  )}
                  {t.status === "iniciado" && (
                    <Button size="sm" className="flex-1 gradient-primary text-white"><Play className="size-3.5 mr-1" />Iniciar</Button>
                  )}
                  <Button size="sm" variant="ghost"><Eye className="size-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
