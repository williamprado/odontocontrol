import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { demoPacientes, demoHistorico, demoOrcamentos, demoTratamentos, demoFinanceiro } from "@/lib/demo-seed";
import { brl, dateBR } from "@/lib/format";
import { Plus, Search, Eye, Pencil, AlertCircle, Phone, Mail, FileText } from "lucide-react";

export const Route = createFileRoute("/demo/Pacientes")({ component: Page });

const STATUS_PILL: Record<string, string> = {
  ativo:             "bg-emerald-100 text-emerald-700 border-emerald-200",
  inativo:           "bg-red-100 text-red-700 border-red-200",
  novo:              "bg-sky-100 text-sky-700 border-sky-200",
  retorno_pendente:  "bg-amber-100 text-amber-700 border-amber-200",
};
const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo", inativo: "Inativo", novo: "Novo", retorno_pendente: "Retorno pendente",
};
const TAG_PILL: Record<string, string> = {
  vip:               "bg-violet-100 text-violet-700 border-violet-200",
  recorrente:        "bg-sky-100 text-sky-700 border-sky-200",
  inativo:           "bg-red-100 text-red-700 border-red-200",
  tratamento_pausado:"bg-orange-100 text-orange-700 border-orange-200",
  revisao_pendente:  "bg-amber-100 text-amber-700 border-amber-200",
  novo:              "bg-cyan-100 text-cyan-700 border-cyan-200",
};

