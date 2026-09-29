INSERT INTO public.inventario (
  sku,
  familia,
  nombre,
  categoria,
  tipo,
  medidas,
  precio,
  stock,
  stock_minimo,
  unidad,
  activo
)
VALUES
  ('TH14X12-G5',  'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 1/2 grado 5 ordinario',   'Tornillos', 'grado5', '1/4 x 1/2',   0, 0, 5, 'unidad', true),
  ('TH14X34-G5',  'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 3/4 grado 5 ordinario',   'Tornillos', 'grado5', '1/4 x 3/4',   0, 0, 5, 'unidad', true),
  ('TH14X1-G5',   'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 1 grado 5 ordinario',     'Tornillos', 'grado5', '1/4 x 1',     0, 0, 5, 'unidad', true),
  ('TH14X114-G5', 'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 1-1/4 grado 5 ordinario', 'Tornillos', 'grado5', '1/4 x 1-1/4', 0, 0, 5, 'unidad', true),
  ('TH14X112-G5', 'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 1-1/2 grado 5 ordinario', 'Tornillos', 'grado5', '1/4 x 1-1/2', 0, 0, 5, 'unidad', true),
  ('TH14X2-G5',   'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 2 grado 5 ordinario',     'Tornillos', 'grado5', '1/4 x 2',     0, 0, 5, 'unidad', true),
  ('TH14X212-G5', 'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 2-1/2 grado 5 ordinario', 'Tornillos', 'grado5', '1/4 x 2-1/2', 0, 0, 5, 'unidad', true),
  ('TH14X3-G5',   'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 3 grado 5 ordinario',     'Tornillos', 'grado5', '1/4 x 3',     0, 0, 5, 'unidad', true),
  ('TH14X312-G5', 'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 3-1/2 grado 5 ordinario', 'Tornillos', 'grado5', '1/4 x 3-1/2', 0, 0, 5, 'unidad', true),
  ('TH14X4-G5',   'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 4 grado 5 ordinario',     'Tornillos', 'grado5', '1/4 x 4',     0, 0, 5, 'unidad', true),
  ('TH14X412-G5', 'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 4-1/2 grado 5 ordinario', 'Tornillos', 'grado5', '1/4 x 4-1/2', 0, 0, 5, 'unidad', true),
  ('TH14X5-G5',   'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 5 grado 5 ordinario',     'Tornillos', 'grado5', '1/4 x 5',     0, 0, 5, 'unidad', true),
  ('TH14X512-G5', 'Tornillo hexagonal · Rosca ordinaria · Grado 5', 'Tornillo hexagonal 1/4 x 5-1/2 grado 5 ordinario', 'Tornillos', 'grado5', '1/4 x 5-1/2', 0, 0, 5, 'unidad', true)
ON CONFLICT (sku) DO UPDATE
SET
  familia = EXCLUDED.familia,
  medidas = EXCLUDED.medidas;
