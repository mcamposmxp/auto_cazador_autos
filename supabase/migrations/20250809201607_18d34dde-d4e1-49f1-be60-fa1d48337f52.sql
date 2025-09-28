-- Ensure idempotency: drop then create
DROP POLICY IF EXISTS "Users can delete their own offers or owners can delete (jwt)" ON public.ofertas;

-- Allow deleting offers by the professional who created them OR by the owner of the car (via JWT email)
CREATE POLICY "Users can delete their own offers or owners can delete (jwt)"
ON public.ofertas
FOR DELETE
USING (
  (profesional_id = auth.uid()) OR
  EXISTS (
    SELECT 1
    FROM public.autos_venta av
    JOIN public.clientes c ON c.id = av.cliente_id
    WHERE av.id = ofertas.auto_venta_id
      AND c.correo_electronico = (auth.jwt() ->> 'email')
  )
);
