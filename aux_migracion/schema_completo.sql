

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'moderator',
    'user'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."tipo_negocio" AS ENUM (
    'agencia_nuevos',
    'seminuevos',
    'comerciante'
);


ALTER TYPE "public"."tipo_negocio" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."actualizar_elegibilidad_evaluacion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."actualizar_elegibilidad_evaluacion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."actualizar_elegibilidad_evaluacion_b2b"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."actualizar_elegibilidad_evaluacion_b2b"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."actualizar_stats_profesional"("p_profesional_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."actualizar_stats_profesional"("p_profesional_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."actualizar_stats_profesional_profesional"("p_profesional_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."actualizar_stats_profesional_profesional"("p_profesional_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."aplicar_autoajuste_general"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  config_record RECORD;
  auto_record RECORD;
  nuevo_precio NUMERIC;
  resultado json;
  total_actualizados INTEGER := 0;
  autos_procesados INTEGER := 0;
BEGIN
  -- Obtener todas las configuraciones generales activas
  FOR config_record IN 
    SELECT * FROM config_autoajuste_general 
    WHERE activo = true
  LOOP
    -- Para cada configuración, obtener autos que NO tienen configuración específica
    -- y que SÍ tienen precio_minimo_venta definido (requisito de seguridad)
    FOR auto_record IN
      SELECT api.* 
      FROM autos_profesional_inventario api
      WHERE api.profesional_id = config_record.profesional_id
        AND api.precio_minimo_venta IS NOT NULL  -- REQUISITO: debe tener precio mínimo
        AND api.estado = 'activo'
        AND NOT EXISTS (
          SELECT 1 FROM config_autoajuste_auto caa 
          WHERE caa.profesional_id = api.profesional_id 
            AND caa.auto_id = api.id 
            AND caa.activo = true
        )
    LOOP
      autos_procesados := autos_procesados + 1;
      nuevo_precio := auto_record.precio_actual;
      
      -- Aplicar reglas de demanda (simulación básica)
      IF config_record.demanda_activa THEN
        -- Simular baja demanda y aplicar reducción si corresponde
        IF config_record.demanda_accion_tipo = 'reducir' THEN
          IF config_record.demanda_valor_tipo = 'porcentaje' THEN
            nuevo_precio := nuevo_precio * (1 - config_record.demanda_valor / 100.0);
          ELSE
            nuevo_precio := nuevo_precio - config_record.demanda_valor;
          END IF;
        END IF;
      END IF;
      
      -- Aplicar reglas de tiempo
      IF config_record.tiempo_activa THEN
        -- Si el auto lleva más tiempo que el límite configurado
        IF (EXTRACT(DAYS FROM (NOW() - auto_record.fecha_publicacion)) >= config_record.tiempo_dias_limite) THEN
          IF config_record.tiempo_accion_tipo = 'porcentaje' THEN
            nuevo_precio := nuevo_precio * (1 - config_record.tiempo_accion_valor / 100.0);
          ELSE
            nuevo_precio := nuevo_precio - config_record.tiempo_accion_valor;
          END IF;
        END IF;
      END IF;
      
      -- Aplicar límites de protección
      IF nuevo_precio < auto_record.precio_minimo_venta THEN
        nuevo_precio := auto_record.precio_minimo_venta;
      END IF;
      
      IF auto_record.precio_maximo_venta IS NOT NULL AND nuevo_precio > auto_record.precio_maximo_venta THEN
        nuevo_precio := auto_record.precio_maximo_venta;
      END IF;
      
      -- Solo actualizar si hay cambio significativo (más de $100)
      IF ABS(nuevo_precio - auto_record.precio_actual) > 100 THEN
        -- Registrar el cambio en historial
        INSERT INTO historial_cambios_precios (
          profesional_id,
          auto_id,
          precio_anterior,
          precio_nuevo,
          regla_aplicada,
          detalles_regla
        ) VALUES (
          config_record.profesional_id,
          auto_record.id,
          auto_record.precio_actual,
          nuevo_precio,
          'autoajuste_general',
          json_build_object(
            'demanda_activa', config_record.demanda_activa,
            'tiempo_activa', config_record.tiempo_activa,
            'precio_minimo_respetado', nuevo_precio >= auto_record.precio_minimo_venta
          )
        );
        
        -- Actualizar el precio del auto
        UPDATE autos_profesional_inventario 
        SET precio_actual = nuevo_precio,
            updated_at = NOW()
        WHERE id = auto_record.id;
        
        total_actualizados := total_actualizados + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  resultado := json_build_object(
    'exito', true,
    'autos_procesados', autos_procesados,
    'precios_actualizados', total_actualizados,
    'mensaje', 'Autoajuste general aplicado solo a autos con precio mínimo definido'
  );
  
  RETURN resultado;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'exito', false,
      'error', SQLERRM,
      'mensaje', 'Error al aplicar autoajuste general'
    );
END;
$_$;


ALTER FUNCTION "public"."aplicar_autoajuste_general"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_cache"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.market_data_cache
  WHERE expires_at < now();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_vehicle_cache"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.vehicle_market_cache
  WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_vehicle_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_credits"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_resource_info" "jsonb" DEFAULT '{}'::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_credits integer;
  current_plan text;
  is_admin boolean;
  admin_queries_today integer;
  last_admin_query timestamp with time zone;
  min_interval_seconds integer := 30; -- 30 seconds minimum between admin queries
  max_admin_queries_per_day integer := 20;
BEGIN
  -- Check if user is admin
  SELECT has_role(p_user_id, 'admin'::app_role) INTO is_admin;
  
  -- Handle admin users with special rules
  IF is_admin THEN
    -- Get or create admin daily usage record
    INSERT INTO public.admin_daily_usage (user_id, usage_date, queries_used)
    VALUES (p_user_id, CURRENT_DATE, 0)
    ON CONFLICT (user_id, usage_date) 
    DO NOTHING;
    
    -- Get current admin usage for today
    SELECT queries_used, last_query_time 
    INTO admin_queries_today, last_admin_query
    FROM public.admin_daily_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    -- Check daily limit
    IF admin_queries_today >= max_admin_queries_per_day THEN
      RETURN false;
    END IF;
    
    -- Check rate limiting (minimum interval between queries)
    IF last_admin_query IS NOT NULL AND 
       EXTRACT(EPOCH FROM (now() - last_admin_query)) < min_interval_seconds THEN
      RETURN false;
    END IF;
    
    -- Update admin usage
    UPDATE public.admin_daily_usage
    SET 
      queries_used = queries_used + p_credits,
      last_query_time = now(),
      updated_at = now()
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
    
    -- Register transaction for admin
    INSERT INTO public.credit_transactions (user_id, credits_consumed, action_type, resource_info)
    VALUES (p_user_id, p_credits, p_action_type || '_admin', p_resource_info);
    
    RETURN true;
  END IF;
  
  -- Handle regular users (existing logic with improved reset)
  PERFORM public.reset_monthly_credits();
  
  SELECT credits_available, plan_type INTO current_credits, current_plan
  FROM public.user_credits
  WHERE user_id = p_user_id;
  
  IF current_credits IS NULL THEN
    INSERT INTO public.user_credits (user_id, credits_available, plan_type, monthly_limit)
    VALUES (p_user_id, 5, 'gratuito', 5);
    current_credits := 5;
    current_plan := 'gratuito';
  END IF;
  
  IF current_credits < p_credits THEN
    RETURN false;
  END IF;
  
  UPDATE public.user_credits
  SET 
    credits_available = credits_available - p_credits,
    credits_used_this_month = credits_used_this_month + p_credits,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO public.credit_transactions (user_id, credits_consumed, action_type, resource_info)
  VALUES (p_user_id, p_credits, p_action_type, p_resource_info);
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."consume_credits"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_resource_info" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_credits_typed"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_credit_type" "text" DEFAULT 'search'::"text", "p_resource_info" "jsonb" DEFAULT '{}'::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_credits integer;
  current_plan text;
  is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT has_role(p_user_id, 'admin'::app_role) INTO is_admin;
  
  -- Handle admin users (existing logic)
  IF is_admin THEN
    -- Existing admin logic from original function
    RETURN true;
  END IF;
  
  -- Handle regular users
  PERFORM public.reset_monthly_credits();
  
  SELECT credits_available, plan_type INTO current_credits, current_plan
  FROM public.user_credits
  WHERE user_id = p_user_id;
  
  IF current_credits IS NULL THEN
    INSERT INTO public.user_credits (user_id, credits_available, plan_type, monthly_limit)
    VALUES (p_user_id, 5, 'gratuito', 5);
    current_credits := 5;
  END IF;
  
  IF current_credits < p_credits THEN
    RETURN false;
  END IF;
  
  -- Update credits with type tracking
  IF p_credit_type = 'ad' THEN
    UPDATE public.user_credits
    SET 
      credits_available = credits_available - p_credits,
      credits_used_this_month = credits_used_this_month + p_credits,
      credits_used_ads = credits_used_ads + p_credits,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.user_credits
    SET 
      credits_available = credits_available - p_credits,
      credits_used_this_month = credits_used_this_month + p_credits,
      credits_used_searches = credits_used_searches + p_credits,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Insert transaction record with credit type
  INSERT INTO public.credit_transactions (user_id, credits_consumed, action_type, resource_info)
  VALUES (p_user_id, p_credits, p_action_type || '_' || p_credit_type, p_resource_info);
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."consume_credits_typed"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_credit_type" "text", "p_resource_info" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."evaluar_filtros_vehiculo"("p_profesional_id" "uuid", "p_marca" "text", "p_modelo" "text", "p_ano" integer, "p_kilometraje" integer, "p_precio_estimado" numeric DEFAULT NULL::numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  filtros_record RECORD;
  marca_modelo_item JSONB;
  cumple_marca_modelo BOOLEAN := false;
  cumple_precio BOOLEAN := true;
  cumple_kilometraje BOOLEAN := true;
BEGIN
  -- Obtener filtros del profesional
  SELECT * INTO filtros_record
  FROM profesional_filtros_ofertas
  WHERE profesional_id = p_profesional_id AND activo = true;
  
  -- Si no tiene filtros o no están activos, acepta todo
  IF filtros_record IS NULL OR filtros_record.tipo_filtro = 'todos' THEN
    RETURN true;
  END IF;
  
  -- Evaluar filtros de marca/modelo/año
  IF jsonb_array_length(filtros_record.filtros_vehiculo->'marcas_modelos') > 0 THEN
    FOR marca_modelo_item IN SELECT * FROM jsonb_array_elements(filtros_record.filtros_vehiculo->'marcas_modelos')
    LOOP
      -- Verificar marca
      IF marca_modelo_item->>'marca' = p_marca THEN
        -- Si no hay modelos específicos, acepta cualquier modelo de esta marca
        IF NOT jsonb_path_exists(marca_modelo_item, '$.modelos[*]') OR 
           jsonb_array_length(marca_modelo_item->'modelos') = 0 THEN
          cumple_marca_modelo := true;
        ELSE
          -- Verificar si el modelo está en la lista
          IF marca_modelo_item->'modelos' ? p_modelo THEN
            cumple_marca_modelo := true;
          END IF;
        END IF;
        
        -- Si cumple marca/modelo, verificar año
        IF cumple_marca_modelo AND marca_modelo_item ? 'años' THEN
          IF (marca_modelo_item->'años'->>'min')::INTEGER IS NOT NULL AND 
             p_ano < (marca_modelo_item->'años'->>'min')::INTEGER THEN
            cumple_marca_modelo := false;
          END IF;
          
          IF (marca_modelo_item->'años'->>'max')::INTEGER IS NOT NULL AND 
             p_ano > (marca_modelo_item->'años'->>'max')::INTEGER THEN
            cumple_marca_modelo := false;
          END IF;
        END IF;
        
        -- Si ya cumple con al menos un filtro, salir del loop
        IF cumple_marca_modelo THEN
          EXIT;
        END IF;
      END IF;
    END LOOP;
    
    -- Si no cumple ningún filtro de marca/modelo, rechazar
    IF NOT cumple_marca_modelo THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Evaluar filtro de precio
  IF (filtros_record.filtros_vehiculo->'rango_precio'->>'activo')::BOOLEAN = true AND p_precio_estimado IS NOT NULL THEN
    IF p_precio_estimado < (filtros_record.filtros_vehiculo->'rango_precio'->>'min')::NUMERIC OR
       p_precio_estimado > (filtros_record.filtros_vehiculo->'rango_precio'->>'max')::NUMERIC THEN
      cumple_precio := false;
    END IF;
  END IF;
  
  -- Evaluar filtro de kilometraje
  IF (filtros_record.filtros_vehiculo->'rango_kilometraje'->>'activo')::BOOLEAN = true THEN
    IF p_kilometraje < (filtros_record.filtros_vehiculo->'rango_kilometraje'->>'min')::INTEGER OR
       p_kilometraje > (filtros_record.filtros_vehiculo->'rango_kilometraje'->>'max')::INTEGER THEN
      cumple_kilometraje := false;
    END IF;
  END IF;
  
  RETURN cumple_precio AND cumple_kilometraje;
END;
$_$;


ALTER FUNCTION "public"."evaluar_filtros_vehiculo"("p_profesional_id" "uuid", "p_marca" "text", "p_modelo" "text", "p_ano" integer, "p_kilometraje" integer, "p_precio_estimado" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_weekly_ad_credit"("p_user_id" "uuid", "p_vehicle_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  week_start DATE;
  existing_record UUID;
BEGIN
  -- Get the start of current week (Monday)
  week_start := date_trunc('week', CURRENT_DATE);
  
  -- Check if record already exists for this week
  SELECT id INTO existing_record
  FROM weekly_ad_credits
  WHERE user_id = p_user_id 
    AND vehicle_id = p_vehicle_id 
    AND week_start = week_start;
  
  -- If record exists, no credit consumption needed
  IF existing_record IS NOT NULL THEN
    RETURN true;
  END IF;
  
  -- Consume credit for this week's ad view
  IF consume_credits_typed(p_user_id, 1, 'weekly_ad_view', 'ad', 
    jsonb_build_object('vehicle_id', p_vehicle_id, 'week_start', week_start)) THEN
    
    -- Insert weekly record
    INSERT INTO weekly_ad_credits (user_id, vehicle_id, week_start)
    VALUES (p_user_id, p_vehicle_id, week_start);
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."get_or_create_weekly_ad_credit"("p_user_id" "uuid", "p_vehicle_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_user_credits"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits_available, plan_type, monthly_limit)
  VALUES (NEW.id, 5, 'gratuito', 5)
  ON CONFLICT (user_id) DO UPDATE SET
    -- For existing users, ensure free accounts don't exceed monthly limit
    credits_available = CASE 
      WHEN user_credits.plan_type = 'gratuito' THEN LEAST(user_credits.credits_available, user_credits.monthly_limit)
      ELSE user_credits.credits_available
    END;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_user_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_monthly_credits"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    credits_used_this_month = 0,
    credits_used_ads = 0,
    credits_used_searches = 0,
    evaluation_credits_this_month = 0,
    credits_available = CASE 
      WHEN plan_type = 'gratuito' THEN monthly_limit
      ELSE GREATEST(credits_available, monthly_limit)
    END,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;


ALTER FUNCTION "public"."reset_monthly_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_monthly_referral_credits"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.user_credits 
  SET 
    referrals_count_this_month = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$;


ALTER FUNCTION "public"."reset_monthly_referral_credits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_actualizar_stats_profesional"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."trigger_actualizar_stats_profesional"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_actualizar_stats_profesional_profesional"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."trigger_actualizar_stats_profesional_profesional"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verificar_y_revelar_evaluaciones"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."verificar_y_revelar_evaluaciones"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verificar_y_revelar_evaluaciones_cliente_profesional"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."verificar_y_revelar_evaluaciones_cliente_profesional"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_daily_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "usage_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "queries_used" integer DEFAULT 0,
    "last_query_time" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_daily_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."anuncios_similares" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "anuncio_1_id" "uuid",
    "anuncio_2_id" "uuid",
    "tipo_similitud" "text" NOT NULL,
    "score_similitud" numeric(3,2) NOT NULL,
    "detalles" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "anuncios_similares_tipo_similitud_check" CHECK (("tipo_similitud" = ANY (ARRAY['exacto'::"text", 'fuzzy_text'::"text", 'imagen'::"text", 'datos_principales'::"text"])))
);


ALTER TABLE "public"."anuncios_similares" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."anuncios_vehiculos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "url_anuncio" "text" NOT NULL,
    "sitio_web" "text" NOT NULL,
    "titulo" "text" NOT NULL,
    "precio" numeric(12,2),
    "precio_original" "text",
    "marca" "text",
    "modelo" "text",
    "ano" integer,
    "kilometraje" integer,
    "kilometraje_original" "text",
    "combustible" "text",
    "transmision" "text",
    "tipo_vehiculo" "text",
    "color" "text",
    "descripcion" "text",
    "ubicacion" "text",
    "telefono" "text",
    "email" "text",
    "imagenes" "jsonb" DEFAULT '[]'::"jsonb",
    "caracteristicas" "jsonb" DEFAULT '{}'::"jsonb",
    "datos_raw" "jsonb" DEFAULT '{}'::"jsonb",
    "hash_contenido" "text",
    "estado_normalizacion" "text" DEFAULT 'pendiente'::"text",
    "fecha_extraccion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_actualizacion" timestamp with time zone,
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "anuncios_vehiculos_estado_normalizacion_check" CHECK (("estado_normalizacion" = ANY (ARRAY['pendiente'::"text", 'procesado'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."anuncios_vehiculos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_tokens" (
    "id" "text" NOT NULL,
    "seller_id" bigint,
    "token" "text",
    "refresh_token" "text",
    "expiration_date" timestamp with time zone
);


ALTER TABLE "public"."api_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autos_profesional_inventario" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "marca" "text" NOT NULL,
    "modelo" "text" NOT NULL,
    "ano" integer NOT NULL,
    "precio_actual" numeric NOT NULL,
    "precio_original" numeric,
    "precio_minimo" numeric,
    "precio_maximo" numeric,
    "kilometraje" integer NOT NULL,
    "estado" "text" DEFAULT 'activo'::"text" NOT NULL,
    "imagen_url" "text",
    "descripcion" "text",
    "ubicacion" "text",
    "caracteristicas" "jsonb" DEFAULT '{}'::"jsonb",
    "fecha_publicacion" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "precio_minimo_venta" numeric,
    "precio_maximo_venta" numeric
);


ALTER TABLE "public"."autos_profesional_inventario" OWNER TO "postgres";


COMMENT ON COLUMN "public"."autos_profesional_inventario"."precio_minimo_venta" IS 'Precio mínimo de venta definido por el profesional. Los ajustes automáticos no reducirán el precio por debajo de este valor.';



COMMENT ON COLUMN "public"."autos_profesional_inventario"."precio_maximo_venta" IS 'Precio máximo de venta definido por el profesional (opcional). Los ajustes automáticos no aumentarán el precio por encima de este valor.';



CREATE TABLE IF NOT EXISTS "public"."autos_venta" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cliente_id" "uuid" NOT NULL,
    "marca" "text" NOT NULL,
    "ano" integer NOT NULL,
    "modelo" "text" NOT NULL,
    "version" "text",
    "kilometraje" integer NOT NULL,
    "servicios_agencia" boolean NOT NULL,
    "documentos_orden" boolean NOT NULL,
    "comentarios_documentos" "text",
    "estado_auto" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "comentarios_estado" "text",
    "recibiendo_ofertas" boolean DEFAULT true NOT NULL,
    CONSTRAINT "autos_venta_estado_auto_check" CHECK (("estado_auto" = ANY (ARRAY['excelente'::"text", 'bueno'::"text", 'regular'::"text", 'con_detalles'::"text"])))
);


ALTER TABLE "public"."autos_venta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre_apellido" "text" NOT NULL,
    "correo_electronico" "text" NOT NULL,
    "numero_telefonico" "text" NOT NULL,
    "estado" "text" NOT NULL,
    "ciudad" "text" NOT NULL,
    "preferencia_contacto" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "clientes_preferencia_contacto_check" CHECK (("preferencia_contacto" = ANY (ARRAY['correo'::"text", 'telefono'::"text", 'whatsapp'::"text"])))
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."config_autoajuste_auto" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "auto_id" "uuid" NOT NULL,
    "activo" boolean DEFAULT false NOT NULL,
    "precio_inicial" numeric(10,2) NOT NULL,
    "precio_minimo" numeric(10,2),
    "precio_maximo" numeric(10,2),
    "demanda_activa" boolean DEFAULT false,
    "demanda_dias_evaluar" integer DEFAULT 7,
    "tiempo_activa" boolean DEFAULT false,
    "tiempo_dias_limite" integer DEFAULT 20,
    "tiempo_accion_tipo" "text",
    "tiempo_accion_valor" numeric(10,2),
    "calendario_activa" boolean DEFAULT false,
    "calendario_frecuencia" "text",
    "calendario_fecha_inicio" "date",
    "calendario_fecha_fin" "date",
    "calendario_accion_tipo" "text",
    "calendario_accion_valor" numeric(10,2),
    "calendario_es_aumento" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "demanda_umbral_tipo" "text" DEFAULT 'menos_de'::"text",
    "demanda_contactos_umbral" integer DEFAULT 5,
    "demanda_accion_tipo" "text" DEFAULT 'reducir'::"text",
    "demanda_valor_tipo" "text" DEFAULT 'porcentaje'::"text",
    "demanda_valor" numeric DEFAULT 2,
    "calendario_precio_objetivo" numeric,
    "calendario_precio_final_tipo" "text" DEFAULT 'valor_directo'::"text",
    "calendario_precio_final_valor" numeric,
    "tiempo_es_aumento" boolean DEFAULT false,
    CONSTRAINT "chk_auto_precios_validos" CHECK ((("precio_maximo" IS NULL) OR ("precio_minimo" IS NULL) OR ("precio_maximo" >= "precio_minimo"))),
    CONSTRAINT "config_autoajuste_auto_calendario_accion_tipo_check" CHECK (("calendario_accion_tipo" = ANY (ARRAY['fijo'::"text", 'porcentaje'::"text", 'manual'::"text"]))),
    CONSTRAINT "config_autoajuste_auto_calendario_frecuencia_check" CHECK (("calendario_frecuencia" = ANY (ARRAY['diario'::"text", 'semanal'::"text", 'quincenal'::"text", 'mensual'::"text", 'personalizado'::"text"]))),
    CONSTRAINT "config_autoajuste_auto_calendario_precio_final_tipo_check" CHECK (("calendario_precio_final_tipo" = ANY (ARRAY['fijo'::"text", 'porcentaje'::"text", 'manual'::"text"]))),
    CONSTRAINT "config_autoajuste_auto_tiempo_accion_tipo_check" CHECK (("tiempo_accion_tipo" = ANY (ARRAY['fijo'::"text", 'porcentaje'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."config_autoajuste_auto" OWNER TO "postgres";


COMMENT ON COLUMN "public"."config_autoajuste_auto"."calendario_precio_objetivo" IS 'Precio específico que el auto tendrá durante el periodo programado';



COMMENT ON COLUMN "public"."config_autoajuste_auto"."calendario_precio_final_tipo" IS 'Tipo de precio al final del periodo: valor_directo, porcentaje, o fijo (volver al precio inicial)';



COMMENT ON COLUMN "public"."config_autoajuste_auto"."calendario_precio_final_valor" IS 'Valor del precio final según el tipo especificado';



CREATE TABLE IF NOT EXISTS "public"."config_autoajuste_general" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "activo" boolean DEFAULT false NOT NULL,
    "precio_minimo" numeric(10,2),
    "precio_maximo" numeric(10,2),
    "demanda_activa" boolean DEFAULT false,
    "demanda_dias_evaluar" integer DEFAULT 7,
    "tiempo_activa" boolean DEFAULT false,
    "tiempo_dias_limite" integer DEFAULT 20,
    "tiempo_accion_tipo" "text",
    "tiempo_accion_valor" numeric(10,2),
    "calendario_activa" boolean DEFAULT false,
    "calendario_frecuencia" "text",
    "calendario_fecha_inicio" "date",
    "calendario_fecha_fin" "date",
    "calendario_accion_tipo" "text",
    "calendario_accion_valor" numeric(10,2),
    "calendario_es_aumento" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "demanda_umbral_tipo" "text" DEFAULT 'menos_de'::"text",
    "demanda_contactos_umbral" integer DEFAULT 5,
    "demanda_accion_tipo" "text" DEFAULT 'reducir'::"text",
    "demanda_valor_tipo" "text" DEFAULT 'porcentaje'::"text",
    "demanda_valor" numeric DEFAULT 2,
    CONSTRAINT "chk_general_precios_validos" CHECK ((("precio_maximo" IS NULL) OR ("precio_minimo" IS NULL) OR ("precio_maximo" >= "precio_minimo"))),
    CONSTRAINT "config_autoajuste_general_calendario_accion_tipo_check" CHECK (("calendario_accion_tipo" = ANY (ARRAY['fijo'::"text", 'porcentaje'::"text"]))),
    CONSTRAINT "config_autoajuste_general_calendario_frecuencia_check" CHECK (("calendario_frecuencia" = ANY (ARRAY['diario'::"text", 'semanal'::"text", 'quincenal'::"text", 'mensual'::"text", 'personalizado'::"text"]))),
    CONSTRAINT "config_autoajuste_general_tiempo_accion_tipo_check" CHECK (("tiempo_accion_tipo" = ANY (ARRAY['fijo'::"text", 'porcentaje'::"text"])))
);


ALTER TABLE "public"."config_autoajuste_general" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuracion_extraccion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sitio_web" "text" NOT NULL,
    "activo" boolean DEFAULT true,
    "selectores" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "headers" "jsonb" DEFAULT '{}'::"jsonb",
    "delay_entre_requests" integer DEFAULT 2000,
    "max_requests_por_minuto" integer DEFAULT 30,
    "user_agents" "jsonb" DEFAULT '[]'::"jsonb",
    "proxies" "jsonb" DEFAULT '[]'::"jsonb",
    "ultima_extraccion" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."configuracion_extraccion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "credits_consumed" integer NOT NULL,
    "action_type" "text" NOT NULL,
    "resource_info" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estadisticas_extraccion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sesion_id" "uuid" NOT NULL,
    "total_urls_objetivo" integer DEFAULT 0,
    "total_urls_extraidas" integer DEFAULT 0,
    "total_anuncios_procesados" integer DEFAULT 0,
    "total_anuncios_nuevos" integer DEFAULT 0,
    "total_anuncios_actualizados" integer DEFAULT 0,
    "total_errores" integer DEFAULT 0,
    "tiempo_estimado_restante" integer,
    "porcentaje_completado" numeric(5,2) DEFAULT 0,
    "estado_general" "text" DEFAULT 'iniciando'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."estadisticas_extraccion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluaciones_cliente_profesional_pendientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interaccion_id" "uuid" NOT NULL,
    "evaluador_id" "uuid" NOT NULL,
    "evaluado_id" "uuid" NOT NULL,
    "tipo_evaluador" "text" NOT NULL,
    "calificacion" integer NOT NULL,
    "aspectos" "jsonb" DEFAULT '{}'::"jsonb",
    "comentario" "text",
    "fecha_evaluacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revelada" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "evaluaciones_cliente_profesional_pendiente_tipo_evaluador_check" CHECK (("tipo_evaluador" = ANY (ARRAY['cliente'::"text", 'profesional'::"text"]))),
    CONSTRAINT "evaluaciones_cliente_profesional_pendientes_calificacion_check" CHECK ((("calificacion" >= 1) AND ("calificacion" <= 5)))
);


ALTER TABLE "public"."evaluaciones_cliente_profesional_pendientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluaciones_profesional_pendientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interaccion_id" "uuid" NOT NULL,
    "evaluador_id" "uuid" NOT NULL,
    "evaluado_id" "uuid" NOT NULL,
    "tipo_interaccion" "text" NOT NULL,
    "calificacion" integer NOT NULL,
    "aspectos" "jsonb" DEFAULT '{}'::"jsonb",
    "comentario" "text",
    "fecha_evaluacion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revelada" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "evaluaciones_profesional_pendientes_calificacion_check" CHECK ((("calificacion" >= 1) AND ("calificacion" <= 5))),
    CONSTRAINT "evaluaciones_profesional_pendientes_tipo_interaccion_check" CHECK (("tipo_interaccion" = ANY (ARRAY['compra'::"text", 'venta'::"text"])))
);

ALTER TABLE ONLY "public"."evaluaciones_profesional_pendientes" REPLICA IDENTITY FULL;


ALTER TABLE "public"."evaluaciones_profesional_pendientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluation_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "interaction_id" "uuid" NOT NULL,
    "credits_awarded" integer DEFAULT 2 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "evaluation_rewards_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['cliente_profesional'::"text", 'profesional_profesional'::"text"])))
);


ALTER TABLE "public"."evaluation_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historial_cambios_precios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "auto_id" "uuid" NOT NULL,
    "precio_anterior" numeric(10,2) NOT NULL,
    "precio_nuevo" numeric(10,2) NOT NULL,
    "regla_aplicada" "text" NOT NULL,
    "detalles_regla" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."historial_cambios_precios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."historico_ventas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "marca" "text" NOT NULL,
    "modelo" "text" NOT NULL,
    "ano" integer NOT NULL,
    "precio_inicial" numeric NOT NULL,
    "precio_venta" numeric NOT NULL,
    "fecha_publicacion" timestamp with time zone NOT NULL,
    "fecha_venta" timestamp with time zone NOT NULL,
    "dias_en_mercado" integer GENERATED ALWAYS AS (EXTRACT(days FROM ("fecha_venta" - "fecha_publicacion"))) STORED,
    "kilometraje" integer,
    "ubicacion" "text",
    "tipo_vendedor" "text" DEFAULT 'profesional'::"text" NOT NULL,
    "caracteristicas" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."historico_ventas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interacciones_profesional_profesional" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_iniciador_id" "uuid" NOT NULL,
    "profesional_receptor_id" "uuid" NOT NULL,
    "auto_inventario_id" "uuid" NOT NULL,
    "primera_interaccion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "telefono_revelado" boolean DEFAULT false NOT NULL,
    "elegible_evaluacion" boolean DEFAULT false NOT NULL,
    "fecha_limite_evaluacion" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "evaluaciones_completadas" boolean DEFAULT false NOT NULL,
    "evaluaciones_reveladas" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."interacciones_profesional_profesional" REPLICA IDENTITY FULL;


ALTER TABLE "public"."interacciones_profesional_profesional" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interacciones_profesionales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cliente_id" "uuid" NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "oferta_id" "uuid" NOT NULL,
    "primera_interaccion" timestamp with time zone DEFAULT "now"() NOT NULL,
    "telefono_revelado" boolean DEFAULT false NOT NULL,
    "elegible_evaluacion" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_limite_evaluacion" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "evaluaciones_reveladas" boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY "public"."interacciones_profesionales" REPLICA IDENTITY FULL;


ALTER TABLE "public"."interacciones_profesionales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logs_extraccion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sitio_web" "text" NOT NULL,
    "url" "text" NOT NULL,
    "estado" "text" NOT NULL,
    "mensaje" "text",
    "tiempo_respuesta" integer,
    "ip_utilizada" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "logs_extraccion_estado_check" CHECK (("estado" = ANY (ARRAY['exito'::"text", 'error'::"text", 'bloqueado'::"text", 'timeout'::"text"])))
);


ALTER TABLE "public"."logs_extraccion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marcas_normalizadas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "marca_original" "text" NOT NULL,
    "marca_normalizada" "text" NOT NULL,
    "confianza" numeric(3,2) DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."marcas_normalizadas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."market_data_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cache_key" "text" NOT NULL,
    "market_data" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."market_data_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mensajes_ofertas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "oferta_id" "uuid" NOT NULL,
    "remitente_tipo" "text" NOT NULL,
    "remitente_id" "uuid" NOT NULL,
    "mensaje" "text" NOT NULL,
    "leido" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mensajes_ofertas_remitente_tipo_check" CHECK (("remitente_tipo" = ANY (ARRAY['cliente'::"text", 'profesional'::"text"])))
);

ALTER TABLE ONLY "public"."mensajes_ofertas" REPLICA IDENTITY FULL;


ALTER TABLE "public"."mensajes_ofertas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mensajes_profesional_profesional" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interaccion_id" "uuid" NOT NULL,
    "remitente_id" "uuid" NOT NULL,
    "mensaje" "text" NOT NULL,
    "leido" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."mensajes_profesional_profesional" REPLICA IDENTITY FULL;


ALTER TABLE "public"."mensajes_profesional_profesional" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modelos_normalizados" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "marca_id" "uuid",
    "modelo_original" "text" NOT NULL,
    "modelo_normalizado" "text" NOT NULL,
    "confianza" numeric(3,2) DEFAULT 1.0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."modelos_normalizados" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notificaciones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "titulo" "text" NOT NULL,
    "mensaje" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "leida" boolean DEFAULT false NOT NULL,
    "es_global" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notificaciones_tipo_check" CHECK (("tipo" = ANY (ARRAY['info'::"text", 'success'::"text", 'warning'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."notificaciones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ofertas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auto_venta_id" "uuid" NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "monto_oferta" numeric NOT NULL,
    "comentarios" "text",
    "estado" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "monto_min" numeric,
    "monto_max" numeric,
    "preferente" boolean DEFAULT false NOT NULL,
    CONSTRAINT "ofertas_estado_check" CHECK (("estado" = ANY (ARRAY['pendiente'::"text", 'aceptada'::"text", 'rechazada'::"text"])))
);


