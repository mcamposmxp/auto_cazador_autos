-- Secure seller contact info on anuncios_vehiculos without breaking public listings
BEGIN;

-- Restrict sensitive columns from anonymous (PUBLIC) role
REVOKE SELECT (telefono, email) ON public.anuncios_vehiculos FROM PUBLIC;

-- Allow authenticated users and service role to access sensitive columns
GRANT SELECT (telefono, email) ON public.anuncios_vehiculos TO authenticated;
GRANT SELECT (telefono, email) ON public.anuncios_vehiculos TO service_role;

COMMIT;