-- Add precio_minimo and precio_maximo fields to the mock data structure
-- Since this appears to be a frontend-heavy app with mock data, we'll add these fields to support the new price adjustment functionality

-- First, let's check if there's a real autos table or if we need to create one for the professional's inventory
CREATE TABLE IF NOT EXISTS public.autos_profesional_inventario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  precio_actual NUMERIC NOT NULL,
  precio_original NUMERIC,
  precio_minimo NUMERIC, -- New field: minimum price for automatic adjustments
  precio_maximo NUMERIC, -- New field: maximum price (optional)
  kilometraje INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo',
  imagen_url TEXT,
  descripcion TEXT,
  ubicacion TEXT,
  caracteristicas JSONB DEFAULT '{}',
  fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.autos_profesional_inventario ENABLE ROW LEVEL SECURITY;

-- Create policies for professional car inventory
CREATE POLICY "Professionals can manage their own inventory"
ON public.autos_profesional_inventario
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profesionales p 
    WHERE p.id = profesional_id AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profesionales p 
    WHERE p.id = profesional_id AND p.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_autos_profesional_inventario_updated_at
BEFORE UPDATE ON public.autos_profesional_inventario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_autos_profesional_inventario_profesional_id ON public.autos_profesional_inventario(profesional_id);
CREATE INDEX idx_autos_profesional_inventario_estado ON public.autos_profesional_inventario(estado);