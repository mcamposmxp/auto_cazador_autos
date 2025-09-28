-- Crear tabla para reviews de profesionales
CREATE TABLE public.reviews_profesionales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  oferta_id UUID NOT NULL,
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT,
  aspectos JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, oferta_id) -- Un cliente solo puede revisar una vez por oferta
);

-- Crear tabla para estadísticas de reputación de profesionales
CREATE TABLE public.stats_profesionales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id UUID NOT NULL UNIQUE,
  calificacion_promedio NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_ofertas_enviadas INTEGER DEFAULT 0,
  total_ofertas_aceptadas INTEGER DEFAULT 0,
  tasa_respuesta NUMERIC(5,2) DEFAULT 0,
  badge_confianza TEXT DEFAULT 'nuevo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews_profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_profesionales ENABLE ROW LEVEL SECURITY;

-- Policies para reviews_profesionales
CREATE POLICY "Clientes pueden crear reviews de ofertas que recibieron"
ON public.reviews_profesionales
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ofertas o
    JOIN autos_venta av ON av.id = o.auto_venta_id
    JOIN clientes c ON c.id = av.cliente_id
    WHERE o.id = reviews_profesionales.oferta_id
      AND c.id = reviews_profesionales.cliente_id
      AND o.profesional_id = reviews_profesionales.profesional_id
      AND c.correo_electronico = (auth.jwt() ->> 'email')
      AND o.estado = 'aceptada' -- Solo pueden revisar ofertas aceptadas
  )
);

CREATE POLICY "Clientes pueden ver y actualizar sus propios reviews"
ON public.reviews_profesionales
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.id = reviews_profesionales.cliente_id
      AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Profesionales pueden ver reviews sobre ellos"
ON public.reviews_profesionales
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profesionales p
    WHERE p.id = reviews_profesionales.profesional_id
      AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Todos pueden ver reviews para mostrar reputación"
ON public.reviews_profesionales
FOR SELECT
USING (true);

-- Policies para stats_profesionales
CREATE POLICY "Todos pueden ver estadísticas de profesionales"
ON public.stats_profesionales
FOR SELECT
USING (true);

CREATE POLICY "Solo sistema puede actualizar estadísticas"
ON public.stats_profesionales
FOR ALL
USING (true)
WITH CHECK (true);

-- Función para actualizar estadísticas de profesional
CREATE OR REPLACE FUNCTION public.actualizar_stats_profesional(p_profesional_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  FROM reviews_profesionales
  WHERE profesional_id = p_profesional_id;

  SELECT COUNT(*) INTO total_ofertas
  FROM ofertas
  WHERE profesional_id = p_profesional_id;

  SELECT COUNT(*) INTO ofertas_aceptadas
  FROM ofertas
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
  INSERT INTO stats_profesionales (
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

-- Trigger para actualizar estadísticas automáticamente
CREATE OR REPLACE FUNCTION public.trigger_actualizar_stats_profesional()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM actualizar_stats_profesional(NEW.profesional_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM actualizar_stats_profesional(OLD.profesional_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_reviews_actualizar_stats
  AFTER INSERT OR UPDATE OR DELETE ON reviews_profesionales
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_stats_profesional();

-- Trigger para actualizar stats cuando cambian ofertas
CREATE TRIGGER trigger_ofertas_actualizar_stats
  AFTER INSERT OR UPDATE OR DELETE ON ofertas
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_stats_profesional();