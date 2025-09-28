-- Fix the handle_new_user function search path issue

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, apellido, telefono_movil, correo_electronico, tipo_usuario)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'apellido', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'telefono_movil', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'tipo_usuario', 'particular')
  );
  RETURN NEW;
END;
$$;