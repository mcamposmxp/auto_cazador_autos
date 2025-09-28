-- Insertar estadísticas de ejemplo para profesionales existentes
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
  4.8,
  24,
  45,
  32,
  71.1,
  'elite'
),
(
  '25da02c1-c147-4b36-8e7e-7c30fa93c1a4',
  4.2,
  15,
  28,
  18,
  64.3,
  'confiable'
)
ON CONFLICT (profesional_id) DO UPDATE SET
  calificacion_promedio = EXCLUDED.calificacion_promedio,
  total_reviews = EXCLUDED.total_reviews,
  total_ofertas_enviadas = EXCLUDED.total_ofertas_enviadas,
  total_ofertas_aceptadas = EXCLUDED.total_ofertas_aceptadas,
  tasa_respuesta = EXCLUDED.tasa_respuesta,
  badge_confianza = EXCLUDED.badge_confianza;

-- Crear algunos clientes de ejemplo
INSERT INTO clientes (
  correo_electronico,
  nombre,
  apellido,
  telefono_movil
) VALUES 
(
  'ejemplo@cliente.com',
  'Juan',
  'Pérez',
  '5555555555'
),
(
  'demo@comprador.com',
  'Ana',
  'López',
  '5556666666'
)
ON CONFLICT (correo_electronico) DO NOTHING;

-- Crear algunos autos para venta de ejemplo
INSERT INTO autos_venta (
  cliente_id,
  marca,
  modelo,
  ano,
  kilometraje,
  estado_auto,
  version,
  servicios_agencia,
  documentos_orden,
  recibiendo_ofertas
) 
SELECT 
  c.id,
  'Toyota',
  'Camry',
  2020,
  45000,
  'excelente',
  'XLE',
  true,
  true,
  true
FROM clientes c
WHERE c.correo_electronico = 'ejemplo@cliente.com'
LIMIT 1;

-- Insertar ofertas de ejemplo
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
    WHEN p.id = '603cfc07-558c-4644-a465-8655b1c7f486' THEN 450000
    WHEN p.id = '25da02c1-c147-4b36-8e7e-7c30fa93c1a4' THEN 440000
  END,
  CASE 
    WHEN p.id = '603cfc07-558c-4644-a465-8655b1c7f486' THEN 480000
    WHEN p.id = '25da02c1-c147-4b36-8e7e-7c30fa93c1a4' THEN 470000
  END,
  CASE 
    WHEN p.id = '603cfc07-558c-4644-a465-8655b1c7f486' THEN 'Excelente auto, estamos interesados. Podemos hacer una inspección técnica completa.'
    WHEN p.id = '25da02c1-c147-4b36-8e7e-7c30fa93c1a4' THEN 'Nos interesa mucho el vehículo. Tenemos experiencia con esta marca y modelo.'
  END,
  'pendiente'
FROM autos_venta av
CROSS JOIN profesionales p
WHERE av.marca = 'Toyota' 
  AND av.modelo = 'Camry'
  AND p.id IN ('603cfc07-558c-4644-a465-8655b1c7f486', '25da02c1-c147-4b36-8e7e-7c30fa93c1a4');