-- Insertar datos históricos de autos en anuncios_vehiculos para mostrar comparaciones
INSERT INTO anuncios_vehiculos (
  url_anuncio, sitio_web, titulo, marca, modelo, ano, precio, kilometraje, 
  combustible, transmision, tipo_vehiculo, color, descripcion, ubicacion, 
  telefono, email, imagenes, caracteristicas, datos_raw, activo
) VALUES 
-- Toyota Camry similares
('https://example.com/toyota-camry-1', 'MercadoLibre', 'Toyota Camry LE 2020 Excelente Estado', 'Toyota', 'Camry LE', 2020, 430000, 52000, 'Gasolina', 'Automática', 'Sedan', 'Blanco', 'Toyota Camry LE 2020 en excelente estado, único dueño, servicios al día', 'Ciudad de México, CDMX', '5551234567', 'vendedor1@email.com', '["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "aire_acondicionado": true}', '{"sitio_origen": "MercadoLibre"}', true),

('https://example.com/toyota-camry-2', 'Seminuevos', 'Toyota Camry XLE 2019 Premium', 'Toyota', 'Camry XLE', 2019, 395000, 68000, 'Gasolina', 'Automática', 'Sedan', 'Negro', 'Toyota Camry XLE 2019 versión premium con navegación', 'Guadalajara, Jalisco', '5559876543', 'seminuevos@dealer.com', '["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "sistema_navegacion": true}', '{"sitio_origen": "Seminuevos"}', true),

('https://example.com/toyota-camry-3', 'Facebook Marketplace', 'Toyota Camry SE 2021 Deportivo', 'Toyota', 'Camry SE', 2021, 485000, 32000, 'Gasolina', 'Automática', 'Sedan', 'Rojo', 'Toyota Camry SE 2021 versión deportiva, llantas de aleación', 'Monterrey, Nuevo León', '5556789012', null, '["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "llantas_aleacion": true}', '{"sitio_origen": "Facebook"}', true),

-- Honda Accord similares 
('https://example.com/honda-accord-1', 'MercadoLibre', 'Honda Accord EX 2019 Turbo', 'Honda', 'Accord EX', 2019, 375000, 75000, 'Gasolina', 'CVT', 'Sedan', 'Blanco', 'Honda Accord EX 2019 con motor turbo, excelente rendimiento', 'Puebla, Puebla', '5552345678', 'honda@vendedor.com', '["https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "motor_turbo": true}', '{"sitio_origen": "MercadoLibre"}', true),

('https://example.com/honda-accord-2', 'AutoTrader', 'Honda Accord LX 2020 Económico', 'Honda', 'Accord LX', 2020, 350000, 89000, 'Gasolina', 'CVT', 'Sedan', 'Gris', 'Honda Accord LX 2020 versión base, muy económico', 'Querétaro, Querétaro', '5553456789', 'autotrader@dealer.com', '["https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "consumo_bajo": true}', '{"sitio_origen": "AutoTrader"}', true),

-- Mazda CX-5 similares
('https://example.com/mazda-cx5-1', 'MercadoLibre', 'Mazda CX-5 Touring 2021 SUV', 'Mazda', 'CX-5 Touring', 2021, 510000, 28000, 'Gasolina', 'Automática', 'SUV', 'Azul', 'Mazda CX-5 Touring 2021, SUV familiar en excelente estado', 'Ciudad de México, CDMX', '5554567890', 'mazda@vendedor.com', '["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop"]', '{"puertas": 5, "asientos": 7, "traccion_integral": true}', '{"sitio_origen": "MercadoLibre"}', true),

('https://example.com/mazda-cx5-2', 'Kavak', 'Mazda CX-5 Sport 2020 Certificado', 'Mazda', 'CX-5 Sport', 2020, 475000, 45000, 'Gasolina', 'Automática', 'SUV', 'Blanco', 'Mazda CX-5 Sport 2020 certificado por Kavak', 'Guadalajara, Jalisco', '5567890123', 'kavak@certified.com', '["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop"]', '{"puertas": 5, "asientos": 5, "certificado": true}', '{"sitio_origen": "Kavak"}', true),

-- Nissan Sentra similares
('https://example.com/nissan-sentra-1', 'MercadoLibre', 'Nissan Sentra SR 2022 Deportivo', 'Nissan', 'Sentra SR', 2022, 335000, 18000, 'Gasolina', 'CVT', 'Sedan', 'Naranja', 'Nissan Sentra SR 2022 versión deportiva, como nuevo', 'Tijuana, Baja California', '5578901234', 'nissan@vendedor.com', '["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "version_sr": true}', '{"sitio_origen": "MercadoLibre"}', true),

('https://example.com/nissan-sentra-2', 'Seminuevos', 'Nissan Sentra Sense 2021 Base', 'Nissan', 'Sentra Sense', 2021, 295000, 35000, 'Gasolina', 'Manual', 'Sedan', 'Blanco', 'Nissan Sentra Sense 2021 transmisión manual, muy económico', 'León, Guanajuato', '5589012345', 'seminuevos2@dealer.com', '["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "transmision_manual": true}', '{"sitio_origen": "Seminuevos"}', true),

-- Volkswagen Jetta similares
('https://example.com/vw-jetta-1', 'MercadoLibre', 'Volkswagen Jetta Comfortline 2020', 'Volkswagen', 'Jetta Comfortline', 2020, 415000, 48000, 'Gasolina', 'Automática', 'Sedan', 'Gris', 'Volkswagen Jetta Comfortline 2020, equipamiento completo', 'Mérida, Yucatán', '5590123456', 'vw@vendedor.com', '["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "equipamiento_completo": true}', '{"sitio_origen": "MercadoLibre"}', true),

('https://example.com/vw-jetta-2', 'AutoCompra', 'Volkswagen Jetta Trendline 2019', 'Volkswagen', 'Jetta Trendline', 2019, 385000, 62000, 'Gasolina', 'Manual', 'Sedan', 'Negro', 'Volkswagen Jetta Trendline 2019 transmisión manual', 'Toluca, Estado de México', '5501234567', 'autocompra@dealer.com', '["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "transmision_manual": true}', '{"sitio_origen": "AutoCompra"}', true);