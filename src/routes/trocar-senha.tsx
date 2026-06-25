import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/trocar-senha")({ component: Page });

function Page() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Senha atualizada!");
      nav({ to: "/app/Configuracoes" });
    } catch (err: any) { toast.error(err.message); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen grid place-items-center p-4 bg-[var(--surface)]">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Trocar senha</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5"><Label>Nova senha</Label><Input type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
            <Button type="submit" disabled={busy} className="w-full">Atualizar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