ALTER TABLE "public"."ofertas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profesional_filtros_ofertas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "activo" boolean DEFAULT false NOT NULL,
    "tipo_filtro" "text" DEFAULT 'todos'::"text" NOT NULL,
    "filtros_vehiculo" "jsonb" DEFAULT '{"rango_precio": {"max": 2000000, "min": 0, "activo": false}, "marcas_modelos": [], "rango_kilometraje": {"max": 300000, "min": 0, "activo": false}}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profesional_filtros_ofertas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profesionales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "negocio_nombre" "text" NOT NULL,
    "razon_social" "text" NOT NULL,
    "rfc" "text" NOT NULL,
    "tipo_negocio" "public"."tipo_negocio" NOT NULL,
    "direccion_calle" "text",
    "direccion_numero" "text",
    "direccion_estado" "text",
    "direccion_ciudad" "text",
    "direccion_cp" "text",
    "representante_legal" "text",
    "contacto_principal" "text",
    "telefono" "text",
    "correo" "text",
    "activo" boolean DEFAULT true NOT NULL,
    "pausado" boolean DEFAULT false NOT NULL,
    "notas" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profesionales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nombre" "text" NOT NULL,
    "apellido" "text" NOT NULL,
    "telefono_movil" "text" NOT NULL,
    "telefono_secundario" "text",
    "correo_electronico" "text" NOT NULL,
    "tipo_usuario" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "negocio_nombre" "text",
    "reputacion" numeric,
    "ubicacion_ciudad" "text",
    "ubicacion_estado" "text",
    "contacto_nombre" "text",
    "contacto_telefono" "text",
    CONSTRAINT "profiles_tipo_usuario_check" CHECK (("tipo_usuario" = ANY (ARRAY['particular'::"text", 'profesional'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."progreso_extraccion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sesion_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "estrategia" "text" NOT NULL,
    "parametro" "text" NOT NULL,
    "estado" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "urls_extraidas" integer DEFAULT 0,
    "anuncios_procesados" integer DEFAULT 0,
    "paginas_procesadas" integer DEFAULT 0,
    "errores_count" integer DEFAULT 0,
    "tiempo_inicio" timestamp with time zone,
    "tiempo_fin" timestamp with time zone,
    "detalles" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."progreso_extraccion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "uses_count" integer DEFAULT 0 NOT NULL,
    "max_uses" integer DEFAULT 5 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."referral_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews_profesional_profesional" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_evaluador_id" "uuid" NOT NULL,
    "profesional_evaluado_id" "uuid" NOT NULL,
    "transaccion_id" "uuid",
    "tipo_interaccion" "text" DEFAULT 'compra'::"text" NOT NULL,
    "calificacion" integer NOT NULL,
    "comentario" "text",
    "aspectos" "jsonb" DEFAULT '{}'::"jsonb",
    "evidencia_transaccion" "jsonb" DEFAULT '{}'::"jsonb",
    "estado_revision" "text" DEFAULT 'activa'::"text",
    "fecha_transaccion" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_profesional_profesional_calificacion_check" CHECK ((("calificacion" >= 1) AND ("calificacion" <= 5))),
    CONSTRAINT "reviews_profesional_profesional_check" CHECK (("profesional_evaluador_id" <> "profesional_evaluado_id")),
    CONSTRAINT "reviews_profesional_profesional_check1" CHECK (("fecha_transaccion" <= "created_at"))
);


ALTER TABLE "public"."reviews_profesional_profesional" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews_profesionales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "cliente_id" "uuid" NOT NULL,
    "oferta_id" "uuid" NOT NULL,
    "calificacion" integer NOT NULL,
    "comentario" "text",
    "aspectos" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_profesionales_calificacion_check" CHECK ((("calificacion" >= 1) AND ("calificacion" <= 5)))
);


ALTER TABLE "public"."reviews_profesionales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."solicitudes_paquetes_personalizados" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "nombre_empresa" "text" NOT NULL,
    "nombre_contacto" "text" NOT NULL,
    "email_contacto" "text" NOT NULL,
    "telefono_contacto" "text" NOT NULL,
    "numero_consultas_estimadas" integer NOT NULL,
    "tipo_negocio" "text" NOT NULL,
    "detalles_necesidades" "text",
    "presupuesto_estimado" "text",
    "estado" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "notas_admin" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."solicitudes_paquetes_personalizados" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stats_profesional_profesional" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "calificacion_promedio_vendedor" numeric(3,2) DEFAULT 0,
    "total_reviews_vendedor" integer DEFAULT 0,
    "calificacion_promedio_comprador" numeric(3,2) DEFAULT 0,
    "total_reviews_comprador" integer DEFAULT 0,
    "reputacion_general" numeric(3,2) DEFAULT 0,
    "badge_vendedor" "text" DEFAULT 'nuevo'::"text",
    "badge_comprador" "text" DEFAULT 'nuevo'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stats_profesional_profesional" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stats_profesionales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profesional_id" "uuid" NOT NULL,
    "calificacion_promedio" numeric(3,2) DEFAULT 0,
    "total_reviews" integer DEFAULT 0,
    "total_ofertas_enviadas" integer DEFAULT 0,
    "total_ofertas_aceptadas" integer DEFAULT 0,
    "tasa_respuesta" numeric(5,2) DEFAULT 0,
    "badge_confianza" "text" DEFAULT 'nuevo'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stats_profesionales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subasta_autos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vendedor_nombre" "text" NOT NULL,
    "vendedor_correo" "text" NOT NULL,
    "vendedor_telefono" "text" NOT NULL,
    "estado" "text",
    "ciudad" "text",
    "preferencia_contacto" "text",
    "marca" "text" NOT NULL,
    "modelo" "text" NOT NULL,
    "version" "text",
    "ano" integer NOT NULL,
    "kilometraje" integer NOT NULL,
    "servicios_agencia" boolean NOT NULL,
    "documentos_orden" boolean NOT NULL,
    "comentarios_documentos" "text",
    "estado_auto" "text" NOT NULL,
    "comentarios_estado" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_registro" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subasta_autos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "credits_available" integer DEFAULT 5 NOT NULL,
    "credits_used_this_month" integer DEFAULT 0 NOT NULL,
    "plan_type" "text" DEFAULT 'gratuito'::"text" NOT NULL,
    "plan_expires_at" timestamp with time zone,
    "monthly_limit" integer DEFAULT 5 NOT NULL,
    "last_reset_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "credits_used_ads" integer DEFAULT 0,
    "credits_used_searches" integer DEFAULT 0,
    "credits_earned_evaluations" integer DEFAULT 0,
    "evaluation_credits_this_month" integer DEFAULT 0,
    "credits_earned_referrals" integer DEFAULT 0,
    "referrals_count_this_month" integer DEFAULT 0
);


ALTER TABLE "public"."user_credits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "new_offers" boolean DEFAULT true NOT NULL,
    "price_alerts" boolean DEFAULT true NOT NULL,
    "market_updates" boolean DEFAULT false NOT NULL,
    "system_updates" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referee_id" "uuid" NOT NULL,
    "referral_code" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "credits_awarded" integer DEFAULT 0 NOT NULL,
    "referee_first_action_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_market_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vehicle_key" "text" NOT NULL,
    "market_data" "jsonb" NOT NULL,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_market_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendedores_ayuda" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "vendedor_nombre" "text" NOT NULL,
    "vendedor_correo" "text" NOT NULL,
    "vendedor_telefono" "text" NOT NULL,
    "ciudad" "text",
    "estado" "text",
    "preferencia_contacto" "text",
    "marca" "text" NOT NULL,
    "modelo" "text" NOT NULL,
    "version" "text",
    "ano" integer NOT NULL,
    "kilometraje" integer DEFAULT 0 NOT NULL,
    "servicios_agencia" boolean DEFAULT false NOT NULL,
    "documentos_orden" boolean DEFAULT true NOT NULL,
    "estado_auto" "text" NOT NULL,
    "fecha_registro" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vendedores_ayuda" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_ad_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "week_start" "date" NOT NULL,
    "credits_consumed" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."weekly_ad_credits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_daily_usage"
    ADD CONSTRAINT "admin_daily_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_daily_usage"
    ADD CONSTRAINT "admin_daily_usage_user_id_usage_date_key" UNIQUE ("user_id", "usage_date");



ALTER TABLE ONLY "public"."anuncios_similares"
    ADD CONSTRAINT "anuncios_similares_anuncio_1_id_anuncio_2_id_tipo_similitud_key" UNIQUE ("anuncio_1_id", "anuncio_2_id", "tipo_similitud");



ALTER TABLE ONLY "public"."anuncios_similares"
    ADD CONSTRAINT "anuncios_similares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anuncios_vehiculos"
    ADD CONSTRAINT "anuncios_vehiculos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anuncios_vehiculos"
    ADD CONSTRAINT "anuncios_vehiculos_url_anuncio_key" UNIQUE ("url_anuncio");



ALTER TABLE ONLY "public"."api_tokens"
    ADD CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autos_profesional_inventario"
    ADD CONSTRAINT "autos_profesional_inventario_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."autos_venta"
    ADD CONSTRAINT "autos_venta_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."config_autoajuste_auto"
    ADD CONSTRAINT "config_autoajuste_auto_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."config_autoajuste_auto"
    ADD CONSTRAINT "config_autoajuste_auto_profesional_id_auto_id_key" UNIQUE ("profesional_id", "auto_id");



ALTER TABLE ONLY "public"."config_autoajuste_general"
    ADD CONSTRAINT "config_autoajuste_general_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracion_extraccion"
    ADD CONSTRAINT "configuracion_extraccion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuracion_extraccion"
    ADD CONSTRAINT "configuracion_extraccion_sitio_web_key" UNIQUE ("sitio_web");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estadisticas_extraccion"
    ADD CONSTRAINT "estadisticas_extraccion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluaciones_cliente_profesional_pendientes"
    ADD CONSTRAINT "evaluaciones_cliente_profesional_pendientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluaciones_profesional_pendientes"
    ADD CONSTRAINT "evaluaciones_profesional_pendie_interaccion_id_evaluador_id_key" UNIQUE ("interaccion_id", "evaluador_id");



ALTER TABLE ONLY "public"."evaluaciones_profesional_pendientes"
    ADD CONSTRAINT "evaluaciones_profesional_pendientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_rewards"
    ADD CONSTRAINT "evaluation_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_rewards"
    ADD CONSTRAINT "evaluation_rewards_user_id_interaction_type_interaction_id_key" UNIQUE ("user_id", "interaction_type", "interaction_id");



ALTER TABLE ONLY "public"."historial_cambios_precios"
    ADD CONSTRAINT "historial_cambios_precios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."historico_ventas"
    ADD CONSTRAINT "historico_ventas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interacciones_profesional_profesional"
    ADD CONSTRAINT "interacciones_profesional_pro_profesional_iniciador_id_prof_key" UNIQUE ("profesional_iniciador_id", "profesional_receptor_id", "auto_inventario_id");



ALTER TABLE ONLY "public"."interacciones_profesional_profesional"
    ADD CONSTRAINT "interacciones_profesional_profesional_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interacciones_profesionales"
    ADD CONSTRAINT "interacciones_profesionales_cliente_id_profesional_id_ofert_key" UNIQUE ("cliente_id", "profesional_id", "oferta_id");



ALTER TABLE ONLY "public"."interacciones_profesionales"
    ADD CONSTRAINT "interacciones_profesionales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logs_extraccion"
    ADD CONSTRAINT "logs_extraccion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marcas_normalizadas"
    ADD CONSTRAINT "marcas_normalizadas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."market_data_cache"
    ADD CONSTRAINT "market_data_cache_cache_key_key" UNIQUE ("cache_key");



ALTER TABLE ONLY "public"."market_data_cache"
    ADD CONSTRAINT "market_data_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mensajes_ofertas"
    ADD CONSTRAINT "mensajes_ofertas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mensajes_profesional_profesional"
    ADD CONSTRAINT "mensajes_profesional_profesional_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modelos_normalizados"
    ADD CONSTRAINT "modelos_normalizados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notificaciones"
    ADD CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ofertas"
    ADD CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profesional_filtros_ofertas"
    ADD CONSTRAINT "profesional_filtros_ofertas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profesional_filtros_ofertas"
    ADD CONSTRAINT "profesional_filtros_ofertas_profesional_id_key" UNIQUE ("profesional_id");



ALTER TABLE ONLY "public"."profesionales"
    ADD CONSTRAINT "profesionales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profesionales"
    ADD CONSTRAINT "profesionales_rfc_key" UNIQUE ("rfc");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."progreso_extraccion"
    ADD CONSTRAINT "progreso_extraccion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews_profesional_profesional"
    ADD CONSTRAINT "reviews_profesional_profesion_profesional_evaluador_id_prof_key" UNIQUE ("profesional_evaluador_id", "profesional_evaluado_id", "transaccion_id");



ALTER TABLE ONLY "public"."reviews_profesional_profesional"
    ADD CONSTRAINT "reviews_profesional_profesional_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews_profesionales"
    ADD CONSTRAINT "reviews_profesionales_cliente_id_oferta_id_key" UNIQUE ("cliente_id", "oferta_id");



ALTER TABLE ONLY "public"."reviews_profesionales"
    ADD CONSTRAINT "reviews_profesionales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."solicitudes_paquetes_personalizados"
    ADD CONSTRAINT "solicitudes_paquetes_personalizados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stats_profesional_profesional"
    ADD CONSTRAINT "stats_profesional_profesional_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stats_profesional_profesional"
    ADD CONSTRAINT "stats_profesional_profesional_profesional_id_key" UNIQUE ("profesional_id");



ALTER TABLE ONLY "public"."stats_profesionales"
    ADD CONSTRAINT "stats_profesionales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stats_profesionales"
    ADD CONSTRAINT "stats_profesionales_profesional_id_key" UNIQUE ("profesional_id");



ALTER TABLE ONLY "public"."subasta_autos"
    ADD CONSTRAINT "subasta_autos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notification_preferences"
    ADD CONSTRAINT "unique_user_preferences" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_credits"
    ADD CONSTRAINT "user_credits_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_notification_preferences"
    ADD CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_referrals"
    ADD CONSTRAINT "user_referrals_referrer_id_referee_id_key" UNIQUE ("referrer_id", "referee_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."vehicle_market_cache"
    ADD CONSTRAINT "vehicle_market_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_market_cache"
    ADD CONSTRAINT "vehicle_market_cache_user_id_vehicle_key_key" UNIQUE ("user_id", "vehicle_key");



ALTER TABLE ONLY "public"."vendedores_ayuda"
    ADD CONSTRAINT "vendedores_ayuda_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_ad_credits"
    ADD CONSTRAINT "weekly_ad_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."weekly_ad_credits"
    ADD CONSTRAINT "weekly_ad_credits_user_id_vehicle_id_week_start_key" UNIQUE ("user_id", "vehicle_id", "week_start");



CREATE INDEX "idx_anuncios_estado_normalizacion" ON "public"."anuncios_vehiculos" USING "btree" ("estado_normalizacion");



CREATE INDEX "idx_anuncios_fecha_extraccion" ON "public"."anuncios_vehiculos" USING "btree" ("fecha_extraccion");



CREATE INDEX "idx_anuncios_hash_contenido" ON "public"."anuncios_vehiculos" USING "btree" ("hash_contenido");



CREATE INDEX "idx_anuncios_marca_modelo" ON "public"."anuncios_vehiculos" USING "btree" ("marca", "modelo");



CREATE INDEX "idx_anuncios_precio" ON "public"."anuncios_vehiculos" USING "btree" ("precio");



CREATE INDEX "idx_anuncios_sitio_web" ON "public"."anuncios_vehiculos" USING "btree" ("sitio_web");



CREATE INDEX "idx_anuncios_vehiculos_activo" ON "public"."anuncios_vehiculos" USING "btree" ("activo");



CREATE INDEX "idx_anuncios_vehiculos_fecha" ON "public"."anuncios_vehiculos" USING "btree" ("fecha_extraccion");



CREATE INDEX "idx_anuncios_vehiculos_marca" ON "public"."anuncios_vehiculos" USING "btree" ("marca");



CREATE INDEX "idx_anuncios_vehiculos_precio" ON "public"."anuncios_vehiculos" USING "btree" ("precio");



CREATE INDEX "idx_anuncios_vehiculos_sitio_web" ON "public"."anuncios_vehiculos" USING "btree" ("sitio_web");



CREATE INDEX "idx_autos_profesional_inventario_estado" ON "public"."autos_profesional_inventario" USING "btree" ("estado");



CREATE INDEX "idx_autos_profesional_inventario_profesional_id" ON "public"."autos_profesional_inventario" USING "btree" ("profesional_id");



CREATE INDEX "idx_evaluaciones_pendientes_interaccion" ON "public"."evaluaciones_profesional_pendientes" USING "btree" ("interaccion_id");



CREATE INDEX "idx_evaluaciones_pendientes_revelada" ON "public"."evaluaciones_profesional_pendientes" USING "btree" ("revelada") WHERE ("revelada" = false);



CREATE INDEX "idx_historico_ventas_dias_mercado" ON "public"."historico_ventas" USING "btree" ("dias_en_mercado");



CREATE INDEX "idx_historico_ventas_fecha_venta" ON "public"."historico_ventas" USING "btree" ("fecha_venta");



CREATE INDEX "idx_historico_ventas_marca_modelo" ON "public"."historico_ventas" USING "btree" ("marca", "modelo");



CREATE INDEX "idx_interacciones_b2b_profesionales" ON "public"."interacciones_profesional_profesional" USING "btree" ("profesional_iniciador_id", "profesional_receptor_id");



CREATE INDEX "idx_interacciones_profesionales_elegible" ON "public"."interacciones_profesionales" USING "btree" ("elegible_evaluacion") WHERE ("elegible_evaluacion" = true);



CREATE INDEX "idx_interacciones_profesionales_lookup" ON "public"."interacciones_profesionales" USING "btree" ("cliente_id", "profesional_id");



CREATE INDEX "idx_logs_sitio_fecha" ON "public"."logs_extraccion" USING "btree" ("sitio_web", "created_at");



CREATE INDEX "idx_mensajes_b2b_interaccion" ON "public"."mensajes_profesional_profesional" USING "btree" ("interaccion_id");



CREATE INDEX "idx_mensajes_ofertas_created_at" ON "public"."mensajes_ofertas" USING "btree" ("created_at");



CREATE INDEX "idx_mensajes_ofertas_oferta_id" ON "public"."mensajes_ofertas" USING "btree" ("oferta_id");



CREATE INDEX "idx_notificaciones_created_at" ON "public"."notificaciones" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notificaciones_global" ON "public"."notificaciones" USING "btree" ("es_global");



CREATE INDEX "idx_notificaciones_leida" ON "public"."notificaciones" USING "btree" ("leida");



CREATE INDEX "idx_notificaciones_user_id" ON "public"."notificaciones" USING "btree" ("user_id");



CREATE INDEX "idx_profesionales_correo" ON "public"."profesionales" USING "btree" ("correo");



CREATE INDEX "idx_profesionales_rfc" ON "public"."profesionales" USING "btree" ("rfc");



CREATE INDEX "idx_progreso_extraccion_estado" ON "public"."progreso_extraccion" USING "btree" ("estado");



CREATE INDEX "idx_progreso_extraccion_estrategia" ON "public"."progreso_extraccion" USING "btree" ("estrategia");



CREATE INDEX "idx_progreso_extraccion_sesion" ON "public"."progreso_extraccion" USING "btree" ("sesion_id");



CREATE INDEX "idx_reviews_prof_prof_estado" ON "public"."reviews_profesional_profesional" USING "btree" ("estado_revision");



CREATE INDEX "idx_reviews_prof_prof_evaluado" ON "public"."reviews_profesional_profesional" USING "btree" ("profesional_evaluado_id");



CREATE INDEX "idx_reviews_prof_prof_evaluador" ON "public"."reviews_profesional_profesional" USING "btree" ("profesional_evaluador_id");



CREATE INDEX "idx_reviews_prof_prof_tipo" ON "public"."reviews_profesional_profesional" USING "btree" ("tipo_interaccion");



CREATE INDEX "idx_reviews_prof_prof_transaccion" ON "public"."reviews_profesional_profesional" USING "btree" ("transaccion_id");



CREATE OR REPLACE TRIGGER "trigger_actualizar_elegibilidad" AFTER INSERT ON "public"."mensajes_ofertas" FOR EACH ROW EXECUTE FUNCTION "public"."actualizar_elegibilidad_evaluacion"();



CREATE OR REPLACE TRIGGER "trigger_actualizar_elegibilidad_b2b" AFTER INSERT ON "public"."mensajes_profesional_profesional" FOR EACH ROW EXECUTE FUNCTION "public"."actualizar_elegibilidad_evaluacion_b2b"();



CREATE OR REPLACE TRIGGER "trigger_ofertas_actualizar_stats" AFTER INSERT OR DELETE OR UPDATE ON "public"."ofertas" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_actualizar_stats_profesional"();



CREATE OR REPLACE TRIGGER "trigger_reviews_actualizar_stats" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews_profesionales" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_actualizar_stats_profesional"();



CREATE OR REPLACE TRIGGER "trigger_update_stats_profesional_profesional" AFTER INSERT OR DELETE OR UPDATE ON "public"."reviews_profesional_profesional" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_actualizar_stats_profesional_profesional"();



CREATE OR REPLACE TRIGGER "update_admin_daily_usage_updated_at" BEFORE UPDATE ON "public"."admin_daily_usage" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_anuncios_updated_at" BEFORE UPDATE ON "public"."anuncios_vehiculos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_autos_profesional_inventario_updated_at" BEFORE UPDATE ON "public"."autos_profesional_inventario" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_autos_venta_updated_at" BEFORE UPDATE ON "public"."autos_venta" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clientes_updated_at" BEFORE UPDATE ON "public"."clientes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_config_autoajuste_auto_updated_at" BEFORE UPDATE ON "public"."config_autoajuste_auto" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_config_autoajuste_general_updated_at" BEFORE UPDATE ON "public"."config_autoajuste_general" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_configuracion_updated_at" BEFORE UPDATE ON "public"."configuracion_extraccion" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_estadisticas_extraccion_updated_at" BEFORE UPDATE ON "public"."estadisticas_extraccion" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_evaluaciones_cliente_profesional_pendientes_updated_at" BEFORE UPDATE ON "public"."evaluaciones_cliente_profesional_pendientes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_evaluaciones_profesional_pendientes_updated_at" BEFORE UPDATE ON "public"."evaluaciones_profesional_pendientes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_historico_ventas_updated_at" BEFORE UPDATE ON "public"."historico_ventas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_interacciones_profesional_profesional_updated_at" BEFORE UPDATE ON "public"."interacciones_profesional_profesional" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_interacciones_profesionales_updated_at" BEFORE UPDATE ON "public"."interacciones_profesionales" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mensajes_ofertas_updated_at" BEFORE UPDATE ON "public"."mensajes_ofertas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mensajes_profesional_profesional_updated_at" BEFORE UPDATE ON "public"."mensajes_profesional_profesional" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notificaciones_updated_at" BEFORE UPDATE ON "public"."notificaciones" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ofertas_updated_at" BEFORE UPDATE ON "public"."ofertas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profesional_filtros_ofertas_updated_at" BEFORE UPDATE ON "public"."profesional_filtros_ofertas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profesionales_updated_at" BEFORE UPDATE ON "public"."profesionales" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_progreso_extraccion_updated_at" BEFORE UPDATE ON "public"."progreso_extraccion" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_referral_codes_updated_at" BEFORE UPDATE ON "public"."referral_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_solicitudes_paquetes_personalizados_updated_at" BEFORE UPDATE ON "public"."solicitudes_paquetes_personalizados" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subasta_autos_updated_at" BEFORE UPDATE ON "public"."subasta_autos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_notification_preferences_updated_at" BEFORE UPDATE ON "public"."user_notification_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_referrals_updated_at" BEFORE UPDATE ON "public"."user_referrals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vendedores_ayuda_updated_at" BEFORE UPDATE ON "public"."vendedores_ayuda" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."anuncios_similares"
    ADD CONSTRAINT "anuncios_similares_anuncio_1_id_fkey" FOREIGN KEY ("anuncio_1_id") REFERENCES "public"."anuncios_vehiculos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anuncios_similares"
    ADD CONSTRAINT "anuncios_similares_anuncio_2_id_fkey" FOREIGN KEY ("anuncio_2_id") REFERENCES "public"."anuncios_vehiculos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autos_venta"
    ADD CONSTRAINT "autos_venta_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."config_autoajuste_auto"
    ADD CONSTRAINT "config_autoajuste_auto_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "public"."profesionales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."config_autoajuste_general"
    ADD CONSTRAINT "config_autoajuste_general_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "public"."profesionales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluaciones_profesional_pendientes"
    ADD CONSTRAINT "evaluaciones_profesional_pendientes_evaluado_id_fkey" FOREIGN KEY ("evaluado_id") REFERENCES "public"."profesionales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluaciones_profesional_pendientes"
    ADD CONSTRAINT "evaluaciones_profesional_pendientes_evaluador_id_fkey" FOREIGN KEY ("evaluador_id") REFERENCES "public"."profesionales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluaciones_profesional_pendientes"
    ADD CONSTRAINT "evaluaciones_profesional_pendientes_interaccion_id_fkey" FOREIGN KEY ("interaccion_id") REFERENCES "public"."interacciones_profesional_profesional"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."historial_cambios_precios"
    ADD CONSTRAINT "historial_cambios_precios_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "public"."profesionales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacciones_profesional_profesional"
    ADD CONSTRAINT "interacciones_profesional_profesi_profesional_iniciador_id_fkey" FOREIGN KEY ("profesional_iniciador_id") REFERENCES "public"."profesionales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacciones_profesional_profesional"
    ADD CONSTRAINT "interacciones_profesional_profesio_profesional_receptor_id_fkey" FOREIGN KEY ("profesional_receptor_id") REFERENCES "public"."profesionales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacciones_profesional_profesional"
    ADD CONSTRAINT "interacciones_profesional_profesional_auto_inventario_id_fkey" FOREIGN KEY ("auto_inventario_id") REFERENCES "public"."autos_profesional_inventario"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacciones_profesionales"
    ADD CONSTRAINT "interacciones_profesionales_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacciones_profesionales"
    ADD CONSTRAINT "interacciones_profesionales_oferta_id_fkey" FOREIGN KEY ("oferta_id") REFERENCES "public"."ofertas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interacciones_profesionales"
    ADD CONSTRAINT "interacciones_profesionales_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "public"."profesionales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mensajes_ofertas"
    ADD CONSTRAINT "mensajes_ofertas_oferta_id_fkey" FOREIGN KEY ("oferta_id") REFERENCES "public"."ofertas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mensajes_profesional_profesional"
    ADD CONSTRAINT "mensajes_profesional_profesional_interaccion_id_fkey" FOREIGN KEY ("interaccion_id") REFERENCES "public"."interacciones_profesional_profesional"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mensajes_profesional_profesional"
    ADD CONSTRAINT "mensajes_profesional_profesional_remitente_id_fkey" FOREIGN KEY ("remitente_id") REFERENCES "public"."profesionales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modelos_normalizados"
    ADD CONSTRAINT "modelos_normalizados_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas_normalizadas"("id");



ALTER TABLE ONLY "public"."notificaciones"
    ADD CONSTRAINT "notificaciones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ofertas"
    ADD CONSTRAINT "ofertas_auto_venta_id_fkey" FOREIGN KEY ("auto_venta_id") REFERENCES "public"."autos_venta"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ofertas"
    ADD CONSTRAINT "ofertas_profesional_id_fkey" FOREIGN KEY ("profesional_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profesionales"
    ADD CONSTRAINT "profesionales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."solicitudes_paquetes_personalizados"
    ADD CONSTRAINT "solicitudes_paquetes_personalizados_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin full access" ON "public"."anuncios_vehiculos" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can delete profesionales" ON "public"."profesionales" FOR DELETE USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can insert profesionales" ON "public"."profesionales" FOR INSERT WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage all cliente records" ON "public"."clientes" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage all notifications" ON "public"."notificaciones" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage all requests" ON "public"."solicitudes_paquetes_personalizados" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage all vehicle records" ON "public"."autos_venta" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage all vendedores_ayuda" ON "public"."vendedores_ayuda" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage extraction configurations" ON "public"."configuracion_extraccion" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage roles" ON "public"."user_roles" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can select all profesionales" ON "public"."profesionales" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can update profesionales" ON "public"."profesionales" FOR UPDATE USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all subasta_autos" ON "public"."subasta_autos" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all vendedores_ayuda" ON "public"."vendedores_ayuda" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view their own usage" ON "public"."admin_daily_usage" FOR SELECT USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Admins pueden gestionar todas las reviews" ON "public"."reviews_profesional_profesional" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "All users can read cache" ON "public"."market_data_cache" FOR SELECT USING (true);



CREATE POLICY "Allow all operations" ON "public"."anuncios_similares" USING (true);



CREATE POLICY "Allow all operations" ON "public"."logs_extraccion" USING (true);



CREATE POLICY "Allow all operations" ON "public"."marcas_normalizadas" USING (true);



CREATE POLICY "Allow all operations" ON "public"."modelos_normalizados" USING (true);



CREATE POLICY "Allow all operations on extraction progress" ON "public"."progreso_extraccion" USING (true);



CREATE POLICY "Allow all operations on extraction stats" ON "public"."estadisticas_extraccion" USING (true);



CREATE POLICY "Anonymous users can insert requests" ON "public"."solicitudes_paquetes_personalizados" FOR INSERT TO "anon" WITH CHECK (("user_id" IS NULL));



CREATE POLICY "Anonymous users can view listings without contact info" ON "public"."anuncios_vehiculos" FOR SELECT TO "anon" USING ((("activo" = true) AND true));



CREATE POLICY "Authenticated users can view listings without contact info" ON "public"."anuncios_vehiculos" FOR SELECT TO "authenticated" USING ((("activo" = true) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."activo" = true)))))));



