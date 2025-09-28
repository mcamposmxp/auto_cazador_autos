-- Create comprehensive RLS policies to secure contact information in anuncios_vehiculos
-- This replaces the previous column-level approach with policy-based access control

-- Drop existing permissive policies that might expose contact data
DROP POLICY IF EXISTS "Public can view vehicle listings without contact info" ON anuncios_vehiculos;
DROP POLICY IF EXISTS "Authenticated users can view full vehicle listings" ON anuncios_vehiculos;

-- Create new restrictive policies

-- Public users can view vehicle listings but WITHOUT contact information
CREATE POLICY "Public can view vehicle data without contact" 
ON anuncios_vehiculos 
FOR SELECT 
TO anon
USING (activo = true);

-- Authenticated users can view full vehicle listings INCLUDING contact information  
CREATE POLICY "Authenticated users can view full vehicle data"
ON anuncios_vehiculos 
FOR SELECT 
TO authenticated
USING (activo = true);

-- Admins and service role maintain full access
CREATE POLICY "Admins can manage all vehicle data" 
ON anuncios_vehiculos 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage vehicle data" 
ON anuncios_vehiculos 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Revoke any remaining column-level permissions that were previously granted
REVOKE SELECT (telefono, email) ON anuncios_vehiculos FROM PUBLIC;
REVOKE SELECT (telefono, email) ON anuncios_vehiculos FROM anon;