-- Tabla para almacenar resultados calculados como fallback
CREATE TABLE IF NOT EXISTS public.vehicle_calculation_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id TEXT NOT NULL UNIQUE,
  
  -- Datos del vehículo para referencia
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  version TEXT NOT NULL,
  
  -- Resultados calculados (lo que se muestra en la UI)
  precio_promedio NUMERIC NOT NULL,
  precio_minimo NUMERIC,
  precio_maximo NUMERIC,
  total_anuncios INTEGER DEFAULT 0,
  demanda_nivel TEXT,
  competencia_nivel TEXT,
  kilometraje_promedio NUMERIC,
  
  -- Datos adicionales para análisis
  distribucion_precios JSONB,
  estadisticas_completas JSONB,
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_successful_fetch TIMESTAMPTZ DEFAULT now(),
  fetch_count INTEGER DEFAULT 1
);

-- Índice para búsquedas rápidas por version_id
CREATE INDEX IF NOT EXISTS idx_vehicle_calculation_cache_version_id 
ON public.vehicle_calculation_cache(version_id);

-- Índice para búsquedas por marca/modelo/año
CREATE INDEX IF NOT EXISTS idx_vehicle_calculation_cache_vehicle 
ON public.vehicle_calculation_cache(marca, modelo, ano);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_vehicle_calculation_cache_updated_at
  BEFORE UPDATE ON public.vehicle_calculation_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.vehicle_calculation_cache ENABLE ROW LEVEL SECURITY;

-- Política: todos pueden leer (caché público)
CREATE POLICY "Todos pueden leer caché de cálculos"
  ON public.vehicle_calculation_cache
  FOR SELECT
  TO public
  USING (true);

-- Política: solo usuarios autenticados pueden insertar/actualizar
CREATE POLICY "Usuarios autenticados pueden actualizar caché"
  ON public.vehicle_calculation_cache
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE public.vehicle_calculation_cache IS 'Caché de resultados calculados para fallback cuando la API externa falla';
COMMENT ON COLUMN public.vehicle_calculation_cache.version_id IS 'ID único de la versión del vehículo desde MaxiPublica';
COMMENT ON COLUMN public.vehicle_calculation_cache.estadisticas_completas IS 'Estadísticas completas en formato JSON para restauración completa de la UI';
COMMENT ON COLUMN public.vehicle_calculation_cache.last_successful_fetch IS 'Última vez que se obtuvo exitosamente desde la API';