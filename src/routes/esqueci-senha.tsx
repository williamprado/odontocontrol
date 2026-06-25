import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/esqueci-senha")({ component: Page });

function Page() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-senha",
      });
      if (error) throw error;
      toast.success("Email enviado, confira sua caixa de entrada.");
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-[var(--surface)]">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Recuperar senha</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <Button type="submit" disabled={busy} className="w-full">Enviar link</Button>
            <Link to="/entrar" className="block text-center text-sm text-muted-foreground">Voltar</Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
