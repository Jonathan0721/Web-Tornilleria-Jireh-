CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  empresa text,
  direccion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clientes_email_unique ON public.clientes (lower(email));

CREATE TABLE IF NOT EXISTS public.inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  nombre text NOT NULL,
  categoria text NOT NULL,
  descripcion text,
  precio numeric(12,2) NOT NULL CHECK (precio >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo integer NOT NULL DEFAULT 5 CHECK (stock_minimo >= 0),
  unidad text NOT NULL DEFAULT 'unidad',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS pedidos_cliente_id_idx ON public.pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS pedidos_estado_idx ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS pedidos_created_at_idx ON public.pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS pedido_items_pedido_id_idx ON public.pedido_items(pedido_id);
CREATE INDEX IF NOT EXISTS inventario_categoria_idx ON public.inventario(categoria);
CREATE INDEX IF NOT EXISTS inventario_stock_idx ON public.inventario(stock);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clientes_set_updated_at ON public.clientes;
CREATE TRIGGER clientes_set_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS inventario_set_updated_at ON public.inventario;
CREATE TRIGGER inventario_set_updated_at BEFORE UPDATE ON public.inventario FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS pedidos_set_updated_at ON public.pedidos;
CREATE TRIGGER pedidos_set_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Better Auth: login y sesiones persistentes del administrador
CREATE TABLE IF NOT EXISTS public."user" (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, "emailVerified" boolean NOT NULL DEFAULT false, image text, "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.session (id text PRIMARY KEY, "expiresAt" timestamp NOT NULL, token text NOT NULL UNIQUE, "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now(), "ipAddress" text, "userAgent" text, "userId" text NOT NULL);
CREATE TABLE IF NOT EXISTS public.account (id text PRIMARY KEY, "accountId" text NOT NULL, "providerId" text NOT NULL, "userId" text NOT NULL, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamp, "refreshTokenExpiresAt" timestamp, scope text, password text, "createdAt" timestamp NOT NULL DEFAULT now(), "updatedAt" timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.verification (id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL, "expiresAt" timestamp NOT NULL, "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now());
CREATE INDEX IF NOT EXISTS session_user_id_idx ON public.session ("userId");
CREATE INDEX IF NOT EXISTS account_user_id_idx ON public.account ("userId");
ALTER TABLE public.account ADD COLUMN IF NOT EXISTS issuer text;
