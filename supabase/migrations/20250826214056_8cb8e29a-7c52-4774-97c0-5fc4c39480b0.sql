-- Crear tabla de historial de ventas
CREATE TABLE public.historico_ventas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER NOT NULL,
  precio_inicial NUMERIC NOT NULL,
  precio_venta NUMERIC NOT NULL,
  fecha_publicacion TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_venta TIMESTAMP WITH TIME ZONE NOT NULL,
  dias_en_mercado INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAYS FROM (fecha_venta - fecha_publicacion))
  ) STORED,
  kilometraje INTEGER,
  ubicacion TEXT,
  tipo_vendedor TEXT NOT NULL DEFAULT 'profesional', -- profesional, particular
  caracteristicas JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.historico_ventas ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer datos históricos (información pública de mercado)
CREATE POLICY "Todos pueden ver historial de ventas" 
ON public.historico_ventas 
FOR SELECT 
USING (true);

-- Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "Solo admins pueden gestionar historial"
ON public.historico_ventas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insertar datos de ejemplo con diferentes patrones de venta
INSERT INTO public.historico_ventas (
  marca, modelo, ano, precio_inicial, precio_venta, 
  fecha_publicacion, fecha_venta, kilometraje, ubicacion, tipo_vendedor
) VALUES
-- Autos que se venden RÁPIDO (5-25 días)
('Toyota', 'Corolla', 2020, 280000, 275000, '2024-01-15', '2024-01-20', 45000, 'Ciudad de México', 'profesional'),
('Honda', 'Civic', 2021, 320000, 315000, '2024-01-10', '2024-01-17', 32000, 'Guadalajara', 'profesional'),
('Nissan', 'Sentra', 2019, 250000, 240000, '2024-01-05', '2024-01-12', 55000, 'Monterrey', 'profesional'),
('Toyota', 'Camry', 2020, 380000, 370000, '2024-01-20', '2024-01-28', 38000, 'Ciudad de México', 'profesional'),
('Honda', 'Accord', 2021, 420000, 410000, '2024-01-25', '2024-02-02', 28000, 'Guadalajara', 'profesional'),
('Mazda', 'Mazda3', 2020, 290000, 285000, '2024-02-01', '2024-02-08', 42000, 'Puebla', 'profesional'),
('Toyota', 'Corolla', 2021, 300000, 295000, '2024-02-05', '2024-02-13', 25000, 'Monterrey', 'profesional'),
('Nissan', 'Altima', 2020, 350000, 340000, '2024-02-10', '2024-02-18', 48000, 'Ciudad de México', 'profesional'),

-- Autos que se venden MEDIO (30-50 días)
('Volkswagen', 'Jetta', 2019, 270000, 250000, '2024-01-01', '2024-02-15', 65000, 'Ciudad de México', 'profesional'),
('Ford', 'Focus', 2020, 260000, 245000, '2024-01-10', '2024-02-25', 58000, 'Guadalajara', 'profesional'),
('Chevrolet', 'Cruze', 2019, 240000, 225000, '2024-01-15', '2024-03-05', 70000, 'Monterrey', 'profesional'),
('Hyundai', 'Elantra', 2020, 280000, 265000, '2024-02-01', '2024-03-20', 52000, 'Puebla', 'profesional'),
('Kia', 'Forte', 2019, 250000, 235000, '2024-02-05', '2024-03-25', 68000, 'León', 'profesional'),

-- Autos que se venden LENTO (60+ días)
('Dodge', 'Attitude', 2018, 180000, 155000, '2024-01-01', '2024-03-15', 85000, 'Ciudad de México', 'particular'),
('Chrysler', '200', 2017, 220000, 190000, '2024-01-05', '2024-03-20', 95000, 'Guadalajara', 'particular'),
('Mitsubishi', 'Lancer', 2017, 200000, 175000, '2024-01-10', '2024-04-01', 88000, 'Monterrey', 'particular'),
('Suzuki', 'Ciaz', 2018, 190000, 165000, '2024-01-15', '2024-04-10', 92000, 'Puebla', 'particular'),
('Renault', 'Fluence', 2017, 170000, 145000, '2024-01-20', '2024-04-15', 98000, 'León', 'particular'),
('Peugeot', '301', 2018, 210000, 180000, '2024-02-01', '2024-05-01', 90000, 'Querétaro', 'particular'),
('Seat', 'Toledo', 2017, 195000, 170000, '2024-02-05', '2024-05-10', 95000, 'Tijuana', 'particular'),

-- Más ejemplos para tener suficientes datos
('Toyota', 'Corolla', 2019, 260000, 255000, '2024-02-15', '2024-02-22', 52000, 'Guadalajara', 'profesional'),
('Honda', 'Civic', 2020, 310000, 305000, '2024-02-20', '2024-02-28', 35000, 'Monterrey', 'profesional'),
('Nissan', 'Sentra', 2021, 270000, 265000, '2024-03-01', '2024-03-08', 18000, 'Ciudad de México', 'profesional'),
('Mazda', 'CX-5', 2020, 450000, 440000, '2024-03-05', '2024-03-14', 40000, 'Guadalajara', 'profesional'),
('Toyota', 'RAV4', 2021, 520000, 510000, '2024-03-10', '2024-03-18', 25000, 'Monterrey', 'profesional');

-- Crear índices para mejorar performance de consultas
CREATE INDEX idx_historico_ventas_marca_modelo ON public.historico_ventas(marca, modelo);
CREATE INDEX idx_historico_ventas_dias_mercado ON public.historico_ventas(dias_en_mercado);
CREATE INDEX idx_historico_ventas_fecha_venta ON public.historico_ventas(fecha_venta);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_historico_ventas_updated_at
  BEFORE UPDATE ON public.historico_ventas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();