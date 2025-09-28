-- Crear tabla de configuración de autoajuste de precios general para profesionales
CREATE TABLE public.config_autoajuste_general (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  activo BOOLEAN NOT NULL DEFAULT false,
  precio_minimo NUMERIC(10,2),
  precio_maximo NUMERIC(10,2),
  
  -- Reglas por demanda
  demanda_activa BOOLEAN DEFAULT false,
  demanda_dias_evaluar INTEGER DEFAULT 7,
  demanda_contactos_minimos INTEGER DEFAULT 5,
  demanda_contactos_maximos INTEGER DEFAULT 30,
  demanda_accion_reducir_tipo TEXT CHECK (demanda_accion_reducir_tipo IN ('fijo', 'porcentaje')),
  demanda_accion_reducir_valor NUMERIC(10,2),
  demanda_accion_aumentar_tipo TEXT CHECK (demanda_accion_aumentar_tipo IN ('fijo', 'porcentaje')),
  demanda_accion_aumentar_valor NUMERIC(10,2),
  
  -- Reglas por tiempo en stock
  tiempo_activa BOOLEAN DEFAULT false,
  tiempo_dias_limite INTEGER DEFAULT 20,
  tiempo_accion_tipo TEXT CHECK (tiempo_accion_tipo IN ('fijo', 'porcentaje')),
  tiempo_accion_valor NUMERIC(10,2),
  
  -- Reglas programadas
  calendario_activa BOOLEAN DEFAULT false,
  calendario_frecuencia TEXT CHECK (calendario_frecuencia IN ('diario', 'semanal', 'quincenal', 'mensual', 'personalizado')),
  calendario_fecha_inicio DATE,
  calendario_fecha_fin DATE,
  calendario_accion_tipo TEXT CHECK (calendario_accion_tipo IN ('fijo', 'porcentaje')),
  calendario_accion_valor NUMERIC(10,2),
  calendario_es_aumento BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla de configuración de autoajuste específica por auto
CREATE TABLE public.config_autoajuste_auto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  auto_id UUID NOT NULL, -- referencia al auto específico del profesional
  activo BOOLEAN NOT NULL DEFAULT false,
  precio_inicial NUMERIC(10,2) NOT NULL,
  precio_minimo NUMERIC(10,2),
  precio_maximo NUMERIC(10,2),
  
  -- Reglas por demanda
  demanda_activa BOOLEAN DEFAULT false,
  demanda_dias_evaluar INTEGER DEFAULT 7,
  demanda_contactos_minimos INTEGER DEFAULT 5,
  demanda_contactos_maximos INTEGER DEFAULT 30,
  demanda_accion_reducir_tipo TEXT CHECK (demanda_accion_reducir_tipo IN ('fijo', 'porcentaje')),
  demanda_accion_reducir_valor NUMERIC(10,2),
  demanda_accion_aumentar_tipo TEXT CHECK (demanda_accion_aumentar_tipo IN ('fijo', 'porcentaje')),
  demanda_accion_aumentar_valor NUMERIC(10,2),
  
  -- Reglas por tiempo en stock
  tiempo_activa BOOLEAN DEFAULT false,
  tiempo_dias_limite INTEGER DEFAULT 20,
  tiempo_accion_tipo TEXT CHECK (tiempo_accion_tipo IN ('fijo', 'porcentaje')),
  tiempo_accion_valor NUMERIC(10,2),
  
  -- Reglas programadas
  calendario_activa BOOLEAN DEFAULT false,
  calendario_frecuencia TEXT CHECK (calendario_frecuencia IN ('diario', 'semanal', 'quincenal', 'mensual', 'personalizado')),
  calendario_fecha_inicio DATE,
  calendario_fecha_fin DATE,
  calendario_accion_tipo TEXT CHECK (calendario_accion_tipo IN ('fijo', 'porcentaje')),
  calendario_accion_valor NUMERIC(10,2),
  calendario_es_aumento BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(profesional_id, auto_id)
);

-- Crear tabla de historial de cambios de precios
CREATE TABLE public.historial_cambios_precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id UUID NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  auto_id UUID NOT NULL,
  precio_anterior NUMERIC(10,2) NOT NULL,
  precio_nuevo NUMERIC(10,2) NOT NULL,
  regla_aplicada TEXT NOT NULL, -- 'demanda', 'tiempo', 'calendario', 'manual'
  detalles_regla JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.config_autoajuste_general ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_autoajuste_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_cambios_precios ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad para config_autoajuste_general
CREATE POLICY "Profesionales pueden gestionar su config general"
ON public.config_autoajuste_general
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = config_autoajuste_general.profesional_id
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = config_autoajuste_general.profesional_id
    AND p.user_id = auth.uid()
  )
);

-- Crear políticas de seguridad para config_autoajuste_auto
CREATE POLICY "Profesionales pueden gestionar su config por auto"
ON public.config_autoajuste_auto
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = config_autoajuste_auto.profesional_id
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = config_autoajuste_auto.profesional_id
    AND p.user_id = auth.uid()
  )
);

-- Crear políticas de seguridad para historial_cambios_precios
CREATE POLICY "Profesionales pueden ver su historial de cambios"
ON public.historial_cambios_precios
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = historial_cambios_precios.profesional_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Solo sistema puede insertar historial"
ON public.historial_cambios_precios
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = historial_cambios_precios.profesional_id
    AND p.user_id = auth.uid()
  )
);

-- Agregar trigger para actualizar updated_at
CREATE TRIGGER update_config_autoajuste_general_updated_at
  BEFORE UPDATE ON public.config_autoajuste_general
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_config_autoajuste_auto_updated_at
  BEFORE UPDATE ON public.config_autoajuste_auto
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();