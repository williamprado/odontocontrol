import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { markPasswordChanged } from "@/lib/query.server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-senha")({ component: Page });

function Page() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const token = new URLSearchParams(window.location.search).get("token") || "";
      if (!token) {
        throw new Error("Token de recuperação de senha inválido ou ausente na URL.");
      }

      const { error } = await authClient.resetPassword({
        newPassword: pw,
        token,
      });
      if (error) throw error;

      // Clear the must_change_password flag in the local members database
      await markPasswordChanged();

      toast.success("Senha atualizada com sucesso!");
      nav({ to: "/entrar" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao redefinir a senha.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-[var(--surface)]">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Nova senha</CardTitle></CardHeader>
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
