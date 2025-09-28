-- Corregir warnings de seguridad: Fijar search_path en funciones críticas

-- 1. Actualizar función has_role con search_path fijo
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

-- 2. Actualizar función cleanup_expired_vehicle_cache con search_path fijo
CREATE OR REPLACE FUNCTION public.cleanup_expired_vehicle_cache()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.vehicle_market_cache
  WHERE expires_at < NOW();
END;
$function$;

-- 3. Actualizar función cleanup_expired_cache con search_path fijo
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.market_data_cache
  WHERE expires_at < now();
END;
$function$;

-- 4. Actualizar función reset_monthly_credits con search_path fijo
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
$function$;

-- 5. Actualizar función reset_monthly_referral_credits con search_path fijo
CREATE OR REPLACE FUNCTION public.reset_monthly_referral_credits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.user_credits 
  SET 
    referrals_count_this_month = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$function$;

-- 6. Actualizar función update_updated_at_column con search_path fijo
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;