import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/entrar")({ component: EntrarPage });

function EntrarPage() {
  const { session, isSuperAdmin, clinicaId, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !session) return;
    if (isSuperAdmin) navigate({ to: "/master/painel" });
    else if (clinicaId) navigate({ to: "/app/Dashboard" });
    else navigate({ to: "/app/Onboarding" });
  }, [loading, session, isSuperAdmin, clinicaId, navigate]);

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const { error } = await authClient.signIn.email({
        email: String(f.get("email")),
        password: String(f.get("password")),
      });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "E-mail ou senha incorretos.");
    } finally {
      setBusy(false);
    }
  };

  const signup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setBusy(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name: String(f.get("nome")),
      });
      if (signUpError) throw signUpError;
      toast.success("Conta criada! Bem-vindo.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-primary/5 via-background to-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-6" />
          </div>
          <CardTitle className="mt-2">OdontoControl AI</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={login} className="space-y-3 mt-4">
                <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" required /></div>
                <div className="space-y-1.5"><Label>Senha</Label><Input name="password" type="password" required /></div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy && <Loader2 className="size-4 animate-spin mr-2" />}Entrar
                </Button>
                <Link to="/esqueci-senha" className="text-sm text-muted-foreground hover:text-primary block text-center">Esqueci a senha</Link>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signup} className="space-y-3 mt-4">
                <div className="space-y-1.5"><Label>Nome</Label><Input name="nome" required /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input name="email" type="email" required /></div>
                <div className="space-y-1.5"><Label>Senha</Label><Input name="password" type="password" minLength={6} required /></div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy && <Loader2 className="size-4 animate-spin mr-2" />}Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="text-center mt-4">
            <Link to="/demo/Dashboard" className="text-xs text-muted-foreground hover:text-primary">Ver demo sem cadastro →</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
