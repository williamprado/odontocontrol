import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEMO_KPI, DEMO_ALERTAS, consultasHoje, demoAIOportunidades } from "@/lib/demo-seed";
import { brl } from "@/lib/format";
import {
  Calendar, Users, DollarSign, Wallet, RotateCcw, Activity, Receipt, TrendingUp,
  AlertTriangle, Star, Sparkles, ArrowRight, Clock, Play, Check,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/demo/Dashboard")({ component: Page });

const KPIS = [
  { label: "Consultas hoje",         value: DEMO_KPI.consultasHoje,             icon: Calendar,   color: "text-sky-500 bg-sky-50" },
  { label: "Pacientes ativos",       value: DEMO_KPI.pacientesAtivos,           icon: Users,      color: "text-emerald-500 bg-emerald-50" },
  { label: "Faturamento do mês",     value: brl(DEMO_KPI.faturamentoMes),       icon: DollarSign, color: "text-violet-500 bg-violet-50" },
  { label: "A receber",              value: brl(DEMO_KPI.aReceber),             icon: Wallet,     color: "text-amber-500 bg-amber-50" },
  { label: "Revisões pendentes",     value: DEMO_KPI.revisoesPendentes,         icon: RotateCcw,  color: "text-orange-500 bg-orange-50" },
  { label: "Tratamentos em andamento", value: DEMO_KPI.tratamentosAndamento,    icon: Activity,   color: "text-cyan-500 bg-cyan-50" },
  { label: "Orçamentos pendentes",   value: DEMO_KPI.orcamentosPendentes,       icon: Receipt,    color: "text-rose-500 bg-rose-50" },
  { label: "Recebido no mês",        value: brl(DEMO_KPI.recebidoMes),          icon: TrendingUp, color: "text-teal-500 bg-teal-50" },
];

const ALERT_TONE: Record<string, string> = {
  red:   "border-red-200 bg-red-50/60",
  amber: "border-amber-200 bg-amber-50/60",
  sky:   "border-sky-200 bg-sky-50/60",
  green: "border-emerald-200 bg-emerald-50/60",
};
const ALERT_ICON: Record<string, any> = { red: AlertTriangle, amber: Clock, sky: Star, green: Check };
const ALERT_ICON_COLOR: Record<string, string> = {
  red: "text-red-500", amber: "text-amber-500", sky: "text-sky-500", green: "text-emerald-500",
};

const STATUS_HOJE: Record<string, { txt: string; cls: string }> = {
  concluida:       { txt: "Concluído",      cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  em_atendimento:  { txt: "Em atendimento", cls: "bg-sky-100 text-sky-700 border-sky-200" },
  agendada:        { txt: "Agendado",       cls: "bg-slate-100 text-slate-700 border-slate-200" },
  confirmada:      { txt: "Confirmado",     cls: "bg-violet-100 text-violet-700 border-violet-200" },
  faltou:          { txt: "Faltou",         cls: "bg-red-100 text-red-700 border-red-200" },
};

const PIE_COLORS = ["#0EA5E9", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

function Page() {
  // Consultas últimos 14 dias
  const chart14 = Array.from({ length: 14 }).map((_, i) => {
    const date = subDays(new Date(), 13 - i);
    return { dia: format(date, "dd/MM", { locale: ptBR }), qtd: 6 + Math.round(Math.sin(i * 0.7) * 4 + (i % 3) * 2 + 5) };
  });

  const top5 = [
    { name: "Limpeza",      value: 38 },
    { name: "Restauração",  value: 26 },
    { name: "Ortodontia",   value: 22 },
    { name: "Clareamento",  value: 14 },
    { name: "Implante",     value: 9 },
  ];

  const totalAI = demoAIOportunidades.reduce((a, o) => a + o.impacto, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Bom dia, Dra. Patrícia 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumo da clínica · {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <Button asChild className="gradient-primary text-white shadow-premium">
          <Link to="/demo/Agenda">Ver agenda completa <ArrowRight className="size-4 ml-1" /></Link>
        </Button>
      </div>

      {/* Alertas */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {DEMO_ALERTAS.map((a) => {
          const Icon = ALERT_ICON[a.tone];
          return (
            <div key={a.titulo} className={`rounded-xl border p-4 ${ALERT_TONE[a.tone]} shadow-card`}>
              <div className="flex items-start gap-3">
                <Icon className={`size-5 shrink-0 mt-0.5 ${ALERT_ICON_COLOR[a.tone]}`} />
                <div className="min-w-0">
                  <div className="font-semibold text-sm leading-tight">{a.titulo}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.desc}</div>
                  <button className="text-xs font-semibold text-foreground mt-2 hover:underline">{a.cta} →</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => (
          <Card key={k.label} className="border-0 shadow-card shadow-card-hover gradient-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{k.label}</span>
                <div className={`size-9 rounded-lg ${k.color} flex items-center justify-center`}>
                  <k.icon className="size-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold mt-3">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold">Consultas — últimos 14 dias</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Tendência diária de agendamentos realizados</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0">+18% vs período anterior</Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={chart14}>
                  <defs>
                    <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dia" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="qtd" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#grad1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-5">
            <h3 className="font-bold mb-1">Top 5 procedimentos</h3>
            <p className="text-xs text-muted-foreground mb-3">Mais realizados este mês</p>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={top5} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {top5.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consultas de hoje */}
      <Card className="border-0 shadow-card">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">Consultas de hoje</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{consultasHoje.length} atendimentos agendados</p>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/demo/Agenda">Ver todas</Link></Button>
          </div>
          <div className="space-y-2">
            {consultasHoje.slice(0, 8).map((c) => {
              const st = STATUS_HOJE[c.status] ?? STATUS_HOJE.agendada;
              return (
                <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/40 border">
                  <div className="text-sm font-mono font-semibold w-14 text-primary">{c.hora}</div>
                  <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {c.paciente_nome.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{c.paciente_nome}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.procedimento} · {c.profissional_nome}</div>
                  </div>
                  <Badge variant="outline" className={st.cls}>{st.txt}</Badge>
                  <div className="flex gap-1">
                    {c.status === "agendada" && <Button size="sm" variant="ghost" className="h-7"><Check className="size-3" /></Button>}
                    {c.status === "confirmada" && <Button size="sm" variant="ghost" className="h-7"><Play className="size-3" /></Button>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Growth banner */}
      <Card className="border-0 gradient-primary text-white shadow-premium">
        <CardContent className="p-6 flex flex-wrap items-center gap-5">
          <div className="size-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="size-7" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="text-xs font-semibold tracking-wider opacity-80">AI GROWTH ENGINE</div>
            <h3 className="text-xl font-extrabold mt-1">5 oportunidades identificadas · {brl(totalAI)} de receita recuperável</h3>
            <p className="text-sm opacity-90 mt-1">Mensagens prontas para disparar via WhatsApp em 1 clique.</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
            <Link to="/demo/AIGrowth">Ver todas <ArrowRight className="size-4 ml-1" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
