-- Crear tabla para códigos de referido
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  uses_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 5,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para tracking de referidos
CREATE TABLE public.user_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referee_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  credits_awarded INTEGER NOT NULL DEFAULT 0,
  referee_first_action_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referee_id)
);

-- Añadir columna para tracking de créditos por referidos en user_credits
ALTER TABLE public.user_credits 
ADD COLUMN credits_earned_referrals INTEGER DEFAULT 0,
ADD COLUMN referrals_count_this_month INTEGER DEFAULT 0;

-- Habilitar RLS en nuevas tablas
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para referral_codes
CREATE POLICY "Users can view their own referral codes" 
ON public.referral_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" 
ON public.referral_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" 
ON public.referral_codes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage referral codes" 
ON public.referral_codes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Políticas RLS para user_referrals
CREATE POLICY "Users can view their own referrals (as referrer)" 
ON public.user_referrals 
FOR SELECT 
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals they were referred by" 
ON public.user_referrals 
FOR SELECT 
USING (auth.uid() = referee_id);

CREATE POLICY "System can manage user referrals" 
ON public.user_referrals 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Función para resetear contadores mensuales de referidos
CREATE OR REPLACE FUNCTION public.reset_monthly_referral_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.user_credits 
  SET 
    referrals_count_this_month = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$function$;

-- Trigger para actualizar timestamps
CREATE TRIGGER update_referral_codes_updated_at
BEFORE UPDATE ON public.referral_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_referrals_updated_at
BEFORE UPDATE ON public.user_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();