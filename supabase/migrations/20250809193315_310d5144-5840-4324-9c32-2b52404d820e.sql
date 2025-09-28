-- Fix RLS errors on public.ofertas caused by policies referencing auth.users
-- Drop problematic policies that reference auth.users (these trigger permission denied for table users)
DROP POLICY IF EXISTS "Users can view offers for their cars or offers they made" ON public.ofertas;
DROP POLICY IF EXISTS "Users can update their own offers or car owners can update offe" ON public.ofertas;

-- Create equivalent policies using JWT email claim instead of querying auth.users
CREATE POLICY "Users can view offers for their cars or offers they made (jwt)"
ON public.ofertas
FOR SELECT
USING (
  (profesional_id = auth.uid()) OR
  EXISTS (
    SELECT 1
    FROM public.autos_venta av
    JOIN public.clientes c ON c.id = av.cliente_id
    WHERE av.id = ofertas.auto_venta_id
      AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Users can update their own offers or owners can update (jwt)"
ON public.ofertas
FOR UPDATE
USING (
  (profesional_id = auth.uid()) OR
  EXISTS (
    SELECT 1
    FROM public.autos_venta av
    JOIN public.clientes c ON c.id = av.cliente_id
    WHERE av.id = ofertas.auto_venta_id
      AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
);
