-- Secure RLS policies for anuncios_vehiculos table
-- Remove overly permissive policies and add proper access control

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "anuncios_vehiculos_select_policy" ON public.anuncios_vehiculos;
DROP POLICY IF EXISTS "anuncios_vehiculos_insert_policy" ON public.anuncios_vehiculos;
DROP POLICY IF EXISTS "anuncios_vehiculos_update_policy" ON public.anuncios_vehiculos;
DROP POLICY IF EXISTS "anuncios_vehiculos_delete_policy" ON public.anuncios_vehiculos;

-- Create secure policies that allow public read access but restrict write operations
-- Public can view vehicle listings (this is appropriate for a vehicle marketplace)
CREATE POLICY "Allow public read access to vehicle listings" 
ON public.anuncios_vehiculos 
FOR SELECT 
TO public
USING (true);

-- Only allow inserts from authenticated service role (for the extraction functions)
CREATE POLICY "Allow service role to insert vehicle data" 
ON public.anuncios_vehiculos 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Only allow updates from authenticated service role
CREATE POLICY "Allow service role to update vehicle data" 
ON public.anuncios_vehiculos 
FOR UPDATE 
TO service_role
USING (true);

-- Only allow deletes from authenticated service role
CREATE POLICY "Allow service role to delete vehicle data" 
ON public.anuncios_vehiculos 
FOR DELETE 
TO service_role
USING (true);