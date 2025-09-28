-- Crear tabla para interacciones entre profesionales (B2B)
CREATE TABLE public.interacciones_profesional_profesional (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_iniciador_id UUID NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  profesional_receptor_id UUID NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  auto_inventario_id UUID NOT NULL REFERENCES public.autos_profesional_inventario(id) ON DELETE CASCADE,
  primera_interaccion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  telefono_revelado BOOLEAN NOT NULL DEFAULT false,
  elegible_evaluacion BOOLEAN NOT NULL DEFAULT false,
  fecha_limite_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  evaluaciones_completadas BOOLEAN NOT NULL DEFAULT false,
  evaluaciones_reveladas BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profesional_iniciador_id, profesional_receptor_id, auto_inventario_id)
);

-- Crear tabla para mensajes entre profesionales
CREATE TABLE public.mensajes_profesional_profesional (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaccion_id UUID NOT NULL REFERENCES public.interacciones_profesional_profesional(id) ON DELETE CASCADE,
  remitente_id UUID NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para evaluaciones pendientes entre profesionales
CREATE TABLE public.evaluaciones_profesional_pendientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaccion_id UUID NOT NULL REFERENCES public.interacciones_profesional_profesional(id) ON DELETE CASCADE,
  evaluador_id UUID NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  evaluado_id UUID NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  tipo_interaccion TEXT NOT NULL CHECK (tipo_interaccion IN ('compra', 'venta')),
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  aspectos JSONB DEFAULT '{}',
  comentario TEXT,
  fecha_evaluacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revelada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(interaccion_id, evaluador_id)
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.interacciones_profesional_profesional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensajes_profesional_profesional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones_profesional_pendientes ENABLE ROW LEVEL SECURITY;

-- Políticas para interacciones_profesional_profesional
CREATE POLICY "Profesionales pueden ver sus interacciones"
ON public.interacciones_profesional_profesional FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id IN (interacciones_profesional_profesional.profesional_iniciador_id, interacciones_profesional_profesional.profesional_receptor_id)
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Sistema puede gestionar interacciones profesionales"
ON public.interacciones_profesional_profesional FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para mensajes_profesional_profesional
CREATE POLICY "Profesionales pueden ver mensajes de sus interacciones"
ON public.mensajes_profesional_profesional FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.interacciones_profesional_profesional i
    JOIN public.profesionales p ON p.id IN (i.profesional_iniciador_id, i.profesional_receptor_id)
    WHERE i.id = mensajes_profesional_profesional.interaccion_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Profesionales pueden crear mensajes"
ON public.mensajes_profesional_profesional FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = mensajes_profesional_profesional.remitente_id
    AND p.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.interacciones_profesional_profesional i
    WHERE i.id = mensajes_profesional_profesional.interaccion_id
    AND (i.profesional_iniciador_id = mensajes_profesional_profesional.remitente_id 
         OR i.profesional_receptor_id = mensajes_profesional_profesional.remitente_id)
  )
);

CREATE POLICY "Profesionales pueden actualizar sus mensajes"
ON public.mensajes_profesional_profesional FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = mensajes_profesional_profesional.remitente_id
    AND p.user_id = auth.uid()
  )
);

-- Políticas para evaluaciones_profesional_pendientes
-- CRÍTICO: Solo se pueden ver evaluaciones propias hasta que se revelen
CREATE POLICY "Profesionales solo ven sus propias evaluaciones pendientes"
ON public.evaluaciones_profesional_pendientes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = evaluaciones_profesional_pendientes.evaluador_id
    AND p.user_id = auth.uid()
  )
  OR (
    revelada = true 
    AND EXISTS (
      SELECT 1 FROM public.profesionales p
      WHERE p.id = evaluaciones_profesional_pendientes.evaluado_id
      AND p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Profesionales pueden crear sus evaluaciones"
ON public.evaluaciones_profesional_pendientes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = evaluaciones_profesional_pendientes.evaluador_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Sistema puede gestionar evaluaciones"
ON public.evaluaciones_profesional_pendientes FOR ALL
USING (true)
WITH CHECK (true);

-- Función para actualizar elegibilidad de evaluación B2B
CREATE OR REPLACE FUNCTION public.actualizar_elegibilidad_evaluacion_b2b()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar y revelar evaluaciones
CREATE OR REPLACE FUNCTION public.verificar_y_revelar_evaluaciones()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para procesar mensajes B2B
CREATE TRIGGER trigger_actualizar_elegibilidad_b2b
  AFTER INSERT ON public.mensajes_profesional_profesional
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_elegibilidad_evaluacion_b2b();

-- Triggers para updated_at
CREATE TRIGGER update_interacciones_profesional_profesional_updated_at
  BEFORE UPDATE ON public.interacciones_profesional_profesional
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mensajes_profesional_profesional_updated_at
  BEFORE UPDATE ON public.mensajes_profesional_profesional
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluaciones_profesional_pendientes_updated_at
  BEFORE UPDATE ON public.evaluaciones_profesional_pendientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar tiempo real
ALTER TABLE public.interacciones_profesional_profesional REPLICA IDENTITY FULL;
ALTER TABLE public.mensajes_profesional_profesional REPLICA IDENTITY FULL;
ALTER TABLE public.evaluaciones_profesional_pendientes REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.interacciones_profesional_profesional;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_profesional_profesional;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluaciones_profesional_pendientes;

-- Crear índices para mejor performance
CREATE INDEX idx_interacciones_b2b_profesionales ON public.interacciones_profesional_profesional(profesional_iniciador_id, profesional_receptor_id);
CREATE INDEX idx_mensajes_b2b_interaccion ON public.mensajes_profesional_profesional(interaccion_id);
CREATE INDEX idx_evaluaciones_pendientes_interaccion ON public.evaluaciones_profesional_pendientes(interaccion_id);
CREATE INDEX idx_evaluaciones_pendientes_revelada ON public.evaluaciones_profesional_pendientes(revelada) WHERE revelada = false;