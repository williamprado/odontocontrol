
-- Status de cobrança da clínica
DO $$ BEGIN
  CREATE TYPE status_cobranca_enum AS ENUM ('ativo','inadimplente','suspenso');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.clinica
  ADD COLUMN IF NOT EXISTS status_cobranca status_cobranca_enum NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS valor_mensal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mrr numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_acesso timestamptz;

-- Slug único + auto-gerador
CREATE UNIQUE INDEX IF NOT EXISTS clinica_slug_unique ON public.clinica(slug) WHERE slug IS NOT NULL;

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
END $$;

DROP TRIGGER IF EXISTS trg_clinica_slug ON public.clinica;
CREATE TRIGGER trg_clinica_slug BEFORE INSERT ON public.clinica
  FOR EACH ROW EXECUTE FUNCTION public.gen_clinica_slug();

-- Backfill slugs existentes
UPDATE public.clinica SET slug = NULL WHERE slug = '';
WITH missing AS (SELECT id, nome FROM public.clinica WHERE slug IS NULL)
UPDATE public.clinica c SET slug = regexp_replace(lower(c.nome), '[^a-z0-9]+', '-', 'g') || '-' || substr(c.id::text,1,4)
FROM missing m WHERE c.id = m.id;

-- Estende role enum
DO $$ BEGIN
  ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'dentista';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'auxiliar'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'financeiro'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'demo'; EXCEPTION WHEN others THEN NULL; END $$;

-- Acesso público para agendamento via slug
DROP POLICY IF EXISTS clinica_public_by_slug ON public.clinica;
CREATE POLICY clinica_public_by_slug ON public.clinica
  FOR SELECT TO anon USING (slug IS NOT NULL);

DROP POLICY IF EXISTS profissional_public_select ON public.profissional;
CREATE POLICY profissional_public_select ON public.profissional
  FOR SELECT TO anon USING (ativo = true);

DROP POLICY IF EXISTS procedimento_public_select ON public.procedimento;
CREATE POLICY procedimento_public_select ON public.procedimento
  FOR SELECT TO anon USING (ativo = true);

DROP POLICY IF EXISTS paciente_public_insert ON public.paciente;
CREATE POLICY paciente_public_insert ON public.paciente
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS consulta_public_insert ON public.consulta;
CREATE POLICY consulta_public_insert ON public.consulta
  FOR INSERT TO anon WITH CHECK (status = 'agendada');
