-- Secure contact information in anuncios_vehiculos by replacing permissive policies

-- First, drop the overly permissive public policies
DROP POLICY IF EXISTS "Authenticated users can view vehicle listings" ON anuncios_vehiculos;
DROP POLICY IF EXISTS "Public can view vehicle listings without contact info" ON anuncios_vehiculos;

-- Create a function to return vehicle data without contact info for anonymous users
CREATE OR REPLACE FUNCTION public.get_public_vehicle_columns()
RETURNS text[] AS $$
BEGIN
  RETURN ARRAY[
    'id', 'precio', 'ano', 'kilometraje', 'imagenes', 'caracteristicas', 
    'datos_raw', 'fecha_extraccion', 'fecha_actualizacion', 'activo', 
    'created_at', 'updated_at', 'url_anuncio', 'sitio_web', 'titulo', 
    'precio_original', 'marca', 'modelo', 'kilometraje_original', 
    'combustible', 'transmision', 'tipo_vehiculo', 'color', 'descripcion', 
    'ubicacion', 'hash_contenido', 'estado_normalizacion'
  ];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure view for public access (without contact info)
CREATE OR REPLACE VIEW public.anuncios_vehiculos_public AS 
SELECT 
  id, precio, ano, kilometraje, imagenes, caracteristicas, 
  datos_raw, fecha_extraccion, fecha_actualizacion, activo, 
  created_at, updated_at, url_anuncio, sitio_web, titulo, 
  precio_original, marca, modelo, kilometraje_original, 
  combustible, transmision, tipo_vehiculo, color, descripcion, 
  ubicacion, hash_contenido, estado_normalizacion
FROM anuncios_vehiculos 
WHERE activo = true;

-- Grant public access to the secure view
GRANT SELECT ON public.anuncios_vehiculos_public TO anon;
GRANT SELECT ON public.anuncios_vehiculos_public TO authenticated;