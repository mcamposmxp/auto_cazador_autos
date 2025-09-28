-- Corregir las últimas funciones que necesitan search_path fijo

-- 1. Actualizar función verificar_y_revelar_evaluaciones con search_path fijo
CREATE OR REPLACE FUNCTION public.verificar_y_revelar_evaluaciones()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  interaccion_record RECORD;
  total_evaluaciones INTEGER;
  evaluaciones_por_revelar INTEGER;
BEGIN
  -- Buscar interacciones donde se deben revelar evaluaciones
  FOR interaccion_record IN 
    SELECT DISTINCT i.id, i.fecha_limite_evaluacion
    FROM public.interacciones_profesional_profesional i
    WHERE i.evaluaciones_reveladas = false
      AND i.elegible_evaluacion = true
      AND (
        -- Tiempo límite cumplido
        i.fecha_limite_evaluacion < now()
        OR
        -- Ambos profesionales ya evaluaron
        (SELECT COUNT(*) FROM public.evaluaciones_profesional_pendientes ep 
         WHERE ep.interaccion_id = i.id) = 2
      )
  LOOP
    -- Contar evaluaciones pendientes para esta interacción
    SELECT COUNT(*) INTO total_evaluaciones
    FROM public.evaluaciones_profesional_pendientes
    WHERE interaccion_id = interaccion_record.id;
    
    -- Solo revelar si hay al menos una evaluación
    IF total_evaluaciones > 0 THEN
      -- Revelar evaluaciones pendientes
      UPDATE public.evaluaciones_profesional_pendientes
      SET revelada = true, updated_at = now()
      WHERE interaccion_id = interaccion_record.id;
      
      -- Transferir a tabla principal si están reveladas
      INSERT INTO public.reviews_profesional_profesional (
        profesional_evaluador_id,
        profesional_evaluado_id,
        tipo_interaccion,
        calificacion,
        aspectos,
        comentario,
        fecha_transaccion,
        created_at
      )
      SELECT 
        ep.evaluador_id,
        ep.evaluado_id,
        ep.tipo_interaccion,
        ep.calificacion,
        ep.aspectos,
        ep.comentario,
        i.primera_interaccion,
        ep.created_at
      FROM public.evaluaciones_profesional_pendientes ep
      JOIN public.interacciones_profesional_profesional i ON i.id = ep.interaccion_id
      WHERE ep.interaccion_id = interaccion_record.id
        AND ep.revelada = true;
      
      -- Marcar interacción como revelada
      UPDATE public.interacciones_profesional_profesional
      SET evaluaciones_reveladas = true, updated_at = now()
      WHERE id = interaccion_record.id;
      
      -- Eliminar evaluaciones pendientes ya transferidas
      DELETE FROM public.evaluaciones_profesional_pendientes
      WHERE interaccion_id = interaccion_record.id AND revelada = true;
    END IF;
  END LOOP;
END;
$function$;

-- 2. Actualizar función verificar_y_revelar_evaluaciones_cliente_profesional con search_path fijo
CREATE OR REPLACE FUNCTION public.verificar_y_revelar_evaluaciones_cliente_profesional()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  interaccion_record RECORD;
  total_evaluaciones INTEGER;
BEGIN
  -- Buscar interacciones donde se deben revelar evaluaciones
  FOR interaccion_record IN 
    SELECT DISTINCT i.id, i.fecha_limite_evaluacion
    FROM public.interacciones_profesionales i
    WHERE i.evaluaciones_reveladas = false
      AND i.elegible_evaluacion = true
      AND (
        -- Tiempo límite cumplido
        i.fecha_limite_evaluacion < now()
        OR
        -- Ambas partes ya evaluaron (cliente y profesional)
        (SELECT COUNT(*) FROM public.evaluaciones_cliente_profesional_pendientes ecp 
         WHERE ecp.interaccion_id = i.id) = 2
      )
  LOOP
    -- Contar evaluaciones pendientes para esta interacción
    SELECT COUNT(*) INTO total_evaluaciones
    FROM public.evaluaciones_cliente_profesional_pendientes
    WHERE interaccion_id = interaccion_record.id;
    
    -- Solo revelar si hay al menos una evaluación
    IF total_evaluaciones > 0 THEN
      -- Revelar evaluaciones pendientes
      UPDATE public.evaluaciones_cliente_profesional_pendientes
      SET revelada = true, updated_at = now()
      WHERE interaccion_id = interaccion_record.id;
      
      -- Transferir a tabla principal si están reveladas
      INSERT INTO public.reviews_profesionales (
        profesional_id,
        cliente_id,
        oferta_id,
        calificacion,
        aspectos,
        comentario,
        created_at
      )
      SELECT 
        CASE 
          WHEN ecp.tipo_evaluador = 'cliente' THEN ecp.evaluado_id
          ELSE ecp.evaluador_id
        END,
        CASE 
          WHEN ecp.tipo_evaluador = 'cliente' THEN ecp.evaluador_id
          ELSE ecp.evaluado_id
        END,
        i.oferta_id,
        ecp.calificacion,
        ecp.aspectos,
        ecp.comentario,
        ecp.created_at
      FROM public.evaluaciones_cliente_profesional_pendientes ecp
      JOIN public.interacciones_profesionales i ON i.id = ecp.interaccion_id
      WHERE ecp.interaccion_id = interaccion_record.id
        AND ecp.revelada = true
        AND ecp.tipo_evaluador = 'cliente'; -- Solo las evaluaciones del cliente al profesional
      
      -- Marcar interacción como revelada
      UPDATE public.interacciones_profesionales
      SET evaluaciones_reveladas = true, updated_at = now()
      WHERE id = interaccion_record.id;
      
      -- Eliminar evaluaciones pendientes ya transferidas
      DELETE FROM public.evaluaciones_cliente_profesional_pendientes
      WHERE interaccion_id = interaccion_record.id AND revelada = true;
    END IF;
  END LOOP;
END;
$function$;