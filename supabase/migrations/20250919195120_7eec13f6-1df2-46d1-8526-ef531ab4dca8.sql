-- Add columns to track different types of credit usage
ALTER TABLE user_credits 
ADD COLUMN credits_used_ads INTEGER DEFAULT 0,
ADD COLUMN credits_used_searches INTEGER DEFAULT 0;

-- Create table for tracking vehicle market data cache
CREATE TABLE vehicle_market_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vehicle_key TEXT NOT NULL, -- format: marca-modelo-año-version
  market_data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vehicle_key)
);

-- Enable RLS on vehicle_market_cache
ALTER TABLE vehicle_market_cache ENABLE ROW LEVEL SECURITY;

-- RLS policy for vehicle_market_cache
CREATE POLICY "Users can manage their own vehicle cache" 
ON vehicle_market_cache 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create table for tracking weekly ad credit consumption
CREATE TABLE weekly_ad_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  week_start DATE NOT NULL, -- start of the week (Monday)
  credits_consumed INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id, week_start)
);

-- Enable RLS on weekly_ad_credits
ALTER TABLE weekly_ad_credits ENABLE ROW LEVEL SECURITY;

-- RLS policy for weekly_ad_credits
CREATE POLICY "Users can view their own weekly ad credits" 
ON weekly_ad_credits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage weekly ad credits" 
ON weekly_ad_credits 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Function to clean expired cache (runs daily at 3 AM)
CREATE OR REPLACE FUNCTION cleanup_expired_vehicle_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM vehicle_market_cache
  WHERE expires_at < NOW();
END;
$$;

-- Updated consume_credits function to handle different credit types
CREATE OR REPLACE FUNCTION consume_credits_typed(
  p_user_id UUID, 
  p_credits INTEGER, 
  p_action_type TEXT, 
  p_credit_type TEXT DEFAULT 'search', -- 'search' or 'ad'
  p_resource_info JSONB DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_credits integer;
  current_plan text;
  is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT has_role(p_user_id, 'admin'::app_role) INTO is_admin;
  
  -- Handle admin users (existing logic)
  IF is_admin THEN
    -- Existing admin logic from original function
    RETURN true;
  END IF;
  
  -- Handle regular users
  PERFORM public.reset_monthly_credits();
  
  SELECT credits_available, plan_type INTO current_credits, current_plan
  FROM public.user_credits
  WHERE user_id = p_user_id;
  
  IF current_credits IS NULL THEN
    INSERT INTO public.user_credits (user_id, credits_available, plan_type, monthly_limit)
    VALUES (p_user_id, 5, 'gratuito', 5);
    current_credits := 5;
  END IF;
  
  IF current_credits < p_credits THEN
    RETURN false;
  END IF;
  
  -- Update credits with type tracking
  IF p_credit_type = 'ad' THEN
    UPDATE public.user_credits
    SET 
      credits_available = credits_available - p_credits,
      credits_used_this_month = credits_used_this_month + p_credits,
      credits_used_ads = credits_used_ads + p_credits,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.user_credits
    SET 
      credits_available = credits_available - p_credits,
      credits_used_this_month = credits_used_this_month + p_credits,
      credits_used_searches = credits_used_searches + p_credits,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Insert transaction record with credit type
  INSERT INTO public.credit_transactions (user_id, credits_consumed, action_type, resource_info)
  VALUES (p_user_id, p_credits, p_action_type || '_' || p_credit_type, p_resource_info);
  
  RETURN true;
END;
$$;

-- Function to get or create weekly ad credit record
CREATE OR REPLACE FUNCTION get_or_create_weekly_ad_credit(
  p_user_id UUID,
  p_vehicle_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  week_start DATE;
  existing_record UUID;
BEGIN
  -- Get the start of current week (Monday)
  week_start := date_trunc('week', CURRENT_DATE);
  
  -- Check if record already exists for this week
  SELECT id INTO existing_record
  FROM weekly_ad_credits
  WHERE user_id = p_user_id 
    AND vehicle_id = p_vehicle_id 
    AND week_start = week_start;
  
  -- If record exists, no credit consumption needed
  IF existing_record IS NOT NULL THEN
    RETURN true;
  END IF;
  
  -- Consume credit for this week's ad view
  IF consume_credits_typed(p_user_id, 1, 'weekly_ad_view', 'ad', 
    jsonb_build_object('vehicle_id', p_vehicle_id, 'week_start', week_start)) THEN
    
    -- Insert weekly record
    INSERT INTO weekly_ad_credits (user_id, vehicle_id, week_start)
    VALUES (p_user_id, p_vehicle_id, week_start);
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Update reset_monthly_credits to also reset typed usage
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    credits_used_this_month = 0,
    credits_used_ads = 0,
    credits_used_searches = 0,
    credits_available = CASE 
      WHEN plan_type = 'gratuito' THEN monthly_limit
      ELSE GREATEST(credits_available, monthly_limit)
    END,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;