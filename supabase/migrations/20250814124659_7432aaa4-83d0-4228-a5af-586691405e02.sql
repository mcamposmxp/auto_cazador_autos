-- Fix security issues and properly secure contact information

-- Drop the view that caused security issues
DROP VIEW IF EXISTS public.anuncios_vehiculos_public;

-- Drop the problematic function
DROP FUNCTION IF EXISTS public.get_public_vehicle_columns();

-- Fix the existing function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create a simple, secure policy approach
-- Remove overly permissive policies first
DROP POLICY IF EXISTS "Authenticated users can view full vehicle listings" ON anuncios_vehiculos;

-- Create specific policies for different user types
CREATE POLICY "Anonymous users can view basic vehicle info" 
ON anuncios_vehiculos 
FOR SELECT 
TO anon
USING (
  activo = true 
  AND telefono IS NULL 
  AND email IS NULL
);

CREATE POLICY "Authenticated users can view all vehicle info"
ON anuncios_vehiculos 
FOR SELECT 
TO authenticated
USING (activo = true);