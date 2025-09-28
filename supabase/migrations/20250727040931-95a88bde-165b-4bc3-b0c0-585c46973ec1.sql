-- Crear tabla para el progreso de extracción masiva
CREATE TABLE public.progreso_extraccion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sesion_id UUID NOT NULL DEFAULT gen_random_uuid(),
  estrategia TEXT NOT NULL, -- 'categoria', 'marca', 'estado', 'precio'
  parametro TEXT NOT NULL, -- el valor específico (ej: 'autos', 'toyota', 'cdmx')
  estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'procesando', 'completado', 'error'
  urls_extraidas INTEGER DEFAULT 0,
  anuncios_procesados INTEGER DEFAULT 0,
  paginas_procesadas INTEGER DEFAULT 0,
  errores_count INTEGER DEFAULT 0,
  tiempo_inicio TIMESTAMP WITH TIME ZONE,
  tiempo_fin TIMESTAMP WITH TIME ZONE,
  detalles JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.progreso_extraccion ENABLE ROW LEVEL SECURITY;

-- Crear políticas para acceso público
CREATE POLICY "Allow all operations on extraction progress" 
ON public.progreso_extraccion 
FOR ALL 
USING (true);

-- Crear índices para optimizar consultas
CREATE INDEX idx_progreso_extraccion_sesion ON public.progreso_extraccion(sesion_id);
CREATE INDEX idx_progreso_extraccion_estado ON public.progreso_extraccion(estado);
CREATE INDEX idx_progreso_extraccion_estrategia ON public.progreso_extraccion(estrategia);

-- Trigger para actualizar timestamp
CREATE TRIGGER update_progreso_extraccion_updated_at
BEFORE UPDATE ON public.progreso_extraccion
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Corregir inconsistencias en sitio_web
UPDATE public.anuncios_vehiculos 
SET sitio_web = 'mercadolibre.com.mx' 
WHERE sitio_web = 'mercadolibre';

-- Crear índices optimizados para anuncios_vehiculos
CREATE INDEX IF NOT EXISTS idx_anuncios_vehiculos_sitio_web ON public.anuncios_vehiculos(sitio_web);
CREATE INDEX IF NOT EXISTS idx_anuncios_vehiculos_marca ON public.anuncios_vehiculos(marca);
CREATE INDEX IF NOT EXISTS idx_anuncios_vehiculos_fecha ON public.anuncios_vehiculos(fecha_extraccion);
CREATE INDEX IF NOT EXISTS idx_anuncios_vehiculos_precio ON public.anuncios_vehiculos(precio);
CREATE INDEX IF NOT EXISTS idx_anuncios_vehiculos_activo ON public.anuncios_vehiculos(activo);

-- Crear tabla para estadísticas de extracción en tiempo real
CREATE TABLE public.estadisticas_extraccion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sesion_id UUID NOT NULL,
  total_urls_objetivo INTEGER DEFAULT 0,
  total_urls_extraidas INTEGER DEFAULT 0,
  total_anuncios_procesados INTEGER DEFAULT 0,
  total_anuncios_nuevos INTEGER DEFAULT 0,
  total_anuncios_actualizados INTEGER DEFAULT 0,
  total_errores INTEGER DEFAULT 0,
  tiempo_estimado_restante INTEGER, -- en minutos
  porcentaje_completado DECIMAL(5,2) DEFAULT 0,
  estado_general TEXT DEFAULT 'iniciando',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para estadísticas
ALTER TABLE public.estadisticas_extraccion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on extraction stats" 
ON public.estadisticas_extraccion 
FOR ALL 
USING (true);

-- Trigger para estadísticas
CREATE TRIGGER update_estadisticas_extraccion_updated_at
BEFORE UPDATE ON public.estadisticas_extraccion
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();