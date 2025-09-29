-- Create api_tokens table with exact structure specified
CREATE TABLE public.api_tokens (
  id text NOT NULL PRIMARY KEY,
  seller_id bigint,
  token text,
  refresh_token text,
  expiration_date timestamp with time zone
);

-- Enable Row Level Security
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage API tokens" 
ON public.api_tokens 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Deny user access to API tokens" 
ON public.api_tokens 
FOR ALL 
USING (false)
WITH CHECK (false);