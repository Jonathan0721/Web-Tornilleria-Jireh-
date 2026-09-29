-- This intentionally replaces the price and stock of every inventory row.
BEGIN;

UPDATE public.inventario
SET
  precio = 0.50,
  stock = 10000,
  updated_at = now();

SELECT
  count(*) AS productos_actualizados,
  count(*) FILTER (WHERE precio = 0.50) AS productos_con_precio_050,
  count(*) FILTER (WHERE stock = 10000) AS productos_con_stock_10000
FROM public.inventario;

COMMIT;
