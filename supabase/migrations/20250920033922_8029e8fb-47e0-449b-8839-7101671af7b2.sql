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
);