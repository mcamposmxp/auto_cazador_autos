Análisis de Datos de la Página de Valuación
Campos de la tabla anuncios_vehiculos
Campos principales utilizados:
| Campo | Tipo | Descripción | Tratamiento | |-------|------|-------------|-------------| | id | uuid | Identificador único | Se mapea directamente | | titulo | text | Título del anuncio | Se mapea como string, fallback a '' | | precio | numeric | Precio del vehículo | Se convierte a number, fallback a 0 | | marca | text | Marca del vehículo | Filtro principal en consulta | | modelo | text | Modelo del vehículo | Filtro principal en consulta | | ano | integer | Año del vehículo | Filtro principal en consulta | | kilometraje | integer | Kilometraje del vehículo | Se mapea a number, fallback a 0 | | ubicacion | text | Ubicación/estado | Filtro opcional, se mapea directamente | | sitio_web | text | Sitio web origen | Se mapea directamente | | url_anuncio | text | URL del anuncio | Se mapea directamente | | activo | boolean | Estado del anuncio | Filtro fijo = true |

Procesamiento de Datos
1. Consulta Base

SELECT * FROM anuncios_vehiculos 
WHERE marca = 'marca_vehiculo' 
  AND modelo = 'modelo_vehiculo' 
  AND ano = año_vehiculo
  AND activo = true
ORDER BY precio ASC 
LIMIT 20
2. Filtros Adicionales Aplicados
Filtro por Estado: Si estadoSeleccionado !== "todos" se aplica:

WHERE ubicacion ILIKE '%estado_seleccionado%'
3. Mapeo de Datos
Los datos se transforman en la interfaz AutoSimilar:


const autosMapeados = data?.map(vehiculo => ({
  id: vehiculo.id,
  titulo: vehiculo.titulo || '',
  precio: vehiculo.precio || 0,
  kilometraje: vehiculo.kilometraje || 0,
  ano: vehiculo.ano || 0,
  ubicacion: vehiculo.ubicacion || '',
  sitio_web: vehiculo.sitio_web || '',
  url_anuncio: vehiculo.url_anuncio || ''
}))
Cálculos y Estadísticas Generadas
1. Estadísticas Básicas de Precio

const estadisticasCalculadas = {
  totalAnuncios: autosMapeados.length,
  precioMinimo: Math.min(...precios),
  precioMaximo: Math.max(...precios),
  precioPromedio: precios.reduce((a, b) => a + b, 0) / precios.length,
  precioRecomendado: estadisticas.precioRecomendado || precioPromedio,
  precioPromedioMercado: estadisticas.precioPromedioMercado || 0
}
2. Factor de Kilometraje
Función: calcularFactorKilometraje()

Input: Kilometraje seleccionado, autos similares, datos del vehículo
Lógica:
Calcula kilometraje esperado: (año_actual - año_vehiculo) * 15,000 km/año
Determina factor según ratio: km_seleccionado / km_esperado
Factores aplicados:
≤ 0.5: +12% (muy poco km)
0.5-0.7: +8% (poco km)
0.7-0.9: +4% (ligeramente bajo)
0.9-1.1: Sin cambio (normal)
1.1-1.3: -4% (ligeramente alto)
1.3-1.5: -8% (alto)
> 1.5: -15% (muy alto)
Límites: Factor entre 0.75 y 1.15
3. Precio de Venta Estimado
Función: calcularPrecioVentaEstimado()

Mínimo: precio_recomendado * 0.85
Máximo: precio_recomendado * 0.95
4. Tiempo de Venta Estimado
Función: calcularTiempoVenta()

Lógica:
Si precio ≤ 90% del promedio: "7-15 días"
Si precio ≤ 110% del promedio: "15-30 días"
Si precio > 110% del promedio: "30-60 días"
5. Sugerencia de Ajuste de Precio
Función: calcularSugerenciaAjuste()

Diferencia: ((precio_recomendado - precio_promedio) / precio_promedio) * 100
Sugerencias:
Si diferencia > 10%: Reducir 15% para "vender en 7-10 días"
Si diferencia < -10%: Aumentar 10% para "mejor rentabilidad"
Caso contrario: Mantener precio
6. Distribución de Precios
Función: calcularDistribucionPrecios()

Lógica: Divide el rango de precios en 5 segmentos iguales
Output: Array con inicio, fin, cantidad y porcentaje de cada rango
7. Análisis de Demanda
Función: calcularDemandaAuto()

Sistema de puntuación (100 puntos totales):

Factor 1 - Antigüedad (35%):

≤ 2 años: 35 puntos
3-5 años: 28 puntos
6-8 años: 20 puntos
9-12 años: 12 puntos
> 12 años: 5 puntos
Factor 2 - Competencia/Oferta (30%):

≤ 3 anuncios: 30 puntos
4-8 anuncios: 22 puntos
9-15 anuncios: 15 puntos
16-25 anuncios: 8 puntos
> 25 anuncios: 3 puntos
Factor 3 - Estabilidad de Precios (20%):

Dispersión < 30%: 20 puntos
Dispersión 30-60%: 12 puntos
Dispersión > 60%: 5 puntos
Factor 4 - Prestigio de Marca (15%):

Marcas alta demanda (Toyota, Honda, Mazda, Subaru): 15 puntos
Marcas demanda media: 10 puntos
Otras marcas: 5 puntos
Clasificaciones de Demanda:

≥ 75 puntos: "Muy alta demanda"
55-74 puntos: "Alta demanda"
35-54 puntos: "Demanda moderada"
20-34 puntos: "Baja demanda"
< 20 puntos: "Muy baja demanda"
8. Análisis de Competencia
Función: calcularCompetenciaMercado()

Factor Base: Número total de anuncios similares
Ajustes:
Si estado = "todos": Factor × 1.3
Si tipo vendedor = "todos": Factor × 1.2
Análisis de Intensidad: Basado en coeficiente de variación de precios
0.4: "agresiva"

< 0.15: "estable"
Resto: "normal"
Clasificaciones:
≤ 4 anuncios: "Muy baja competencia"
5-8 anuncios: "Baja competencia"
9-15 anuncios: "Competencia moderada"
16-25 anuncios: "Alta competencia"
> 25 anuncios: "Competencia extrema"
Fuentes de Datos Adicionales
Precio Recomendado de Mercado
Fuente: API MaxiPublica (getCarMarketIntelligenceData)
Campo utilizado: suggestedPricePublish
Fallback: Promedio de precios similares locales
Tiempo de Venta IA
Fuente: Edge Function calcular-tiempo-venta-ia
Input: Datos del vehículo + precio seleccionado + estadísticas de mercado
Output: Estimación inteligente basada en múltiples factores