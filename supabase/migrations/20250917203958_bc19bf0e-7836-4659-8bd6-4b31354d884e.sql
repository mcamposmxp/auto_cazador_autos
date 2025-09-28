-- Update the reset_monthly_credits function to prevent accumulation
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- For free users, reset to monthly_limit instead of adding to existing credits
  -- For paid users, keep existing behavior (accumulation allowed)
  UPDATE public.user_credits 
  SET 
    credits_used_this_month = 0,
    credits_available = CASE 
      WHEN plan_type = 'gratuito' THEN monthly_limit  -- Reset to limit, don't accumulate
      ELSE GREATEST(credits_available, monthly_limit)  -- For paid plans, keep accumulation
    END,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$function$;

-- Update the consume_credits function to handle non-accumulation for free users
CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id uuid, p_credits integer, p_action_type text, p_resource_info jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_credits integer;
  current_plan text;
  is_admin boolean;
  admin_queries_today integer;
  last_admin_query timestamp with time zone;
  min_interval_seconds integer := 30; -- 30 seconds minimum between admin queries
  max_admin_queries_per_day integer := 20;
BEGIN
  -- Check if user is admin
  SELECT has_role(p_user_id, 'admin'::app_role) INTO is_admin;
  
  -- Handle admin users with special rules
  IF is_admin THEN
    -- Get or create admin daily usage record
    INSERT INTO public.admin_daily_usage (user_id, usage_date, queries_used)
    VALUES (p_user_id, CURRENT_DATE, 0)
    ON CONFLICT (user_id, usage_date) 
    DO NOTHING;
    
    -- Get current admin usage for today
    SELECT queries_used, last_query_time 
    INTO admin_queries_today, last_admin_query
    FROM public.admin_daily_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    -- Check daily limit
    IF admin_queries_today >= max_admin_queries_per_day THEN
      RETURN false;
    END IF;
    
    -- Check rate limiting (minimum interval between queries)
    IF last_admin_query IS NOT NULL AND 
       EXTRACT(EPOCH FROM (now() - last_admin_query)) < min_interval_seconds THEN
      RETURN false;
    END IF;
    
    -- Update admin usage
    UPDATE public.admin_daily_usage
    SET 
      queries_used = queries_used + p_credits,
      last_query_time = now(),
      updated_at = now()
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    -- Register transaction for admin
    INSERT INTO public.credit_transactions (user_id, credits_consumed, action_type, resource_info)
    VALUES (p_user_id, p_credits, p_action_type || '_admin', p_resource_info);
    
    RETURN true;
  END IF;
  
  -- Handle regular users (existing logic with improved reset)
  PERFORM public.reset_monthly_credits();
  
  SELECT credits_available, plan_type INTO current_credits, current_plan
  FROM public.user_credits
  WHERE user_id = p_user_id;
  
  IF current_credits IS NULL THEN
    INSERT INTO public.user_credits (user_id, credits_available, plan_type, monthly_limit)
    VALUES (p_user_id, 5, 'gratuito', 5);
    current_credits := 5;
    current_plan := 'gratuito';
  END IF;
  
  IF current_credits < p_credits THEN
    RETURN false;
  END IF;
  
  UPDATE public.user_credits
  SET 
    credits_available = credits_available - p_credits,
    credits_used_this_month = credits_used_this_month + p_credits,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO public.credit_transactions (user_id, credits_consumed, action_type, resource_info)
  VALUES (p_user_id, p_credits, p_action_type, p_resource_info);
  
  RETURN true;
END;
$function$;

-- Update the initialize_user_credits function to ensure proper initialization
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_available, plan_type, monthly_limit)
  VALUES (NEW.id, 5, 'gratuito', 5)
  ON CONFLICT (user_id) DO UPDATE SET
    -- For existing users, ensure free accounts don't exceed monthly limit
    credits_available = CASE 
      WHEN user_credits.plan_type = 'gratuito' THEN LEAST(user_credits.credits_available, user_credits.monthly_limit)
      ELSE user_credits.credits_available
    END;
  RETURN NEW;
END;
$function$;