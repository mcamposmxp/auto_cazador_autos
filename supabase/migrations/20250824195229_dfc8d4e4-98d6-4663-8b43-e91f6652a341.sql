-- Agregar más datos históricos específicos para los autos del usuario

-- Más Toyota Camry XLE 2020 similares
INSERT INTO anuncios_vehiculos (
  url_anuncio, sitio_web, titulo, marca, modelo, ano, precio, kilometraje, 
  combustible, transmision, tipo_vehiculo, color, descripcion, ubicacion, 
  telefono, email, imagenes, caracteristicas, datos_raw, activo
) VALUES 
('https://example.com/toyota-camry-4', 'AutoScout24', 'Toyota Camry XLE 2020 Impecable', 'Toyota', 'Camry XLE', 2020, 465000, 40000, 'Gasolina', 'Automática', 'Sedan', 'Plata', 'Toyota Camry XLE 2020 impecable, servicios en agencia', 'Toluca, Estado de México', '5512345678', 'vendedor4@email.com', '["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "aire_acondicionado": true, "sistema_navegacion": true}', '{"sitio_origen": "AutoScout24"}', true),

('https://example.com/toyota-camry-5', 'Derrama Magisterial', 'Toyota Camry XLE 2021 Único Dueño', 'Toyota', 'Camry XLE', 2021, 495000, 35000, 'Gasolina', 'Automática', 'Sedan', 'Azul', 'Toyota Camry XLE 2021 único dueño, factura original', 'Cancún, Quintana Roo', '5523456789', 'derrama@magisterial.com', '["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "garantia_vigente": true}', '{"sitio_origen": "Derrama Magisterial"}', true),

('https://example.com/toyota-camry-6', 'Carmudi', 'Toyota Camry XLE 2019 Premium', 'Toyota', 'Camry XLE', 2019, 415000, 65000, 'Gasolina', 'Automática', 'Sedan', 'Gris', 'Toyota Camry XLE 2019 premium, interior en piel', 'San Luis Potosí, SLP', '5534567890', 'carmudi@dealer.com', '["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "interior_piel": true}', '{"sitio_origen": "Carmudi"}', true),

-- Más Honda Accord Sport 2019 similares
('https://example.com/honda-accord-3', 'Autos Usados', 'Honda Accord Sport 2019 Turbo Manual', 'Honda', 'Accord Sport', 2019, 385000, 72000, 'Gasolina', 'Manual', 'Sedan', 'Rojo', 'Honda Accord Sport 2019 transmisión manual, motor turbo', 'Aguascalientes, Aguascalientes', '5545678901', 'usados@honda.com', '["https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "motor_turbo": true, "transmision_manual": true}', '{"sitio_origen": "Autos Usados"}', true),

('https://example.com/honda-accord-4', 'Vroom', 'Honda Accord Sport 2018 Deportivo', 'Honda', 'Accord Sport', 2018, 345000, 95000, 'Gasolina', 'Manual', 'Sedan', 'Blanco', 'Honda Accord Sport 2018 versión deportiva, llantas nuevas', 'Hermosillo, Sonora', '5556789012', 'vroom@dealer.com', '["https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "llantas_nuevas": true}', '{"sitio_origen": "Vroom"}', true),

('https://example.com/honda-accord-5', 'Carvana', 'Honda Accord Sport 2020 Bajo Kilometraje', 'Honda', 'Accord Sport', 2020, 405000, 55000, 'Gasolina', 'CVT', 'Sedan', 'Negro', 'Honda Accord Sport 2020 bajo kilometraje, excelente estado', 'Morelia, Michoacán', '5567890123', 'carvana@sales.com', '["https://images.unsplash.com/photo-1590362891991-f776e747a588?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "bajo_kilometraje": true}', '{"sitio_origen": "Carvana"}', true),

