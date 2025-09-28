-- Corregir la función para tener search_path seguro
CREATE OR REPLACE FUNCTION public.update_documentos_profesional_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;