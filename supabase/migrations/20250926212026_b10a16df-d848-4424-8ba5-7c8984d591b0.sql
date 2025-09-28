-- Add 300 credits to specified users
-- First, let's get the user IDs for the email addresses
DO $$
DECLARE
    user_id_1 uuid;
    user_id_2 uuid;
BEGIN
    -- Get user IDs from auth.users
    SELECT id INTO user_id_1 FROM auth.users WHERE email = 'jmbrionesp@gmail.com';
    SELECT id INTO user_id_2 FROM auth.users WHERE email = 'mc+caz_profesional@maxipublica.com';
    
    -- For jmbrionesp@gmail.com - create new record with 300 credits
    IF user_id_1 IS NOT NULL THEN
        INSERT INTO public.user_credits (
            user_id, 
            credits_available, 
            plan_type, 
            monthly_limit,
            credits_used_this_month
        ) VALUES (
            user_id_1, 
            300, 
            'personalizado', 
            500,
            0
        ) ON CONFLICT (user_id) DO UPDATE SET
            credits_available = user_credits.credits_available + 300,
            plan_type = 'personalizado',
            monthly_limit = 500,
            updated_at = now();
        
        -- Log the transaction
        INSERT INTO public.credit_transactions (
            user_id, 
            credits_consumed, 
            action_type, 
            resource_info
        ) VALUES (
            user_id_1, 
            -300, 
            'admin_credit_grant', 
            '{"reason": "Manual credit addition by admin", "email": "jmbrionesp@gmail.com"}'::jsonb
        );
    END IF;
    
    -- For mc+caz_profesional@maxipublica.com - add 300 credits to existing record
    IF user_id_2 IS NOT NULL THEN
        INSERT INTO public.user_credits (
            user_id, 
            credits_available, 
            plan_type, 
            monthly_limit,
            credits_used_this_month
        ) VALUES (
            user_id_2, 
            300, 
            'personalizado', 
            500,
            0
        ) ON CONFLICT (user_id) DO UPDATE SET
            credits_available = user_credits.credits_available + 300,
            plan_type = 'personalizado',
            monthly_limit = 500,
            updated_at = now();
        
        -- Log the transaction
        INSERT INTO public.credit_transactions (
            user_id, 
            credits_consumed, 
            action_type, 
            resource_info
        ) VALUES (
            user_id_2, 
            -300, 
            'admin_credit_grant', 
            '{"reason": "Manual credit addition by admin", "email": "mc+caz_profesional@maxipublica.com"}'::jsonb
        );
    END IF;
END $$;