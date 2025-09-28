-- Corregir funciones restantes que necesitan search_path fijo para seguridad

-- 1. Actualizar función actualizar_stats_profesional_profesional con search_path fijo
CREATE OR REPLACE FUNCTION public.actualizar_stats_profesional_profesional(p_profesional_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  avg_rating_vendedor NUMERIC(3,2);
  total_reviews_vendedor INTEGER;
  avg_rating_comprador NUMERIC(3,2);
  total_reviews_comprador INTEGER;
  badge_vendedor_nivel TEXT;
  badge_comprador_nivel TEXT;
  reputacion_general_calc NUMERIC(3,2);
BEGIN
  -- Calculate seller stats (when evaluated as seller)
  SELECT 
    COALESCE(AVG(calificacion), 0),
    COUNT(*)
  INTO avg_rating_vendedor, total_reviews_vendedor
  FROM public.reviews_profesional_profesional
  WHERE profesional_evaluado_id = p_profesional_id 
    AND tipo_interaccion IN ('venta', 'colaboracion')
    AND estado_revision = 'activa';

  -- Calculate buyer stats (when evaluated as buyer)
  SELECT 
    COALESCE(AVG(calificacion), 0),
    COUNT(*)
  INTO avg_rating_comprador, total_reviews_comprador
  FROM public.reviews_profesional_profesional
  WHERE profesional_evaluado_id = p_profesional_id 
    AND tipo_interaccion = 'compra'
    AND estado_revision = 'activa';

  -- Determine seller badge
  IF total_reviews_vendedor = 0 THEN
    badge_vendedor_nivel := 'nuevo';
  ELSIF avg_rating_vendedor >= 4.5 AND total_reviews_vendedor >= 10 THEN
    badge_vendedor_nivel := 'elite';
  ELSIF avg_rating_vendedor >= 4.0 AND total_reviews_vendedor >= 5 THEN
    badge_vendedor_nivel := 'confiable';
  ELSIF avg_rating_vendedor >= 3.5 AND total_reviews_vendedor >= 3 THEN
    badge_vendedor_nivel := 'verificado';
  ELSE
    badge_vendedor_nivel := 'basico';
  END IF;

  -- Determine buyer badge
  IF total_reviews_comprador = 0 THEN
    badge_comprador_nivel := 'nuevo';
  ELSIF avg_rating_comprador >= 4.5 AND total_reviews_comprador >= 10 THEN
    badge_comprador_nivel := 'elite';
  ELSIF avg_rating_comprador >= 4.0 AND total_reviews_comprador >= 5 THEN
    badge_comprador_nivel := 'confiable';
  ELSIF avg_rating_comprador >= 3.5 AND total_reviews_comprador >= 3 THEN
    badge_comprador_nivel := 'verificado';
  ELSE
    badge_comprador_nivel := 'basico';
  END IF;

  -- Calculate general reputation (weighted average)
  reputacion_general_calc := CASE
    WHEN (total_reviews_vendedor + total_reviews_comprador) = 0 THEN 0
    ELSE (
      (avg_rating_vendedor * total_reviews_vendedor + avg_rating_comprador * total_reviews_comprador) 
      / (total_reviews_vendedor + total_reviews_comprador)
    )
  END;

  -- Insert or update stats
  INSERT INTO public.stats_profesional_profesional (
    profesional_id,
    calificacion_promedio_vendedor,
    total_reviews_vendedor,
    calificacion_promedio_comprador,
    total_reviews_comprador,
    reputacion_general,
    badge_vendedor,
    badge_comprador
  ) VALUES (
    p_profesional_id,
    avg_rating_vendedor,
    total_reviews_vendedor,
    avg_rating_comprador,
    total_reviews_comprador,
    reputacion_general_calc,
    badge_vendedor_nivel,
    badge_comprador_nivel
  )
  ON CONFLICT (profesional_id) 
  DO UPDATE SET
    calificacion_promedio_vendedor = EXCLUDED.calificacion_promedio_vendedor,
    total_reviews_vendedor = EXCLUDED.total_reviews_vendedor,
    calificacion_promedio_comprador = EXCLUDED.calificacion_promedio_comprador,
    total_reviews_comprador = EXCLUDED.total_reviews_comprador,
    reputacion_general = EXCLUDED.reputacion_general,
    badge_vendedor = EXCLUDED.badge_vendedor,
    badge_comprador = EXCLUDED.badge_comprador,
    updated_at = now();
END;
$function$;

-- 2. Actualizar función actualizar_stats_profesional con search_path fijo
CREATE OR REPLACE FUNCTION public.actualizar_stats_profesional(p_profesional_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  avg_rating NUMERIC(3,2);
  total_reviews_count INTEGER;
  total_ofertas INTEGER;
  ofertas_aceptadas INTEGER;
  badge_nivel TEXT;
BEGIN
  -- Calcular estadísticas
  SELECT 
    COALESCE(AVG(calificacion), 0),
    COUNT(*)
  INTO avg_rating, total_reviews_count
  FROM public.reviews_profesionales
  WHERE profesional_id = p_profesional_id;

  SELECT COUNT(*) INTO total_ofertas
  FROM public.ofertas
  WHERE profesional_id = p_profesional_id;

  SELECT COUNT(*) INTO ofertas_aceptadas
  FROM public.ofertas
  WHERE profesional_id = p_profesional_id AND estado = 'aceptada';

  -- Determinar badge según calificación y reviews
  IF total_reviews_count = 0 THEN
    badge_nivel := 'nuevo';
  ELSIF avg_rating >= 4.5 AND total_reviews_count >= 20 THEN
    badge_nivel := 'elite';
  ELSIF avg_rating >= 4.0 AND total_reviews_count >= 10 THEN
    badge_nivel := 'confiable';
  ELSIF avg_rating >= 3.5 AND total_reviews_count >= 5 THEN
    badge_nivel := 'verificado';
  ELSE
    badge_nivel := 'basico';
  END IF;

  -- Insertar o actualizar estadísticas
  INSERT INTO public.stats_profesionales (
    profesional_id,
    calificacion_promedio,
    total_reviews,
    total_ofertas_enviadas,
    total_ofertas_aceptadas,
    tasa_respuesta,
    badge_confianza
  ) VALUES (
    p_profesional_id,
    avg_rating,
    total_reviews_count,
    total_ofertas,
    ofertas_aceptadas,
    CASE WHEN total_ofertas > 0 THEN (ofertas_aceptadas::NUMERIC / total_ofertas * 100) ELSE 0 END,
    badge_nivel
  )
  ON CONFLICT (profesional_id) 
  DO UPDATE SET
    calificacion_promedio = EXCLUDED.calificacion_promedio,
    total_reviews = EXCLUDED.total_reviews,
    total_ofertas_enviadas = EXCLUDED.total_ofertas_enviadas,
    total_ofertas_aceptadas = EXCLUDED.total_ofertas_aceptadas,
    tasa_respuesta = EXCLUDED.tasa_respuesta,
    badge_confianza = EXCLUDED.badge_confianza,
    updated_at = now();
END;
$function$;