-- Crear tabla para evaluaciones pendientes entre clientes y profesionales
CREATE TABLE public.evaluaciones_cliente_profesional_pendientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaccion_id UUID NOT NULL,
  evaluador_id UUID NOT NULL,
  evaluado_id UUID NOT NULL,
  tipo_evaluador TEXT NOT NULL CHECK (tipo_evaluador IN ('cliente', 'profesional')),
  calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  aspectos JSONB DEFAULT '{}',
  comentario TEXT,
  fecha_evaluacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revelada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Añadir campos necesarios a la tabla interacciones_profesionales
ALTER TABLE public.interacciones_profesionales 
ADD COLUMN IF NOT EXISTS fecha_limite_evaluacion TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS evaluaciones_reveladas BOOLEAN NOT NULL DEFAULT false;

-- Crear función para verificar y revelar evaluaciones cliente-profesional
CREATE OR REPLACE FUNCTION public.verificar_y_revelar_evaluaciones_cliente_profesional()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Crear trigger para actualizar timestamp
CREATE TRIGGER update_evaluaciones_cliente_profesional_pendientes_updated_at
  BEFORE UPDATE ON public.evaluaciones_cliente_profesional_pendientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.evaluaciones_cliente_profesional_pendientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para evaluaciones pendientes cliente-profesional
CREATE POLICY "Evaluadores pueden crear sus evaluaciones"
  ON public.evaluaciones_cliente_profesional_pendientes
  FOR INSERT
  WITH CHECK (
    (tipo_evaluador = 'cliente' AND EXISTS (
      SELECT 1 FROM clientes c WHERE c.id = evaluador_id AND c.correo_electronico = (auth.jwt() ->> 'email')
    )) OR
    (tipo_evaluador = 'profesional' AND EXISTS (
      SELECT 1 FROM profesionales p WHERE p.id = evaluador_id AND p.user_id = auth.uid()
    ))
  );

CREATE POLICY "Evaluadores solo ven sus propias evaluaciones pendientes"
  ON public.evaluaciones_cliente_profesional_pendientes
  FOR SELECT
  USING (
    (tipo_evaluador = 'cliente' AND EXISTS (
      SELECT 1 FROM clientes c WHERE c.id = evaluador_id AND c.correo_electronico = (auth.jwt() ->> 'email')
    )) OR
    (tipo_evaluador = 'profesional' AND EXISTS (
      SELECT 1 FROM profesionales p WHERE p.id = evaluador_id AND p.user_id = auth.uid()
    )) OR
    (revelada = true AND (
      (tipo_evaluador = 'cliente' AND EXISTS (
        SELECT 1 FROM clientes c WHERE c.id = evaluado_id AND c.correo_electronico = (auth.jwt() ->> 'email')
      )) OR
      (tipo_evaluador = 'profesional' AND EXISTS (
        SELECT 1 FROM profesionales p WHERE p.id = evaluado_id AND p.user_id = auth.uid()
      ))
    ))
  );

CREATE POLICY "Sistema puede gestionar evaluaciones"
  ON public.evaluaciones_cliente_profesional_pendientes
  FOR ALL
  USING (true)
  WITH CHECK (true);