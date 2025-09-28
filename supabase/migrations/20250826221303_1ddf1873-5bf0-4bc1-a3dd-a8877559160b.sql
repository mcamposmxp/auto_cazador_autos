-- Seed de datos de ejemplo para historico_ventas si está vacío
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.historico_ventas) = 0 THEN
    INSERT INTO public.historico_ventas
      (ano, precio_inicial, precio_venta, fecha_publicacion, fecha_venta, dias_en_mercado, kilometraje, marca, modelo, ubicacion, tipo_vendedor)
    VALUES
      -- Rápidos
      (2021, 300000, 295000, now() - interval '25 days', now() - interval '13 days', 12, 35000, 'Toyota', 'Corolla', 'Ciudad de México', 'profesional'),
      (2020, 280000, 270000, now() - interval '35 days', now() - interval '20 days', 15, 45000, 'Toyota', 'Corolla', 'Guadalajara', 'particular'),
      (2021, 320000, 315000, now() - interval '22 days', now() - interval '8 days', 14, 40000, 'Ford', 'Focus', 'Guadalajara', 'profesional'),
      (2020, 310000, 300000, now() - interval '30 days', now() - interval '12 days', 18, 50000, 'Hyundai', 'Elantra', 'Monterrey', 'particular'),
      (2022, 290000, 285000, now() - interval '25 days', now() - interval '5 days', 20, 30000, 'Kia', 'Rio', 'Ciudad de México', 'profesional'),
      (2019, 260000, 250000, now() - interval '40 days', now() - interval '11 days', 29, 65000, 'Honda', 'Civic', 'Ciudad de México', 'profesional'),
      (2021, 340000, 330000, now() - interval '35 days', now() - interval '7 days', 28, 42000, 'BMW', 'Serie 3', 'Guadalajara', 'profesional'),
      -- Lentos
      (2022, 520000, 500000, now() - interval '90 days', now() - interval '20 days', 70, 30000, 'Mazda', 'CX-5', 'Monterrey', 'profesional'),
      (2019, 450000, 420000, now() - interval '80 days', now() - interval '10 days', 70, 60000, 'Mazda', 'CX-5', 'Ciudad de México', 'particular'),
      (2018, 200000, 185000, now() - interval '110 days', now() - interval '20 days', 90, 80000, 'Chevrolet', 'Aveo', 'Puebla', 'particular'),
      (2020, 270000, 265000, now() - interval '70 days', now() - interval '8 days', 62, 58000, 'Volkswagen', 'Jetta', 'Monterrey', 'particular'),
      (2021, 275000, 260000, now() - interval '95 days', now() - interval '15 days', 80, 70000, 'Nissan', 'Sentra', 'Guadalajara', 'particular');
  END IF;
END $$;
