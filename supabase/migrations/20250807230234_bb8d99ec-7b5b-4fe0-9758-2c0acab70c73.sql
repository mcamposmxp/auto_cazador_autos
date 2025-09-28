-- Create table for users interested in auctioning their car
CREATE TABLE IF NOT EXISTS public.subasta_autos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  -- Vendedor datos
  vendedor_nombre TEXT NOT NULL,
  vendedor_correo TEXT NOT NULL,
  vendedor_telefono TEXT NOT NULL,
  estado TEXT,
  ciudad TEXT,
  preferencia_contacto TEXT,
  -- Vehículo datos
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  version TEXT,
  ano INTEGER NOT NULL,
  kilometraje INTEGER NOT NULL,
  servicios_agencia BOOLEAN NOT NULL,
  documentos_orden BOOLEAN NOT NULL,
  comentarios_documentos TEXT,
  estado_auto TEXT NOT NULL,
  comentarios_estado TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subasta_autos ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own records
CREATE POLICY "Users can insert their own auction records"
ON public.subasta_autos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own auction records"
ON public.subasta_autos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own auction records"
ON public.subasta_autos
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_subasta_autos_updated_at'
  ) THEN
    CREATE TRIGGER update_subasta_autos_updated_at
    BEFORE UPDATE ON public.subasta_autos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;