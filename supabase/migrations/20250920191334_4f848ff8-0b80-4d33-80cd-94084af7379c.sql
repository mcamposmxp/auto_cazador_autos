-- Add columns to track evaluation credits
ALTER TABLE public.user_credits 
ADD COLUMN credits_earned_evaluations INTEGER DEFAULT 0,
ADD COLUMN evaluation_credits_this_month INTEGER DEFAULT 0;

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

-- Create table to track evaluation rewards to prevent duplicates
CREATE TABLE public.evaluation_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('cliente_profesional', 'profesional_profesional')),
  interaction_id UUID NOT NULL,
  credits_awarded INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, interaction_type, interaction_id)
);

-- Enable RLS on evaluation_rewards
ALTER TABLE public.evaluation_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for evaluation_rewards
CREATE POLICY "Users can view their own evaluation rewards"
  ON public.evaluation_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage evaluation rewards"
  ON public.evaluation_rewards
  FOR ALL
  USING (true)
  WITH CHECK (true);