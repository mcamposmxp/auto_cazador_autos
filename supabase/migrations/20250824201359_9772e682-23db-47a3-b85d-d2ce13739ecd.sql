-- Agregar nuevos campos para ajustes programados en config_autoajuste_auto
ALTER TABLE config_autoajuste_auto 
ADD COLUMN IF NOT EXISTS calendario_precio_objetivo NUMERIC,
ADD COLUMN IF NOT EXISTS calendario_precio_final_tipo TEXT DEFAULT 'valor_directo',
ADD COLUMN IF NOT EXISTS calendario_precio_final_valor NUMERIC;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN config_autoajuste_auto.calendario_precio_objetivo IS 'Precio específico que el auto tendrá durante el periodo programado';
COMMENT ON COLUMN config_autoajuste_auto.calendario_precio_final_tipo IS 'Tipo de precio al final del periodo: valor_directo, porcentaje, o fijo (volver al precio inicial)';
COMMENT ON COLUMN config_autoajuste_auto.calendario_precio_final_valor IS 'Valor del precio final según el tipo especificado';

-- Actualizar el tipo de calendario_accion_tipo para incluir valor_directo
-- Nota: No podemos modificar directamente un enum, así que verificamos que el campo permita el nuevo valor
-- Si el campo ya permite text, no necesitamos hacer nada más