import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Calendar, Users, ClipboardList, Receipt, DollarSign,
  BarChart3, Sparkles, Zap, Stethoscope, UsersRound, Settings,
} from "lucide-react";

const items = [
  { to: "/demo/Dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { to: "/demo/Agenda",     label: "Agenda",      icon: Calendar },
  { to: "/demo/Pacientes",  label: "Pacientes",   icon: Users },
  { to: "/demo/Tratamentos",label: "Tratamentos", icon: ClipboardList },
  { to: "/demo/Orcamentos", label: "Orçamentos",  icon: Receipt },
  { to: "/demo/Financeiro", label: "Financeiro",  icon: DollarSign },
  { to: "/demo/Relatorios", label: "Relatórios",  icon: BarChart3 },
  { to: "/demo/AIGrowth",   label: "AI Growth",   icon: Sparkles },
] as const;

const extra = [
  { label: "Profissionais", icon: Stethoscope },
  { label: "Equipe",        icon: UsersRound },
  { label: "Configurações", icon: Settings },
];

export function SidebarDemo() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="size-9 rounded-lg gradient-primary flex items-center justify-center shadow-premium">
            <Zap className="size-5 text-white" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-bold leading-tight">OdontoControl</div>
            <div className="text-xs text-sidebar-foreground/60">Modo demonstração</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={path === it.to} tooltip={it.label}>
                    <Link to={it.to}><it.icon className="size-4" /><span>{it.label}</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">Em breve no demo</div>
          <SidebarGroupContent>
            <SidebarMenu>
              {extra.map((it) => (
                <SidebarMenuItem key={it.label}>
                  <SidebarMenuButton tooltip={it.label} className="opacity-50 cursor-not-allowed">
                    <it.icon className="size-4" /><span>{it.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
