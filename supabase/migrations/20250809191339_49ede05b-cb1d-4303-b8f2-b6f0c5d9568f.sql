-- Seed one fixed and one ranged offer per auto using existing profiles if available
-- Fixed offer using the earliest profile
INSERT INTO public.ofertas (auto_venta_id, profesional_id, monto_oferta, preferente, comentarios, estado)
SELECT a.id,
       (SELECT user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1) AS profesional_id,
       ROUND((random()*150000 + 120000)::numeric, 0) AS monto_oferta,
       false AS preferente,
       'Oferta directa de compra' AS comentarios,
       'pendiente' AS estado
FROM public.autos_venta a
WHERE EXISTS (SELECT 1 FROM public.profiles)
  AND NOT EXISTS (
    SELECT 1 FROM public.ofertas o
    WHERE o.auto_venta_id = a.id
      AND o.profesional_id = (SELECT user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1)
  );

-- Ranged offer using the second earliest profile (if exists)
INSERT INTO public.ofertas (auto_venta_id, profesional_id, monto_min, monto_max, preferente, comentarios, estado)
SELECT a.id,
       (SELECT user_id FROM public.profiles ORDER BY created_at ASC OFFSET 1 LIMIT 1) AS profesional_id,
       ROUND((random()*100000 + 100000)::numeric, 0) AS monto_min,
       ROUND((random()*150000 + 200000)::numeric, 0) AS monto_max,
       true AS preferente,
       'Rango estimado sujeto a inspección' AS comentarios,
       'pendiente' AS estado
FROM public.autos_venta a
WHERE EXISTS (SELECT 1 FROM public.profiles ORDER BY created_at ASC OFFSET 1 LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.ofertas o
    WHERE o.auto_venta_id = a.id
      AND o.profesional_id = (SELECT user_id FROM public.profiles ORDER BY created_at ASC OFFSET 1 LIMIT 1)
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