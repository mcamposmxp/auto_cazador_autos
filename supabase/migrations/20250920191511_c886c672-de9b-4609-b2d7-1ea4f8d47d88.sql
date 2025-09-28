-- Update reset_monthly_credits function to reset evaluation credits
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_credits 
  SET 
    credits_used_this_month = 0,
    credits_used_ads = 0,
    credits_used_searches = 0,
    evaluation_credits_this_month = 0,
    credits_available = CASE 
      WHEN plan_type = 'gratuito' THEN monthly_limit
      ELSE GREATEST(credits_available, monthly_limit)
    END,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$function$