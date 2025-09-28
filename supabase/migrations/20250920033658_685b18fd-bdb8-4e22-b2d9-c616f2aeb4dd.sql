-- Crear algunos profiles de usuario para los profesionales de ejemplo
INSERT INTO profiles (
  id,
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
  gen_random_uuid(),
  'José',
  'Martínez',
  '8181234567',
  'jose@lospinos.com',
  'profesional',
  'Compra-Venta Los Pinos'
);

-- Insertar algunos profesionales de ejemplo usando los user_id de los profiles
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
) 
SELECT 
  gen_random_uuid(),
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
  p.nombre || ' ' || p.apellido,
  p.telefono_movil,
  p.correo_electronico,
  true
FROM profiles p
WHERE p.negocio_nombre IN ('AutoDealer Premium', 'Autos del Valle', 'Compra-Venta Los Pinos')
ON CONFLICT (id) DO NOTHING;