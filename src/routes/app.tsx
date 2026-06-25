import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarTenant } from "@/components/SidebarTenant";
import { TrialBanner } from "@/components/TrialBanner";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const { loading, session, clinica, clinicaId } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate({ to: "/entrar" }); return; }
    if (!clinicaId && path !== "/app/Onboarding") { navigate({ to: "/app/Onboarding" }); return; }
    if (clinica?.status_cobranca === "suspenso" && path !== "/app/Configuracoes") {
      navigate({ to: "/clinica-suspensa" });
    }
  }, [loading, session, clinicaId, clinica, path, navigate]);

  if (loading || !session) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarTenant />
        <SidebarInset className="flex-1 flex flex-col bg-[var(--surface)]">
          <TrialBanner />
          <header className="h-12 flex items-center border-b bg-card px-3 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-3 text-sm font-medium text-muted-foreground">{clinica?.nome}</div>
          </header>
          <main className="flex-1 p-6"><Outlet /></main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
