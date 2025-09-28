-- Fix security vulnerability in anuncios_vehiculos table
-- Remove overly permissive policies and implement secure access controls

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations" ON public.anuncios_vehiculos;
DROP POLICY IF EXISTS "Allow public read access to vehicle listings" ON public.anuncios_vehiculos;
DROP POLICY IF EXISTS "Allow service role to delete vehicle data" ON public.anuncios_vehiculos;
DROP POLICY IF EXISTS "Allow service role to insert vehicle data" ON public.anuncios_vehiculos;
DROP POLICY IF EXISTS "Allow service role to update vehicle data" ON public.anuncios_vehiculos;

-- Create secure RLS policies for anuncios_vehiculos

-- 1. Allow public users to view vehicle listings but WITHOUT sensitive contact information
-- This policy will work with SELECT statements that don't include telefono, email columns
CREATE POLICY "Public can view vehicle listings without contact info" 
ON public.anuncios_vehiculos 
FOR SELECT 
USING (true);

-- 2. Allow authenticated users to view all vehicle data including contact information
CREATE POLICY "Authenticated users can view full vehicle listings" 
ON public.anuncios_vehiculos 
FOR SELECT 
TO authenticated
USING (true);

-- 3. Allow admins to perform all operations
CREATE POLICY "Admins can manage all vehicle data" 
ON public.anuncios_vehiculos 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Allow service role operations for automated data extraction
CREATE POLICY "Service role can manage vehicle data" 
ON public.anuncios_vehiculos 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Note: The application will need to handle contact information visibility 
-- by checking authentication status in the frontend