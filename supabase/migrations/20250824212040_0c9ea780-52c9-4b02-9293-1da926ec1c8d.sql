-- Primero actualizar registros existentes que tienen valores no válidos
-- y luego agregar la restricción para calendario_precio_final_tipo

-- Paso 1: Verificar qué valores existen actualmente
-- y actualizar cualquier valor inválido a 'fijo'
UPDATE config_autoajuste_auto 
SET calendario_precio_final_tipo = 'fijo' 
WHERE calendario_precio_final_tipo IS NOT NULL 
  AND calendario_precio_final_tipo NOT IN ('fijo', 'porcentaje');

-- Paso 2: Agregar la restricción con 'manual' como opción válida
ALTER TABLE config_autoajuste_auto 
ADD CONSTRAINT config_autoajuste_auto_calendario_precio_final_tipo_check 
CHECK (calendario_precio_final_tipo IS NULL OR calendario_precio_final_tipo = ANY (ARRAY['fijo'::text, 'porcentaje'::text, 'manual'::text]));