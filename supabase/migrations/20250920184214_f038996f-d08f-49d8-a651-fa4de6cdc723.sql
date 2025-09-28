-- Crear tabla para mensajes entre clientes y profesionales en ofertas
CREATE TABLE public.mensajes_ofertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  oferta_id UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
  remitente_tipo TEXT NOT NULL CHECK (remitente_tipo IN ('cliente', 'profesional')),
  remitente_id UUID NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para rastrear interacciones entre clientes y profesionales
CREATE TABLE public.interacciones_profesionales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  profesional_id UUID NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  oferta_id UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
  primera_interaccion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  telefono_revelado BOOLEAN NOT NULL DEFAULT false,
  elegible_evaluacion BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, profesional_id, oferta_id)
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.mensajes_ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacciones_profesionales ENABLE ROW LEVEL SECURITY;

-- Políticas para mensajes_ofertas
CREATE POLICY "Participantes pueden ver mensajes de sus ofertas"
ON public.mensajes_ofertas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ofertas o
    JOIN public.autos_venta av ON av.id = o.auto_venta_id
    JOIN public.clientes c ON c.id = av.cliente_id
    WHERE o.id = mensajes_ofertas.oferta_id
    AND (
      (o.profesional_id = auth.uid()) -- Profesional que hizo la oferta
      OR 
      (c.correo_electronico = (auth.jwt() ->> 'email')) -- Cliente dueño del auto
    )
  )
);

CREATE POLICY "Participantes pueden crear mensajes en sus ofertas"
ON public.mensajes_ofertas FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ofertas o
    JOIN public.autos_venta av ON av.id = o.auto_venta_id
    JOIN public.clientes c ON c.id = av.cliente_id
    WHERE o.id = mensajes_ofertas.oferta_id
    AND (
      (o.profesional_id = auth.uid() AND remitente_tipo = 'profesional' AND remitente_id = auth.uid())
      OR 
      (c.correo_electronico = (auth.jwt() ->> 'email') AND remitente_tipo = 'cliente' AND remitente_id = c.id)
    )
  )
);

CREATE POLICY "Participantes pueden actualizar mensajes"
ON public.mensajes_ofertas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ofertas o
    JOIN public.autos_venta av ON av.id = o.auto_venta_id
    JOIN public.clientes c ON c.id = av.cliente_id
    WHERE o.id = mensajes_ofertas.oferta_id
    AND (
      (o.profesional_id = auth.uid()) -- Profesional que hizo la oferta
      OR 
      (c.correo_electronico = (auth.jwt() ->> 'email')) -- Cliente dueño del auto
    )
  )
);

-- Políticas para interacciones_profesionales
CREATE POLICY "Participantes pueden ver sus interacciones"
ON public.interacciones_profesionales FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profesionales p
    WHERE p.id = interacciones_profesionales.profesional_id
    AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = interacciones_profesionales.cliente_id
    AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Sistema puede gestionar interacciones"
ON public.interacciones_profesionales FOR ALL
USING (true)
WITH CHECK (true);

-- Crear función para actualizar automáticamente la elegibilidad de evaluación
CREATE OR REPLACE FUNCTION public.actualizar_elegibilidad_evaluacion()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se envía un mensaje, marcar la interacción como elegible para evaluación
  -- y revelar teléfono si es la primera respuesta del profesional
  INSERT INTO public.interacciones_profesionales (
    cliente_id,
    profesional_id,
    oferta_id,
    elegible_evaluacion,
    telefono_revelado
  )
  SELECT 
    av.cliente_id,
    o.profesional_id,
    o.id,
    true, -- Elegible para evaluación
    CASE 
      WHEN NEW.remitente_tipo = 'profesional' THEN true -- Revelar teléfono si profesional responde
      ELSE false
    END
  FROM public.ofertas o
  JOIN public.autos_venta av ON av.id = o.auto_venta_id
  WHERE o.id = NEW.oferta_id
  ON CONFLICT (cliente_id, profesional_id, oferta_id) 
  DO UPDATE SET
    elegible_evaluacion = true,
    telefono_revelado = CASE 
      WHEN NEW.remitente_tipo = 'profesional' THEN true
      ELSE interacciones_profesionales.telefono_revelado
    END,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para actualizar elegibilidad automáticamente
CREATE TRIGGER trigger_actualizar_elegibilidad
  AFTER INSERT ON public.mensajes_ofertas
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_elegibilidad_evaluacion();

-- Crear función de trigger para updated_at
CREATE TRIGGER update_mensajes_ofertas_updated_at
  BEFORE UPDATE ON public.mensajes_ofertas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interacciones_profesionales_updated_at
  BEFORE UPDATE ON public.interacciones_profesionales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Crear índices para mejor performance
CREATE INDEX idx_mensajes_ofertas_oferta_id ON public.mensajes_ofertas(oferta_id);
CREATE INDEX idx_mensajes_ofertas_created_at ON public.mensajes_ofertas(created_at);
CREATE INDEX idx_interacciones_profesionales_lookup ON public.interacciones_profesionales(cliente_id, profesional_id);
CREATE INDEX idx_interacciones_profesionales_elegible ON public.interacciones_profesionales(elegible_evaluacion) WHERE elegible_evaluacion = true;