CREATE POLICY "Clientes pueden crear reviews de ofertas que recibieron" ON "public"."reviews_profesionales" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."ofertas" "o"
     JOIN "public"."autos_venta" "av" ON (("av"."id" = "o"."auto_venta_id")))
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("o"."id" = "reviews_profesionales"."oferta_id") AND ("c"."id" = "reviews_profesionales"."cliente_id") AND ("o"."profesional_id" = "reviews_profesionales"."profesional_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")) AND ("o"."estado" = 'aceptada'::"text")))));



CREATE POLICY "Clientes pueden ver y actualizar sus propios reviews" ON "public"."reviews_profesionales" USING ((EXISTS ( SELECT 1
   FROM "public"."clientes" "c"
  WHERE (("c"."id" = "reviews_profesionales"."cliente_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "Customers can manage their own cars" ON "public"."autos_venta" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."clientes" "c"
  WHERE (("c"."id" = "autos_venta"."cliente_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."clientes" "c"
  WHERE (("c"."id" = "autos_venta"."cliente_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text"))))));



CREATE POLICY "Deny anonymous access to profesionales" ON "public"."profesionales" TO "anon" USING (false);



CREATE POLICY "Deny user access to API tokens" ON "public"."api_tokens" TO "authenticated", "anon" USING (false) WITH CHECK (false);



CREATE POLICY "Evaluadores pueden crear sus evaluaciones" ON "public"."evaluaciones_cliente_profesional_pendientes" FOR INSERT WITH CHECK (((("tipo_evaluador" = 'cliente'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."clientes" "c"
  WHERE (("c"."id" = "evaluaciones_cliente_profesional_pendientes"."evaluador_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))) OR (("tipo_evaluador" = 'profesional'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "evaluaciones_cliente_profesional_pendientes"."evaluador_id") AND ("p"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Evaluadores solo ven sus propias evaluaciones pendientes" ON "public"."evaluaciones_cliente_profesional_pendientes" FOR SELECT USING (((("tipo_evaluador" = 'cliente'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."clientes" "c"
  WHERE (("c"."id" = "evaluaciones_cliente_profesional_pendientes"."evaluador_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))) OR (("tipo_evaluador" = 'profesional'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "evaluaciones_cliente_profesional_pendientes"."evaluador_id") AND ("p"."user_id" = "auth"."uid"()))))) OR (("revelada" = true) AND ((("tipo_evaluador" = 'cliente'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."clientes" "c"
  WHERE (("c"."id" = "evaluaciones_cliente_profesional_pendientes"."evaluado_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))) OR (("tipo_evaluador" = 'profesional'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "evaluaciones_cliente_profesional_pendientes"."evaluado_id") AND ("p"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Owners can view professional contact for received offers" ON "public"."profiles" FOR SELECT USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR ("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM (("public"."ofertas" "o"
     JOIN "public"."autos_venta" "av" ON (("av"."id" = "o"."auto_venta_id")))
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("o"."profesional_id" = "profiles"."user_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "Owners update offers via jwt email" ON "public"."ofertas" FOR UPDATE USING ((("profesional_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."autos_venta" "av"
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("av"."id" = "ofertas"."auto_venta_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "Owners view offers via jwt email" ON "public"."ofertas" FOR SELECT USING ((("profesional_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."autos_venta" "av"
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("av"."id" = "ofertas"."auto_venta_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "Participantes pueden actualizar mensajes" ON "public"."mensajes_ofertas" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (("public"."ofertas" "o"
     JOIN "public"."autos_venta" "av" ON (("av"."id" = "o"."auto_venta_id")))
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("o"."id" = "mensajes_ofertas"."oferta_id") AND (("o"."profesional_id" = "auth"."uid"()) OR ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "Participantes pueden crear mensajes en sus ofertas" ON "public"."mensajes_ofertas" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."ofertas" "o"
     JOIN "public"."autos_venta" "av" ON (("av"."id" = "o"."auto_venta_id")))
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("o"."id" = "mensajes_ofertas"."oferta_id") AND ((("o"."profesional_id" = "auth"."uid"()) AND ("mensajes_ofertas"."remitente_tipo" = 'profesional'::"text") AND ("mensajes_ofertas"."remitente_id" = "auth"."uid"())) OR (("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")) AND ("mensajes_ofertas"."remitente_tipo" = 'cliente'::"text") AND ("mensajes_ofertas"."remitente_id" = "c"."id")))))));



CREATE POLICY "Participantes pueden ver mensajes de sus ofertas" ON "public"."mensajes_ofertas" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."ofertas" "o"
     JOIN "public"."autos_venta" "av" ON (("av"."id" = "o"."auto_venta_id")))
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("o"."id" = "mensajes_ofertas"."oferta_id") AND (("o"."profesional_id" = "auth"."uid"()) OR ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "Participantes pueden ver sus interacciones" ON "public"."interacciones_profesionales" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "interacciones_profesionales"."profesional_id") AND ("p"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."clientes" "c"
  WHERE (("c"."id" = "interacciones_profesionales"."cliente_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "Profesionales pueden actualizar sus mensajes" ON "public"."mensajes_profesional_profesional" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "mensajes_profesional_profesional"."remitente_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales pueden actualizar sus propias reviews" ON "public"."reviews_profesional_profesional" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "reviews_profesional_profesional"."profesional_evaluador_id") AND ("p"."user_id" = "auth"."uid"())))) AND ("estado_revision" = 'activa'::"text")));



CREATE POLICY "Profesionales pueden crear mensajes" ON "public"."mensajes_profesional_profesional" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "mensajes_profesional_profesional"."remitente_id") AND ("p"."user_id" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."interacciones_profesional_profesional" "i"
  WHERE (("i"."id" = "mensajes_profesional_profesional"."interaccion_id") AND (("i"."profesional_iniciador_id" = "mensajes_profesional_profesional"."remitente_id") OR ("i"."profesional_receptor_id" = "mensajes_profesional_profesional"."remitente_id")))))));



CREATE POLICY "Profesionales pueden crear reviews basadas en transacciones" ON "public"."reviews_profesional_profesional" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "reviews_profesional_profesional"."profesional_evaluador_id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."activo" = true)))) AND (EXISTS ( SELECT 1
   FROM "public"."ofertas" "o"
  WHERE ((("o"."id" = "reviews_profesional_profesional"."transaccion_id") OR ("reviews_profesional_profesional"."transaccion_id" IS NULL)) AND ("o"."profesional_id" = "reviews_profesional_profesional"."profesional_evaluador_id") AND ("o"."estado" = 'aceptada'::"text")))) AND ("fecha_transaccion" < ("now"() - '48:00:00'::interval))));



CREATE POLICY "Profesionales pueden crear sus evaluaciones" ON "public"."evaluaciones_profesional_pendientes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "evaluaciones_profesional_pendientes"."evaluador_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales pueden gestionar su config general" ON "public"."config_autoajuste_general" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "config_autoajuste_general"."profesional_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "config_autoajuste_general"."profesional_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales pueden gestionar su config por auto" ON "public"."config_autoajuste_auto" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "config_autoajuste_auto"."profesional_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "config_autoajuste_auto"."profesional_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales pueden gestionar sus filtros" ON "public"."profesional_filtros_ofertas" USING ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "profesional_filtros_ofertas"."profesional_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "profesional_filtros_ofertas"."profesional_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales pueden ver mensajes de sus interacciones" ON "public"."mensajes_profesional_profesional" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."interacciones_profesional_profesional" "i"
     JOIN "public"."profesionales" "p" ON ((("p"."id" = "i"."profesional_iniciador_id") OR ("p"."id" = "i"."profesional_receptor_id"))))
  WHERE (("i"."id" = "mensajes_profesional_profesional"."interaccion_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales pueden ver reviews sobre ellos" ON "public"."reviews_profesionales" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "reviews_profesionales"."profesional_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales pueden ver reviews sobre ellos o que hicieron" ON "public"."reviews_profesional_profesional" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE ((("p"."id" = "reviews_profesional_profesional"."profesional_evaluado_id") OR ("p"."id" = "reviews_profesional_profesional"."profesional_evaluador_id")) AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales pueden ver su historial de cambios" ON "public"."historial_cambios_precios" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "historial_cambios_precios"."profesional_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales pueden ver sus interacciones" ON "public"."interacciones_profesional_profesional" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = ANY (ARRAY["interacciones_profesional_profesional"."profesional_iniciador_id", "interacciones_profesional_profesional"."profesional_receptor_id"])) AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Profesionales solo ven sus propias evaluaciones pendientes" ON "public"."evaluaciones_profesional_pendientes" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "evaluaciones_profesional_pendientes"."evaluador_id") AND ("p"."user_id" = "auth"."uid"())))) OR (("revelada" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "evaluaciones_profesional_pendientes"."evaluado_id") AND ("p"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Professionals can insert offers" ON "public"."ofertas" FOR INSERT TO "authenticated" WITH CHECK ((("profesional_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."autos_venta" "av"
  WHERE (("av"."id" = "ofertas"."auto_venta_id") AND ("av"."recibiendo_ofertas" = true))))));



CREATE POLICY "Professionals can manage their own inventory" ON "public"."autos_profesional_inventario" USING ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "autos_profesional_inventario"."profesional_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "autos_profesional_inventario"."profesional_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Professionals can view available cars for sale" ON "public"."autos_venta" FOR SELECT TO "authenticated" USING ((("recibiendo_ofertas" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profesionales"
  WHERE (("profesionales"."user_id" = "auth"."uid"()) AND ("profesionales"."activo" = true))))));



