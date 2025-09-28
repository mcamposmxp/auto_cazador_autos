-- Security fix: Ensure profesionales table is completely protected from public access
-- The issue might be that we need explicit denial for anonymous users

-- First, let's add a restrictive policy that explicitly denies anonymous access
CREATE POLICY "Deny anonymous access to profesionales" 
ON public.profesionales 
FOR ALL 
TO anon
USING (false);

-- Also add a restrictive policy for authenticated users who are not owners or admins
CREATE POLICY "Restrict professional data access" 
ON public.profesionales 
FOR SELECT 
TO authenticated
USING (
  -- Only allow access if user is admin or owns the professional record
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_id = auth.uid()
);

-- Ensure other operations are also properly restricted for authenticated users
CREATE POLICY "Restrict professional data modifications" 
ON public.profesionales 
FOR ALL 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_id = auth.uid()
);