import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, ListChecks, ClipboardList,
  Receipt, DollarSign, BarChart3, Sparkles, UserCog, Settings, LogOut, Activity,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const groups = [
  {
    label: "Principal",
    items: [
      { to: "/app/Dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/app/Agenda", label: "Agenda", icon: Calendar },
      { to: "/app/Pacientes", label: "Pacientes", icon: Users },
      { to: "/app/Profissionais", label: "Profissionais", icon: Stethoscope },
      { to: "/app/Procedimentos", label: "Procedimentos", icon: ListChecks },
    ],
  },
  {
    label: "Operacional",
    items: [
      { to: "/app/Tratamentos", label: "Tratamentos", icon: ClipboardList },
      { to: "/app/Orcamentos", label: "Orçamentos", icon: Receipt },
      { to: "/app/Financeiro", label: "Financeiro", icon: DollarSign },
      { to: "/app/Relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/app/AIGrowth", label: "AI Growth", icon: Sparkles, badge: "IA" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/app/Equipe", label: "Equipe", icon: UserCog },
      { to: "/app/Configuracoes", label: "Configurações", icon: Settings },
    ],
  },
] as const;

export function SidebarTenant() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, clinica, membro } = useAuth();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="size-8 rounded-md bg-primary flex items-center justify-center">
            <Activity className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-semibold truncate">{clinica?.nome ?? "OdontoControl"}</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">{membro?.nome}</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton asChild isActive={path.startsWith(it.to)} tooltip={it.label}>
                      <Link to={it.to}>
                        <it.icon className="size-4" />
                        <span className="flex-1">{it.label}</span>
                        {"badge" in it && it.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 group-data-[collapsible=icon]:hidden">{it.badge}</Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sair">
              <LogOut className="size-4" /><span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
