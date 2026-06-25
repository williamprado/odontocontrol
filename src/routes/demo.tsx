import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarDemo } from "@/components/SidebarDemo";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/demo")({ component: DemoLayout });

function DemoLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarDemo />
        <SidebarInset className="flex-1 flex flex-col">
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs flex items-center gap-2">
            <Sparkles className="size-3.5 text-amber-600" />
            <span className="text-amber-900"><b>Modo demonstração</b> · dados fictícios apenas para visualização. Tudo o que você vê funciona de verdade no sistema real.</span>
            <Button asChild size="sm" className="ml-auto h-7 gradient-primary text-white">
              <Link to="/entrar">Criar conta grátis</Link>
            </Button>
          </div>
          <header className="h-12 flex items-center border-b bg-white px-3">
            <SidebarTrigger />
            <div className="ml-3 text-sm font-semibold">OdontoControl Excellence <span className="text-muted-foreground font-normal">(demo)</span></div>
          </header>
          <main className="flex-1 p-6 bg-[var(--surface)]"><Outlet /></main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
