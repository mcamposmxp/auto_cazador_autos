-- Insertar estadísticas de ejemplo para profesionales existentes (eliminando duplicados primero)
DELETE FROM stats_profesionales WHERE profesional_id IN ('603cfc07-558c-4644-a465-8655b1c7f486', '25da02c1-c147-4b36-8e7e-7c30fa93c1a4');

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
);

-- Crear algunos clientes de ejemplo
INSERT INTO clientes (
  correo_electronico,
  nombre_apellido,
  numero_telefonico,
  ciudad,
  estado,
  preferencia_contacto
) VALUES 
(
  'ejemplo@cliente.com',
  'Juan Pérez',
  '5555555555',
  'Ciudad de México',
  'CDMX',
  'telefono'
);

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