-- Fix security vulnerability: Restrict access to configuracion_extraccion table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations" ON configuracion_extraccion;

-- Create secure policies that only allow:
-- 1. Admins to manage all configurations
-- 2. Service roles (Edge Functions) to read and update configurations
-- 3. No public access

-- Policy for admins to have full access
CREATE POLICY "Admins can manage extraction configurations" 
ON configuracion_extraccion
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy for service role to read configurations (needed by Edge Functions)
CREATE POLICY "Service role can read extraction configurations" 
ON configuracion_extraccion
FOR SELECT
TO service_role
USING (true);

-- Policy for service role to update last extraction timestamp (needed by Edge Functions)
CREATE POLICY "Service role can update extraction timestamps" 
ON configuracion_extraccion
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);