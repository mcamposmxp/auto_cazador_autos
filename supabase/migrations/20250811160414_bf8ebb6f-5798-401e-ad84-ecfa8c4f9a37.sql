-- Fix security vulnerability in clientes table
-- Drop the overly permissive policy that allows public access to all customer data
DROP POLICY IF EXISTS "Permitir todas las operaciones en clientes" ON public.clientes;

-- Create secure RLS policies for clientes table

-- Policy 1: Users can manage their own cliente records
-- Users can only access customer records where the email matches their authenticated email
CREATE POLICY "Users can manage their own cliente records"
ON public.clientes
FOR ALL
TO authenticated
USING (correo_electronico = (auth.jwt() ->> 'email'))
WITH CHECK (correo_electronico = (auth.jwt() ->> 'email'));

-- Policy 2: Admins can manage all cliente records
CREATE POLICY "Admins can manage all cliente records"
ON public.clientes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));