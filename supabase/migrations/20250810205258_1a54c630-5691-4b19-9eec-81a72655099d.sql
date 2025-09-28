-- Update profiles.tipo_usuario check constraint to allow 'profesional'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tipo_usuario_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tipo_usuario_check
  CHECK (tipo_usuario IN ('particular', 'profesional'));
