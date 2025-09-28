-- Fix security vulnerability in autos_venta table
-- Drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Permitir todas las operaciones en autos_venta" ON public.autos_venta;

-- Create secure RLS policies for autos_venta table

-- Policy 1: Authenticated professionals can view cars available for sale
CREATE POLICY "Professionals can view available cars for sale"
ON public.autos_venta
FOR SELECT
TO authenticated
USING (
  recibiendo_ofertas = true 
  AND EXISTS (
    SELECT 1 FROM public.profesionales 
    WHERE user_id = auth.uid() AND activo = true
  )
);

-- Policy 2: Customers can view and manage their own cars
-- Uses email matching through the clientes table
CREATE POLICY "Customers can manage their own cars"
ON public.autos_venta
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = autos_venta.cliente_id 
    AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = autos_venta.cliente_id 
    AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
);

-- Policy 3: Admins can manage all vehicle records
CREATE POLICY "Admins can manage all vehicle records"
ON public.autos_venta
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));