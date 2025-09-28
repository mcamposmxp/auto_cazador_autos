-- First, update any existing invalid records to 'manual' to fix the constraint
UPDATE config_autoajuste_auto 
SET calendario_accion_tipo = 'manual' 
WHERE calendario_accion_tipo = 'valor_directo';

UPDATE config_autoajuste_auto 
SET calendario_precio_final_tipo = 'manual' 
WHERE calendario_precio_final_tipo = 'valor_directo';

UPDATE config_autoajuste_auto 
SET tiempo_accion_tipo = 'manual' 
WHERE tiempo_accion_tipo NOT IN ('fijo', 'porcentaje', 'manual');

-- Add the tiempo_es_aumento column if it doesn't exist
ALTER TABLE config_autoajuste_auto 
ADD COLUMN IF NOT EXISTS tiempo_es_aumento boolean DEFAULT false;

-- Drop the old constraints and create new ones
ALTER TABLE config_autoajuste_auto 
DROP CONSTRAINT IF EXISTS config_autoajuste_auto_calendario_accion_tipo_check;

ALTER TABLE config_autoajuste_auto 
DROP CONSTRAINT IF EXISTS config_autoajuste_auto_calendario_precio_final_tipo_check;

ALTER TABLE config_autoajuste_auto 
DROP CONSTRAINT IF EXISTS config_autoajuste_auto_tiempo_accion_tipo_check;

-- Add new constraints with 'manual' option
ALTER TABLE config_autoajuste_auto 
ADD CONSTRAINT config_autoajuste_auto_calendario_accion_tipo_check 
CHECK (calendario_accion_tipo IN ('fijo', 'porcentaje', 'manual'));

ALTER TABLE config_autoajuste_auto 
ADD CONSTRAINT config_autoajuste_auto_calendario_precio_final_tipo_check 
CHECK (calendario_precio_final_tipo IN ('fijo', 'porcentaje', 'manual'));

ALTER TABLE config_autoajuste_auto 
ADD CONSTRAINT config_autoajuste_auto_tiempo_accion_tipo_check 
CHECK (tiempo_accion_tipo IN ('fijo', 'porcentaje', 'manual'));