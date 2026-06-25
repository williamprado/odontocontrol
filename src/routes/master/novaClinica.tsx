import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClinicaWithOwner } from "@/lib/clinica-admin.functions";
import { sendWelcomeEmail } from "@/lib/email-client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Copy, ExternalLink, MessageCircle, AlertTriangle, Building2, MapPin, Phone, Stethoscope, CreditCard, UserCog } from "lucide-react";

export const Route = createFileRoute("/master/novaClinica")({ component: Page });

const schema = z.object({
  nome: z.string().min(2, "Mínimo 2 caracteres").max(120),
  slug: z.string().regex(/^[a-z0-9-]*$/, "Use minúsculas, números e hífen").max(60).optional().or(z.literal("")),
  cor_principal: z.string().max(20).optional(),
  cep: z.string().max(15).optional(),
  rua: z.string().max(200).optional(),
  numero: z.string().max(20).optional(),
  bairro: z.string().max(100).optional(),
  cidade: z.string().max(100).optional(),
  uf: z.string().max(2).optional(),
  telefone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  cro_clinica: z.string().max(50).optional(),
  especialidades: z.string().max(500).optional(),
  plano: z.enum(["starter", "pro", "premium"]),
  valor_mensal: z.coerce.number().min(0).max(99999),
  dia_vencimento: z.coerce.number().int().min(1).max(31),
  email_admin: z.string().email("Email inválido"),
  nome_admin: z.string().min(2).max(120),
});

type FormV = z.infer<typeof schema>;

