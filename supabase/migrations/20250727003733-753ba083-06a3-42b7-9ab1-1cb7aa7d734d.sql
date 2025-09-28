-- Crear tabla principal de anuncios de vehículos
CREATE TABLE public.anuncios_vehiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url_anuncio TEXT NOT NULL UNIQUE,
  sitio_web TEXT NOT NULL,
  titulo TEXT NOT NULL,
  precio DECIMAL(12,2),
  precio_original TEXT, -- Para almacenar el precio tal como aparece en el sitio
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  kilometraje INTEGER,
  kilometraje_original TEXT, -- Para almacenar el kilometraje original
  combustible TEXT,
  transmision TEXT,
  tipo_vehiculo TEXT,
  color TEXT,
  descripcion TEXT,
  ubicacion TEXT,
  telefono TEXT,
  email TEXT,
  imagenes JSONB DEFAULT '[]'::jsonb,
  caracteristicas JSONB DEFAULT '{}'::jsonb,
  datos_raw JSONB DEFAULT '{}'::jsonb, -- Datos originales sin procesar
  hash_contenido TEXT, -- Para detectar duplicados
  estado_normalizacion TEXT DEFAULT 'pendiente' CHECK (estado_normalizacion IN ('pendiente', 'procesado', 'error')),
  fecha_extraccion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_actualizacion TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para normalización de marcas
CREATE TABLE public.marcas_normalizadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca_original TEXT NOT NULL,
  marca_normalizada TEXT NOT NULL,
  confianza DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para normalización de modelos
CREATE TABLE public.modelos_normalizados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca_id UUID REFERENCES public.marcas_normalizadas(id),
  modelo_original TEXT NOT NULL,
  modelo_normalizado TEXT NOT NULL,
  confianza DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para detectar duplicados
CREATE TABLE public.anuncios_similares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  anuncio_1_id UUID REFERENCES public.anuncios_vehiculos(id) ON DELETE CASCADE,
  anuncio_2_id UUID REFERENCES public.anuncios_vehiculos(id) ON DELETE CASCADE,
  tipo_similitud TEXT NOT NULL CHECK (tipo_similitud IN ('exacto', 'fuzzy_text', 'imagen', 'datos_principales')),
  score_similitud DECIMAL(3,2) NOT NULL,
  detalles JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(anuncio_1_id, anuncio_2_id, tipo_similitud)
);

-- Crear tabla para configuración de extracción
CREATE TABLE public.configuracion_extraccion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sitio_web TEXT NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT true,
  selectores JSONB NOT NULL DEFAULT '{}'::jsonb,
  headers JSONB DEFAULT '{}'::jsonb,
  delay_entre_requests INTEGER DEFAULT 2000,
  max_requests_por_minuto INTEGER DEFAULT 30,
  user_agents JSONB DEFAULT '[]'::jsonb,
  proxies JSONB DEFAULT '[]'::jsonb,
  ultima_extraccion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para logs de extracción
CREATE TABLE public.logs_extraccion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sitio_web TEXT NOT NULL,
  url TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('exito', 'error', 'bloqueado', 'timeout')),
  mensaje TEXT,
  tiempo_respuesta INTEGER, -- en milisegundos
  ip_utilizada INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para optimizar consultas
CREATE INDEX idx_anuncios_sitio_web ON public.anuncios_vehiculos(sitio_web);
CREATE INDEX idx_anuncios_marca_modelo ON public.anuncios_vehiculos(marca, modelo);
CREATE INDEX idx_anuncios_precio ON public.anuncios_vehiculos(precio);
CREATE INDEX idx_anuncios_fecha_extraccion ON public.anuncios_vehiculos(fecha_extraccion);
CREATE INDEX idx_anuncios_hash_contenido ON public.anuncios_vehiculos(hash_contenido);
CREATE INDEX idx_anuncios_estado_normalizacion ON public.anuncios_vehiculos(estado_normalizacion);
CREATE INDEX idx_logs_sitio_fecha ON public.logs_extraccion(sitio_web, created_at);

-- Habilitar RLS
ALTER TABLE public.anuncios_vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas_normalizadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos_normalizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anuncios_similares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_extraccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_extraccion ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir todo por ahora para el desarrollo)
CREATE POLICY "Allow all operations" ON public.anuncios_vehiculos FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.marcas_normalizadas FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.modelos_normalizados FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.anuncios_similares FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.configuracion_extraccion FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.logs_extraccion FOR ALL USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_anuncios_updated_at
  BEFORE UPDATE ON public.anuncios_vehiculos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracion_updated_at
  BEFORE UPDATE ON public.configuracion_extraccion
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();