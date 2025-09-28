-- Seed two sample profiles (using allowed tipo_usuario)
WITH ins1 AS (
  INSERT INTO public.profiles (
    user_id, nombre, apellido, telefono_movil, correo_electronico, tipo_usuario,
    negocio_nombre, reputacion, ubicacion_ciudad, ubicacion_estado, created_at, updated_at
  )
  SELECT gen_random_uuid(), 'Agencia', 'Uno', '5551112222', 'agencia1@example.com', 'particular',
         'Agencia Uno Autos', 4.5, 'Ciudad de México', 'CDMX', now(), now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE correo_electronico = 'agencia1@example.com'
  )
  RETURNING user_id
), ins2 AS (
  INSERT INTO public.profiles (
    user_id, nombre, apellido, telefono_movil, correo_electronico, tipo_usuario,
    negocio_nombre, reputacion, ubicacion_ciudad, ubicacion_estado, created_at, updated_at
  )
  SELECT gen_random_uuid(), 'Agencia', 'Dos', '5552223333', 'agencia2@example.com', 'particular',
         'Autos y Más Dos', 4.2, 'Guadalajara', 'Jalisco', now(), now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE correo_electronico = 'agencia2@example.com'
  )
  RETURNING user_id
), pro1 AS (
  SELECT user_id FROM public.profiles WHERE correo_electronico = 'agencia1@example.com' LIMIT 1
), pro2 AS (
  SELECT user_id FROM public.profiles WHERE correo_electronico = 'agencia2@example.com' LIMIT 1
)
INSERT INTO public.ofertas (auto_venta_id, profesional_id, monto_oferta, preferente, comentarios, estado)
SELECT a.id, (SELECT user_id FROM pro1), ROUND((random()*150000 + 120000)::numeric, 0), false, 'Oferta directa de compra', 'pendiente'
FROM public.autos_venta a
WHERE EXISTS (SELECT 1 FROM pro1)
  AND NOT EXISTS (
    SELECT 1 FROM public.ofertas o
    WHERE o.auto_venta_id = a.id AND o.profesional_id = (SELECT user_id FROM pro1)
  );

INSERT INTO public.ofertas (auto_venta_id, profesional_id, monto_min, monto_max, preferente, comentarios, estado)
SELECT a.id, (SELECT user_id FROM pro2), ROUND((random()*100000 + 100000)::numeric, 0), ROUND((random()*150000 + 200000)::numeric, 0), true, 'Rango estimado sujeto a inspección', 'pendiente'
FROM public.autos_venta a
WHERE EXISTS (SELECT 1 FROM pro2)
  AND NOT EXISTS (
    SELECT 1 FROM public.ofertas o
    WHERE o.auto_venta_id = a.id AND o.profesional_id = (SELECT user_id FROM pro2)
  );

-- Replace/ensure RLS policies using JWT email claim
DROP POLICY IF EXISTS "Owners view offers via jwt email" ON public.ofertas;
CREATE POLICY "Owners view offers via jwt email"
ON public.ofertas
FOR SELECT
USING (
  (profesional_id = auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.autos_venta av
    JOIN public.clientes c ON c.id = av.cliente_id
    WHERE av.id = ofertas.auto_venta_id
      AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "Owners update offers via jwt email" ON public.ofertas;
CREATE POLICY "Owners update offers via jwt email"
ON public.ofertas
FOR UPDATE
USING (
  (profesional_id = auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.autos_venta av
    JOIN public.clientes c ON c.id = av.cliente_id
    WHERE av.id = ofertas.auto_venta_id
      AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
);