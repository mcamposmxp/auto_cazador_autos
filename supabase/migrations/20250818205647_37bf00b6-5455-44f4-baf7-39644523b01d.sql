-- Enforce price consistency in both config tables
ALTER TABLE public.config_autoajuste_general
DROP CONSTRAINT IF EXISTS chk_general_precios_validos;
ALTER TABLE public.config_autoajuste_general
ADD CONSTRAINT chk_general_precios_validos
CHECK (
  precio_maximo IS NULL OR precio_minimo IS NULL OR precio_maximo >= precio_minimo
);

ALTER TABLE public.config_autoajuste_auto
DROP CONSTRAINT IF EXISTS chk_auto_precios_validos;
ALTER TABLE public.config_autoajuste_auto
ADD CONSTRAINT chk_auto_precios_validos
CHECK (
  precio_maximo IS NULL OR precio_minimo IS NULL OR precio_maximo >= precio_minimo
);
