-- Actualizar estructura de config_autoajuste_general para coincidir con el código
ALTER TABLE public.config_autoajuste_general 
DROP COLUMN IF EXISTS demanda_accion_reducir_valor,
DROP COLUMN IF EXISTS demanda_accion_aumentar_valor,
DROP COLUMN IF EXISTS demanda_accion_reducir_tipo,
DROP COLUMN IF EXISTS demanda_accion_aumentar_tipo,
DROP COLUMN IF EXISTS demanda_contactos_minimos,
DROP COLUMN IF EXISTS demanda_contactos_maximos;

-- Agregar las nuevas columnas que coinciden con el código
ALTER TABLE public.config_autoajuste_general 
ADD COLUMN demanda_umbral_tipo TEXT DEFAULT 'menos_de',
ADD COLUMN demanda_contactos_umbral INTEGER DEFAULT 5,
ADD COLUMN demanda_accion_tipo TEXT DEFAULT 'reducir',
ADD COLUMN demanda_valor_tipo TEXT DEFAULT 'porcentaje',
ADD COLUMN demanda_valor NUMERIC DEFAULT 2;

-- Actualizar estructura de config_autoajuste_auto para coincidir también
ALTER TABLE public.config_autoajuste_auto 
DROP COLUMN IF EXISTS demanda_accion_reducir_valor,
DROP COLUMN IF EXISTS demanda_accion_aumentar_valor,
DROP COLUMN IF EXISTS demanda_accion_reducir_tipo,
DROP COLUMN IF EXISTS demanda_accion_aumentar_tipo,
DROP COLUMN IF EXISTS demanda_contactos_minimos,
DROP COLUMN IF EXISTS demanda_contactos_maximos;

-- Agregar las nuevas columnas en config_autoajuste_auto
ALTER TABLE public.config_autoajuste_auto 
ADD COLUMN demanda_umbral_tipo TEXT DEFAULT 'menos_de',
ADD COLUMN demanda_contactos_umbral INTEGER DEFAULT 5,
ADD COLUMN demanda_accion_tipo TEXT DEFAULT 'reducir',
ADD COLUMN demanda_valor_tipo TEXT DEFAULT 'porcentaje',
ADD COLUMN demanda_valor NUMERIC DEFAULT 2;