import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resetarSenhaAdmin } from "@/lib/clinica-admin.functions";
import { sendPasswordResetEmail } from "@/lib/email-client";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { brl, dateBR } from "@/lib/format";
import { toast } from "sonner";
import { MoreHorizontal, KeyRound, AlertTriangle, Copy } from "lucide-react";

export const Route = createFileRoute("/master/listaClinicas")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const resetFn = useServerFn(resetarSenhaAdmin);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [newCreds, setNewCreds] = useState<null | { email: string; senha: string }>(null);
  const [busy, setBusy] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["master-clinicas"],
    queryFn: async () => (await supabase.from("clinica").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const setStatus = async (id: string, status_cobranca: "ativo" | "inadimplente" | "suspenso") => {
    const { error } = await supabase.from("clinica").update({ status_cobranca }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["master-clinicas"] }); }
  };

  const doReset = async () => {
    if (!confirmId) return;
    setBusy(true);
    try {
      const r = await resetFn({ data: { clinica_id: confirmId } });
      setNewCreds({ email: r.email, senha: r.nova_senha });
      await sendPasswordResetEmail({ to: r.email, nova_senha: r.nova_senha }).catch(() => {});
      toast.success("Senha redefinida");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao redefinir senha");
    } finally {
      setBusy(false);
      setConfirmId(null);
    }
  };

  return (
    <>
      <PageHeader title="Clínicas" description="Todas as clínicas da plataforma" />
      <DataTable
        rows={rows as any[]}
        searchKeys={["nome" as any, "owner_email" as any, "cnpj" as any]}
        columns={[
          { key: "nome", header: "Nome" },
          { key: "owner_email", header: "Admin" },
          { key: "plano", header: "Plano", render: (r: any) => <Badge>{r.plano}</Badge> },
          { key: "valor_mensal", header: "MRR", render: (r: any) => brl(r.valor_mensal) },
          { key: "status_cobranca", header: "Cobrança", render: (r: any) => <Badge variant={r.status_cobranca === "ativo" ? "default" : "destructive"}>{r.status_cobranca}</Badge> },
          { key: "created_at", header: "Criada", render: (r: any) => dateBR(r.created_at) },
          {
            key: "_a", header: "", className: "w-12 text-right", render: (r: any) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatus(r.id, "ativo")}>Ativar cobrança</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus(r.id, "inadimplente")}>Marcar inadimplente</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus(r.id, "suspenso")} className="text-red-600">Suspender</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setConfirmId(r.id)}>
                    <KeyRound className="size-4 mr-2" />Resetar senha do admin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
        ]}
      />

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar senha do admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Uma nova senha aleatória forte será gerada. A senha anterior deixará de funcionar imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); doReset(); }}>{busy ? "Gerando..." : "Sim, redefinir"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!newCreds} onOpenChange={(o) => !o && setNewCreds(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova senha gerada</DialogTitle></DialogHeader>
          {newCreds && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-300 rounded p-3 flex gap-2 text-sm text-red-800">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <div><b>Esta senha só aparece uma vez.</b> Repasse ao admin pelo canal seguro.</div>
              </div>
              <div className="space-y-1"><div className="text-xs text-muted-foreground">Email</div>
                <code className="block px-3 py-2 rounded bg-muted text-sm break-all">{newCreds.email}</code>
              </div>
              <div className="space-y-1"><div className="text-xs text-muted-foreground">Nova senha</div>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 rounded bg-muted text-sm font-mono font-semibold">{newCreds.senha}</code>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newCreds.senha); toast.success("Senha copiada"); }}><Copy className="size-3" /></Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setNewCreds(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
