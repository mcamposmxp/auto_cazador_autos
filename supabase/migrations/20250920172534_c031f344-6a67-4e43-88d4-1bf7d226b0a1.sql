-- Create table for professional-to-professional reviews
CREATE TABLE public.reviews_profesional_profesional (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_evaluador_id UUID NOT NULL,
  profesional_evaluado_id UUID NOT NULL,
  transaccion_id UUID NULL, -- Reference to a transaction/offer
  tipo_interaccion TEXT NOT NULL DEFAULT 'compra', -- 'compra', 'venta', 'colaboracion'
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT,
  aspectos JSONB DEFAULT '{}',
  evidencia_transaccion JSONB DEFAULT '{}', -- Evidence of real transaction
  estado_revision TEXT DEFAULT 'activa', -- 'activa', 'disputada', 'moderada'
  fecha_transaccion TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints to prevent abuse
  UNIQUE(profesional_evaluador_id, profesional_evaluado_id, transaccion_id),
  CHECK (profesional_evaluador_id != profesional_evaluado_id),
  CHECK (fecha_transaccion <= created_at)
);

-- Enable RLS
ALTER TABLE public.reviews_profesional_profesional ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profesionales pueden ver reviews sobre ellos o que hicieron"
ON public.reviews_profesional_profesional
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profesionales p 
    WHERE (p.id = profesional_evaluado_id OR p.id = profesional_evaluador_id) 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Profesionales pueden crear reviews basadas en transacciones"
ON public.reviews_profesional_profesional
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profesionales p 
    WHERE p.id = profesional_evaluador_id 
    AND p.user_id = auth.uid()
    AND p.activo = true
  )
  AND 
  -- Must be based on real transaction (offer accepted)
  EXISTS (
    SELECT 1 FROM ofertas o
    WHERE (o.id = transaccion_id OR transaccion_id IS NULL)
    AND o.profesional_id = profesional_evaluador_id
    AND o.estado = 'aceptada'
  )
  AND
  -- Cooldown period: 48 hours after transaction
  fecha_transaccion < (now() - INTERVAL '48 hours')
);

CREATE POLICY "Profesionales pueden actualizar sus propias reviews"
ON public.reviews_profesional_profesional
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profesionales p 
    WHERE p.id = profesional_evaluador_id 
    AND p.user_id = auth.uid()
  )
  AND estado_revision = 'activa'
);

CREATE POLICY "Admins pueden gestionar todas las reviews"
ON public.reviews_profesional_profesional
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Todos pueden ver reviews activas para mostrar reputación"
ON public.reviews_profesional_profesional
FOR SELECT
USING (estado_revision = 'activa');

-- Create stats table for professional-to-professional reputation
CREATE TABLE public.stats_profesional_profesional (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id UUID NOT NULL UNIQUE,
  
  -- As seller stats
  calificacion_promedio_vendedor NUMERIC(3,2) DEFAULT 0,
  total_reviews_vendedor INTEGER DEFAULT 0,
  
  -- As buyer stats  
  calificacion_promedio_comprador NUMERIC(3,2) DEFAULT 0,
  total_reviews_comprador INTEGER DEFAULT 0,
  
  -- Combined reputation
  reputacion_general NUMERIC(3,2) DEFAULT 0,
  badge_vendedor TEXT DEFAULT 'nuevo',
  badge_comprador TEXT DEFAULT 'nuevo',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for stats
ALTER TABLE public.stats_profesional_profesional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver stats profesional-profesional"
ON public.stats_profesional_profesional
FOR SELECT
USING (true);

CREATE POLICY "Solo sistema puede actualizar stats profesional-profesional"
ON public.stats_profesional_profesional
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to update professional-to-professional stats
CREATE OR REPLACE FUNCTION public.actualizar_stats_profesional_profesional(p_profesional_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  FROM reviews_profesional_profesional
  WHERE profesional_evaluado_id = p_profesional_id 
    AND tipo_interaccion IN ('venta', 'colaboracion')
    AND estado_revision = 'activa';

  -- Calculate buyer stats (when evaluated as buyer)
  SELECT 
    COALESCE(AVG(calificacion), 0),
    COUNT(*)
  INTO avg_rating_comprador, total_reviews_comprador
  FROM reviews_profesional_profesional
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
  INSERT INTO stats_profesional_profesional (
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

-- Create trigger for automatic stats updates
CREATE OR REPLACE FUNCTION public.trigger_actualizar_stats_profesional_profesional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM actualizar_stats_profesional_profesional(NEW.profesional_evaluado_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM actualizar_stats_profesional_profesional(OLD.profesional_evaluado_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_update_stats_profesional_profesional
AFTER INSERT OR UPDATE OR DELETE ON reviews_profesional_profesional
FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_stats_profesional_profesional();

-- Create indexes for performance
CREATE INDEX idx_reviews_prof_prof_evaluado ON reviews_profesional_profesional(profesional_evaluado_id);
CREATE INDEX idx_reviews_prof_prof_evaluador ON reviews_profesional_profesional(profesional_evaluador_id);
CREATE INDEX idx_reviews_prof_prof_transaccion ON reviews_profesional_profesional(transaccion_id);
CREATE INDEX idx_reviews_prof_prof_tipo ON reviews_profesional_profesional(tipo_interaccion);
CREATE INDEX idx_reviews_prof_prof_estado ON reviews_profesional_profesional(estado_revision);