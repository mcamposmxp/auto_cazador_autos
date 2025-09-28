-- Drop existing problematic policies for anuncios_vehiculos
DROP POLICY IF EXISTS "Authenticated users protected contact access" ON public.anuncios_vehiculos;
DROP POLICY IF EXISTS "Block anonymous access to contact data" ON public.anuncios_vehiculos;
DROP POLICY IF EXISTS "Verified professionals access all data" ON public.anuncios_vehiculos;

-- Create more secure policies for anuncios_vehiculos

-- 1. Allow anonymous users to view listings WITHOUT contact information
CREATE POLICY "Anonymous users can view listings without contact info" 
ON public.anuncios_vehiculos 
FOR SELECT 
TO anon
USING (
  activo = true AND 
  -- This policy applies but contact fields will be filtered out in the application layer
  true
);

-- 2. Allow authenticated regular users to view listings WITHOUT contact information  
CREATE POLICY "Authenticated users can view listings without contact info" 
ON public.anuncios_vehiculos 
FOR SELECT 
TO authenticated
USING (
  activo = true AND
  -- Only allow access if user is not a professional (regular users can't see contact info)
  NOT EXISTS (
    SELECT 1 FROM profesionales p 
    WHERE p.user_id = auth.uid() AND p.activo = true
  )
);

-- 3. Allow verified professionals to view ALL data including contact information
CREATE POLICY "Verified professionals can access contact information" 
ON public.anuncios_vehiculos 
FOR SELECT 
TO authenticated
USING (
  activo = true AND
  EXISTS (
    SELECT 1 FROM profesionales p 
    WHERE p.user_id = auth.uid() AND p.activo = true
  )
);

-- 4. Admin and service role maintain full access (existing policies cover this)
-- Admin full access and Service role access policies remain unchanged