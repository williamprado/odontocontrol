import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Building2, BarChart3, AlertOctagon, PlusCircle, LogOut, Shield, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";

const items = [
  { to: "/master/painel", label: "Painel", icon: BarChart3 },
  { to: "/master/listaClinicas", label: "Clínicas", icon: Building2 },
  { to: "/master/novaClinica", label: "Nova clínica", icon: PlusCircle },
  { to: "/master/clinicasSuspensas", label: "Suspensas", icon: AlertOctagon },
  { to: "/master/configuracoes", label: "Configurações do sistema", icon: Settings },
] as const;

export function SidebarMaster() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { signOut, user } = useAuth();
  return (
    <Sidebar collapsible="icon" className="sidebar-master">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="size-8 rounded-md bg-sidebar-primary flex items-center justify-center">
            <Shield className="size-4 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-semibold truncate">Super Admin</div>
            <div className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</div>
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