function Page() {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<string>("todos");
  const [sel, setSel] = useState<any>(null);

  const rows = useMemo(() => {
    return demoPacientes.filter((p) => {
      if (filtro !== "todos" && p.status !== filtro) return false;
      if (q && !p.nome.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, filtro]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Pacientes"
        description={`${demoPacientes.length} cadastrados · ${demoPacientes.filter(p=>p.status==="ativo").length} ativos · ${demoPacientes.filter(p=>p.status==="inativo").length} inativos`}
        actions={<Button className="gradient-primary text-white shadow-premium"><Plus className="size-4 mr-1.5" />Novo paciente</Button>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome..." className="pl-9 bg-white" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["todos","ativo","inativo","novo","retorno_pendente"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                filtro === s ? "gradient-primary text-white border-transparent shadow-premium" : "bg-white hover:bg-muted/50"
              }`}
            >
              {s === "todos" ? "Todos" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-0 shadow-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Contato</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Tags</th>
                  <th className="px-4 py-3 font-semibold">Última consulta</th>
                  <th className="px-4 py-3 font-semibold text-right">Consultas</th>
                  <th className="px-4 py-3 font-semibold text-right">Histórico R$</th>
                  <th className="px-4 py-3 font-semibold">Plano</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setSel(p)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {p.nome.split(" ").slice(0,2).map((n) => n[0]).join("")}
                        </div>
                        <div className="font-semibold">{p.nome}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Phone className="size-3" />{p.telefone}</div>
                      <div className="flex items-center gap-1 mt-0.5 truncate max-w-[200px]"><Mail className="size-3" />{p.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={STATUS_PILL[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="outline" className={`text-[10px] ${TAG_PILL[t] ?? ""}`}>{t.replace("_", " ")}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{dateBR(p.ultima_consulta)}</div>
                      <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${p.dias_sem_consulta > 60 ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                        {p.dias_sem_consulta > 60 && <AlertCircle className="size-3" />}
                        há {p.dias_sem_consulta} dias
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{p.total_consultas}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{brl(p.valor_historico)}</td>
                    <td className="px-4 py-3 text-xs">{p.convenio}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSel(p); }}><Eye className="size-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => e.stopPropagation()}><Pencil className="size-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ficha Sheet */}
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {sel && <FichaContent paciente={sel} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FichaContent({ paciente }: { paciente: any }) {
  const histPac = demoHistorico.filter((h) => h.paciente_id === paciente.id);
  const tratPac = demoTratamentos.filter((t) => t.paciente_id === paciente.id);
  const orcPac  = demoOrcamentos.filter((o) => o.paciente_id === paciente.id);
  const finPac  = demoFinanceiro.filter((f: any) => f.descricao?.includes(paciente.nome));

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-full gradient-primary text-white flex items-center justify-center font-bold text-lg shadow-premium">
            {paciente.nome.split(" ").slice(0,2).map((n: string) => n[0]).join("")}
          </div>
          <div>
            <SheetTitle className="text-xl">{paciente.nome}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={STATUS_PILL[paciente.status]}>{STATUS_LABEL[paciente.status]}</Badge>
              <span className="text-xs">{paciente.telefone}</span>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="grid grid-cols-3 gap-3 my-5">
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <div className="text-xs text-muted-foreground">Histórico</div>
          <div className="text-lg font-bold text-emerald-700">{brl(paciente.valor_historico)}</div>
        </div>
        <div className="rounded-lg bg-sky-50 p-3 text-center">
          <div className="text-xs text-muted-foreground">Consultas</div>
          <div className="text-lg font-bold text-sky-700">{paciente.total_consultas}</div>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-center">
          <div className="text-xs text-muted-foreground">Última visita</div>
          <div className="text-lg font-bold text-amber-700">{paciente.dias_sem_consulta}d</div>
        </div>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="hist">Histórico</TabsTrigger>
          <TabsTrigger value="trat">Tratamentos</TabsTrigger>
          <TabsTrigger value="orc">Orçamentos</TabsTrigger>
          <TabsTrigger value="fin">Financeiro</TabsTrigger>
          <TabsTrigger value="doc">Docs</TabsTrigger>
        </TabsList>
        <TabsContent value="geral" className="space-y-3 mt-4 text-sm">
          <Row k="CPF" v={paciente.cpf} />
          <Row k="Email" v={paciente.email} />
          <Row k="Nascimento" v={dateBR(paciente.data_nascimento)} />
          <Row k="Convênio" v={paciente.convenio} />
          <Row k="Alergias" v={paciente.alergias?.length ? paciente.alergias.join(", ") : "—"} />
          <Row k="Medicamentos" v={paciente.medicamentos_uso?.length ? paciente.medicamentos_uso.join(", ") : "—"} />
          <Row k="Doenças" v={paciente.doencas_preexistentes ?? "—"} />
        </TabsContent>
        <TabsContent value="hist" className="space-y-2 mt-4">
          {histPac.length === 0 ? <Empty /> : histPac.map((h) => (
            <div key={h.id} className="p-3 border rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{h.tipo}</span>
                <span className="text-xs text-muted-foreground">{dateBR(h.data)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{h.descricao}</p>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="trat" className="space-y-2 mt-4">
          {tratPac.length === 0 ? <Empty /> : tratPac.map((t) => (
            <div key={t.id} className="p-3 border rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.descricao}</span>
                <Badge variant="outline">{t.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{brl(t.valor_total)} · {t.etapas_concluidas}/{t.etapas_total} etapas</div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="orc" className="space-y-2 mt-4">
          {orcPac.length === 0 ? <Empty /> : orcPac.map((o) => (
            <div key={o.id} className="p-3 border rounded-lg text-sm flex items-center justify-between">
              <div>
                <div className="font-semibold">{o.numero}</div>
                <div className="text-xs text-muted-foreground">{dateBR(o.data)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">{brl(o.total_com_desconto)}</div>
                <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="fin" className="space-y-2 mt-4">
          {finPac.length === 0 ? <Empty /> : finPac.map((f: any) => (
            <div key={f.id} className="p-3 border rounded-lg text-sm flex items-center justify-between">
              <div>
                <div className="font-semibold">{f.descricao}</div>
                <div className="text-xs text-muted-foreground">{dateBR(f.data)} · {f.categoria}</div>
              </div>
              <div className={`font-bold ${f.tipo === "receita" ? "text-emerald-600" : "text-red-600"}`}>{brl(f.valor)}</div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="doc" className="mt-4">
          <div className="text-center py-10 text-sm text-muted-foreground">
            <FileText className="size-8 mx-auto mb-3 opacity-40" />
            Nenhum documento anexado ainda.
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between py-2 border-b">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
function Empty() { return <div className="text-center py-8 text-xs text-muted-foreground">Nenhum registro.</div>; }
