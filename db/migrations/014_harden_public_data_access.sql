-- Keep personal data and authentication records out of Supabase's public Data API.
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clientes lectura pública" ON public.clientes;
DROP POLICY IF EXISTS "Clientes escritura autenticada" ON public.clientes;
REVOKE ALL ON TABLE public.clientes FROM anon, authenticated;

ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."user", public.session, public.account, public.verification FROM anon, authenticated;