CREATE POLICY "Restrict professional data access" ON "public"."profesionales" FOR SELECT TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Restrict professional data modifications" ON "public"."profesionales" TO "authenticated" USING (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR ("user_id" = "auth"."uid"()))) WITH CHECK (("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role") OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Service role access" ON "public"."anuncios_vehiculos" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can manage API tokens" ON "public"."api_tokens" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role can read extraction configurations" ON "public"."configuracion_extraccion" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Service role can update extraction timestamps" ON "public"."configuracion_extraccion" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Sistema puede gestionar evaluaciones" ON "public"."evaluaciones_cliente_profesional_pendientes" USING (true) WITH CHECK (true);



CREATE POLICY "Sistema puede gestionar evaluaciones" ON "public"."evaluaciones_profesional_pendientes" USING (true) WITH CHECK (true);



CREATE POLICY "Sistema puede gestionar interacciones" ON "public"."interacciones_profesionales" USING (true) WITH CHECK (true);



CREATE POLICY "Sistema puede gestionar interacciones profesionales" ON "public"."interacciones_profesional_profesional" USING (true) WITH CHECK (true);



CREATE POLICY "Sistema puede leer filtros" ON "public"."profesional_filtros_ofertas" FOR SELECT USING (true);



CREATE POLICY "Solo admins pueden gestionar historial" ON "public"."historico_ventas" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Solo sistema puede actualizar estadísticas" ON "public"."stats_profesionales" USING (true) WITH CHECK (true);



