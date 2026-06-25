import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Download, LinkIcon } from "lucide-react";
import { toast } from "sonner";

export function BookingLinkCard({ slug }: { slug: string | null | undefined }) {
  const ref = useRef<HTMLDivElement>(null);

  if (!slug) {
    return (
      <Card><CardContent className="p-5 text-sm text-muted-foreground">
        Defina o slug público da clínica em Configurações para habilitar agendamento online.
      </CardContent></Card>
    );
  }

  const url = typeof window !== "undefined" ? `${window.location.origin}/agendar/${slug}` : `/agendar/${slug}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };
  const open = () => window.open(url, "_blank", "noopener");
  const download = () => {
    const canvas = ref.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-agendamento-${slug}.png`;
    a.click();
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div ref={ref} className="bg-white p-3 rounded-lg border shadow-sm">
            <QRCodeCanvas value={url} size={128} level="M" />
          </div>
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <LinkIcon className="size-4" />
              Link público de agendamento
            </div>
            <div className="font-mono text-xs bg-muted rounded p-2 break-all">{url}</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={copy}><Copy className="size-4 mr-1" />Copiar link</Button>
              <Button size="sm" variant="outline" onClick={open}><ExternalLink className="size-4 mr-1" />Abrir</Button>
              <Button size="sm" variant="outline" onClick={download}><Download className="size-4 mr-1" />Baixar QR</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
