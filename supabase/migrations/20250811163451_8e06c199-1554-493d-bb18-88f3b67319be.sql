-- Allow car owners to see professional contact info for offers they received
-- without exposing other profiles. Keep existing self-view policy intact.

-- Create an additional SELECT policy on profiles
CREATE POLICY "Owners can view professional contact for received offers"
ON public.profiles
FOR SELECT
USING (
  -- Admins can view all profiles
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Users can always view their own profile (already covered, but harmless here)
  auth.uid() = user_id
  OR
  -- Car owners (by JWT email) can view profiles of professionals who made offers on their cars
  EXISTS (
    SELECT 1
    FROM public.ofertas o
    JOIN public.autos_venta av ON av.id = o.auto_venta_id
    JOIN public.clientes c ON c.id = av.cliente_id
    WHERE o.profesional_id = profiles.user_id
      AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
);
