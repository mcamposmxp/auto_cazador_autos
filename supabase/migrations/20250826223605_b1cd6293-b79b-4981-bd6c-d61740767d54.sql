-- Insertar más datos realistas en historico_ventas para mejorar las analíticas
INSERT INTO historico_ventas (marca, modelo, ano, precio_inicial, precio_venta, fecha_publicacion, fecha_venta, dias_en_mercado, kilometraje, ubicacion, tipo_vendedor) VALUES

-- Autos que se venden rápido (menos de 30 días)
('Toyota', 'Corolla', 2022, 350000, 340000, '2024-01-15', '2024-01-28', 13, 25000, 'Ciudad de México, CDMX', 'profesional'),
('Honda', 'Civic', 2023, 420000, 415000, '2024-02-01', '2024-02-12', 11, 15000, 'Guadalajara, Jalisco', 'profesional'),
('Nissan', 'Versa', 2022, 280000, 275000, '2024-01-20', '2024-02-05', 16, 35000, 'Monterrey, Nuevo León', 'profesional'),
('Volkswagen', 'Jetta', 2023, 390000, 385000, '2024-02-10', '2024-02-28', 18, 20000, 'Puebla, Puebla', 'profesional'),
('Hyundai', 'Accent', 2022, 260000, 250000, '2024-01-25', '2024-02-15', 21, 40000, 'Querétaro, Querétaro', 'particular'),
('Kia', 'Rio', 2023, 270000, 265000, '2024-02-05', '2024-02-20', 15, 18000, 'León, Guanajuato', 'profesional'),
('Chevrolet', 'Onix', 2022, 240000, 235000, '2024-01-30', '2024-02-18', 19, 32000, 'Tijuana, Baja California', 'particular'),
('Ford', 'Fiesta', 2021, 220000, 210000, '2024-02-12', '2024-03-05', 22, 45000, 'Mérida, Yucatán', 'particular'),
('Mazda', 'Mazda2', 2022, 290000, 285000, '2024-01-18', '2024-02-08', 21, 28000, 'Toluca, Estado de México', 'profesional'),
('Suzuki', 'Swift', 2023, 250000, 245000, '2024-02-15', '2024-03-08', 22, 12000, 'Cancún, Quintana Roo', 'profesional'),

-- Autos de venta media (30-60 días)
('Toyota', 'Camry', 2021, 450000, 430000, '2024-01-10', '2024-03-15', 45, 55000, 'Ciudad de México, CDMX', 'profesional'),
('Honda', 'Accord', 2020, 420000, 400000, '2024-01-20', '2024-03-25', 42, 65000, 'Guadalajara, Jalisco', 'profesional'),
('Nissan', 'Sentra', 2021, 320000, 310000, '2024-02-01', '2024-03-20', 38, 48000, 'Monterrey, Nuevo León', 'particular'),
('Volkswagen', 'Passat', 2020, 380000, 365000, '2024-01-25', '2024-03-18', 52, 70000, 'Puebla, Puebla', 'profesional'),
('Hyundai', 'Elantra', 2021, 340000, 325000, '2024-02-05', '2024-03-28', 41, 52000, 'Querétaro, Querétaro', 'particular'),
('Mazda', 'Mazda3', 2020, 360000, 345000, '2024-01-15', '2024-03-10', 55, 58000, 'León, Guanajuato', 'profesional'),
('Ford', 'Focus', 2019, 280000, 265000, '2024-02-10', '2024-04-05', 47, 75000, 'Tijuana, Baja California', 'particular'),
('Chevrolet', 'Cruze', 2020, 320000, 305000, '2024-01-28', '2024-03-22', 54, 62000, 'Mérida, Yucatán', 'profesional'),
('Kia', 'Forte', 2021, 310000, 295000, '2024-02-08', '2024-03-30', 51, 48000, 'Toluca, Estado de México', 'particular'),
('Suzuki', 'Ciaz', 2020, 270000, 255000, '2024-01-22', '2024-03-15', 53, 68000, 'Cancún, Quintana Roo', 'profesional'),

-- Autos que se venden lento (más de 60 días)
('BMW', 'Serie 3', 2018, 650000, 580000, '2023-11-15', '2024-03-20', 95, 85000, 'Ciudad de México, CDMX', 'particular'),
('Mercedes-Benz', 'Clase C', 2017, 700000, 620000, '2023-12-01', '2024-03-25', 115, 95000, 'Guadalajara, Jalisco', 'particular'),
('Audi', 'A4', 2018, 680000, 600000, '2023-11-20', '2024-03-18', 118, 90000, 'Monterrey, Nuevo León', 'particular'),
('Lexus', 'IS', 2017, 720000, 640000, '2023-12-10', '2024-04-05', 116, 88000, 'Puebla, Puebla', 'particular'),
('Infiniti', 'Q50', 2018, 550000, 480000, '2023-11-25', '2024-03-28', 123, 92000, 'Querétaro, Querétaro', 'particular'),
('Volvo', 'S60', 2017, 480000, 420000, '2023-12-05', '2024-04-02', 119, 105000, 'León, Guanajuato', 'particular'),
('Cadillac', 'ATS', 2016, 520000, 450000, '2023-11-18', '2024-03-22', 125, 110000, 'Tijuana, Baja California', 'particular'),
('Lincoln', 'MKZ', 2017, 460000, 390000, '2023-12-08', '2024-04-08', 122, 98000, 'Mérida, Yucatán', 'particular'),
('Acura', 'TLX', 2018, 580000, 510000, '2023-11-28', '2024-03-30', 123, 87000, 'Toluca, Estado de México', 'particular'),
('Genesis', 'G80', 2019, 850000, 750000, '2023-12-12', '2024-04-10', 120, 75000, 'Cancún, Quintana Roo', 'particular'),

