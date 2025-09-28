-- Actualizar estadísticas de profesionales existentes
UPDATE stats_profesionales 
SET 
  calificacion_promedio = 4.7,
  total_reviews = 18,
  total_ofertas_enviadas = 35,
  total_ofertas_aceptadas = 24,
  tasa_respuesta = 68.6,
  badge_confianza = 'confiable'
WHERE profesional_id = '603cfc07-558c-4644-a465-8655b1c7f486';

UPDATE stats_profesionales 
SET 
  calificacion_promedio = 4.3,
  total_reviews = 12,
  total_ofertas_enviadas = 22,
  total_ofertas_aceptadas = 15,
  tasa_respuesta = 68.2,
  badge_confianza = 'verificado'
WHERE profesional_id = '25da02c1-c147-4b36-8e7e-7c30fa93c1a4';

-- Crear algunos clientes de ejemplo (ignorar si ya existen)
DO $$
BEGIN
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
EXCEPTION WHEN unique_violation THEN
  -- Ignorar si los clientes ya existen
END $$;