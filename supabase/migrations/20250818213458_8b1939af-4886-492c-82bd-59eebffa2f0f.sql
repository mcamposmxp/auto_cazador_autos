-- Agregar campos de precio mínimo y máximo de venta a la tabla de autos profesionales
ALTER TABLE public.autos_profesional_inventario 
ADD COLUMN precio_minimo_venta numeric,
ADD COLUMN precio_maximo_venta numeric;

-- Agregar comentarios para documentar los nuevos campos
COMMENT ON COLUMN public.autos_profesional_inventario.precio_minimo_venta IS 'Precio mínimo de venta definido por el profesional. Los ajustes automáticos no reducirán el precio por debajo de este valor.';
COMMENT ON COLUMN public.autos_profesional_inventario.precio_maximo_venta IS 'Precio máximo de venta definido por el profesional (opcional). Los ajustes automáticos no aumentarán el precio por encima de este valor.';