ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nit text;
CREATE UNIQUE INDEX IF NOT EXISTS clientes_nit_unique
  ON public.clientes (lower(nit))
  WHERE nit IS NOT NULL AND btrim(nit) <> '';
CREATE INDEX IF NOT EXISTS clientes_telefono_idx ON public.clientes (telefono);
