-- Fix security vulnerability in anuncios_vehiculos table
-- Drop the policy that allows public read access to all vehicle data including contact info
DROP POLICY IF EXISTS "Allow public read access to vehicle listings" ON public.anuncios_vehiculos;

-- Create secure policies for anuncios_vehiculos table

-- Policy 1: Public users can view vehicle listings but without contact information
-- Note: This is handled at application level since RLS can't hide specific columns
-- For now, we'll restrict all access to authenticated users only for security
CREATE POLICY "Authenticated users can view vehicle listings"
ON public.anuncios_vehiculos
FOR SELECT
TO authenticated
USING (activo = true);

-- Policy 2: Admins and service roles can view all vehicle data
CREATE POLICY "Admins can view all vehicle data"
ON public.anuncios_vehiculos
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  activo = true
);