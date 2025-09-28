-- Agregar 'manual' como opción válida para calendario_precio_final_tipo
-- Esto permitirá establecer un precio específico al final del período

-- Primero, verificamos si existe una restricción para este campo
DO $$
BEGIN
    -- Eliminar restricción existente si existe
    IF EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'config_autoajuste_auto' 
        AND c.conname LIKE '%precio_final_tipo%'
    ) THEN
        ALTER TABLE config_autoajuste_auto 
        DROP CONSTRAINT IF EXISTS config_autoajuste_auto_calendario_precio_final_tipo_check;
    END IF;
    
    -- Agregar nueva restricción que incluye 'manual' como opción válida
    ALTER TABLE config_autoajuste_auto 
    ADD CONSTRAINT config_autoajuste_auto_calendario_precio_final_tipo_check 
    CHECK (calendario_precio_final_tipo IS NULL OR calendario_precio_final_tipo = ANY (ARRAY['fijo'::text, 'porcentaje'::text, 'manual'::text]));
    
EXCEPTION
    WHEN OTHERS THEN
        -- Si no existe restricción, solo agregar la nueva
        ALTER TABLE config_autoajuste_auto 
        ADD CONSTRAINT config_autoajuste_auto_calendario_precio_final_tipo_check 
        CHECK (calendario_precio_final_tipo IS NULL OR calendario_precio_final_tipo = ANY (ARRAY['fijo'::text, 'porcentaje'::text, 'manual'::text]));
END $$;