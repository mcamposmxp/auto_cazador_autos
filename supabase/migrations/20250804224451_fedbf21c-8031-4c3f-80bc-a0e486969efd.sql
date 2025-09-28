-- Add column for damage/details description in car condition
ALTER TABLE public.autos_venta 
ADD COLUMN comentarios_estado text;