-- SUVs populares (venta rápida a media)
('Toyota', 'RAV4', 2022, 550000, 535000, '2024-02-01', '2024-02-25', 24, 30000, 'Ciudad de México, CDMX', 'profesional'),
('Honda', 'CR-V', 2023, 620000, 610000, '2024-01-15', '2024-02-10', 26, 18000, 'Guadalajara, Jalisco', 'profesional'),
('Mazda', 'CX-5', 2022, 580000, 565000, '2024-02-05', '2024-03-08', 32, 25000, 'Monterrey, Nuevo León', 'profesional'),
('Nissan', 'X-Trail', 2021, 520000, 500000, '2024-01-20', '2024-03-15', 55, 45000, 'Puebla, Puebla', 'particular'),
('Hyundai', 'Tucson', 2022, 490000, 475000, '2024-02-10', '2024-03-18', 37, 22000, 'Querétaro, Querétaro', 'profesional'),
('Kia', 'Sportage', 2021, 460000, 445000, '2024-01-25', '2024-03-12', 47, 38000, 'León, Guanajuato', 'particular'),
('Ford', 'Escape', 2020, 420000, 400000, '2024-02-08', '2024-03-25', 46, 52000, 'Tijuana, Baja California', 'profesional'),
('Chevrolet', 'Equinox', 2021, 480000, 465000, '2024-01-28', '2024-03-20', 52, 41000, 'Mérida, Yucatán', 'profesional'),
('Volkswagen', 'Tiguan', 2020, 520000, 495000, '2024-02-12', '2024-04-02', 50, 48000, 'Toluca, Estado de México', 'particular'),
('Subaru', 'Forester', 2021, 540000, 520000, '2024-01-18', '2024-03-05', 47, 35000, 'Cancún, Quintana Roo', 'profesional'),

-- Pickups (mercado específico)
('Ford', 'Ranger', 2021, 580000, 560000, '2024-01-10', '2024-02-28', 49, 65000, 'Ciudad de México, CDMX', 'profesional'),
('Chevrolet', 'Colorado', 2020, 620000, 590000, '2024-01-22', '2024-03-18', 56, 72000, 'Guadalajara, Jalisco', 'profesional'),
('Nissan', 'Frontier', 2021, 640000, 615000, '2024-02-01', '2024-03-25', 53, 58000, 'Monterrey, Nuevo León', 'profesional'),
('Toyota', 'Hilux', 2022, 680000, 665000, '2024-01-15', '2024-03-02', 47, 42000, 'Puebla, Puebla', 'profesional'),
('Volkswagen', 'Amarok', 2020, 720000, 685000, '2024-02-05', '2024-04-08', 63, 78000, 'Querétaro, Querétaro', 'particular'),

-- Autos de lujo (venta lenta)
('Mercedes-Benz', 'GLE', 2019, 1200000, 1050000, '2023-10-15', '2024-03-28', 165, 65000, 'Ciudad de México, CDMX', 'particular'),
('BMW', 'X5', 2018, 1100000, 950000, '2023-11-01', '2024-04-02', 153, 75000, 'Guadalajara, Jalisco', 'particular'),
('Audi', 'Q7', 2019, 1350000, 1150000, '2023-10-20', '2024-03-30', 162, 68000, 'Monterrey, Nuevo León', 'particular'),
('Porsche', 'Cayenne', 2017, 1800000, 1500000, '2023-09-25', '2024-04-10', 198, 85000, 'Puebla, Puebla', 'particular'),
('Land Rover', 'Range Rover', 2018, 2200000, 1850000, '2023-09-10', '2024-04-05', 208, 72000, 'Querétaro, Querétaro', 'particular'),

-- Autos compactos económicos (venta rápida)
('Nissan', 'March', 2022, 210000, 205000, '2024-02-15', '2024-03-02', 16, 28000, 'León, Guanajuato', 'profesional'),
('Chevrolet', 'Beat', 2023, 195000, 190000, '2024-02-08', '2024-02-25', 17, 15000, 'Tijuana, Baja California', 'profesional'),
('Hyundai', 'Grand i10', 2022, 220000, 215000, '2024-01-28', '2024-02-18', 21, 32000, 'Mérida, Yucatán', 'particular'),
('Kia', 'Picanto', 2023, 200000, 195000, '2024-02-12', '2024-03-05', 22, 18000, 'Toluca, Estado de México', 'profesional'),
('Suzuki', 'Celerio', 2022, 185000, 180000, '2024-02-01', '2024-02-20', 19, 25000, 'Cancún, Quintana Roo', 'particular');