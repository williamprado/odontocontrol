
ALTER TABLE public.membro_equipe ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

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
  IF NEW.status = 'cancelada' THEN
    RETURN NEW;
  END IF;
  novo_inicio := (NEW.data::text || ' ' || NEW.hora::text)::timestamp;
  novo_fim := novo_inicio + (COALESCE(NEW.duracao_minutos, 60) || ' minutes')::interval;

  SELECT COUNT(*) INTO conflito_count
  FROM public.consulta c
  WHERE c.profissional_id = NEW.profissional_id
    AND c.clinica_id = NEW.clinica_id
    AND c.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND c.status <> 'cancelada'
    AND c.data = NEW.data
    AND tstzrange(
          (c.data::text || ' ' || c.hora::text)::timestamp,
          (c.data::text || ' ' || c.hora::text)::timestamp + (COALESCE(c.duracao_minutos, 60) || ' minutes')::interval,
          '[)'
        ) && tstzrange(novo_inicio, novo_fim, '[)');

  IF conflito_count > 0 THEN
    RAISE EXCEPTION 'Horário em conflito com outra consulta deste profissional.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_consulta_conflict ON public.consulta;
CREATE TRIGGER trg_check_consulta_conflict
BEFORE INSERT OR UPDATE OF data, hora, duracao_minutos, profissional_id, status
ON public.consulta
FOR EACH ROW
EXECUTE FUNCTION public.check_consulta_conflict();
