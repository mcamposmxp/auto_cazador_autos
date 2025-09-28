-- Corregir funciones de triggers y otras funciones críticas

-- 1. Actualizar función trigger_actualizar_stats_profesional con search_path fijo
CREATE OR REPLACE FUNCTION public.trigger_actualizar_stats_profesional()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.actualizar_stats_profesional(NEW.profesional_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.actualizar_stats_profesional(OLD.profesional_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 2. Actualizar función trigger_actualizar_stats_profesional_profesional con search_path fijo
CREATE OR REPLACE FUNCTION public.trigger_actualizar_stats_profesional_profesional()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.actualizar_stats_profesional_profesional(NEW.profesional_evaluado_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.actualizar_stats_profesional_profesional(OLD.profesional_evaluado_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- 3. Actualizar función actualizar_elegibilidad_evaluacion con search_path fijo
CREATE OR REPLACE FUNCTION public.actualizar_elegibilidad_evaluacion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Cuando se envía un mensaje, marcar la interacción como elegible para evaluación
  -- y revelar teléfono si es la primera respuesta del profesional
  INSERT INTO public.interacciones_profesionales (
    cliente_id,
    profesional_id,
    oferta_id,
    elegible_evaluacion,
    telefono_revelado
  )
  SELECT 
    av.cliente_id,
    o.profesional_id,
    o.id,
    true, -- Elegible para evaluación
    CASE 
      WHEN NEW.remitente_tipo = 'profesional' THEN true -- Revelar teléfono si profesional responde
      ELSE false
    END
  FROM public.ofertas o
  JOIN public.autos_venta av ON av.id = o.auto_venta_id
  WHERE o.id = NEW.oferta_id
  ON CONFLICT (cliente_id, profesional_id, oferta_id) 
  DO UPDATE SET
    elegible_evaluacion = true,
    telefono_revelado = CASE 
      WHEN NEW.remitente_tipo = 'profesional' THEN true
      ELSE interacciones_profesionales.telefono_revelado
    END,
    updated_at = now();
    
  RETURN NEW;
END;
$function$;

-- 4. Actualizar función actualizar_elegibilidad_evaluacion_b2b con search_path fijo
CREATE OR REPLACE FUNCTION public.actualizar_elegibilidad_evaluacion_b2b()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Crear o actualizar interacción cuando hay un mensaje
  INSERT INTO public.interacciones_profesional_profesional (
    profesional_iniciador_id,
    profesional_receptor_id,
    auto_inventario_id,
    elegible_evaluacion,
    telefono_revelado
  )
  SELECT 
    CASE 
      WHEN NEW.remitente_id = i.profesional_iniciador_id THEN i.profesional_iniciador_id
      ELSE i.profesional_receptor_id
    END,
    CASE 
      WHEN NEW.remitente_id = i.profesional_iniciador_id THEN i.profesional_receptor_id
      ELSE i.profesional_iniciador_id
    END,
    i.auto_inventario_id,
    true,
    true -- Revelar teléfono tras primer intercambio
  FROM public.interacciones_profesional_profesional i
  WHERE i.id = NEW.interaccion_id
  ON CONFLICT (profesional_iniciador_id, profesional_receptor_id, auto_inventario_id) 
  DO UPDATE SET
    elegible_evaluacion = true,
    telefono_revelado = true,
    updated_at = now();
    
  RETURN NEW;
END;
$function$;