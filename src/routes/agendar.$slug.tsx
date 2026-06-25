import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Activity, ChevronLeft, ChevronRight, Clock, User, Stethoscope, Calendar } from "lucide-react";
import { brl, initials } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/agendar/$slug")({ component: Page });

const HORAS = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"];

function Page() {
  const { slug } = useParams({ from: "/agendar/$slug" });
  const [clinica, setClinica] = useState<any>(null);
  const [profs, setProfs] = useState<any[]>([]);
  const [procs, setProcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState<any>({ proc: null, prof: null, data: "", hora: "", nome: "", telefone: "", email: "", data_nascimento: "", convenio: "" });
  const [protocolo, setProtocolo] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("clinica").select("*").eq("slug", slug).maybeSingle();
      setClinica(c);
      if (c) {
        const [{ data: p }, { data: pr }] = await Promise.all([
          supabase.from("profissional").select("*").eq("clinica_id", c.id).eq("ativo", true),
          supabase.from("procedimento").select("*").eq("clinica_id", c.id).eq("ativo", true),
        ]);
        setProfs(p ?? []); setProcs(pr ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  const submit = async () => {
    setBusy(true);
    try {
      const pacienteId = crypto.randomUUID();
      const { error: e1 } = await supabase.from("paciente").insert({
        id: pacienteId,
        clinica_id: clinica.id, nome: sel.nome, telefone: sel.telefone, email: sel.email || null,
        data_nascimento: sel.data_nascimento || null, convenio: sel.convenio || null,
      });
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("consulta").insert({
        clinica_id: clinica.id, paciente_id: pacienteId, paciente_nome: sel.nome,
        profissional_id: sel.prof.id, profissional_nome: sel.prof.nome,
        data: sel.data, hora: sel.hora, duracao_minutos: sel.proc.duracao_minutos ?? 60,
        tipo: "consulta", status: "agendada", valor_total: sel.proc.valor,
        procedimentos: [{ id: sel.proc.id, nome: sel.proc.nome, valor: sel.proc.valor }],
      });
      if (e2) throw e2;
      setProtocolo("OS" + Date.now().toString().slice(-8));
      setDone(true);
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>;
  if (!clinica) return <div className="min-h-screen grid place-items-center"><p className="text-muted-foreground">Clínica não encontrada.</p></div>;

  if (done) {
    const waMsg = encodeURIComponent(`Olá! Acabei de solicitar um agendamento na ${clinica.nome}. Protocolo: ${protocolo}. Procedimento: ${sel.proc.nome} com ${sel.prof.nome} em ${sel.data} às ${sel.hora}.`);
    const waNumero = (clinica.telefone ?? "").replace(/\D/g, "");
    const waUrl = `https://wa.me/${waNumero ? "55" + waNumero : ""}?text=${waMsg}`;
    return (
    <div className="min-h-screen grid place-items-center p-4 bg-[var(--surface)]">
      <Card className="w-full max-w-md text-center">
        <CardContent className="p-8 space-y-3">
          <CheckCircle2 className="size-14 text-emerald-500 mx-auto" />
          <h1 className="text-xl font-semibold">Agendamento solicitado!</h1>
          <p className="text-sm text-muted-foreground">A clínica entrará em contato para confirmar.</p>
          <div className="bg-primary/10 border border-primary/30 rounded p-3 text-sm">
            <div className="text-xs text-muted-foreground">Protocolo</div>
            <div className="font-mono font-bold text-primary text-lg">{protocolo}</div>
          </div>
          <div className="bg-muted rounded p-3 text-left text-sm space-y-1">
            <div><b>{sel.proc.nome}</b> com {sel.prof.nome}</div>
            <div className="text-muted-foreground">{sel.data} às {sel.hora}</div>
          </div>
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
            <a href={waUrl} target="_blank" rel="noopener noreferrer">Confirmar via WhatsApp</a>
          </Button>
        </CardContent>
      </Card>
    </div>
    );
  }

  const steps = [
    { n: 1, label: "Procedimento", icon: Stethoscope },
    { n: 2, label: "Profissional", icon: User },
    { n: 3, label: "Data & Hora", icon: Calendar },
    { n: 4, label: "Contato", icon: Clock },
  ];

  const canNext = step === 1 ? !!sel.proc : step === 2 ? !!sel.prof : step === 3 ? !!(sel.data && sel.hora) : !!(sel.nome && sel.telefone);

  return (
    <div className="min-h-screen bg-[var(--surface)] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="size-10 rounded-md bg-primary flex items-center justify-center"><Activity className="size-5 text-primary-foreground" /></div>
          <div>
            <div className="text-xs text-muted-foreground">Agendamento online</div>
            <h1 className="text-xl font-bold">{clinica.nome}</h1>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.n; const passed = step > s.n;
            return (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`size-9 rounded-full flex items-center justify-center transition ${passed ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {passed ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                  </div>
                  <div className={`text-[10px] uppercase ${active ? "font-semibold text-primary" : "text-muted-foreground"}`}>{s.label}</div>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-px mx-1 ${passed ? "bg-emerald-500" : "bg-muted"}`} />}
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader><CardTitle>
            {step === 1 && "Qual procedimento?"}
            {step === 2 && "Escolha o profissional"}
            {step === 3 && "Quando você prefere?"}
            {step === 4 && "Seus dados de contato"}
          </CardTitle></CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="grid sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                {procs.map((p) => (
                  <button key={p.id} onClick={() => setSel({ ...sel, proc: p })} className={`text-left p-3 border rounded-lg hover:border-primary transition ${sel.proc?.id === p.id ? "border-primary bg-primary/5" : ""}`}>
                    <div className="font-medium text-sm">{p.nome}</div>
                    <div className="text-xs text-muted-foreground flex justify-between mt-1"><span>{p.duracao_minutos}min</span><span className="font-semibold text-primary">{brl(p.valor)}</span></div>
                  </button>
                ))}
                {procs.length === 0 && <div className="col-span-full text-muted-foreground text-center py-6 text-sm">Nenhum procedimento disponível.</div>}
              </div>
            )}
            {step === 2 && (
              <div className="grid sm:grid-cols-2 gap-2">
                {profs.map((p) => (
                  <button key={p.id} onClick={() => setSel({ ...sel, prof: p })} className={`flex items-center gap-3 p-3 border rounded-lg hover:border-primary transition ${sel.prof?.id === p.id ? "border-primary bg-primary/5" : ""}`}>
                    <Avatar><AvatarFallback className="bg-primary text-primary-foreground">{initials(p.nome)}</AvatarFallback></Avatar>
                    <div className="text-left">
                      <div className="font-medium text-sm">{p.nome}</div>
                      <div className="text-xs text-muted-foreground capitalize">{p.especialidade?.replace("_", " ") ?? "—"}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={sel.data} min={new Date().toISOString().slice(0,10)} onChange={(e) => setSel({ ...sel, data: e.target.value })} /></div>
                <div>
                  <Label className="mb-2 block">Horário</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {HORAS.map((h) => (
                      <button key={h} onClick={() => setSel({ ...sel, hora: h })}
                        className={`py-2 text-sm border rounded transition ${sel.hora === h ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary"}`}>{h}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Seu nome *</Label><Input value={sel.nome} onChange={(e) => setSel({ ...sel, nome: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Telefone *</Label><Input value={sel.telefone} onChange={(e) => setSel({ ...sel, telefone: e.target.value })} required /></div>
                  <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={sel.email} onChange={(e) => setSel({ ...sel, email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Data de nascimento</Label><Input type="date" value={sel.data_nascimento} onChange={(e) => setSel({ ...sel, data_nascimento: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Plano/Convênio</Label><Input placeholder="Particular ou nome do plano" value={sel.convenio} onChange={(e) => setSel({ ...sel, convenio: e.target.value })} /></div>
                </div>
                <div className="bg-accent/40 border rounded p-3 text-sm space-y-1">
                  <div className="font-medium">Resumo</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Procedimento</span><span>{sel.proc?.nome}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Profissional</span><span>{sel.prof?.nome}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Data/Hora</span><span>{sel.data} {sel.hora}</span></div>
                  <div className="flex justify-between font-semibold"><span>Valor</span><Badge className="bg-primary">{brl(sel.proc?.valor)}</Badge></div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 1}><ChevronLeft className="size-4 mr-1" />Voltar</Button>
              {step < 4
                ? <Button onClick={() => setStep(step + 1)} disabled={!canNext}>Continuar<ChevronRight className="size-4 ml-1" /></Button>
                : <Button onClick={submit} disabled={!canNext || busy}>{busy && <Loader2 className="size-4 animate-spin mr-1" />}Confirmar agendamento</Button>}
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">Powered by OdontoControl AI</p>
      </div>
    </div>
  );
}
