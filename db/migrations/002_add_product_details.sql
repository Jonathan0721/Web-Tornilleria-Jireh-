-- Migración para agregar campos de imagen, descripción detallada, tipo y medidas a la tabla inventario
-- Ejecutar este script en tu base de datos PostgreSQL

-- Agregar nuevos campos a la tabla inventario
ALTER TABLE inventario 
ADD COLUMN IF NOT EXISTS descripcion_detallada TEXT,
ADD COLUMN IF NOT EXISTS imagen TEXT,
ADD COLUMN IF NOT EXISTS tipo VARCHAR(30),
ADD COLUMN IF NOT EXISTS medidas VARCHAR(50);

-- Crear índice para búsquedas por tipo
CREATE INDEX IF NOT EXISTS idx_inventario_tipo ON inventario(tipo) WHERE tipo IS NOT NULL;

-- Crear índice para búsquedas por medidas
CREATE INDEX IF NOT EXISTS idx_inventario_medidas ON inventario(medidas) WHERE medidas IS NOT NULL;

-- Comentario sobre los nuevos campos
COMMENT ON COLUMN inventario.descripcion_detallada IS 'Descripción detallada del producto con especificaciones técnicas';
COMMENT ON COLUMN inventario.imagen IS 'URL de la imagen del producto';
COMMENT ON COLUMN inventario.tipo IS 'Tipo de material (galvanizado, grado5, grado8, seguridad, acero_inoxidable, zincado)';
COMMENT ON COLUMN inventario.medidas IS 'Medidas del producto (ej: M8 x 40, 1/2-13)';