CREATE POLICY "Solo sistema puede actualizar stats profesional-profesional" ON "public"."stats_profesional_profesional" USING (true) WITH CHECK (true);



CREATE POLICY "Solo sistema puede insertar historial" ON "public"."historial_cambios_precios" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."id" = "historial_cambios_precios"."profesional_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "System can create notifications" ON "public"."notificaciones" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert transactions" ON "public"."credit_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert user credits" ON "public"."user_credits" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage admin usage" ON "public"."admin_daily_usage" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage cache" ON "public"."market_data_cache" USING (true);



CREATE POLICY "System can manage evaluation rewards" ON "public"."evaluation_rewards" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage referral codes" ON "public"."referral_codes" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage user referrals" ON "public"."user_referrals" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage weekly ad credits" ON "public"."weekly_ad_credits" USING (true) WITH CHECK (true);



CREATE POLICY "Todos pueden ver estadísticas de profesionales" ON "public"."stats_profesionales" FOR SELECT USING (true);



CREATE POLICY "Todos pueden ver historial de ventas" ON "public"."historico_ventas" FOR SELECT USING (true);



CREATE POLICY "Todos pueden ver reviews activas para mostrar reputación" ON "public"."reviews_profesional_profesional" FOR SELECT USING (("estado_revision" = 'activa'::"text"));



