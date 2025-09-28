-- Crear estadísticas para profesionales existentes
INSERT INTO stats_profesionales (
  profesional_id,
  calificacion_promedio,
  total_reviews,
  total_ofertas_enviadas,
  total_ofertas_aceptadas,
  tasa_respuesta,
  badge_confianza
) VALUES 
(
  '603cfc07-558c-4644-a465-8655b1c7f486',
  4.7,
  18,
  35,
  24,
  68.6,
  'confiable'
),
(
  '25da02c1-c147-4b36-8e7e-7c30fa93c1a4',
  4.3,
  12,
  22,
  15,
  68.2,
  'verificado'
)
ON CONFLICT (profesional_id) DO UPDATE SET
  calificacion_promedio = EXCLUDED.calificacion_promedio,
  total_reviews = EXCLUDED.total_reviews,
  total_ofertas_enviadas = EXCLUDED.total_ofertas_enviadas,
  total_ofertas_aceptadas = EXCLUDED.total_ofertas_aceptadas,
  tasa_respuesta = EXCLUDED.tasa_respuesta,
  badge_confianza = EXCLUDED.badge_confianza;

-- Crear algunos clientes de ejemplo usando las columnas correctas
INSERT INTO clientes (
  correo_electronico,
  nombre_apellido,
  numero_telefonico,
  ciudad,
  estado,
  preferencia_contacto
) VALUES 
(
  'cliente1@ejemplo.com',
  'Ana Pérez',
  '5561234567',
  'Ciudad de México',
  'CDMX',
  'telefono'
),
(
  'cliente2@ejemplo.com',
  'Roberto García',
  '5562345678',
  'Guadalajara',
  'Jalisco',
  'correo'
)
ON CONFLICT (correo_electronico) DO NOTHING;

-- Crear algunos autos de ejemplo
INSERT INTO autos_venta (
  cliente_id,
  marca,
  modelo,
  ano,
  kilometraje,
  estado_auto,
  servicios_agencia,
  documentos_orden,
  recibiendo_ofertas
) 
SELECT 
  c.id,
  CASE 
    WHEN c.correo_electronico = 'cliente1@ejemplo.com' THEN 'Toyota'
    WHEN c.correo_electronico = 'cliente2@ejemplo.com' THEN 'Honda'
  END,
  CASE 
    WHEN c.correo_electronico = 'cliente1@ejemplo.com' THEN 'Camry'
    WHEN c.correo_electronico = 'cliente2@ejemplo.com' THEN 'Civic'
  END,
  CASE 
    WHEN c.correo_electronico = 'cliente1@ejemplo.com' THEN 2020
    WHEN c.correo_electronico = 'cliente2@ejemplo.com' THEN 2019
  END,
  CASE 
    WHEN c.correo_electronico = 'cliente1@ejemplo.com' THEN 45000
    WHEN c.correo_electronico = 'cliente2@ejemplo.com' THEN 32000
  END,
  'excelente',
  true,
  true,
  true
FROM clientes c
WHERE c.correo_electronico IN ('cliente1@ejemplo.com', 'cliente2@ejemplo.com');

-- Crear ofertas de ejemplo
INSERT INTO ofertas (
  auto_venta_id,
  profesional_id,
  monto_min,
  monto_max,
  comentarios,
  estado
)
SELECT 
  av.id,
  p.user_id,
  CASE 
    WHEN av.marca = 'Toyota' AND p.negocio_nombre = 'TES' THEN 280000
    WHEN av.marca = 'Toyota' AND p.negocio_nombre = 'Cazador profesional' THEN 270000
    WHEN av.marca = 'Honda' AND p.negocio_nombre = 'TES' THEN 220000
    WHEN av.marca = 'Honda' AND p.negocio_nombre = 'Cazador profesional' THEN 215000
  END,
  CASE 
    WHEN av.marca = 'Toyota' AND p.negocio_nombre = 'TES' THEN 300000
    WHEN av.marca = 'Toyota' AND p.negocio_nombre = 'Cazador profesional' THEN 290000
    WHEN av.marca = 'Honda' AND p.negocio_nombre = 'TES' THEN 240000
    WHEN av.marca = 'Honda' AND p.negocio_nombre = 'Cazador profesional' THEN 235000
  END,
  CASE 
    WHEN p.negocio_nombre = 'TES' THEN 'Excelente vehículo, estamos interesados. Podemos hacer la transacción esta semana.'
    WHEN p.negocio_nombre = 'Cazador profesional' THEN 'Auto en muy buen estado. Oferta competitiva, evaluación inmediata.'
  END,
  'pendiente'
FROM autos_venta av
CROSS JOIN profesionales p
WHERE av.marca IN ('Toyota', 'Honda')
  AND p.negocio_nombre IN ('TES', 'Cazador profesional');