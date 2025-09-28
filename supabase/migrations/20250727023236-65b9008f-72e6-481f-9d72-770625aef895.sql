-- Limpiar datos de prueba existentes
DELETE FROM anuncios_vehiculos;

-- Configurar MercadoLibre correctamente
INSERT INTO configuracion_extraccion (
  sitio_web,
  selectores,
  headers,
  delay_entre_requests,
  max_requests_por_minuto,
  user_agents,
  activo
) VALUES (
  'mercadolibre.com.mx',
  '{
    "titulo": ".ui-pdp-title",
    "precio": ".andes-money-amount__fraction",
    "marca": ".ui-pdp-subtitle",
    "modelo": ".ui-pdp-subtitle", 
    "ano": "[data-testid=\"vehicle-year\"]",
    "kilometraje": "[data-testid=\"vehicle-mileage\"]",
    "combustible": "[data-testid=\"vehicle-fuel\"]",
    "transmision": "[data-testid=\"vehicle-transmission\"]",
    "descripcion": ".ui-pdp-description__content",
    "ubicacion": ".ui-seller-info__status-info__subtitle",
    "imagenes": ".ui-pdp-gallery img"
  }',
  '{
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache"
  }',
  3000,
  20,
  '[
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ]',
  true
) ON CONFLICT (sitio_web) DO UPDATE SET
  selectores = EXCLUDED.selectores,
  headers = EXCLUDED.headers,
  delay_entre_requests = EXCLUDED.delay_entre_requests,
  max_requests_por_minuto = EXCLUDED.max_requests_por_minuto,
  user_agents = EXCLUDED.user_agents,
  activo = EXCLUDED.activo,
  updated_at = NOW();