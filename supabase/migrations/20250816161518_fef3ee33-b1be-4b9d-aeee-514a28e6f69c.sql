-- First, remove the current overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on vendedores_ayuda" ON vendedores_ayuda;

-- Create secure RLS policies for vendedores_ayuda table

-- 1. Admins can view all help requests for management purposes
CREATE POLICY "Admins can view all vendedores_ayuda"
ON vendedores_ayuda
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Admins can manage all help requests
CREATE POLICY "Admins can manage all vendedores_ayuda"
ON vendedores_ayuda
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Authenticated users can insert their own help requests
CREATE POLICY "Users can insert their own help requests"
ON vendedores_ayuda
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  vendedor_correo = (auth.jwt() ->> 'email'::text)
);

-- 4. Users can view their own help requests by email or user_id
CREATE POLICY "Users can view their own help requests"
ON vendedores_ayuda
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  vendedor_correo = (auth.jwt() ->> 'email'::text)
);

-- 5. Users can update their own help requests
CREATE POLICY "Users can update their own help requests"
ON vendedores_ayuda
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  vendedor_correo = (auth.jwt() ->> 'email'::text)
)
WITH CHECK (
  auth.uid() = user_id OR 
  vendedor_correo = (auth.jwt() ->> 'email'::text)
);