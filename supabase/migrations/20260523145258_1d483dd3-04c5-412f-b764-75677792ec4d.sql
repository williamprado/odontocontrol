
-- ============ ENUMS ============
CREATE TYPE plano_enum AS ENUM ('starter','pro','premium');
CREATE TYPE status_clinica_enum AS ENUM ('ativo','trial','bloqueado');
CREATE TYPE role_enum AS ENUM ('owner','admin','dentista','recepcionista','auxiliar','financeiro');
CREATE TYPE especialidade_enum AS ENUM ('Clinico_geral','Ortodontia','Implantodontia','Endodontia','Periodontia','Estetica','Cirurgia','Outro');
CREATE TYPE tipo_consulta_enum AS ENUM ('avaliacao','consulta','retorno','procedimento','urgencia');
CREATE TYPE status_consulta_enum AS ENUM ('agendada','confirmada','em_atendimento','concluida','cancelada','faltou');
CREATE TYPE status_tratamento_enum AS ENUM ('planejado','em_andamento','concluido','cancelado');
CREATE TYPE status_orcamento_enum AS ENUM ('pendente','aprovado','recusado','em_negociacao');
CREATE TYPE tipo_historico_enum AS ENUM ('anamnese','exame','procedimento','observacao','receita');
CREATE TYPE tipo_financeiro_enum AS ENUM ('receita','despesa');
CREATE TYPE status_financeiro_enum AS ENUM ('pendente','pago','atrasado','cancelado');

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ APP CONFIG ============
CREATE TABLE public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_emails text[] DEFAULT '{}',
  app_name text DEFAULT 'OdontoControl AI',
  system_settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_config (super_admin_emails) VALUES ('{}');
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- ============ HELPER: is_admin ============
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_config
    WHERE (auth.jwt() ->> 'email') = ANY(super_admin_emails)
  );
$$;

-- ============ CLINICA ============
CREATE TABLE public.clinica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  cro_responsavel text,
  slug text UNIQUE,
  telefone text,
  email text,
  endereco jsonb,
  owner_nome text,
  owner_email text,
  owner_telefone text,
  plano plano_enum NOT NULL DEFAULT 'starter',
  status status_clinica_enum NOT NULL DEFAULT 'trial',
  trial_ate date,
  logo_url text,
  cor_primaria text DEFAULT '#06B6D4',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clinica ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clinica_updated BEFORE UPDATE ON public.clinica
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MEMBRO_EQUIPE ============
CREATE TABLE public.membro_equipe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  user_id uuid,
  nome text NOT NULL,
  email text NOT NULL,
  role role_enum NOT NULL DEFAULT 'recepcionista',
  ativo boolean NOT NULL DEFAULT true,
  ultimo_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_membro_clinica ON public.membro_equipe(clinica_id);
CREATE INDEX idx_membro_user ON public.membro_equipe(user_id);
ALTER TABLE public.membro_equipe ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_membro_updated BEFORE UPDATE ON public.membro_equipe
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HELPERS: clinica_id + role do usuário (security definer) ============
CREATE OR REPLACE FUNCTION public.user_clinica_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT clinica_id FROM public.membro_equipe
  WHERE user_id = auth.uid() AND ativo = true;
$$;

CREATE OR REPLACE FUNCTION public.is_clinica_admin(_clinica_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membro_equipe
    WHERE user_id = auth.uid()
      AND clinica_id = _clinica_id
      AND ativo = true
      AND role IN ('owner','admin')
  );
$$;

-- ============ PROFISSIONAL ============
CREATE TABLE public.profissional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  nome text NOT NULL,
  especialidade especialidade_enum,
  cro_numero text,
  cro_uf text,
  telefone text,
  email text,
  ativo boolean NOT NULL DEFAULT true,
  percentual_repasse numeric NOT NULL DEFAULT 50,
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_prof_clinica ON public.profissional(clinica_id);
ALTER TABLE public.profissional ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_prof_updated BEFORE UPDATE ON public.profissional
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PACIENTE ============
CREATE TABLE public.paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cpf text,
  rg text,
  data_nascimento date,
  telefone text,
  email text,
  endereco jsonb,
  profissao text,
  convenio text,
  numero_convenio text,
  foto_url text,
  alergias text[],
  medicamentos_uso text[],
  doencas_preexistentes text,
  observacoes_anamnese text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pac_clinica ON public.paciente(clinica_id);
ALTER TABLE public.paciente ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_pac_updated BEFORE UPDATE ON public.paciente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROCEDIMENTO ============
CREATE TABLE public.procedimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  nome text NOT NULL,
  codigo_tuss text,
  descricao text,
  valor numeric NOT NULL,
  duracao_minutos int NOT NULL DEFAULT 60,
  especialidade text,
  categoria text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_proc_clinica ON public.procedimento(clinica_id);
ALTER TABLE public.procedimento ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_proc_updated BEFORE UPDATE ON public.procedimento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONSULTA ============
CREATE TABLE public.consulta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.paciente(id) ON DELETE CASCADE,
  paciente_nome text,
  profissional_id uuid NOT NULL REFERENCES public.profissional(id) ON DELETE RESTRICT,
  profissional_nome text,
  data date NOT NULL,
  hora time NOT NULL,
  duracao_minutos int NOT NULL DEFAULT 60,
  tipo tipo_consulta_enum NOT NULL DEFAULT 'consulta',
  status status_consulta_enum NOT NULL DEFAULT 'agendada',
  procedimentos jsonb,
  valor_total numeric,
  observacoes text,
  prontuario text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cons_clinica ON public.consulta(clinica_id);
