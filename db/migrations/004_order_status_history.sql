CREATE TABLE IF NOT EXISTS public.pedido_historial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  estado_anterior text,
  estado_nuevo text NOT NULL,
  cambiado_por text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pedido_historial_pedido_created_idx
  ON public.pedido_historial (pedido_id, created_at DESC);

INSERT INTO public.pedido_historial (
  id,
  pedido_id,
  estado_anterior,
  estado_nuevo,
  cambiado_por,
  created_at
)
SELECT
  gen_random_uuid(),
  p.id,
  NULL,
  p.estado,
  'Registro inicial',
  p.created_at
FROM public.pedidos p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.pedido_historial h
  WHERE h.pedido_id = p.id
);
