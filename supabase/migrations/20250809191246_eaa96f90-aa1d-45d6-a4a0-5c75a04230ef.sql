-- Seed sample offers using existing profiles (if any)
WITH pro1 AS (
  SELECT user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1
),
pro2 AS (
  SELECT user_id FROM public.profiles ORDER BY created_at ASC OFFSET 1 LIMIT 1
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