CREATE INDEX idx_cons_data ON public.consulta(clinica_id, data);
ALTER TABLE public.consulta ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_cons_updated BEFORE UPDATE ON public.consulta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TRATAMENTO ============
CREATE TABLE public.tratamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.paciente(id) ON DELETE CASCADE,
  paciente_nome text,
  profissional_id uuid REFERENCES public.profissional(id) ON DELETE SET NULL,
  profissional_nome text,
  descricao text NOT NULL,
  dente text,
  status status_tratamento_enum NOT NULL DEFAULT 'planejado',
  data_inicio date,
  data_conclusao date,
  valor_total numeric,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_trat_clinica ON public.tratamento(clinica_id);
ALTER TABLE public.tratamento ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_trat_updated BEFORE UPDATE ON public.tratamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORCAMENTO ============
CREATE TABLE public.orcamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.paciente(id) ON DELETE CASCADE,
  paciente_nome text,
  profissional_id uuid REFERENCES public.profissional(id) ON DELETE SET NULL,
  numero text,
  data date NOT NULL,
  validade date,
  status status_orcamento_enum NOT NULL DEFAULT 'pendente',
  total numeric,
  total_com_desconto numeric,
  desconto_pct numeric NOT NULL DEFAULT 0,
  itens jsonb,
  parcelas int NOT NULL DEFAULT 1,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orc_clinica ON public.orcamento(clinica_id);
ALTER TABLE public.orcamento ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_orc_updated BEFORE UPDATE ON public.orcamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HISTORICO_CLINICA ============
CREATE TABLE public.historico_clinica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.paciente(id) ON DELETE CASCADE,
  data date NOT NULL,
  tipo tipo_historico_enum NOT NULL,
  descricao text NOT NULL,
  profissional_id uuid REFERENCES public.profissional(id) ON DELETE SET NULL,
  profissional_nome text,
  anexos text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hist_clinica ON public.historico_clinica(clinica_id);
ALTER TABLE public.historico_clinica ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_hist_updated BEFORE UPDATE ON public.historico_clinica
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FINANCEIRO ============
CREATE TABLE public.financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  tipo tipo_financeiro_enum NOT NULL DEFAULT 'receita',
  valor numeric NOT NULL,
  data date NOT NULL,
  vencimento date,
  categoria text,
  forma_pagamento text,
  paciente_id uuid REFERENCES public.paciente(id) ON DELETE SET NULL,
  consulta_id uuid REFERENCES public.consulta(id) ON DELETE SET NULL,
  orcamento_id uuid REFERENCES public.orcamento(id) ON DELETE SET NULL,
  status status_financeiro_enum NOT NULL DEFAULT 'pago',
  parcela_atual int NOT NULL DEFAULT 1,
  total_parcelas int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_clinica ON public.financeiro(clinica_id);
CREATE INDEX idx_fin_data ON public.financeiro(clinica_id, data);
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_fin_updated BEFORE UPDATE ON public.financeiro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS POLICIES ============

-- app_config: leitura para todos autenticados; escrita só super admin
CREATE POLICY "app_config_read" ON public.app_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_config_write" ON public.app_config FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- clinica
CREATE POLICY "clinica_select" ON public.clinica FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_clinica_ids()) OR public.is_admin());
CREATE POLICY "clinica_insert" ON public.clinica FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "clinica_update" ON public.clinica FOR UPDATE TO authenticated
  USING (public.is_clinica_admin(id) OR public.is_admin())
  WITH CHECK (public.is_clinica_admin(id) OR public.is_admin());
CREATE POLICY "clinica_delete" ON public.clinica FOR DELETE TO authenticated
  USING (public.is_admin());

-- membro_equipe: usuário vê membros da sua clínica; pode criar self; admin gerencia
CREATE POLICY "membro_select" ON public.membro_equipe FOR SELECT TO authenticated
  USING (clinica_id IN (SELECT public.user_clinica_ids()) OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "membro_insert" ON public.membro_equipe FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_clinica_admin(clinica_id) OR public.is_admin());
CREATE POLICY "membro_update" ON public.membro_equipe FOR UPDATE TO authenticated
  USING (public.is_clinica_admin(clinica_id) OR public.is_admin() OR user_id = auth.uid())
  WITH CHECK (public.is_clinica_admin(clinica_id) OR public.is_admin() OR user_id = auth.uid());
CREATE POLICY "membro_delete" ON public.membro_equipe FOR DELETE TO authenticated
  USING (public.is_clinica_admin(clinica_id) OR public.is_admin());

-- macro: isolamento por clinica_id para as demais tabelas
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['profissional','paciente','procedimento','consulta','tratamento','orcamento','historico_clinica','financeiro'])
  LOOP
    EXECUTE format($f$
      CREATE POLICY "%1$s_select" ON public.%1$I FOR SELECT TO authenticated
        USING (clinica_id IN (SELECT public.user_clinica_ids()) OR public.is_admin());
      CREATE POLICY "%1$s_insert" ON public.%1$I FOR INSERT TO authenticated
        WITH CHECK (clinica_id IN (SELECT public.user_clinica_ids()) OR public.is_admin());
      CREATE POLICY "%1$s_update" ON public.%1$I FOR UPDATE TO authenticated
        USING (clinica_id IN (SELECT public.user_clinica_ids()) OR public.is_admin())
        WITH CHECK (clinica_id IN (SELECT public.user_clinica_ids()) OR public.is_admin());
      CREATE POLICY "%1$s_delete" ON public.%1$I FOR DELETE TO authenticated
        USING (clinica_id IN (SELECT public.user_clinica_ids()) OR public.is_admin());
    $f$, t);
  END LOOP;
END $$;
