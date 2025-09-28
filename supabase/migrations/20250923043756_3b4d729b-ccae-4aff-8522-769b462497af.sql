-- Create a test filter for verification
INSERT INTO profesional_filtros_ofertas (
  profesional_id,
  tipo_filtro,
  activo,
  filtros_vehiculo
) VALUES (
  '25da02c1-c147-4b36-8e7e-7c30fa93c1a4', -- Using existing professional
  'personalizado',
  true,
  '{
    "marcas_modelos": [
      {
        "marca": "Toyota",
        "modelos": ["Corolla", "Camry"],
        "años": {"min": 2018, "max": 2023}
      }
    ],
    "rango_precio": {
      "activo": true,
      "min": 200000,
      "max": 400000
    },
    "rango_kilometraje": {
      "activo": true,
      "min": 0,
      "max": 80000
    }
  }'::jsonb
) ON CONFLICT (profesional_id) DO UPDATE SET
  tipo_filtro = EXCLUDED.tipo_filtro,
  activo = EXCLUDED.activo,
  filtros_vehiculo = EXCLUDED.filtros_vehiculo,
  updated_at = now();

-- Test the filter function directly
SELECT 
  evaluar_filtros_vehiculo(
    '25da02c1-c147-4b36-8e7e-7c30fa93c1a4'::uuid,
    'Toyota',
    'Corolla', 
    2020,
    50000,
    300000
  ) as should_match_toyota_corolla;

SELECT 
  evaluar_filtros_vehiculo(
    '25da02c1-c147-4b36-8e7e-7c30fa93c1a4'::uuid,
    'Honda',
    'Civic',
    2020, 
    50000,
    300000
  ) as should_not_match_honda;