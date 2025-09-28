-- Insertar algunos profesionales de ejemplo
INSERT INTO profesionales (
  id,
  user_id,
  negocio_nombre,
  razon_social,
  rfc,
  tipo_negocio,
  direccion_ciudad,
  direccion_estado,
  contacto_principal,
  telefono,
  correo,
  activo
) VALUES 
(
  gen_random_uuid(),
  gen_random_uuid(),
  'AutoDealer Premium',
  'AutoDealer Premium SA de CV',
  'ADP123456789',
  'concesionario',
  'Ciudad de México',
  'CDMX',
  'Carlos Rodríguez',
  '5551234567',
  'carlos@autodealer.com',
  true
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Autos del Valle',
  'Autos del Valle SA de CV',
  'ADV987654321',
  'lote',
  'Guadalajara',
  'Jalisco',
  'María González',
  '3339876543',
  'maria@autosdelvalle.com',
  true
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Compra-Venta Los Pinos',
  'Compra-Venta Los Pinos SA de CV',
  'CVP456789123',
  'compra_venta',
  'Monterrey',
  'Nuevo León',
  'José Martínez',
  '8181234567',
  'jose@lospinos.com',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Insertar estadísticas de profesionales de ejemplo
INSERT INTO stats_profesionales (
  profesional_id,
  calificacion_promedio,
  total_reviews,
  total_ofertas_enviadas,
  total_ofertas_aceptadas,
  tasa_respuesta,
  badge_confianza
) 
SELECT 
  p.id,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 4.8
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 4.2
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 3.9
  END,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 24
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 15
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 8
  END,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 45
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 28
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 12
  END,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 32
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 18
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 7
  END,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 71.1
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 64.3
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 58.3
  END,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 'elite'
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 'confiable'
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 'verificado'
  END
FROM profesionales p
WHERE p.negocio_nombre IN ('AutoDealer Premium', 'Autos del Valle', 'Compra-Venta Los Pinos')
ON CONFLICT (profesional_id) DO UPDATE SET
  calificacion_promedio = EXCLUDED.calificacion_promedio,
  total_reviews = EXCLUDED.total_reviews,
  total_ofertas_enviadas = EXCLUDED.total_ofertas_enviadas,
  total_ofertas_aceptadas = EXCLUDED.total_ofertas_aceptadas,
  tasa_respuesta = EXCLUDED.tasa_respuesta,
  badge_confianza = EXCLUDED.badge_confianza;