function Page() {
  const navigate = useNavigate();
  const createFn = useServerFn(createClinicaWithOwner);
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<null | { email: string; senha: string; link: string; nome_admin: string; clinica: string; telefone?: string }>(null);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormV>({
    resolver: zodResolver(schema) as any,
    defaultValues: { plano: "starter", valor_mensal: 197, dia_vencimento: 10, cor_principal: "#0EA5E9", uf: "SP" },
  });

  const onSubmit = async (v: FormV) => {
    setBusy(true);
    try {
      const r = await createFn({
        data: {
          nome: v.nome,
          slug: v.slug || undefined,
          cor_principal: v.cor_principal,
          telefone: v.telefone,
          whatsapp: v.whatsapp,
          endereco: { cep: v.cep, rua: v.rua, numero: v.numero, bairro: v.bairro, cidade: v.cidade, uf: v.uf },
          cro_clinica: v.cro_clinica,
          especialidades: v.especialidades ? v.especialidades.split(",").map((s) => s.trim()).filter(Boolean) : [],
          plano: v.plano,
          valor_mensal: Number(v.valor_mensal),
          dia_vencimento: Number(v.dia_vencimento),
          email_admin: v.email_admin,
          nome_admin: v.nome_admin,
        },
      });
      const link = `${window.location.origin}${r.link_publico_completo}`;
      setCreds({ email: r.email_admin, senha: r.senha_gerada, link, nome_admin: v.nome_admin, clinica: v.nome, telefone: v.whatsapp || v.telefone });
      await sendWelcomeEmail({ to: r.email_admin, nome_admin: v.nome_admin, clinica: v.nome, senha: r.senha_gerada, link_publico: link }).catch(() => {});
      toast.success("Clínica criada com sucesso");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar clínica");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Nova clínica" description="Cadastro completo + criação de admin" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-5xl">
        <Section icon={Building2} title="Dados da clínica">
          <Grid>
            <Field label="Nome *" error={errors.nome?.message}><Input {...register("nome")} /></Field>
            <Field label="Slug público" help="Aparecerá em /agendar/SLUG. Deixe em branco para gerar"><Input placeholder="ex: odontosorriso" {...register("slug")} /></Field>
            <Field label="Cor principal"><Input type="color" className="h-10 w-20 p-1" {...register("cor_principal")} /></Field>
            <Field label="CRO da clínica" error={errors.cro_clinica?.message}><Input placeholder="CRO-RJ 12345" {...register("cro_clinica")} /></Field>
            <Field label="Especialidades (separadas por vírgula)" full><Input placeholder="Ortodontia, Endodontia, Periodontia" {...register("especialidades")} /></Field>
          </Grid>
        </Section>

        <Section icon={MapPin} title="Endereço">
          <Grid>
            <Field label="CEP"><Input {...register("cep")} /></Field>
            <Field label="Rua"><Input {...register("rua")} /></Field>
            <Field label="Número"><Input {...register("numero")} /></Field>
            <Field label="Bairro"><Input {...register("bairro")} /></Field>
            <Field label="Cidade"><Input {...register("cidade")} /></Field>
            <Field label="UF"><Input maxLength={2} {...register("uf")} /></Field>
          </Grid>
        </Section>

        <Section icon={Phone} title="Contato">
          <Grid>
            <Field label="Telefone"><Input {...register("telefone")} /></Field>
            <Field label="WhatsApp"><Input placeholder="(11) 99999-9999" {...register("whatsapp")} /></Field>
          </Grid>
        </Section>

        <Section icon={Stethoscope} title="Responsável técnico">
          <div className="text-xs text-muted-foreground">Use a seção CRO acima para o responsável técnico — campo único.</div>
        </Section>

        <Section icon={CreditCard} title="Plano e cobrança">
          <Grid>
            <Field label="Plano">
              <Select value={watch("plano")} onValueChange={(v) => setValue("plano", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Básico (R$ 97)</SelectItem>
                  <SelectItem value="pro">Profissional (R$ 197)</SelectItem>
                  <SelectItem value="premium">Enterprise (R$ 397)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Valor mensal (R$)" error={errors.valor_mensal?.message}><Input type="number" step="0.01" {...register("valor_mensal")} /></Field>
            <Field label="Dia de vencimento" error={errors.dia_vencimento?.message}><Input type="number" min={1} max={31} {...register("dia_vencimento")} /></Field>
          </Grid>
        </Section>

        <Section icon={UserCog} title="Admin de acesso">
          <Grid>
            <Field label="Nome do admin *" error={errors.nome_admin?.message}><Input {...register("nome_admin")} /></Field>
            <Field label="Email do admin *" error={errors.email_admin?.message}><Input type="email" {...register("email_admin")} /></Field>
          </Grid>
          <p className="text-xs text-muted-foreground mt-3">Uma senha aleatória forte será gerada automaticamente. Aparece UMA vez ao final do cadastro.</p>
        </Section>

        <div className="flex justify-end gap-2 sticky bottom-0 bg-background/80 backdrop-blur p-3 -mx-3 border-t">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/master/listaClinicas" })}>Cancelar</Button>
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin mr-1" />}Criar clínica e gerar admin</Button>
        </div>
      </form>

      <CredsDialog
        creds={creds}
        onClose={() => { setCreds(null); navigate({ to: "/master/listaClinicas" }); }}
      />
    </>
  );
}

function Section({ icon: Icon, title, children }: any) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
          <Icon className="size-4" />{title}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
function Grid({ children }: any) { return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>; }
function Field({ label, error, help, full, children }: any) {
  return (
    <div className={`space-y-1 ${full ? "md:col-span-3" : ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
      {help && <p className="text-[10px] text-muted-foreground">{help}</p>}
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

function CredsDialog({ creds, onClose }: { creds: any; onClose: () => void }) {
  if (!creds) return null;
  const copy = (txt: string, label: string) => { navigator.clipboard.writeText(txt); toast.success(`${label} copiado`); };
  const tudo = `Clínica: ${creds.clinica}\nAdmin: ${creds.nome_admin}\nEmail: ${creds.email}\nSenha: ${creds.senha}\nLink público: ${creds.link}`;
  const wa = (creds.telefone ?? "").replace(/\D/g, "");
  const waMsg = encodeURIComponent(`Olá ${creds.nome_admin}, sua clínica ${creds.clinica} foi cadastrada no OdontoControl AI.\n\nAcesso:\nEmail: ${creds.email}\nSenha: ${creds.senha}\n\nLink público de agendamento:\n${creds.link}\n\nPor segurança, altere a senha no primeiro acesso.`);
  const waUrl = `https://wa.me/${wa ? (wa.startsWith("55") ? wa : "55" + wa) : ""}?text=${waMsg}`;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Credenciais geradas</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-300 rounded p-3 flex gap-2 text-sm text-red-800">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <div><b>Esta senha só aparece uma vez.</b> Salve-a agora — não conseguiremos recuperá-la.</div>
          </div>
          <Row label="Email" value={creds.email} onCopy={() => copy(creds.email, "Email")} />
          <Row label="Senha" value={creds.senha} mono onCopy={() => copy(creds.senha, "Senha")} />
          <Row label="Link público" value={creds.link} onCopy={() => copy(creds.link, "Link")} extra={
            <Button size="sm" variant="outline" onClick={() => window.open(creds.link, "_blank", "noopener")}><ExternalLink className="size-3" /></Button>
          } />
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => copy(tudo, "Tudo")}><Copy className="size-4 mr-1" />Copiar tudo</Button>
          <Button variant="outline" onClick={() => window.open(waUrl, "_blank", "noopener")}><MessageCircle className="size-4 mr-1" />Enviar por WhatsApp</Button>
          <Button onClick={onClose}>Concluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono, onCopy, extra }: any) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex gap-2 items-center">
        <code className={`flex-1 px-3 py-2 rounded bg-muted text-sm break-all ${mono ? "font-mono font-semibold" : ""}`}>{value}</code>
        <Button size="sm" variant="outline" onClick={onCopy}><Copy className="size-3" /></Button>
        {extra}
      </div>
    </div>
  );
}
