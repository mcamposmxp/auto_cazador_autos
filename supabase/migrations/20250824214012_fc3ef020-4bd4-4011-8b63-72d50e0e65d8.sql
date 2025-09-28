-- Fix the functions that don't have search_path set properly
CREATE OR REPLACE FUNCTION public.aplicar_autoajuste_general()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;