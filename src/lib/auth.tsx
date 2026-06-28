import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { syncAuthUser } from "@/lib/query.server";

export type Membro = {
  id: string;
  clinica_id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
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
  session: Session | null;
  user: User | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [membro, setMembro] = useState<Membro | null>(null);
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const loadAll = async (uid: string | undefined, email: string | undefined) => {
    if (!uid) {
      setMembro(null); setClinica(null); setIsSuperAdmin(false); return;
    }
    const [syncRes, { data: cfg }] = await Promise.all([
      syncAuthUser(),
      supabase.from("app_config").select("id,super_admin_emails").limit(1).maybeSingle(),
    ]);
    const m = syncRes && syncRes.success ? syncRes.member : null;
    setMembro((m as Membro | null) ?? null);

    let admins: string[] = (cfg?.super_admin_emails as string[]) ?? [];
    // Auto-promove primeiro usuário a super admin
    if (email && cfg?.id && (!admins || admins.length === 0)) {
      const { data: upd } = await supabase
        .from("app_config")
        .update({ super_admin_emails: [email] })
        .eq("id", cfg.id)
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
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => { loadAll(s?.user?.id, s?.user?.email ?? undefined); qc.invalidateQueries(); }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadAll(data.session?.user?.id, data.session?.user?.email ?? undefined).finally(() => setLoading(false));
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };
  const refresh = async () => { await loadAll(session?.user?.id, session?.user?.email ?? undefined); };

  return (
    <Ctx.Provider value={{
      session, user: session?.user ?? null, membro, clinica,
      clinicaId: membro?.clinica_id ?? null, isSuperAdmin, loading, signOut, refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
