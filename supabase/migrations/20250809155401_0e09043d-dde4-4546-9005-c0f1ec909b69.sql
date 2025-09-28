-- Add new columns for offers and auto selling control
-- 1) ofertas: rango de oferta y preferente
ALTER TABLE public.ofertas
  ADD COLUMN IF NOT EXISTS monto_min NUMERIC,
  ADD COLUMN IF NOT EXISTS monto_max NUMERIC,
  ADD COLUMN IF NOT EXISTS preferente BOOLEAN NOT NULL DEFAULT false;

-- 2) autos_venta: control para recibir ofertas
ALTER TABLE public.autos_venta
  ADD COLUMN IF NOT EXISTS recibiendo_ofertas BOOLEAN NOT NULL DEFAULT true;

-- 3) profiles: info del negocio/profesional
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS negocio_nombre TEXT,
  ADD COLUMN IF NOT EXISTS reputacion NUMERIC,
  ADD COLUMN IF NOT EXISTS ubicacion_ciudad TEXT,
  ADD COLUMN IF NOT EXISTS ubicacion_estado TEXT,
  ADD COLUMN IF NOT EXISTS contacto_nombre TEXT,
  ADD COLUMN IF NOT EXISTS contacto_telefono TEXT;

-- 4) Actualizar política de INSERT en ofertas para impedir inserciones si el auto dejó de recibir ofertas
DO $$
BEGIN
  -- Drop existing policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ofertas' AND policyname = 'Professionals can insert offers'
  ) THEN
    DROP POLICY "Professionals can insert offers" ON public.ofertas;
  END IF;

  -- Create stricter INSERT policy
  CREATE POLICY "Professionals can insert offers"
  ON public.ofertas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    profesional_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.autos_venta av
      WHERE av.id = ofertas.auto_venta_id
        AND av.recibiendo_ofertas = true
    )
  );
END $$;