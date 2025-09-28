-- Crear tabla para filtros de ofertas de profesionales
CREATE TABLE public.profesional_filtros_ofertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id UUID NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT false,
  tipo_filtro TEXT NOT NULL DEFAULT 'todos', -- 'todos' o 'personalizado'
  filtros_vehiculo JSONB NOT NULL DEFAULT '{
    "marcas_modelos": [],
    "rango_precio": {
      "activo": false,
      "min": 0,
      "max": 2000000
    },
    "rango_kilometraje": {
      "activo": false,
      "min": 0,
      "max": 300000
    }
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profesional_id)
);

-- Enable RLS
ALTER TABLE public.profesional_filtros_ofertas ENABLE ROW LEVEL SECURITY;

-- Policies para filtros de ofertas
CREATE POLICY "Profesionales pueden gestionar sus filtros"
  ON public.profesional_filtros_ofertas
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profesionales p
    WHERE p.id = profesional_filtros_ofertas.profesional_id 
    AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profesionales p
    WHERE p.id = profesional_filtros_ofertas.profesional_id 
    AND p.user_id = auth.uid()
  ));

-- Sistema puede leer filtros para aplicarlos
CREATE POLICY "Sistema puede leer filtros"
  ON public.profesional_filtros_ofertas
  FOR SELECT
  USING (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profesional_filtros_ofertas_updated_at
  BEFORE UPDATE ON public.profesional_filtros_ofertas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para evaluar si un vehículo cumple con los filtros de un profesional
CREATE OR REPLACE FUNCTION public.evaluar_filtros_vehiculo(
  p_profesional_id UUID,
  p_marca TEXT,
  p_modelo TEXT,
  p_ano INTEGER,
  p_kilometraje INTEGER,
  p_precio_estimado NUMERIC DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;