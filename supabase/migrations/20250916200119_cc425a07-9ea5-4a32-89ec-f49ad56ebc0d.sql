-- Enable Row Level Security on api_tokens table
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to deny all access to regular users
CREATE POLICY "Deny user access to API tokens" 
ON public.api_tokens 
FOR ALL 
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Create policy to allow service role access
CREATE POLICY "Service role can manage API tokens" 
ON public.api_tokens 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);