-- Más Mazda CX-5 Grand Touring 2021 similares
('https://example.com/mazda-cx5-3', 'Nydesa', 'Mazda CX-5 Grand Touring 2021 AWD', 'Mazda', 'CX-5 Grand Touring', 2021, 535000, 22000, 'Gasolina', 'Automática', 'SUV', 'Negro', 'Mazda CX-5 Grand Touring 2021 con tracción integral AWD', 'Veracruz, Veracruz', '5578901234', 'nydesa@mazda.com', '["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop"]', '{"puertas": 5, "asientos": 7, "traccion_awd": true, "sistema_bose": true}', '{"sitio_origen": "Nydesa"}', true),

('https://example.com/mazda-cx5-4', 'Grupo Prame', 'Mazda CX-5 Grand Touring 2020 Premium', 'Mazda', 'CX-5 Grand Touring', 2020, 485000, 42000, 'Gasolina', 'Automática', 'SUV', 'Blanco', 'Mazda CX-5 Grand Touring 2020 versión premium completa', 'Chihuahua, Chihuahua', '5589012345', 'prame@group.com', '["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop"]', '{"puertas": 5, "asientos": 5, "version_premium": true}', '{"sitio_origen": "Grupo Prame"}', true),

-- Más Nissan Sentra Advance 2022 similares
('https://example.com/nissan-sentra-3', 'Nissan Seminuevos', 'Nissan Sentra Advance 2022 Certificado', 'Nissan', 'Sentra Advance', 2022, 325000, 12000, 'Gasolina', 'CVT', 'Sedan', 'Rojo', 'Nissan Sentra Advance 2022 certificado, garantía extendida', 'Saltillo, Coahuila', '5590123456', 'seminuevos@nissan.com', '["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "certificado": true, "garantia_extendida": true}', '{"sitio_origen": "Nissan Seminuevos"}', true),

('https://example.com/nissan-sentra-4', 'AutoNation', 'Nissan Sentra Advance 2023 Nuevo', 'Nissan', 'Sentra Advance', 2023, 345000, 8000, 'Gasolina', 'CVT', 'Sedan', 'Azul', 'Nissan Sentra Advance 2023 prácticamente nuevo', 'Culiacán, Sinaloa', '5501234567', 'autonation@dealer.com', '["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "practicamente_nuevo": true}', '{"sitio_origen": "AutoNation"}', true),

-- Más Volkswagen Jetta GLI 2020 similares  
('https://example.com/vw-jetta-3', 'Das WeltAuto', 'Volkswagen Jetta GLI 2020 Performance', 'Volkswagen', 'Jetta GLI', 2020, 435000, 45000, 'Gasolina', 'Manual', 'Sedan', 'Rojo', 'Volkswagen Jetta GLI 2020 performance, suspensión deportiva', 'Cuernavaca, Morelos', '5512345678', 'daswelt@vw.com', '["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "suspension_deportiva": true, "motor_performance": true}', '{"sitio_origen": "Das WeltAuto"}', true),

('https://example.com/vw-jetta-4', 'Motornova', 'Volkswagen Jetta GLI 2019 Edición Especial', 'Volkswagen', 'Jetta GLI', 2019, 395000, 68000, 'Gasolina', 'Manual', 'Sedan', 'Blanco', 'Volkswagen Jetta GLI 2019 edición especial con paquete deportivo', 'Oaxaca, Oaxaca', '5523456789', 'motornova@dealer.com', '["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "edicion_especial": true, "paquete_deportivo": true}', '{"sitio_origen": "Motornova"}', true),

('https://example.com/vw-jetta-5', 'Eureka', 'Volkswagen Jetta GLI 2021 Turbo DSG', 'Volkswagen', 'Jetta GLI', 2021, 455000, 35000, 'Gasolina', 'DSG', 'Sedan', 'Gris', 'Volkswagen Jetta GLI 2021 con transmisión DSG automática', 'Villahermosa, Tabasco', '5534567890', 'eureka@vw.com', '["https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop"]', '{"puertas": 4, "asientos": 5, "transmision_dsg": true, "turbo": true}', '{"sitio_origen": "Eureka"}', true);