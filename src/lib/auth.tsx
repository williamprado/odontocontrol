import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { syncAuthUser } from "@/lib/query.server";
import { supabase } from "@/integrations/supabase/client";

export type Membro = {
  id: string;
  clinica_id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  must_change_password: boolean;
};

export type Clinica = {
  id: string;
  nome: string;
  slug: string | null;
  status: string;
  status_cobranca: "ativo" | "inadimplente" | "suspenso";
  trial_ate: string | null;
  plano: string;
  valor_mensal: number;
  cor_primaria: string | null;
  logo_url: string | null;
};

type AuthCtx = {
  session: any | null;
  user: any | null;
  membro: Membro | null;
  clinica: Clinica | null;
  clinicaId: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [membro, setMembro] = useState<Membro | null>(null);
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const { data: sessionData, isPending } = authClient.useSession();

  const loadAll = async (uid: string | undefined, email: string | undefined) => {
    if (!uid) {
      setMembro(null);
      setClinica(null);
      setIsSuperAdmin(false);
      return;
    }

    try {
      const [syncRes, configRes] = await Promise.all([
        syncAuthUser(),
        supabase.from("app_config").select("id,super_admin_emails").limit(1).maybeSingle(),
      ]);

      const m = syncRes && syncRes.success ? syncRes.member : null;
      setMembro((m as Membro | null) ?? null);

      let admins: string[] = (configRes?.data?.super_admin_emails as string[]) ?? [];
      
      // Auto-promote first user to super admin if list is empty
      if (email && configRes?.data?.id && (!admins || admins.length === 0)) {
        const { data: upd } = await supabase
          .from("app_config")
          .update({ super_admin_emails: [email] })
          .eq("id", configRes.data.id)
          .select("super_admin_emails")
          .maybeSingle();
        admins = (upd?.super_admin_emails as string[]) ?? [email];
      }

      setIsSuperAdmin(!!(email && admins.includes(email)));

      if (m?.clinica_id) {
        const { data: c } = await supabase.from("clinica").select("*").eq("id", m.clinica_id).maybeSingle();
        setClinica((c as any) ?? null);
      } else {
        setClinica(null);
      }
    } catch (err) {
      console.error("[AuthProvider loadAll error]", err);
    }
  };

  useEffect(() => {
    if (isPending) return;

    const u = sessionData?.user;
    const s = sessionData?.session;

    setSession(s ?? null);
    setUser(u ?? null);

    if (u) {
      loadAll(u.id, u.email).finally(() => {
        setLoading(false);
        qc.invalidateQueries();
      });
    } else {
      setMembro(null);
      setClinica(null);
      setIsSuperAdmin(false);
      setLoading(false);
    }
  }, [sessionData, isPending]);

  const signOut = async () => {
    await authClient.signOut();
    setSession(null);
    setUser(null);
    setMembro(null);
    setClinica(null);
    setIsSuperAdmin(false);
    qc.invalidateQueries();
  };

  const refresh = async () => {
    setLoading(true);
    const { data } = await authClient.getSession({ fetchOptions: { cache: "no-store" } });
    const u = data?.user;
    await loadAll(u?.id, u?.email);
    setLoading(false);
  };

  return (
    <Ctx.Provider
      value={{
        session,
        user,
        membro,
        clinica,
        clinicaId: membro?.clinica_id ?? null,
        isSuperAdmin,
        loading,
        signOut,
        refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
