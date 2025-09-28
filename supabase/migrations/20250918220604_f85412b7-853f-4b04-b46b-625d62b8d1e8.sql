-- Fix RLS policies for solicitudes_paquetes_personalizados table to prevent unauthorized access to customer contact information

-- Drop existing policies to rebuild them properly
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.solicitudes_paquetes_personalizados;
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.solicitudes_paquetes_personalizados;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.solicitudes_paquetes_personalizados;

-- Create secure policies for customer package requests

-- 1. Admins can manage all requests (unchanged - this is secure)
CREATE POLICY "Admins can manage all requests" 
ON public.solicitudes_paquetes_personalizados
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Users can insert requests but must use their own user_id if authenticated
CREATE POLICY "Users can insert their own requests" 
ON public.solicitudes_paquetes_personalizados
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Anonymous users can insert requests (for non-authenticated contact forms)
CREATE POLICY "Anonymous users can insert requests" 
ON public.solicitudes_paquetes_personalizados
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- 4. Users can only view their own requests (authenticated users)
CREATE POLICY "Users can view their own requests" 
ON public.solicitudes_paquetes_personalizados
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 5. Users can update their own requests (authenticated users only)
CREATE POLICY "Users can update their own requests" 
ON public.solicitudes_paquetes_personalizados
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Users can delete their own requests (authenticated users only)
CREATE POLICY "Users can delete their own requests" 
ON public.solicitudes_paquetes_personalizados
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Note: Removed the email-based access policy as it could be exploited
-- Contact information is now only accessible to:
-- 1. Admins (for processing requests)
-- 2. The authenticated user who created the request
-- 3. Anonymous requests can be created but not viewed (admin-only processing)