import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertOctagon } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/clinica-suspensa")({ component: Page });

function Page() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen grid place-items-center p-4 bg-[var(--surface)]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <AlertOctagon className="size-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-semibold">Clínica suspensa</h1>
          <p className="text-sm text-muted-foreground">
            Sua clínica está suspensa por inadimplência. Regularize o pagamento para reativar.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button asChild><Link to="/app/Configuracoes">Ir para cobrança</Link></Button>
            <Button variant="outline" onClick={signOut}>Sair</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