CREATE POLICY "Todos pueden ver reviews para mostrar reputación" ON "public"."reviews_profesionales" FOR SELECT USING (true);



CREATE POLICY "Todos pueden ver stats profesional-profesional" ON "public"."stats_profesional_profesional" FOR SELECT USING (true);



CREATE POLICY "Users can create their own referral codes" ON "public"."referral_codes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own offers or owners can delete (jwt)" ON "public"."ofertas" FOR DELETE USING ((("profesional_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."autos_venta" "av"
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("av"."id" = "ofertas"."auto_venta_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "Users can delete their own requests" ON "public"."solicitudes_paquetes_personalizados" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own auction records" ON "public"."subasta_autos" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own help requests" ON "public"."vendedores_ayuda" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") OR ("vendedor_correo" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Users can insert their own profesionales" ON "public"."profesionales" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own requests" ON "public"."solicitudes_paquetes_personalizados" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own cliente records" ON "public"."clientes" TO "authenticated" USING (("correo_electronico" = ("auth"."jwt"() ->> 'email'::"text"))) WITH CHECK (("correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")));



CREATE POLICY "Users can manage their own notification preferences" ON "public"."user_notification_preferences" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own vehicle cache" ON "public"."vehicle_market_cache" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select their own profesionales" ON "public"."profesionales" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own auction records" ON "public"."subasta_autos" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own credits" ON "public"."user_credits" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own help requests" ON "public"."vendedores_ayuda" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("vendedor_correo" = ("auth"."jwt"() ->> 'email'::"text")))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("vendedor_correo" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Users can update their own notifications" ON "public"."notificaciones" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own offers or owners can update (jwt)" ON "public"."ofertas" FOR UPDATE USING ((("profesional_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."autos_venta" "av"
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("av"."id" = "ofertas"."auto_venta_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "Users can update their own profesionales" ON "public"."profesionales" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own referral codes" ON "public"."referral_codes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own requests" ON "public"."solicitudes_paquetes_personalizados" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view offers for their cars or offers they made (jwt)" ON "public"."ofertas" FOR SELECT USING ((("profesional_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."autos_venta" "av"
     JOIN "public"."clientes" "c" ON (("c"."id" = "av"."cliente_id")))
  WHERE (("av"."id" = "ofertas"."auto_venta_id") AND ("c"."correo_electronico" = ("auth"."jwt"() ->> 'email'::"text")))))));



