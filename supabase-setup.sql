-- ============================================
-- SCRIPT SQL PARA SUPABASE - TORNILLERIA JEHOVA JIREH
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase
-- Este script crea todas las tablas, índices y triggers necesarios

-- Habilitar extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA DE CLIENTES
-- ============================================
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  empresa text,
  direccion text,
  nit text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para clientes
CREATE UNIQUE INDEX IF NOT EXISTS clientes_email_unique ON public.clientes (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS clientes_nit_unique
  ON public.clientes (lower(nit))
  WHERE nit IS NOT NULL AND btrim(nit) <> '';
CREATE INDEX IF NOT EXISTS clientes_telefono_idx ON public.clientes (telefono);

-- ============================================
-- TABLA DE INVENTARIO
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  nombre text NOT NULL,
  categoria text NOT NULL,
  descripcion text,
  descripcion_detallada TEXT,
  imagen TEXT,
  tipo VARCHAR(30),
  medidas VARCHAR(50),
  precio numeric(12,2) NOT NULL CHECK (precio >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo integer NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
  unidad text NOT NULL DEFAULT 'unidad',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para inventario
CREATE INDEX IF NOT EXISTS inventario_categoria_idx ON public.inventario(categoria);
CREATE INDEX IF NOT EXISTS inventario_stock_idx ON public.inventario(stock);
CREATE INDEX IF NOT EXISTS idx_inventario_tipo ON inventario(tipo) WHERE tipo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventario_medidas ON inventario(medidas) WHERE medidas IS NOT NULL;

-- Comentarios sobre campos adicionales
COMMENT ON COLUMN inventario.descripcion_detallada IS 'Descripción detallada del producto con especificaciones técnicas';
COMMENT ON COLUMN inventario.imagen IS 'URL de la imagen del producto';
COMMENT ON COLUMN inventario.tipo IS 'Tipo de material (galvanizado, grado5, grado8, seguridad, acero_inoxidable, zincado)';
COMMENT ON COLUMN inventario.medidas IS 'Medidas del producto (ej: M8 x 40, 1/2-13)';

-- ============================================
-- TABLA DE PEDIDOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','preparando','enviado','entregado','cancelado')),
  subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  impuestos numeric(12,2) NOT NULL DEFAULT 0 CHECK (impuestos >= 0),
  total numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS pedidos_cliente_id_idx ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS pedidos_estado_idx ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS pedidos_created_at_idx ON public.pedidos(created_at DESC);

-- ============================================
-- TABLA DE ITEMS DE PEDIDO
-- ============================================
CREATE TABLE IF NOT EXISTS public.pedido_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  inventario_id uuid REFERENCES public.inventario(id) ON DELETE SET NULL,
  sku text NOT NULL,
  nombre text NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
  total numeric(12,2) NOT NULL CHECK (total >= 0)
);

-- Índices para pedido_items
CREATE INDEX IF NOT EXISTS pedido_items_pedido_id_idx ON public.pedido_items(pedido_id);

-- ============================================
-- BETTER AUTH - TABLAS DE AUTENTICACIÓN
-- ============================================
CREATE TABLE IF NOT EXISTS public."user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session (
  id text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.account (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL,
  accessToken text,
  refreshToken text,
  idToken text,
  accessTokenExpiresAt timestamp,
  refreshTokenExpiresAt timestamp,
  scope text,
  password text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  issuer text
);

CREATE TABLE IF NOT EXISTS public.verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

-- Índices para Better Auth
CREATE INDEX IF NOT EXISTS session_user_id_idx ON public.session ("userId");
CREATE INDEX IF NOT EXISTS account_user_id_idx ON public.account ("userId");

-- ============================================
-- FUNCIONES Y TRIGGERS PARA updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para clientes
DROP TRIGGER IF EXISTS clientes_set_updated_at ON public.clientes;
CREATE TRIGGER clientes_set_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Triggers para inventario
DROP TRIGGER IF EXISTS inventario_set_updated_at ON public.inventario;
CREATE TRIGGER inventario_set_updated_at BEFORE UPDATE ON public.inventario FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Triggers para pedidos
DROP TRIGGER IF EXISTS pedidos_set_updated_at ON public.pedidos;
CREATE TRIGGER pedidos_set_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- DATOS DE EJEMPLO (PRODUCTOS INICIALES)
-- ============================================
INSERT INTO public.inventario (sku, nombre, categoria, descripcion, precio, stock, stock_minimo, unidad, tipo, medidas) VALUES
('TH-M8-40', 'Tornillo hexagonal M8 x 40', 'Tornillos', 'Tornillo hexagonal galvanizado', 0.18, 248, 10, 'unidad', 'galvanizado', 'M8 x 40'),
('TH-M10-60', 'Tornillo hexagonal M10 x 60', 'Tornillos', 'Tornillo hexagonal galvanizado', 0.29, 186, 10, 'unidad', 'galvanizado', 'M10 x 60'),
('TA-M10', 'Tuerca autoblocante M10', 'Tuercas', 'Tuerca autoblocante de seguridad', 0.24, 84, 15, 'unidad', 'seguridad', 'M10'),
('AP-M6-ZN', 'Arandela plana zincada M6', 'Arandelas', 'Arandela plana zincada', 0.06, 512, 50, 'unidad', 'zincado', 'M6'),
('KIT-120', 'Kit de fijación profesional 120 pzs.', 'Kits', 'Kit completo de fijación', 12.90, 19, 5, 'kit', NULL, NULL),
('TA-M8', 'Tuerca hexagonal M8 zincada', 'Tuercas', 'Tuerca hexagonal zincada', 0.12, 340, 30, 'unidad', 'zincado', 'M8')
ON CONFLICT (sku) DO NOTHING;

-- ============================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- ============================================
-- Habilitar RLS en todas las tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Clientes lectura pública" ON public.clientes;
DROP POLICY IF EXISTS "Clientes escritura autenticada" ON public.clientes;
DROP POLICY IF EXISTS "Inventario lectura pública" ON public.inventario;
DROP POLICY IF EXISTS "Inventario escritura autenticada" ON public.inventario;
DROP POLICY IF EXISTS "Pedidos lectura autenticada" ON public.pedidos;
DROP POLICY IF EXISTS "Pedidos escritura autenticada" ON public.pedidos;
DROP POLICY IF EXISTS "Pedido items lectura autenticada" ON public.pedido_items;
DROP POLICY IF EXISTS "Pedido items escritura autenticada" ON public.pedido_items;

-- Políticas para clientes (lectura pública, escritura solo autenticados)
CREATE POLICY "Clientes lectura pública" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Clientes escritura autenticada" ON public.clientes FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para inventario (lectura pública, escritura solo autenticados)
CREATE POLICY "Inventario lectura pública" ON public.inventario FOR SELECT USING (true);
CREATE POLICY "Inventario escritura autenticada" ON public.inventario FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para pedidos (lectura/escritura solo autenticados)
CREATE POLICY "Pedidos lectura autenticada" ON public.pedidos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pedidos escritura autenticada" ON public.pedidos FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para pedido_items (lectura/escritura solo autenticados)
CREATE POLICY "Pedido items lectura autenticada" ON public.pedido_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pedido items escritura autenticada" ON public.pedido_items FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- COMPLETADO
-- ============================================
-- El script ha finalizado. Ahora puedes:
-- 1. Obtener tu DATABASE_URL desde Supabase (Settings > Database > Connection String)
-- 2. Configurar tu archivo .env con la URL de conexión
-- 3. Ejecutar npm run dev para iniciar la aplicación
