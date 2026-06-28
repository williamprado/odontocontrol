-- ==========================================
-- ODONTOCONTROL - DATABASE INITIALIZATION
-- Consolidated schema from Supabase migrations
-- ==========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create auth schema mock for compatibility with Supabase helper functions
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT null::uuid; -- Can be overridden in session context if needed
$$;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT '{}'::jsonb; -- Can be overridden in session context if needed
$$;

-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE plano_enum AS ENUM ('starter', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE status_clinica_enum AS ENUM ('ativo', 'trial', 'bloqueado');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE role_enum AS ENUM ('owner', 'admin', 'dentista', 'recepcionista', 'auxiliar', 'financeiro', 'demo');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE especialidade_enum AS ENUM ('Clinico_geral', 'Ortodontia', 'Implantodontia', 'Endodontia', 'Periodontia', 'Estetica', 'Cirurgia', 'Outro');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE tipo_consulta_enum AS ENUM ('avaliacao', 'consulta', 'retorno', 'procedimento', 'urgencia');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE status_consulta_enum AS ENUM ('agendada', 'confirmada', 'em_atendimento', 'concluida', 'cancelada', 'faltou');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE status_tratamento_enum AS ENUM ('planejado', 'em_andamento', 'concluido', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE status_orcamento_enum AS ENUM ('pendente', 'aprovado', 'recusado', 'em_negociacao');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE tipo_historico_enum AS ENUM ('anamnese', 'exame', 'procedimento', 'observacao', 'receita');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE tipo_financeiro_enum AS ENUM ('receita', 'despesa');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE status_financeiro_enum AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  CREATE TYPE status_cobranca_enum AS ENUM ('ativo', 'inadimplente', 'suspenso');
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ APP CONFIG ============
CREATE TABLE IF NOT EXISTS public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_emails text[] DEFAULT '{}',
  app_name text DEFAULT 'OdontoControl AI',
  system_settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed app_config if empty
INSERT INTO public.app_config (super_admin_emails)
SELECT '{}' WHERE NOT EXISTS (SELECT 1 FROM public.app_config);

-- ============ CLINICA ============
CREATE TABLE IF NOT EXISTS public.clinica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  cro_responsavel text,
  slug text,
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
  status_cobranca status_cobranca_enum NOT NULL DEFAULT 'ativo',
  valor_mensal numeric NOT NULL DEFAULT 0,
  mrr numeric NOT NULL DEFAULT 0,
  ultimo_acesso timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clinica_slug_unique ON public.clinica(slug) WHERE slug IS NOT NULL;

-- Slug generator function & trigger
CREATE OR REPLACE FUNCTION public.gen_clinica_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; n int := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN RETURN NEW; END IF;
  base := regexp_replace(lower(coalesce(NEW.nome,'clinica')), '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  IF base = '' THEN base := 'clinica'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.clinica WHERE slug = candidate) LOOP
    n := n + 1; candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinica_slug ON public.clinica;
CREATE TRIGGER trg_clinica_slug BEFORE INSERT ON public.clinica
  FOR EACH ROW EXECUTE FUNCTION public.gen_clinica_slug();

DROP TRIGGER IF EXISTS trg_clinica_updated ON public.clinica;
CREATE TRIGGER trg_clinica_updated BEFORE UPDATE ON public.clinica
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MEMBRO_EQUIPE ============
CREATE TABLE IF NOT EXISTS public.membro_equipe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinica(id) ON DELETE CASCADE,
  user_id uuid,
  nome text NOT NULL,
  email text NOT NULL,
  role role_enum NOT NULL DEFAULT 'recepcionista',
  ativo boolean NOT NULL DEFAULT true,
  ultimo_login timestamptz,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membro_clinica ON public.membro_equipe(clinica_id);
CREATE INDEX IF NOT EXISTS idx_membro_user ON public.membro_equipe(user_id);

DROP TRIGGER IF EXISTS trg_membro_updated ON public.membro_equipe;
CREATE TRIGGER trg_membro_updated BEFORE UPDATE ON public.membro_equipe
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROFISSIONAL ============
CREATE TABLE IF NOT EXISTS public.profissional (
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

CREATE INDEX IF NOT EXISTS idx_prof_clinica ON public.profissional(clinica_id);

DROP TRIGGER IF EXISTS trg_prof_updated ON public.profissional;
CREATE TRIGGER trg_prof_updated BEFORE UPDATE ON public.profissional
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PACIENTE ============
CREATE TABLE IF NOT EXISTS public.paciente (
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

CREATE INDEX IF NOT EXISTS idx_pac_clinica ON public.paciente(clinica_id);

DROP TRIGGER IF EXISTS trg_pac_updated ON public.paciente;
CREATE TRIGGER trg_pac_updated BEFORE UPDATE ON public.paciente
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROCEDIMENTO ============
CREATE TABLE IF NOT EXISTS public.procedimento (
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

CREATE INDEX IF NOT EXISTS idx_proc_clinica ON public.procedimento(clinica_id);

DROP TRIGGER IF EXISTS trg_proc_updated ON public.procedimento;
CREATE TRIGGER trg_proc_updated BEFORE UPDATE ON public.procedimento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CONSULTA ============
CREATE TABLE IF NOT EXISTS public.consulta (
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

CREATE INDEX IF NOT EXISTS idx_cons_clinica ON public.consulta(clinica_id);
CREATE INDEX IF NOT EXISTS idx_cons_data ON public.consulta(clinica_id, data);

DROP TRIGGER IF EXISTS trg_cons_updated ON public.consulta;
CREATE TRIGGER trg_cons_updated BEFORE UPDATE ON public.consulta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conflict check trigger function for scheduling
CREATE OR REPLACE FUNCTION public.check_consulta_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  novo_inicio TIMESTAMP;
  novo_fim TIMESTAMP;
  conflito_count INT;
BEGIN
  RETURN NEW;
END;
$$; -- Stub for conflict compilation compatibility (can be implemented inside server)

DROP TRIGGER IF EXISTS trg_check_consulta_conflict ON public.consulta;

-- ============ TRATAMENTO ============
CREATE TABLE IF NOT EXISTS public.tratamento (
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

CREATE INDEX IF NOT EXISTS idx_trat_clinica ON public.tratamento(clinica_id);

DROP TRIGGER IF EXISTS trg_trat_updated ON public.tratamento;
CREATE TRIGGER trg_trat_updated BEFORE UPDATE ON public.tratamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ORCAMENTO ============
CREATE TABLE IF NOT EXISTS public.orcamento (
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

CREATE INDEX IF NOT EXISTS idx_orc_clinica ON public.orcamento(clinica_id);

DROP TRIGGER IF EXISTS trg_orc_updated ON public.orcamento;
CREATE TRIGGER trg_orc_updated BEFORE UPDATE ON public.orcamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HISTORICO_CLINICA ============
CREATE TABLE IF NOT EXISTS public.historico_clinica (
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

CREATE INDEX IF NOT EXISTS idx_hist_clinica ON public.historico_clinica(clinica_id);

DROP TRIGGER IF EXISTS trg_hist_updated ON public.historico_clinica;
CREATE TRIGGER trg_hist_updated BEFORE UPDATE ON public.historico_clinica
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ FINANCEIRO ============
CREATE TABLE IF NOT EXISTS public.financeiro (
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

CREATE INDEX IF NOT EXISTS idx_fin_clinica ON public.financeiro(clinica_id);
CREATE INDEX IF NOT EXISTS idx_fin_data ON public.financeiro(clinica_id, data);

DROP TRIGGER IF EXISTS trg_fin_updated ON public.financeiro;
CREATE TRIGGER trg_fin_updated BEFORE UPDATE ON public.financeiro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FUTURE PGVECTOR / EMBEDDINGS DOCUMENTATION STUB
-- =========================================================
-- Para buscas de IA em prontuários clínicos no futuro:
-- CREATE TABLE IF NOT EXISTS public.documento_clinico_vector (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   paciente_id uuid REFERENCES public.paciente(id) ON DELETE CASCADE,
--   conteudo text NOT NULL,
--   embedding vector(1536),
--   created_at timestamptz DEFAULT now()
-- );
-- CREATE INDEX ON public.documento_clinico_vector USING hnsw (embedding vector_cosine_ops);

-- =========================================================
-- BETTER AUTH TABLES
-- =========================================================
CREATE TABLE IF NOT EXISTS public."user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL,
  image text,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  role text,
  banned boolean,
  "banReason" text,
  "banExpires" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public."session" (
  id text PRIMARY KEY,
  "expiresAt" timestamp with time zone NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public."account" (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "expiresAt" timestamp with time zone,
  password text,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS public."verification" (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone
);

