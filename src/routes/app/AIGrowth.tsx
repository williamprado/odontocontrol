import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, UserMinus, ReceiptText, PauseCircle, TrendingDown, MessageCircle } from "lucide-react";
import { brl, dateBR } from "@/lib/format";
import { format, subDays } from "date-fns";

export const Route = createFileRoute("/app/AIGrowth")({ component: Page });

function Page() {
  const { clinicaId } = useAuth();
  const cutoff90 = format(subDays(new Date(), 90), "yyyy-MM-dd");
  const cutoff7 = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const { data } = useQuery({
    queryKey: ["aigrowth", clinicaId],
    enabled: !!clinicaId,
    queryFn: async () => {
      const [pac, cons, orc, trat, proc] = await Promise.all([
        supabase.from("paciente").select("id,nome,telefone").eq("clinica_id", clinicaId!).eq("ativo", true),
        supabase.from("consulta").select("paciente_id,data,status").eq("clinica_id", clinicaId!),
        supabase.from("orcamento").select("*").eq("clinica_id", clinicaId!),
        supabase.from("tratamento").select("*").eq("clinica_id", clinicaId!),
        supabase.from("procedimento").select("*").eq("clinica_id", clinicaId!).eq("ativo", true),
      ]);
      return { pac: pac.data ?? [], cons: cons.data ?? [], orc: orc.data ?? [], trat: trat.data ?? [], proc: proc.data ?? [] };
    },
  });

  const ultimaConsulta: Record<string, string> = {};
  (data?.cons ?? []).forEach((c: any) => {
    const prev = ultimaConsulta[c.paciente_id];
    if (!prev || c.data > prev) ultimaConsulta[c.paciente_id] = c.data;
  });
  const pacInativos = (data?.pac ?? []).filter((p: any) => {
    const last = ultimaConsulta[p.id];
    return !last || last < cutoff90;
  });

  const orcVelhos = (data?.orc ?? []).filter((o: any) =>
    (o.status === "pendente" || o.status === "em_negociacao") && o.data <= cutoff7
  );

  const tratParalisados = (data?.trat ?? []).filter((t: any) =>
    t.status === "em_andamento" && t.updated_at && t.updated_at.slice(0, 10) < cutoff90
  );

  // Procedimentos com baixa demanda (não apareceram em nenhum orçamento nos últimos 90d)
  const procsUsados = new Set<string>();
  (data?.orc ?? []).forEach((o: any) => {
    if (o.data >= cutoff90) {
      (Array.isArray(o.itens) ? o.itens : []).forEach((it: any) => procsUsados.add((it.nome ?? "").toLowerCase()));
    }
  });
  const procsBaixaDemanda = (data?.proc ?? []).filter((p: any) => !procsUsados.has((p.nome ?? "").toLowerCase())).slice(0, 8);

  const cards = [
    {
      icon: UserMinus, color: "text-amber-600 bg-amber-50",
      title: "Pacientes para reativar",
      desc: "Sem consulta há mais de 90 dias. Campanha de retorno via WhatsApp aumenta a receita recorrente.",
      count: pacInativos.length,
      impacto: `Potencial: ${brl(pacInativos.length * 180)}/mês`,
      preview: pacInativos.slice(0, 5).map((p: any) => p.nome),
      cta: { to: "/app/Pacientes", label: "Ver pacientes" },
    },
    {
      icon: ReceiptText, color: "text-cyan-600 bg-cyan-50",
      title: "Orçamentos sem resposta",
      desc: "Pendentes há mais de 7 dias. Follow-up rápido eleva a taxa de aprovação em até 35%.",
      count: orcVelhos.length,
      impacto: `Valor parado: ${brl(orcVelhos.reduce((a: number, o: any) => a + Number(o.total_com_desconto ?? o.total ?? 0), 0))}`,
      preview: orcVelhos.slice(0, 5).map((o: any) => `${o.paciente_nome} · ${brl(o.total_com_desconto ?? o.total)}`),
      cta: { to: "/app/Orcamentos", label: "Ver orçamentos" },
    },
    {
      icon: PauseCircle, color: "text-purple-600 bg-purple-50",
      title: "Tratamentos paralisados",
      desc: "Em andamento, mas sem atividade recente. Retomar evita perda do paciente para outra clínica.",
      count: tratParalisados.length,
      impacto: `Receita em risco: ${brl(tratParalisados.reduce((a: number, t: any) => a + Number(t.valor_total ?? 0), 0))}`,
      preview: tratParalisados.slice(0, 5).map((t: any) => `${t.paciente_nome} · ${t.descricao}`),
      cta: { to: "/app/Tratamentos", label: "Ver tratamentos" },
    },
    {
      icon: TrendingDown, color: "text-emerald-600 bg-emerald-50",
      title: "Procedimentos para promover",
      desc: "Pouco demandados nos últimos 90 dias. Inclua em pacote ou destaque na recepção.",
      count: procsBaixaDemanda.length,
      impacto: "Aumente o ticket médio com cross-sell",
      preview: procsBaixaDemanda.slice(0, 5).map((p: any) => `${p.nome} · ${brl(p.valor)}`),
      cta: { to: "/app/Procedimentos", label: "Ver procedimentos" },
    },
  ];

  return (
    <>
      <PageHeader
        title="AI Growth"
        description="Oportunidades calculadas a partir dos seus dados"
        actions={<Badge variant="outline"><Sparkles className="size-3 mr-1" />Beta</Badge>}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="hover:border-primary/40 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center ${c.color}`}>
                  <c.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{c.title}</h3>
                    <Badge variant="secondary">{c.count}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
                  <div className="text-sm font-medium text-foreground mt-3">{c.impacto}</div>
                  {c.preview.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {c.preview.map((p: any, j: number) => (
                        <li key={j} className="text-xs text-muted-foreground truncate">• {p}</li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button asChild size="sm"><Link to={c.cta.to}>{c.cta.label}</Link></Button>
                    <Button size="sm" variant="outline" disabled><MessageCircle className="size-3 mr-1" />WhatsApp em lote</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4 bg-gradient-to-br from-primary/5 to-accent/30 border-primary/20">
        <CardContent className="p-5 text-sm text-muted-foreground">
          <strong className="text-foreground">Como funciona:</strong> o AI Growth varre seus pacientes,
          consultas, orçamentos e tratamentos para encontrar oportunidades de receita acionáveis.
          Atualizado em {dateBR(new Date())}.
        </CardContent>
      </Card>
    </>
  );
}
