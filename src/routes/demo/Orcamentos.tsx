import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { demoOrcamentos } from "@/lib/demo-seed";
import { brl, dateBR } from "@/lib/format";
import { ChevronDown, Search, Check, X, Send, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/Orcamentos")({ component: Page });

const ST: Record<string, { txt: string; cls: string }> = {
  aprovado:  { txt: "Aprovado",  cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pendente:  { txt: "Pendente",  cls: "bg-amber-100 text-amber-700 border-amber-200" },
  enviado:   { txt: "Enviado",   cls: "bg-sky-100 text-sky-700 border-sky-200" },
  recusado:  { txt: "Recusado",  cls: "bg-red-100 text-red-700 border-red-200" },
};

function Page() {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");

  const rows = useMemo(() => demoOrcamentos.filter((o) => {
    if (filtro !== "todos" && o.status !== filtro) return false;
    if (q && !o.paciente_nome.toLowerCase().includes(q.toLowerCase()) && !o.numero.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [q, filtro]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Orçamentos"
        description={`${demoOrcamentos.length} orçamentos · ${demoOrcamentos.filter(o=>o.status==="pendente").length} aguardando resposta`}
        actions={<Button className="gradient-primary text-white shadow-premium"><FileText className="size-4 mr-1.5" />Novo orçamento</Button>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar paciente ou número..." className="pl-9 bg-white" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["todos","pendente","enviado","aprovado","recusado"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                filtro === s ? "gradient-primary text-white border-transparent shadow-premium" : "bg-white hover:bg-muted/50"
              }`}
            >
              {s === "todos" ? "Todos" : ST[s]?.txt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((o) => {
          const st = ST[o.status];
          const isOpen = open === o.id;
          const stale = o.dias_desde_envio > 14 && o.status !== "aprovado" && o.status !== "recusado";
          return (
            <Card key={o.id} className="border-0 shadow-card">
              <CardContent className="p-0">
                <button onClick={() => setOpen(isOpen ? null : o.id)} className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30">
                  <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {o.paciente_nome.split(" ").slice(0,2).map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-bold">{o.paciente_nome}</div>
                      <Badge variant="outline" className="text-[10px] font-mono">{o.numero}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Enviado em {dateBR(o.data)} · {o.parcelas}x · {o.profissional_nome}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-primary">{brl(o.total_com_desconto)}</div>
                    <div className={`text-[10px] mt-0.5 flex items-center justify-end gap-1 ${stale ? "text-red-600 font-bold" : "text-muted-foreground"}`}>
                      {stale && <AlertCircle className="size-3" />}
                      há {o.dias_desde_envio}d
                    </div>
                  </div>
                  <Badge variant="outline" className={st?.cls}>{st?.txt}</Badge>
                  <ChevronDown className={`size-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="border-t bg-muted/20 p-5 animate-fade-in">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Itens do orçamento</div>
                    <div className="space-y-2">
                      {o.itens.map((it: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div>
                            <div className="font-semibold text-sm">{it.nome}</div>
                            <div className="text-xs text-muted-foreground">{it.descricao} · qtd {it.qtd}</div>
                          </div>
                          <div className="font-bold">{brl(it.valor * it.qtd)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-white rounded-lg border flex justify-between items-center">
                      <div>
                        <div className="text-xs text-muted-foreground">Total com desconto ({o.desconto_pct}%)</div>
                        <div className="text-2xl font-extrabold text-primary">{brl(o.total_com_desconto)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{o.observacoes}</div>
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <Button size="sm" className="gradient-primary text-white" onClick={() => toast.success("Aprovado e convertido em tratamento (demo)")}>
                        <Check className="size-3.5 mr-1.5" />Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toast.info("Marcado como recusado (demo)")}>
                        <X className="size-3.5 mr-1.5" />Recusar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toast.success("Reenviado por WhatsApp (demo)")}>
                        <Send className="size-3.5 mr-1.5" />Reenviar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
