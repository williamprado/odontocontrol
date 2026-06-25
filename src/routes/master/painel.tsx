import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardContent } from "@/components/ui/card";
import { brl } from "@/lib/format";
import { Building2, DollarSign, AlertOctagon, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/master/painel")({ component: Page });

function Page() {
  const { data } = useQuery({
    queryKey: ["master-painel"],
    queryFn: async () => (await supabase.from("clinica").select("*")).data ?? [],
  });

  const clinicas = data ?? [];
  const total = clinicas.length;
  const ativas = clinicas.filter((c: any) => c.status_cobranca === "ativo").length;
  const suspensas = clinicas.filter((c: any) => c.status_cobranca === "suspenso").length;
  const mrr = clinicas.filter((c: any) => c.status_cobranca === "ativo").reduce((a: number, c: any) => a + Number(c.valor_mensal ?? 0), 0);

  const porPlano = ["starter", "pro", "premium"].map((p) => ({
    plano: p,
    clinicas: clinicas.filter((c: any) => c.plano === p).length,
    mrr: clinicas.filter((c: any) => c.plano === p && c.status_cobranca === "ativo").reduce((a: number, c: any) => a + Number(c.valor_mensal ?? 0), 0),
  }));

  return (
    <>
      <PageHeader title="Painel Master" description="Visão geral da plataforma" />
      <div className="grid md:grid-cols-4 gap-4">
        <KpiCard label="Clínicas" value={total} icon={<Building2 className="size-4" />} />
        <KpiCard label="Ativas" value={ativas} icon={<TrendingUp className="size-4" />} />
        <KpiCard label="Suspensas" value={suspensas} icon={<AlertOctagon className="size-4" />} />
        <KpiCard label="MRR" value={brl(mrr)} icon={<DollarSign className="size-4" />} />
      </div>
      <Card className="mt-6"><CardContent className="p-5">
        <h3 className="font-semibold mb-4">MRR por plano</h3>
        <div className="h-72"><ResponsiveContainer>
          <BarChart data={porPlano}>
            <XAxis dataKey="plano" /><YAxis /><Tooltip formatter={(v: any, k: any) => k === "mrr" ? brl(Number(v)) : v} /><Legend />
            <Bar dataKey="clinicas" fill="#06B6D4" name="Clínicas" />
            <Bar dataKey="mrr" fill="#10B981" name="MRR" />
          </BarChart>
        </ResponsiveContainer></div>
      </CardContent></Card>
    </>
  );
}
