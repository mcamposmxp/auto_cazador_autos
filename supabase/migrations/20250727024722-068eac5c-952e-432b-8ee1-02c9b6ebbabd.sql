-- Actualizar configuración de MercadoLibre con selectores optimizados
UPDATE configuracion_extraccion 
SET selectores = '{
  "titulo": "h1.ui-pdp-title, .item-title__primary, h1[data-testid=\"title\"]",
  "precio": ".andes-money-amount__fraction, .price-tag-fraction, [data-testid=\"price\"] .andes-money-amount__fraction",
  "marca": ".ui-pdp-subtitle, .item-subtitle, [data-testid=\"subtitle\"]",
  "modelo": ".ui-pdp-subtitle, .item-subtitle, [data-testid=\"subtitle\"]",
  "ano": ".ui-pdp-specs__table td, .specs-item-value, [data-testid=\"specs\"] td",
  "kilometraje": ".ui-pdp-specs__table td, .specs-item-value, [data-testid=\"specs\"] td",
  "combustible": ".ui-pdp-specs__table td, .specs-item-value, [data-testid=\"specs\"] td",
  "transmision": ".ui-pdp-specs__table td, .specs-item-value, [data-testid=\"specs\"] td",
  "color": ".ui-pdp-specs__table td, .specs-item-value, [data-testid=\"specs\"] td",
  "ubicacion": ".ui-pdp-media__map-link, .seller-info__location, [data-testid=\"location\"]",
  "descripcion": ".ui-pdp-description__content, .item-description, [data-testid=\"description\"]",
  "imagenes": ".ui-pdp-gallery__column img, .gallery-image img, [data-testid=\"gallery\"] img"
}'::jsonb,
delay_entre_requests = 3000,
max_requests_por_minuto = 20
WHERE sitio_web = 'mercadolibre.com.mx';