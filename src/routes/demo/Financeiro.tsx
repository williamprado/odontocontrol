import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { demoFinanceiro, DEMO_KPI } from "@/lib/demo-seed";
import { brl, dateBR } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, Wallet, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { format, subMonths } from "date-fns";

export const Route = createFileRoute("/demo/Financeiro")({ component: Page });

const STATUS: Record<string, string> = {
  pago:     "bg-emerald-100 text-emerald-700 border-emerald-200",
  pendente: "bg-amber-100 text-amber-700 border-amber-200",
  atrasado: "bg-red-100 text-red-700 border-red-200",
};

function Page() {
  const receitas = useMemo(() => demoFinanceiro.filter((f) => f.tipo === "receita").sort((a,b) => b.data.localeCompare(a.data)), []);
  const despesas = useMemo(() => demoFinanceiro.filter((f) => f.tipo === "despesa").sort((a,b) => b.data.localeCompare(a.data)), []);

  const chart = Array.from({ length: 6 }).map((_, i) => {
    const m = subMonths(new Date(), 5 - i);
    const base = 32000 + i * 2400 + (i % 2 ? 4000 : 0);
    return { mes: format(m, "MMM"), receitas: base, despesas: 18000 + i * 800 + (i % 3 ? 1500 : 0) };
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Financeiro"
        description="Receitas, despesas e fluxo de caixa"
        actions={<Button className="gradient-primary text-white shadow-premium"><Plus className="size-4 mr-1.5" />Novo lançamento</Button>}
      />

      <div className="grid md:grid-cols-4 gap-3">
        <Kpi label="Faturamento do mês" value={brl(DEMO_KPI.faturamentoMes)} icon={DollarSign} color="text-emerald-500 bg-emerald-50" />
        <Kpi label="A receber"          value={brl(DEMO_KPI.aReceber)}        icon={Wallet}     color="text-amber-500 bg-amber-50" />
        <Kpi label="Recebido no mês"    value={brl(DEMO_KPI.recebidoMes)}     icon={TrendingUp} color="text-sky-500 bg-sky-50" />
        <Kpi label="Despesas do mês"    value={brl(DEMO_KPI.despesasMes)}     icon={TrendingDown} color="text-red-500 bg-red-50" />
      </div>

      <Card className="border-0 shadow-card">
        <CardContent className="p-5">
          <h3 className="font-bold mb-4">Receitas vs Despesas — últimos 6 meses</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip formatter={(v: any) => brl(Number(v))} contentStyle={{ borderRadius: 8 }} />
                <Legend iconType="circle" />
                <Bar dataKey="receitas" fill="#0EA5E9" name="Receitas" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesas" fill="#EF4444" name="Despesas" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card">
        <CardContent className="p-5">
          <Tabs defaultValue="receitas">
            <TabsList>
              <TabsTrigger value="receitas">Receitas · {receitas.length}</TabsTrigger>
              <TabsTrigger value="despesas">Despesas · {despesas.length}</TabsTrigger>
            </TabsList>
            <TabsContent value="receitas" className="mt-4"><Tabela items={receitas} /></TabsContent>
            <TabsContent value="despesas" className="mt-4"><Tabela items={despesas} /></TabsContent>
          </Tabs>

          <div className="mt-5 pt-5 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total entradas</div>
              <div className="text-xl font-extrabold text-emerald-600">{brl(receitas.reduce((a,r) => a + r.valor, 0))}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total saídas</div>
              <div className="text-xl font-extrabold text-red-600">{brl(despesas.reduce((a,r) => a + r.valor, 0))}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Lucro</div>
              <div className="text-xl font-extrabold text-primary">{brl(receitas.reduce((a,r) => a + r.valor, 0) - despesas.reduce((a,r) => a + r.valor, 0))}</div>
            </div>
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

function Tabela({ items }: { items: any[] }) {
  return (
    <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 sticky top-0">
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2 font-semibold">Data</th>
            <th className="px-4 py-2 font-semibold">Descrição</th>
            <th className="px-4 py-2 font-semibold">Categoria</th>
            <th className="px-4 py-2 font-semibold">Pagamento</th>
            <th className="px-4 py-2 font-semibold">Status</th>
            <th className="px-4 py-2 font-semibold text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {items.map((f) => (
            <tr key={f.id} className="border-t hover:bg-muted/20">
              <td className="px-4 py-2 text-xs">{dateBR(f.data)}</td>
              <td className="px-4 py-2 text-xs truncate max-w-[280px]">{f.descricao}</td>
              <td className="px-4 py-2"><Badge variant="outline" className="text-[10px]">{f.categoria}</Badge></td>
              <td className="px-4 py-2 text-xs text-muted-foreground">{f.forma_pagamento}</td>
              <td className="px-4 py-2"><Badge variant="outline" className={`text-[10px] ${STATUS[f.status] ?? ""}`}>{f.status}</Badge></td>
              <td className={`px-4 py-2 text-right font-bold ${f.tipo === "receita" ? "text-emerald-600" : "text-red-600"}`}>{brl(f.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
