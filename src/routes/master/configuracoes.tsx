import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ExternalLink, Info } from "lucide-react";

export const Route = createFileRoute("/master/configuracoes")({ component: Page });

function Page() {
  return (
    <>
      <PageHeader title="Configurações do sistema" description="Integrações globais e modo de operação" />
      <div className="grid lg:grid-cols-2 gap-4 max-w-5xl">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Mail className="size-5" />Envio de emails (modo STUB)
            </div>
            <div className="bg-amber-50 border border-amber-300 rounded p-3 text-sm text-amber-900 flex gap-2">
              <Info className="size-4 mt-0.5 shrink-0" />
              <div>
                Os emails (boas-vindas, confirmação de agendamento, reset de senha) estão em modo <b>stub</b>: são apenas registrados em log e não saem da aplicação.
              </div>
            </div>
            <div>
              <div className="font-semibold text-sm mb-2">Para ativar com Resend (5 minutos)</div>
              <ol className="text-sm space-y-2 list-decimal pl-5 text-muted-foreground">
                <li>Crie uma conta grátis em <a className="text-primary underline" href="https://resend.com" target="_blank" rel="noopener"><span className="inline-flex items-center gap-1">resend.com <ExternalLink className="size-3" /></span></a> (3.000 emails/mês grátis).</li>
                <li>Verifique seu domínio em <b>Resend &gt; Domains</b> (adicione os registros DNS sugeridos).</li>
                <li>Em <b>API Keys</b>, gere uma nova chave.</li>
                <li>No painel Lovable Cloud, adicione o secret <code className="px-1 bg-muted rounded">RESEND_API_KEY</code> com o valor copiado.</li>
                <li>No arquivo <code className="px-1 bg-muted rounded">src/lib/clinica-admin.functions.ts</code>, descomente o bloco <code className="px-1 bg-muted rounded">fetch("https://api.resend.com/emails", ...)</code> dentro de <code className="px-1 bg-muted rounded">enviarEmail</code> e ajuste o remetente para o domínio verificado.</li>
              </ol>
            </div>
            <div className="text-xs text-muted-foreground border-t pt-3">
              Por enquanto, copie credenciais e links manualmente no momento do cadastro (modal já gera botão "Enviar por WhatsApp").
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="text-primary font-semibold">Outras integrações</div>
            <Bullet title="Pagamentos">Stripe/Mercado Pago — registre manualmente o status em Clínicas até integrar.</Bullet>
            <Bullet title="IA Growth">Insights derivados de SQL determinístico. Para LLM, use Lovable AI Gateway.</Bullet>
            <Bullet title="WhatsApp Business">Hoje apenas link wa.me. Para envio automatizado, conecte UAZAPI/Z-API.</Bullet>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Bullet({ title, children }: any) {
  return (
    <div className="text-sm">
      <div className="font-medium">{title}</div>
      <div className="text-muted-foreground text-xs">{children}</div>
    </div>
  );
}
