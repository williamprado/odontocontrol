import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { DEMO_KPI, demoProfissionais } from "@/lib/demo-seed";
import { brl } from "@/lib/format";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { Download, TrendingUp, Calendar, Users, DollarSign } from "lucide-react";

export const Route = createFileRoute("/demo/Relatorios")({ component: Page });

const C = ["#0EA5E9", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#6366F1"];

function Page() {
  const meses = ["Jul","Ago","Set","Out","Nov","Dez","Jan","Fev","Mar","Abr","Mai","Jun"];
  const fat12 = meses.map((m, i) => ({ mes: m, valor: 28000 + i * 1800 + Math.round(Math.sin(i) * 5000) + 8000 }));

  const profCons = demoProfissionais.map((p, i) => ({
    nome: p.nome.split(" ").slice(-1)[0],
    consultas: 95 - i * 18,
    faturamento: 28000 - i * 4200,
  }));

  const procTop = [
    { name: "Limpeza", value: 86 }, { name: "Restauração", value: 62 },
    { name: "Ortodontia", value: 54 }, { name: "Canal", value: 38 },
    { name: "Clareamento", value: 32 }, { name: "Implante", value: 24 },
    { name: "Coroa", value: 18 }, { name: "Faceta", value: 14 },
  ];

  const statusAg = [
    { name: "Realizadas", value: 198 },
    { name: "Confirmadas", value: 54 },
    { name: "Agendadas", value: 28 },
    { name: "Faltas", value: 14 },
    { name: "Canceladas", value: 8 },
  ];

  const ranking = demoProfissionais.map((p, i) => ({
    ...p, consultas: 95 - i * 18, ticket: 286 - i * 22, faturamento: 28000 - i * 4200, comissao: (28000 - i * 4200) * (p.percentual_repasse / 100),
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Relatórios"
        description="Análise completa de performance e produtividade"
        actions={<Button className="gradient-primary text-white shadow-premium"><Download className="size-4 mr-1.5" />Exportar PDF</Button>}
      />

      <div className="grid md:grid-cols-4 gap-3">
        <Kpi label="Faturamento 12m" value={brl(fat12.reduce((a,r)=>a+r.valor,0))} icon={DollarSign} color="text-emerald-500 bg-emerald-50" />
        <Kpi label="Consultas no período" value="287" icon={Calendar} color="text-sky-500 bg-sky-50" />
        <Kpi label="Pacientes ativos" value={DEMO_KPI.pacientesAtivos} icon={Users} color="text-violet-500 bg-violet-50" />
        <Kpi label="Ticket médio" value={brl(DEMO_KPI.ticketMedio)} icon={TrendingUp} color="text-amber-500 bg-amber-50" />
      </div>

      <Card className="border-0 shadow-card">
        <CardContent className="p-5">
          <h3 className="font-bold mb-4">Faturamento — últimos 12 meses</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={fat12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(v: any) => brl(Number(v))} contentStyle={{ borderRadius: 8 }} />
                <Line type="monotone" dataKey="valor" stroke="#0EA5E9" strokeWidth={3} dot={{ r: 4, fill: "#0EA5E9" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-card">
          <CardContent className="p-5">
            <h3 className="font-bold mb-4">Consultas por profissional</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={profCons}>
                  <XAxis dataKey="nome" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="consultas" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-5">
            <h3 className="font-bold mb-4">Top 8 procedimentos</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={procTop} dataKey="value" nameKey="name" outerRadius={90} label={{ fontSize: 10 }}>
                    {procTop.map((_, i) => <Cell key={i} fill={C[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-5">
            <h3 className="font-bold mb-4">Status dos agendamentos</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusAg} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {statusAg.map((_, i) => <Cell key={i} fill={C[i]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardContent className="p-5">
            <h3 className="font-bold mb-4">Faturamento por profissional</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={profCons} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="nome" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                  <Tooltip formatter={(v: any) => brl(Number(v))} />
                  <Bar dataKey="faturamento" fill="#10B981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-card">
        <CardContent className="p-5">
          <h3 className="font-bold mb-4">Ranking de profissionais</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 font-semibold">#</th>
                  <th className="px-4 py-2 font-semibold">Profissional</th>
                  <th className="px-4 py-2 font-semibold">Especialidade</th>
                  <th className="px-4 py-2 font-semibold text-right">Consultas</th>
                  <th className="px-4 py-2 font-semibold text-right">Ticket</th>
                  <th className="px-4 py-2 font-semibold text-right">Faturamento</th>
                  <th className="px-4 py-2 font-semibold text-right">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-bold text-primary">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold">{r.nome}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{r.especialidade}</Badge></td>
                    <td className="px-4 py-3 text-right">{r.consultas}</td>
                    <td className="px-4 py-3 text-right">{brl(r.ticket)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{brl(r.faturamento)}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary">{brl(r.comissao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="border-0 shadow-card gradient-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
          <div className={`size-9 rounded-lg flex items-center justify-center ${color}`}><Icon className="size-4" /></div>
        </div>
        <div className="text-2xl font-extrabold mt-3">{value}</div>
      </CardContent>
    </Card>
  );
}
