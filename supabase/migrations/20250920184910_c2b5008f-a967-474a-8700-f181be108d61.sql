-- Habilitar tiempo real para las nuevas tablas
ALTER TABLE public.mensajes_ofertas REPLICA IDENTITY FULL;
ALTER TABLE public.interacciones_profesionales REPLICA IDENTITY FULL;

-- Agregar las tablas a la publicación de tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_ofertas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interacciones_profesionales;