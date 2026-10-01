-- Seed the ordinary grade 2/8 and fine grade 5 hex bolt catalog.
-- All seeded products start with the temporary public price and stock requested
-- for the catalog launch.
BEGIN;

WITH specs(grade, thread, width, lengths) AS (
  VALUES
    ('2', 'ordinaria', '1/4', ARRAY['1/2','3/4','1','1-1/4','1-1/2','2','2-1/2','3','4','5','6']),
    ('2', 'ordinaria', '5/16', ARRAY['3/4','1','1-1/4','1-1/2','2','2-1/2','3','4','5','6']),
    ('2', 'ordinaria', '3/8', ARRAY['3/4','1','1-1/4','1-1/2','2','2-1/2','3','4','5','6']),
    ('2', 'ordinaria', '7/16', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','4','5','6']),
    ('2', 'ordinaria', '1/2', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','4','5','6']),
    ('8', 'ordinaria', '1/4', ARRAY['1/2','3/4','1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6']),
    ('8', 'ordinaria', '5/16', ARRAY['1/2','3/4','1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6']),
    ('8', 'ordinaria', '3/8', ARRAY['1/2','3/4','1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6']),
    ('8', 'ordinaria', '7/16', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6']),
    ('8', 'ordinaria', '1/2', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6','7','8']),
    ('8', 'ordinaria', '9/16', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6']),
    ('8', 'ordinaria', '5/8', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6','7','8']),
    ('8', 'ordinaria', '3/4', ARRAY['1','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6','7','8']),
    ('8', 'ordinaria', '7/8', ARRAY['1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','6','7','8']),
    ('8', 'ordinaria', '1', ARRAY['1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','6','7','8','9','10']),
    ('5', 'fina', '1/4', ARRAY['1/2','3/4','1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6']),
    ('5', 'fina', '5/16', ARRAY['1/2','3/4','1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6']),
    ('5', 'fina', '3/8', ARRAY['1/2','3/4','1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6','7','8']),
    ('5', 'fina', '7/16', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6']),
    ('5', 'fina', '1/2', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6','7','8']),
    ('5', 'fina', '9/16', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6']),
    ('5', 'fina', '5/8', ARRAY['1','1-1/4','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6','7','8']),
    ('5', 'fina', '3/4', ARRAY['1','1-1/2','2','2-1/2','3','3-1/2','4','4-1/2','5','5-1/2','6','7','8'])
),
expanded AS (
  SELECT
    grade,
    thread,
    width,
    length,
    CASE WHEN thread = 'fina' THEN 'THF' ELSE 'TH' END
      || replace(replace(width, '/', ''), '-', '')
      || 'X'
      || replace(replace(length, '/', ''), '-', '')
      || '-G' || grade AS sku,
    'Tornillo hexagonal · Rosca ' || thread || ' · Grado ' || grade AS familia,
    'Tornillo hexagonal grado ' || grade || ' ' || thread || ' ' || width || ' x ' || length AS nombre,
    width || ' x ' || length AS medidas
  FROM specs
  CROSS JOIN LATERAL unnest(specs.lengths) AS lengths(length)
)
INSERT INTO public.inventario (
  sku, familia, nombre, categoria, tipo, medidas, precio, stock,
  stock_minimo, unidad, activo
)
SELECT
  sku, familia, nombre, 'Tornillos', 'grado' || grade, medidas, 0.50, 10000,
  5, 'unidad', true
FROM expanded
ON CONFLICT (sku) DO UPDATE SET
  familia = EXCLUDED.familia,
  nombre = EXCLUDED.nombre,
  categoria = EXCLUDED.categoria,
  tipo = EXCLUDED.tipo,
  medidas = EXCLUDED.medidas,
  precio = EXCLUDED.precio,
  stock = EXCLUDED.stock,
  activo = EXCLUDED.activo;

UPDATE public.inventario
SET precio = 0.50, stock = 10000, activo = true
WHERE tipo IN ('grado2', 'grado5', 'grado8')
  AND familia LIKE 'Tornillo hexagonal%';

COMMIT;
