-- Agregar campos de verificación a la tabla profesionales
ALTER TABLE public.profesionales 
ADD COLUMN IF NOT EXISTS estado_verificacion text DEFAULT 'pendiente' CHECK (estado_verificacion IN ('pendiente', 'en_revision', 'verificado', 'rechazado')),
ADD COLUMN IF NOT EXISTS fecha_solicitud timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS fecha_verificacion timestamp with time zone,
ADD COLUMN IF NOT EXISTS documentos_verificacion jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS comentarios_verificacion text,
ADD COLUMN IF NOT EXISTS verificado_por uuid REFERENCES auth.users(id);

-- Cambiar el default de activo a false para nuevos profesionales
ALTER TABLE public.profesionales 
ALTER COLUMN activo SET DEFAULT false;

-- Crear tabla para documentos de verificación
CREATE TABLE IF NOT EXISTS public.documentos_profesional (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id uuid NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL CHECK (tipo_documento IN ('rfc', 'comprobante_domicilio', 'identificacion', 'licencia_funcionamiento', 'foto_establecimiento')),
  url_documento text NOT NULL,
  nombre_archivo text NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  comentarios text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.documentos_profesional ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para documentos_profesional
CREATE POLICY "Admins can manage all documents" ON public.documentos_profesional
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can manage their own documents" ON public.documentos_profesional
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profesionales p 
      WHERE p.id = documentos_profesional.profesional_id 
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profesionales p 
      WHERE p.id = documentos_profesional.profesional_id 
      AND p.user_id = auth.uid()
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_documentos_profesional_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documentos_profesional_updated_at
    BEFORE UPDATE ON public.documentos_profesional
    FOR EACH ROW
    EXECUTE FUNCTION public.update_documentos_profesional_updated_at();

-- Crear tabla para historial de verificaciones
CREATE TABLE IF NOT EXISTS public.historial_verificaciones (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id uuid NOT NULL REFERENCES public.profesionales(id) ON DELETE CASCADE,
  accion text NOT NULL CHECK (accion IN ('solicitud', 'revision_iniciada', 'documentos_recibidos', 'verificado', 'rechazado', 'suspendido')),
  comentarios text,
  realizado_por uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS en historial_verificaciones
ALTER TABLE public.historial_verificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para historial_verificaciones
CREATE POLICY "Admins can view all verification history" ON public.historial_verificaciones
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert verification history" ON public.historial_verificaciones
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Professionals can view their own verification history" ON public.historial_verificaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profesionales p 
      WHERE p.id = historial_verificaciones.profesional_id 
      AND p.user_id = auth.uid()
    )
  );

-- Restricción: Solo profesionales verificados pueden hacer ofertas
-- Modificar política existente de ofertas para incluir verificación
DROP POLICY IF EXISTS "Professionals can insert offers" ON public.ofertas;

CREATE POLICY "Verified professionals can insert offers" ON public.ofertas
  FOR INSERT WITH CHECK (
    profesional_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM public.profesionales p 
      WHERE p.user_id = profesional_id 
      AND p.activo = true 
      AND p.estado_verificacion = 'verificado'
    ) AND 
    EXISTS (
      SELECT 1 FROM public.autos_venta av 
      WHERE av.id = ofertas.auto_venta_id 
      AND av.recibiendo_ofertas = true
    )
  );