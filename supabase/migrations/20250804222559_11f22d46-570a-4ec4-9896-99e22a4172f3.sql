-- Crear tabla de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_apellido TEXT NOT NULL,
  correo_electronico TEXT NOT NULL,
  numero_telefonico TEXT NOT NULL,
  estado TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  preferencia_contacto TEXT NOT NULL CHECK (preferencia_contacto IN ('correo', 'telefono', 'whatsapp')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de autos para vender
CREATE TABLE public.autos_venta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  marca TEXT NOT NULL,
  ano INTEGER NOT NULL,
  modelo TEXT NOT NULL,
  version TEXT,
  kilometraje INTEGER NOT NULL,
  servicios_agencia BOOLEAN NOT NULL,
  documentos_orden BOOLEAN NOT NULL,
  comentarios_documentos TEXT,
  estado_auto TEXT NOT NULL CHECK (estado_auto IN ('excelente', 'bueno', 'regular', 'con_detalles')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en ambas tablas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autos_venta ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir todas las operaciones (formulario público)
CREATE POLICY "Permitir todas las operaciones en clientes" 
ON public.clientes 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir todas las operaciones en autos_venta" 
ON public.autos_venta 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_autos_venta_updated_at
BEFORE UPDATE ON public.autos_venta
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();