ALTER TABLE public.pedido_items
  ADD COLUMN IF NOT EXISTS cantidad_reservada integer;

UPDATE public.pedido_items
SET cantidad_reservada = cantidad
WHERE cantidad_reservada IS NULL;

ALTER TABLE public.pedido_items
  ALTER COLUMN cantidad_reservada SET DEFAULT 0,
  ALTER COLUMN cantidad_reservada SET NOT NULL;
