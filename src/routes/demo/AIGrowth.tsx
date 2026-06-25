import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { demoAIOportunidades } from "@/lib/demo-seed";
import { brl } from "@/lib/format";
import {
  Users, RotateCcw, Activity, FileText, Clock, Sparkles, Copy, MessageCircle,
  Wand2, ChevronDown, Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo/AIGrowth")({ component: Page });

const ICONS: Record<string, any> = { Users, RotateCcw, Activity, FileText, Clock };
const TONES: Record<string, { bg: string; text: string; ring: string }> = {
  red:    { bg: "bg-red-50",     text: "text-red-600",     ring: "ring-red-200" },
  amber:  { bg: "bg-amber-50",   text: "text-amber-600",   ring: "ring-amber-200" },
  orange: { bg: "bg-orange-50",  text: "text-orange-600",  ring: "ring-orange-200" },
  teal:   { bg: "bg-teal-50",    text: "text-teal-600",    ring: "ring-teal-200" },
  blue:   { bg: "bg-sky-50",     text: "text-sky-600",     ring: "ring-sky-200" },
};

function Page() {
  const [open, setOpen] = useState<string | null>(demoAIOportunidades[0].id);
  const total = demoAIOportunidades.reduce((a, o) => a + o.impacto, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="AI Growth Engine"
        description="A IA varre seus dados todos os dias e mostra exatamente onde está a receita parada."
        actions={<Badge className="bg-sky-100 text-sky-700 border-sky-200">Beta</Badge>}
      />

      {/* Destaque */}
      <Card className="border-0 gradient-primary text-white shadow-premium">
        <CardContent className="p-6 flex flex-wrap items-center gap-5">
          <div className="size-14 rounded-xl bg-white/20 flex items-center justify-center"><Sparkles className="size-7" /></div>
          <div className="flex-1 min-w-[240px]">
            <div className="text-xs font-semibold tracking-wider opacity-80">RECEITA POTENCIAL RECUPERÁVEL</div>
            <div className="text-4xl font-extrabold mt-1">{brl(total)}</div>
            <p className="text-sm opacity-90 mt-1">Distribuída em {demoAIOportunidades.length} oportunidades acionáveis.</p>
          </div>
          <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90"
            onClick={() => toast.success("Disparado para todos os contatos (demo).")}>
            Executar todas
          </Button>
        </CardContent>
      </Card>

      {/* Oportunidades */}
      <div className="space-y-3">
        {demoAIOportunidades.map((o) => {
          const Icon = ICONS[o.icon];
          const T = TONES[o.tone];
          const isOpen = open === o.id;
          return (
            <Card key={o.id} className="border-0 shadow-card">
              <CardContent className="p-0">
                <button
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30"
                  onClick={() => setOpen(isOpen ? null : o.id)}
                >
                  <div className={`size-12 rounded-xl ${T.bg} ${T.text} flex items-center justify-center ring-1 ${T.ring}`}>
                    <Icon className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{o.titulo}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{o.desc}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Impacto estimado</div>
                    <div className="text-lg font-extrabold text-emerald-600">+{brl(o.impacto)}</div>
                  </div>
                  <ChevronDown className={`size-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="border-t bg-muted/20 p-5 space-y-4 animate-fade-in">
                    {o.pacientes.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          Pacientes identificados ({o.pacientes.length})
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          {o.pacientes.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                              <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {p.nome.split(" ").slice(0,2).map((n)=>n[0]).join("")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">{p.nome}</div>
                                <div className="text-xs text-muted-foreground">{p.telefone} · há {p.dias} dias</div>
                              </div>
                              <div className="text-xs font-bold text-emerald-600">{brl(p.valor)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mensagem sugerida</div>
                      <div className="bg-white rounded-xl border p-4 text-sm leading-relaxed shadow-card">
                        {o.mensagem}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(o.mensagem); toast.success("Copiado!"); }}>
                          <Copy className="size-3.5 mr-1.5" /> Copiar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toast.info("IA gerou uma nova variação (demo).")}>
                          <Wand2 className="size-3.5 mr-1.5" /> Gerar com IA
                        </Button>
                        <Button size="sm" className="gradient-primary text-white" onClick={() => toast.success(`Campanha disparada para ${o.pacientes.length || "todos"} contatos (demo).`)}>
                          <MessageCircle className="size-3.5 mr-1.5" /> Disparar campanha
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-card bg-emerald-50/40 border border-emerald-100">
        <CardContent className="p-5 flex items-center gap-3">
          <Check className="size-5 text-emerald-600" />
          <div className="text-sm">
            <span className="font-semibold">Dados anonimizados.</span>{" "}
            <span className="text-muted-foreground">A IA roda apenas sobre dados da sua clínica e nunca compartilha informações com terceiros.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
