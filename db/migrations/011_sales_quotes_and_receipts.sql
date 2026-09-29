CREATE SEQUENCE IF NOT EXISTS public.documentos_venta_numero_seq;

CREATE TABLE IF NOT EXISTS public.documentos_venta (
  id uuid PRIMARY KEY,
  numero_cotizacion text NOT NULL UNIQUE,
  numero_comprobante text UNIQUE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'cotizacion'
    CHECK (estado IN ('cotizacion', 'comprobante')),
  subtotal numeric(12, 2) NOT NULL CHECK (subtotal >= 0),
  impuestos numeric(12, 2) NOT NULL CHECK (impuestos >= 0),
  total numeric(12, 2) NOT NULL CHECK (total >= 0),
  notas text,
  creado_por text NOT NULL,
  confirmado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.documento_venta_items (
  id uuid PRIMARY KEY,
  documento_id uuid NOT NULL REFERENCES public.documentos_venta(id) ON DELETE CASCADE,
  inventario_id uuid REFERENCES public.inventario(id) ON DELETE SET NULL,
  sku text NOT NULL,
  nombre text NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  cantidad_descontada integer NOT NULL DEFAULT 0 CHECK (cantidad_descontada >= 0 AND cantidad_descontada <= cantidad),
  precio_unitario numeric(12, 2) NOT NULL CHECK (precio_unitario > 0),
  total numeric(12, 2) NOT NULL CHECK (total > 0)
);

CREATE INDEX IF NOT EXISTS documentos_venta_cliente_id_idx
  ON public.documentos_venta(cliente_id);
CREATE INDEX IF NOT EXISTS documentos_venta_created_at_idx
  ON public.documentos_venta(created_at DESC);
CREATE INDEX IF NOT EXISTS documentos_venta_estado_created_at_idx
  ON public.documentos_venta(estado, created_at DESC);
CREATE INDEX IF NOT EXISTS documento_venta_items_documento_id_idx
  ON public.documento_venta_items(documento_id);
CREATE INDEX IF NOT EXISTS documento_venta_items_inventario_id_idx
  ON public.documento_venta_items(inventario_id);

ALTER TABLE public.documentos_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_venta_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.documentos_venta FROM anon, authenticated;
REVOKE ALL ON TABLE public.documento_venta_items FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.documentos_venta_numero_seq FROM anon, authenticated;