CREATE POLICY "Users can view referrals they were referred by" ON "public"."user_referrals" FOR SELECT USING (("auth"."uid"() = "referee_id"));



CREATE POLICY "Users can view their own auction records" ON "public"."subasta_autos" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own credits" ON "public"."user_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own evaluation rewards" ON "public"."evaluation_rewards" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own help requests" ON "public"."vendedores_ayuda" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("vendedor_correo" = ("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "Users can view their own notifications and global ones" ON "public"."notificaciones" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("es_global" = true)));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own referral codes" ON "public"."referral_codes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own referrals (as referrer)" ON "public"."user_referrals" FOR SELECT USING (("auth"."uid"() = "referrer_id"));



CREATE POLICY "Users can view their own requests" ON "public"."solicitudes_paquetes_personalizados" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own transactions" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own weekly ad credits" ON "public"."weekly_ad_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Verified professionals can access contact information" ON "public"."anuncios_vehiculos" FOR SELECT TO "authenticated" USING ((("activo" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profesionales" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."activo" = true))))));



ALTER TABLE "public"."admin_daily_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."anuncios_similares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."anuncios_vehiculos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."autos_profesional_inventario" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."autos_venta" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."config_autoajuste_auto" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."config_autoajuste_general" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."configuracion_extraccion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."estadisticas_extraccion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluaciones_cliente_profesional_pendientes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluaciones_profesional_pendientes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluation_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historial_cambios_precios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."historico_ventas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interacciones_profesional_profesional" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interacciones_profesionales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logs_extraccion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marcas_normalizadas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."market_data_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mensajes_ofertas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mensajes_profesional_profesional" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modelos_normalizados" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notificaciones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ofertas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profesional_filtros_ofertas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profesionales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."progreso_extraccion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews_profesional_profesional" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews_profesionales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."solicitudes_paquetes_personalizados" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stats_profesional_profesional" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stats_profesionales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subasta_autos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_market_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendedores_ayuda" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."weekly_ad_credits" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."evaluaciones_profesional_pendientes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."interacciones_profesional_profesional";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."interacciones_profesionales";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."mensajes_ofertas";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."mensajes_profesional_profesional";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."actualizar_elegibilidad_evaluacion"() TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_elegibilidad_evaluacion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_elegibilidad_evaluacion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."actualizar_elegibilidad_evaluacion_b2b"() TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_elegibilidad_evaluacion_b2b"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_elegibilidad_evaluacion_b2b"() TO "service_role";



GRANT ALL ON FUNCTION "public"."actualizar_stats_profesional"("p_profesional_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_stats_profesional"("p_profesional_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_stats_profesional"("p_profesional_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."actualizar_stats_profesional_profesional"("p_profesional_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."actualizar_stats_profesional_profesional"("p_profesional_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."actualizar_stats_profesional_profesional"("p_profesional_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."aplicar_autoajuste_general"() TO "anon";
GRANT ALL ON FUNCTION "public"."aplicar_autoajuste_general"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."aplicar_autoajuste_general"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_vehicle_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_vehicle_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_vehicle_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_credits"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_resource_info" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."consume_credits"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_resource_info" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_credits"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_resource_info" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_credits_typed"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_credit_type" "text", "p_resource_info" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."consume_credits_typed"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_credit_type" "text", "p_resource_info" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_credits_typed"("p_user_id" "uuid", "p_credits" integer, "p_action_type" "text", "p_credit_type" "text", "p_resource_info" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."evaluar_filtros_vehiculo"("p_profesional_id" "uuid", "p_marca" "text", "p_modelo" "text", "p_ano" integer, "p_kilometraje" integer, "p_precio_estimado" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."evaluar_filtros_vehiculo"("p_profesional_id" "uuid", "p_marca" "text", "p_modelo" "text", "p_ano" integer, "p_kilometraje" integer, "p_precio_estimado" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."evaluar_filtros_vehiculo"("p_profesional_id" "uuid", "p_marca" "text", "p_modelo" "text", "p_ano" integer, "p_kilometraje" integer, "p_precio_estimado" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_weekly_ad_credit"("p_user_id" "uuid", "p_vehicle_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_weekly_ad_credit"("p_user_id" "uuid", "p_vehicle_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_weekly_ad_credit"("p_user_id" "uuid", "p_vehicle_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_user_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_monthly_referral_credits"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_monthly_referral_credits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_monthly_referral_credits"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_actualizar_stats_profesional"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_actualizar_stats_profesional"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_actualizar_stats_profesional"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_actualizar_stats_profesional_profesional"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_actualizar_stats_profesional_profesional"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_actualizar_stats_profesional_profesional"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verificar_y_revelar_evaluaciones"() TO "anon";
GRANT ALL ON FUNCTION "public"."verificar_y_revelar_evaluaciones"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verificar_y_revelar_evaluaciones"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verificar_y_revelar_evaluaciones_cliente_profesional"() TO "anon";
GRANT ALL ON FUNCTION "public"."verificar_y_revelar_evaluaciones_cliente_profesional"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."verificar_y_revelar_evaluaciones_cliente_profesional"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_daily_usage" TO "anon";
GRANT ALL ON TABLE "public"."admin_daily_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_daily_usage" TO "service_role";



GRANT ALL ON TABLE "public"."anuncios_similares" TO "anon";
GRANT ALL ON TABLE "public"."anuncios_similares" TO "authenticated";
GRANT ALL ON TABLE "public"."anuncios_similares" TO "service_role";



GRANT ALL ON TABLE "public"."anuncios_vehiculos" TO "anon";
GRANT ALL ON TABLE "public"."anuncios_vehiculos" TO "authenticated";
GRANT ALL ON TABLE "public"."anuncios_vehiculos" TO "service_role";



GRANT SELECT("telefono") ON TABLE "public"."anuncios_vehiculos" TO "authenticated";
GRANT SELECT("telefono") ON TABLE "public"."anuncios_vehiculos" TO "service_role";



GRANT SELECT("email") ON TABLE "public"."anuncios_vehiculos" TO "authenticated";
GRANT SELECT("email") ON TABLE "public"."anuncios_vehiculos" TO "service_role";



GRANT ALL ON TABLE "public"."api_tokens" TO "anon";
GRANT ALL ON TABLE "public"."api_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."api_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."autos_profesional_inventario" TO "anon";
GRANT ALL ON TABLE "public"."autos_profesional_inventario" TO "authenticated";
GRANT ALL ON TABLE "public"."autos_profesional_inventario" TO "service_role";



GRANT ALL ON TABLE "public"."autos_venta" TO "anon";
GRANT ALL ON TABLE "public"."autos_venta" TO "authenticated";
GRANT ALL ON TABLE "public"."autos_venta" TO "service_role";



GRANT ALL ON TABLE "public"."clientes" TO "anon";
GRANT ALL ON TABLE "public"."clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."clientes" TO "service_role";



GRANT ALL ON TABLE "public"."config_autoajuste_auto" TO "anon";
GRANT ALL ON TABLE "public"."config_autoajuste_auto" TO "authenticated";
GRANT ALL ON TABLE "public"."config_autoajuste_auto" TO "service_role";



GRANT ALL ON TABLE "public"."config_autoajuste_general" TO "anon";
GRANT ALL ON TABLE "public"."config_autoajuste_general" TO "authenticated";
GRANT ALL ON TABLE "public"."config_autoajuste_general" TO "service_role";



GRANT ALL ON TABLE "public"."configuracion_extraccion" TO "anon";
GRANT ALL ON TABLE "public"."configuracion_extraccion" TO "authenticated";
GRANT ALL ON TABLE "public"."configuracion_extraccion" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."estadisticas_extraccion" TO "anon";
GRANT ALL ON TABLE "public"."estadisticas_extraccion" TO "authenticated";
GRANT ALL ON TABLE "public"."estadisticas_extraccion" TO "service_role";



GRANT ALL ON TABLE "public"."evaluaciones_cliente_profesional_pendientes" TO "anon";
GRANT ALL ON TABLE "public"."evaluaciones_cliente_profesional_pendientes" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluaciones_cliente_profesional_pendientes" TO "service_role";



GRANT ALL ON TABLE "public"."evaluaciones_profesional_pendientes" TO "anon";
GRANT ALL ON TABLE "public"."evaluaciones_profesional_pendientes" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluaciones_profesional_pendientes" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_rewards" TO "anon";
GRANT ALL ON TABLE "public"."evaluation_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."historial_cambios_precios" TO "anon";
GRANT ALL ON TABLE "public"."historial_cambios_precios" TO "authenticated";
GRANT ALL ON TABLE "public"."historial_cambios_precios" TO "service_role";



GRANT ALL ON TABLE "public"."historico_ventas" TO "anon";
GRANT ALL ON TABLE "public"."historico_ventas" TO "authenticated";
GRANT ALL ON TABLE "public"."historico_ventas" TO "service_role";



GRANT ALL ON TABLE "public"."interacciones_profesional_profesional" TO "anon";
GRANT ALL ON TABLE "public"."interacciones_profesional_profesional" TO "authenticated";
GRANT ALL ON TABLE "public"."interacciones_profesional_profesional" TO "service_role";



GRANT ALL ON TABLE "public"."interacciones_profesionales" TO "anon";
GRANT ALL ON TABLE "public"."interacciones_profesionales" TO "authenticated";
GRANT ALL ON TABLE "public"."interacciones_profesionales" TO "service_role";



GRANT ALL ON TABLE "public"."logs_extraccion" TO "anon";
GRANT ALL ON TABLE "public"."logs_extraccion" TO "authenticated";
GRANT ALL ON TABLE "public"."logs_extraccion" TO "service_role";



GRANT ALL ON TABLE "public"."marcas_normalizadas" TO "anon";
GRANT ALL ON TABLE "public"."marcas_normalizadas" TO "authenticated";
GRANT ALL ON TABLE "public"."marcas_normalizadas" TO "service_role";



GRANT ALL ON TABLE "public"."market_data_cache" TO "anon";
GRANT ALL ON TABLE "public"."market_data_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."market_data_cache" TO "service_role";



GRANT ALL ON TABLE "public"."mensajes_ofertas" TO "anon";
GRANT ALL ON TABLE "public"."mensajes_ofertas" TO "authenticated";
GRANT ALL ON TABLE "public"."mensajes_ofertas" TO "service_role";



GRANT ALL ON TABLE "public"."mensajes_profesional_profesional" TO "anon";
GRANT ALL ON TABLE "public"."mensajes_profesional_profesional" TO "authenticated";
GRANT ALL ON TABLE "public"."mensajes_profesional_profesional" TO "service_role";



GRANT ALL ON TABLE "public"."modelos_normalizados" TO "anon";
GRANT ALL ON TABLE "public"."modelos_normalizados" TO "authenticated";
GRANT ALL ON TABLE "public"."modelos_normalizados" TO "service_role";



GRANT ALL ON TABLE "public"."notificaciones" TO "anon";
GRANT ALL ON TABLE "public"."notificaciones" TO "authenticated";
GRANT ALL ON TABLE "public"."notificaciones" TO "service_role";



GRANT ALL ON TABLE "public"."ofertas" TO "anon";
GRANT ALL ON TABLE "public"."ofertas" TO "authenticated";
GRANT ALL ON TABLE "public"."ofertas" TO "service_role";



GRANT ALL ON TABLE "public"."profesional_filtros_ofertas" TO "anon";
GRANT ALL ON TABLE "public"."profesional_filtros_ofertas" TO "authenticated";
GRANT ALL ON TABLE "public"."profesional_filtros_ofertas" TO "service_role";



GRANT ALL ON TABLE "public"."profesionales" TO "anon";
GRANT ALL ON TABLE "public"."profesionales" TO "authenticated";
GRANT ALL ON TABLE "public"."profesionales" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."progreso_extraccion" TO "anon";
GRANT ALL ON TABLE "public"."progreso_extraccion" TO "authenticated";
GRANT ALL ON TABLE "public"."progreso_extraccion" TO "service_role";



GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_codes" TO "service_role";



GRANT ALL ON TABLE "public"."reviews_profesional_profesional" TO "anon";
GRANT ALL ON TABLE "public"."reviews_profesional_profesional" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews_profesional_profesional" TO "service_role";



GRANT ALL ON TABLE "public"."reviews_profesionales" TO "anon";
GRANT ALL ON TABLE "public"."reviews_profesionales" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews_profesionales" TO "service_role";



GRANT ALL ON TABLE "public"."solicitudes_paquetes_personalizados" TO "anon";
GRANT ALL ON TABLE "public"."solicitudes_paquetes_personalizados" TO "authenticated";
GRANT ALL ON TABLE "public"."solicitudes_paquetes_personalizados" TO "service_role";



GRANT ALL ON TABLE "public"."stats_profesional_profesional" TO "anon";
GRANT ALL ON TABLE "public"."stats_profesional_profesional" TO "authenticated";
GRANT ALL ON TABLE "public"."stats_profesional_profesional" TO "service_role";



GRANT ALL ON TABLE "public"."stats_profesionales" TO "anon";
GRANT ALL ON TABLE "public"."stats_profesionales" TO "authenticated";
GRANT ALL ON TABLE "public"."stats_profesionales" TO "service_role";



GRANT ALL ON TABLE "public"."subasta_autos" TO "anon";
GRANT ALL ON TABLE "public"."subasta_autos" TO "authenticated";
GRANT ALL ON TABLE "public"."subasta_autos" TO "service_role";



GRANT ALL ON TABLE "public"."user_credits" TO "anon";
GRANT ALL ON TABLE "public"."user_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."user_credits" TO "service_role";



GRANT ALL ON TABLE "public"."user_notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_referrals" TO "anon";
GRANT ALL ON TABLE "public"."user_referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."user_referrals" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_market_cache" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_market_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_market_cache" TO "service_role";



GRANT ALL ON TABLE "public"."vendedores_ayuda" TO "anon";
GRANT ALL ON TABLE "public"."vendedores_ayuda" TO "authenticated";
GRANT ALL ON TABLE "public"."vendedores_ayuda" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_ad_credits" TO "anon";
GRANT ALL ON TABLE "public"."weekly_ad_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_ad_credits" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
