-- Crear algunos usuarios de ejemplo en la tabla profiles
INSERT INTO profiles (
  user_id,
  nombre,
  apellido,
  telefono_movil,
  correo_electronico,
  tipo_usuario,
  negocio_nombre
) VALUES 
(
  gen_random_uuid(),
  'Carlos',
  'Rodríguez',
  '5551234567',
  'carlos@autodealer.com',
  'profesional',
  'AutoDealer Premium'
),
(
  gen_random_uuid(),
  'María',
  'González',
  '3339876543',
  'maria@autosdelvalle.com',
  'profesional',
  'Autos del Valle'
),
(
  gen_random_uuid(),
  'José',
  'Martínez',
  '8181234567',
  'jose@lospinos.com',
  'profesional',
  'Compra-Venta Los Pinos'
);

-- Insertar profesionales usando los user_ids de los profiles creados
INSERT INTO profesionales (
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
) 
SELECT 
  p.user_id,
  p.negocio_nombre,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 'AutoDealer Premium SA de CV'
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 'Autos del Valle SA de CV'
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 'Compra-Venta Los Pinos SA de CV'
  END,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 'ADP123456789'
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 'ADV987654321'
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 'CVP456789123'
  END,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 'agencia_nuevos'
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 'seminuevos'
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 'comerciante'
  END,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 'Ciudad de México'
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 'Guadalajara'
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 'Monterrey'
  END,
  CASE 
    WHEN p.negocio_nombre = 'AutoDealer Premium' THEN 'CDMX'
    WHEN p.negocio_nombre = 'Autos del Valle' THEN 'Jalisco'
    WHEN p.negocio_nombre = 'Compra-Venta Los Pinos' THEN 'Nuevo León'
  END,
  CONCAT(p.nombre, ' ', p.apellido),
  p.telefono_movil,
  p.correo_electronico,
  true
FROM profiles p
WHERE p.negocio_nombre IN ('AutoDealer Premium', 'Autos del Valle', 'Compra-Venta Los Pinos')
  AND p.tipo_usuario = 'profesional';

-- Insertar estadísticas de profesionales
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
  prof.id,
  CASE 
    WHEN prof.negocio_nombre = 'AutoDealer Premium' THEN 4.8
    WHEN prof.negocio_nombre = 'Autos del Valle' THEN 4.2
    WHEN prof.negocio_nombre = 'Compra-Venta Los Pinos' THEN 3.9
  END,
  CASE 
    WHEN prof.negocio_nombre = 'AutoDealer Premium' THEN 24
    WHEN prof.negocio_nombre = 'Autos del Valle' THEN 15
    WHEN prof.negocio_nombre = 'Compra-Venta Los Pinos' THEN 8
  END,
  CASE 
    WHEN prof.negocio_nombre = 'AutoDealer Premium' THEN 45
    WHEN prof.negocio_nombre = 'Autos del Valle' THEN 28
    WHEN prof.negocio_nombre = 'Compra-Venta Los Pinos' THEN 12
  END,
  CASE 
    WHEN prof.negocio_nombre = 'AutoDealer Premium' THEN 32
    WHEN prof.negocio_nombre = 'Autos del Valle' THEN 18
    WHEN prof.negocio_nombre = 'Compra-Venta Los Pinos' THEN 7
  END,
  CASE 
    WHEN prof.negocio_nombre = 'AutoDealer Premium' THEN 71.1
    WHEN prof.negocio_nombre = 'Autos del Valle' THEN 64.3
    WHEN prof.negocio_nombre = 'Compra-Venta Los Pinos' THEN 58.3
  END,
  CASE 
    WHEN prof.negocio_nombre = 'AutoDealer Premium' THEN 'elite'
    WHEN prof.negocio_nombre = 'Autos del Valle' THEN 'confiable'
    WHEN prof.negocio_nombre = 'Compra-Venta Los Pinos' THEN 'verificado'
  END
FROM profesionales prof
WHERE prof.negocio_nombre IN ('AutoDealer Premium', 'Autos del Valle', 'Compra-Venta Los Pinos')
ON CONFLICT (profesional_id) DO UPDATE SET
  calificacion_promedio = EXCLUDED.calificacion_promedio,
  total_reviews = EXCLUDED.total_reviews,
  total_ofertas_enviadas = EXCLUDED.total_ofertas_enviadas,
  total_ofertas_aceptadas = EXCLUDED.total_ofertas_aceptadas,
  tasa_respuesta = EXCLUDED.tasa_respuesta,
  badge_confianza = EXCLUDED.badge_confianza;