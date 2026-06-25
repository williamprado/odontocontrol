import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarMaster } from "@/components/SidebarMaster";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/master")({ component: MasterLayout });

function MasterLayout() {
  const { loading, session, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/entrar" });
    else if (!isSuperAdmin) navigate({ to: "/" });
  }, [loading, session, isSuperAdmin, navigate]);

  if (loading || !session || !isSuperAdmin) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarMaster />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-card px-3 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="ml-3 text-sm font-semibold text-red-700">Painel Master</div>
          </header>
          <main className="flex-1 p-6 bg-[var(--surface)]"><Outlet /></main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
