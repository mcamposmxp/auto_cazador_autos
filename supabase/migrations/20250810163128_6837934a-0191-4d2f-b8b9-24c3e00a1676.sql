-- Grant admin role to the provided email
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email = 'jmbriones@maxipublica.com'
ON CONFLICT (user_id, role) DO NOTHING;