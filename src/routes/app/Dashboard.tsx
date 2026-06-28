import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookingLinkCard } from "@/components/booking-link-card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brl, dateBR } from "@/lib/format";
import {
  Calendar, Users, DollarSign, TrendingUp, Receipt, ClipboardList,
  AlertTriangle, Repeat, Activity, FileWarning,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, subMonths } from "date-fns";

export const Route = createFileRoute("/app/Dashboard")({ component: Page });

const COLORS = ["#06B6D4", "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

function Page() {
  const { clinicaId, clinica } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const cutoff90 = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const cutoff7 = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", clinicaId],
    enabled: !!clinicaId,
    queryFn: async () => {
      const [cons, pac, fin, orc, trat] = await Promise.all([
        supabase.from("consulta").select("*").eq("clinica_id", clinicaId!),
        supabase.from("paciente").select("id,nome,updated_at").eq("clinica_id", clinicaId!).eq("ativo", true),
        supabase.from("financeiro").select("*").eq("clinica_id", clinicaId!).gte("data", format(subMonths(new Date(), 6), "yyyy-MM-dd")),
        supabase.from("orcamento").select("*").eq("clinica_id", clinicaId!),
        supabase.from("tratamento").select("*").eq("clinica_id", clinicaId!),
      ]);
      return {
        cons: cons.data ?? [],
        pac: pac.data ?? [],
        fin: fin.data ?? [],
        orc: orc.data ?? [],
        trat: trat.data ?? [],
      };
    },
  });

  const consultas = data?.cons ?? [];
  const consHoje = consultas.filter((c: any) => c.data === today);
  const consSemana = consultas.filter((c: any) => c.data >= weekStart && c.data <= weekEnd);
  const consMes = consultas.filter((c: any) => c.data >= monthStart && c.data <= monthEnd);
  const finMes = (data?.fin ?? []).filter((f: any) => f.data >= monthStart && f.data <= monthEnd);
  const receitaMes = finMes.filter((f: any) => f.tipo === "receita").reduce((a: number, x: any) => a + Number(x.valor), 0);
  const consConcluidasMes = consMes.filter((c: any) => c.status === "concluida" || c.status === "realizada");
  const ticketMedio = consConcluidasMes.length ? receitaMes / consConcluidasMes.length : 0;
  const consTotal = consMes.length || 1;
  const consFaltou = consMes.filter((c: any) => c.status === "faltou" || c.status === "no_show").length;
  const noShowRate = (consFaltou / consTotal) * 100;
  const orcPendentes = (data?.orc ?? []).filter((o: any) => o.status === "pendente" || o.status === "em_negociacao").length;
  const orcVelhos = (data?.orc ?? []).filter((o: any) => (o.status === "pendente" || o.status === "em_negociacao") && o.data <= cutoff7).length;
  const tratParalisados = (data?.trat ?? []).filter((t: any) => t.status === "em_andamento" && t.updated_at && t.updated_at < cutoff90).length;
  const pacAtivos = data?.pac.length ?? 0;
  // Retorno: pacientes com >1 consulta concluída nos últimos 90d / pacientes ativos
  const pacComRetorno = new Set(consultas.filter((c: any) => c.data >= cutoff90 && (c.status === "concluida" || c.status === "realizada")).map((c: any) => c.paciente_id)).size;
  const taxaRetorno = pacAtivos ? (pacComRetorno / pacAtivos) * 100 : 0;
  const aiAlerts = orcVelhos + tratParalisados;

  // Chart: atendimentos por dia da semana atual
  const chartSemana = Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    return {
      dia: dateBR(d, "EEE dd/MM"),
      consultas: consultas.filter((c: any) => c.data === d).length,
      concluidas: consultas.filter((c: any) => c.data === d && (c.status === "concluida" || c.status === "realizada")).length,
    };
  });

  // Top procedimentos via itens de orçamento
  const procMap: Record<string, number> = {};
  (data?.orc ?? []).forEach((o: any) => {
    (Array.isArray(o.itens) ? o.itens : []).forEach((it: any) => {
      const k = it.nome ?? it.descricao ?? "—";
      procMap[k] = (procMap[k] || 0) + (it.qtd ?? 1);
    });
  });
  const topProcs = Object.entries(procMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));

  // Top profissionais por consulta no mês
  const profMap: Record<string, number> = {};
  consMes.forEach((c: any) => {
    const k = c.profissional_nome ?? "—";
    profMap[k] = (profMap[k] || 0) + 1;
  });
  const topProfs = Object.entries(profMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nome, qtd]) => ({ nome, qtd }));

  // Próximas consultas
  const proximas = consultas
    .filter((c: any) => c.data >= today && c.status !== "cancelada")
    .sort((a: any, b: any) => (a.data + a.hora).localeCompare(b.data + b.hora))
    .slice(0, 5);

  const prontuariosPendentes = consultas.filter((c: any) => (c.status === "concluida" || c.status === "realizada") && !c.prontuario).slice(0, 5);

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral da sua clínica" />

      <div className="mb-4">
        <BookingLinkCard slug={clinica?.slug} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Consultas hoje" value={consHoje.length} icon={<Calendar className="size-4" />} />
        <KpiCard label="Consultas semana" value={consSemana.length} icon={<Calendar className="size-4" />} />
        <KpiCard label="Consultas mês" value={consMes.length} icon={<Activity className="size-4" />} />
        <KpiCard label="Faturamento mês" value={brl(receitaMes)} icon={<DollarSign className="size-4" />} />
        <KpiCard label="Ticket médio" value={brl(ticketMedio)} icon={<TrendingUp className="size-4" />} />
        <KpiCard label="Pacientes ativos" value={pacAtivos} icon={<Users className="size-4" />} />
        <KpiCard label="Taxa de retorno 90d" value={`${taxaRetorno.toFixed(1)}%`} icon={<Repeat className="size-4" />} />
        <KpiCard label="No-show" value={`${noShowRate.toFixed(1)}%`} icon={<AlertTriangle className="size-4" />} />
        <KpiCard label="Orçamentos pendentes" value={orcPendentes} icon={<Receipt className="size-4" />} />
        <KpiCard label="Alertas AI Growth" value={aiAlerts} icon={<ClipboardList className="size-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">Atendimentos (últimos 7 dias)</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={chartSemana}>
                  <XAxis dataKey="dia" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="consultas" fill="#06B6D4" name="Agendadas" />
                  <Bar dataKey="concluidas" fill="#10B981" name="Concluídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">Top procedimentos</h3>
            <div className="h-64">
              {topProcs.length ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={topProcs} dataKey="value" nameKey="name" outerRadius={80} label={(p) => p.name?.slice(0, 12)}>
                      {topProcs.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4">Top profissionais (mês)</h3>
            <div className="h-56">
              {topProfs.length ? (
                <ResponsiveContainer>
                  <BarChart data={topProfs} layout="vertical">
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="nome" type="category" width={120} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="qtd" fill="#06B6D4" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="size-4 text-primary" />Próximas consultas</h3>
            {proximas.length === 0 && <Empty />}
            <div className="space-y-2">
              {proximas.map((c: any) => (
                <div key={c.id} className="text-sm flex justify-between items-center border-b last:border-0 pb-2">
                  <div>
                    <div className="font-medium">{c.paciente_nome}</div>
                    <div className="text-xs text-muted-foreground">{c.profissional_nome}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs">{dateBR(c.data, "dd/MM")} {c.hora?.slice(0, 5)}</div>
                    <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={prontuariosPendentes.length ? "border-amber-300" : ""}>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><FileWarning className="size-4 text-amber-600" />Prontuários pendentes</h3>
            {prontuariosPendentes.length === 0 ? (
              <div className="text-sm text-muted-foreground">Tudo em dia!</div>
            ) : (
              <div className="space-y-2">
                {prontuariosPendentes.map((c: any) => (
                  <div key={c.id} className="text-sm flex justify-between border-b last:border-0 pb-2">
                    <div>
                      <div className="font-medium">{c.paciente_nome}</div>
                      <div className="text-xs text-muted-foreground">{c.profissional_nome}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{dateBR(c.data, "dd/MM")}</span>
                  </div>
                ))}
              </div>
            )}
            <Link to="/app/Agenda" className="text-xs text-primary hover:underline mt-3 inline-block">Ver agenda →</Link>
          </CardContent>
        </Card>
      </div>

      {isLoading && <div className="text-xs text-muted-foreground mt-4">Atualizando dados…</div>}
    </>
  );
}

function Empty() {
  return <div className="text-sm text-muted-foreground py-8 text-center">Sem dados ainda.</div>;
}
