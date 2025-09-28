# Reporte Técnico: Análisis de Variables y Construcción de la Página de Valuación Vehicular

## 1\. Arquitectura General del Sistema

### 1.1 Componentes Principales

* ValuacionAuto.tsx (contenedor principal)  
* FormularioValuacion.tsx (captura de datos)  
* AnalisisPrecio.tsx (motor de análisis)  
* AnalisisMercado.tsx (visualización de mercado)  
* Edge Functions (servicios backend)  
* Base de Datos Supabase (almacenamiento)

Todos los archivos están ubicados en la carpeta `src/components/` del proyecto.

## 2\. Flujo de Datos y Construcción de Variables

### 2.1 Captura de Datos (FormularioValuacion.tsx)

Variables de Origen:

* `marcas`: Array de objetos desde Edge Function `catalogo-vehiculos`  
* `modelos`: Array jerárquico basado en `marcaId` seleccionada  
* `anos`: Array basado en `modeloId` seleccionado  
* `versiones`: Array basado en `anoId` seleccionado

Fuente de Datos: API MaxiPublica a través de Edge Function

`const { data, error } = await supabase.functions.invoke('catalogo-vehiculos', {`  
  `body: { catalogId: marcaId }`

`});`

### 2.2 Datos del Mercado (AnalisisPrecio.tsx)

Variables de Cálculo:

* `autosSimilares`: Query desde tabla `anuncios_vehiculos`  
* `estadisticas`: Objeto calculado con:  
  * `precioRecomendado`: Promedio de precios similares  
  * `precioMinimo/Maximo`: Min/Max del dataset  
  * `precioPromedio`: Media aritmética  
  * `precioPromedioMercado`: API externa MaxiPublica

| La tabla ‘`anuncios_vehiculos`’ no contiene información suficiente para este módulo, ya que son datos de prueba que ademas no tienen el campo de la version y no tienen el identificador del ´trimId’ |
| :---- |

Query Principal:

`let query = supabase`  
  `.from('anuncios_vehiculos')`  
  `.select('*')`  
  `.eq('marca', datos.marca)`  
  `.eq('modelo', datos.modelo)`  
  `.eq('ano', datos.ano)`

  `.eq('activo', true);`

### 2.3 Inteligencia de Mercado Externa

Fuente: Edge Function `getCarMarketIntelligenceData`

* Endpoint: API MaxiPublica  
* Parámetro: `versionId` del catálogo  
* Variables obtenidas:  
  * `suggestedPricePublish`: Precio sugerido de publicación  
  * `averageSalesTime`: Tiempo promedio de venta  
  * `histPrice`: Distribución histórica de precios

## 3\. Lógica de Cálculos (priceAnalysisCalculations.ts)

### 3.1 Factor de Kilometraje

`export const calcularFactorKilometraje = (kilometrajeSeleccionado, autosSimilares, datos)`

Algoritmo:

1. Calcula kilometraje esperado: `antiguedad * 15000 km/año`  
2. Factor vs esperado: `kilometrajeSeleccionado / kmEsperadoTotal`  
3. Aplica bonificaciones/penalizaciones:  
   * ≤0.5: \+12% (muy poco uso)  
   * *1.5: \-15% (uso excesivo)*

### 3.2 Análisis de Demanda

`export const calcularDemandaAuto = (autosSimilares, datos, estadisticas)`

Factores ponderados:

* Antigüedad del vehículo (35%)  
* Competencia/oferta en mercado (30%)  
* Estabilidad de precios (20%)  
* Prestigio de marca (15%)

### 3.3 Análisis de Competencia

`export const calcularCompetenciaMercado = (autosSimilares, estadoSeleccionado, tipoVendedorSeleccionado)`

Variables:

* `factorCompetencia`: Número total de anuncios ajustado por filtros  
* `intensidadCompetencia`: Basado en dispersión de precios (coeficiente de variación)

## 4\. Integración con IA (calcular-tiempo-venta-ia)

### 4.1 Variables de Entrada

`interface CalculoTiempoRequest {`  
  `precioSeleccionado: number;`  
  `precioRecomendado: number;`  
  `datosVehiculo: {`  
    `marca, modelo, ano, kilometraje, estado, ciudad`  
  `};`  
  `estadisticasMercado?: {`  
    `demanda, competencia, tendencia`  
  `};`

`}`

### 4.2 Procesamiento IA

* Modelo: GPT-4o-mini  
* Prompt: Análisis contextual de mercado mexicano  
* Output: JSON estructurado con tiempo estimado y factores

## 5\. Visualización de Datos (AnalisisMercado.tsx)

### 5.1 Variables Calculadas en Memoria

`const posicionPrecio = ((precio - datos.rangoMinimo) / (datos.rangoMaximo - datos.rangoMinimo)) * 100;`

### 5.2 Distribución de Precios

`const distribucionPrecios = [`  
  `{ rango: "Muy Bajo", porcentaje: 8, color: "bg-green-500" },`  
  `{ rango: "Bajo", porcentaje: 17, color: "bg-yellow-500" },`  
  `// ... más rangos`

`];`

## 6\. Estados y Gestión de Memoria

### 6.1 Estados Principales (AnalisisPrecio.tsx)

* `autosSimilares`: Array de vehículos similares  
* `estadisticas`: Objeto con métricas calculadas  
* `precioSeleccionado`: Estado local del precio ajustado  
* `kilometrajeSeleccionado`: Estado local del kilometraje  
* `estadisticasKilometraje`: Métricas de kilometraje calculadas

### 6.2 Optimizaciones con useMemo

`const demandaAuto = useMemo(() => calcularDemandaAuto(autosSimilares, datos, estadisticas), [autosSimilares, datos, estadisticas]);`

`const competenciaMercado = useMemo(() => calcularCompetenciaMercado(autosSimilares, estadoSeleccionado, tipoVendedorSeleccionado), [autosSimilares, estadoSeleccionado, tipoVendedorSeleccionado]);`

## 7\. Sistema de Créditos y Autenticación

### 7.1 Control de Acceso

* `useCreditControl`: Hook para gestión de créditos  
* `AuthRequiredWrapper`: Componente de autenticación  
* Sistema de consumo de créditos tipificado

### 7.2 Validación de Créditos

`const creditConsumed = await consumeCredits(1, 'price_analysis', 'search', {`  
  `marca: formData.marca,`  
  `modelo: formData.modelo,`  
  `ano: formData.ano`

`});`

## 8\. Fuentes de Datos

### 8.1 Base de Datos Principal

* Tabla: `anuncios_vehiculos`  
* Campos clave: marca, modelo, año, precio, kilometraje, ubicacion, activo

### 8.2 APIs Externas

* MaxiPublica Catálogo: Estructura jerárquica de vehículos  
* MaxiPublica Market Intelligence: Precios y estadísticas de mercado

### 8.3 Datos Sintéticos

* Distribución de precios por rangos  
* Factores de demanda por marca  
* Algoritmos de depreciación

## 9\. Consideraciones Críticas

### 9.1 Manejo de Errores

* Fallbacks para APIs externas  
* Datos sintéticos cuando no hay información  
* Validaciones de entrada de usuario

### 9.2 Optimizaciones de Performance

* Memoización de cálculos complejos  
* Debouncing en controles interactivos  
* Paginación y límites en queries

### 9.3 Seguridad de Datos

* Validación de precios y rangos  
* Normalización de datos de entrada  
* Control de acceso por créditos

El sistema combina datos reales del mercado mexicano con algoritmos de análisis avanzados e inteligencia artificial para proporcionar valuaciones precisas y actualizadas.

# Reporte Técnico: Análisis de Variables y Construcción de la Página de Valuación Vehicular

## 1\. Arquitectura General del Sistema

### 1.1 Componentes Principales

* ValuacionAuto.tsx (contenedor principal)  
* FormularioValuacion.tsx (captura de datos)  
* AnalisisPrecio.tsx (motor de análisis)  
* AnalisisMercado.tsx (visualización de mercado)  
* Edge Functions (servicios backend)  
* Base de Datos Supabase (almacenamiento)

## 2\. Flujo de Datos y Construcción de Variables

### 2.1 Captura de Datos (FormularioValuacion.tsx)

Variables de Origen:

* `marcas`: Array de objetos desde Edge Function `catalogo-vehiculos`  
* `modelos`: Array jerárquico basado en `marcaId` seleccionada  
* `anos`: Array basado en `modeloId` seleccionado  
* `versiones`: Array basado en `anoId` seleccionado

Fuente de Datos: API MaxiPublica a través de Edge Function

`const { data, error } = await supabase.functions.invoke('catalogo-vehiculos', {`  
  `body: { catalogId: marcaId }`

`});`

### 2.2 Datos del Mercado (AnalisisPrecio.tsx)

Variables de Cálculo:

* `autosSimilares`: Query desde tabla `anuncios_vehiculos`  
* `estadisticas`: Objeto calculado con:  
  * `precioRecomendado`: Promedio de precios similares  
  * `precioMinimo/Maximo`: Min/Max del dataset  
  * `precioPromedio`: Media aritmética  
  * `precioPromedioMercado`: API externa MaxiPublica

Query Principal:

`let query = supabase`  
  `.from('anuncios_vehiculos')`  
  `.select('*')`  
  `.eq('marca', datos.marca)`  
  `.eq('modelo', datos.modelo)`  
  `.eq('ano', datos.ano)`

  `.eq('activo', true);`

### 2.3 Inteligencia de Mercado Externa

Fuente: Edge Function `getCarMarketIntelligenceData`

* Endpoint: API MaxiPublica  
* Parámetro: `versionId` del catálogo  
* Variables obtenidas:  
  * `suggestedPricePublish`: Precio sugerido de publicación  
  * `averageSalesTime`: Tiempo promedio de venta  
  * `histPrice`: Distribución histórica de precios

## 3\. Lógica de Cálculos (priceAnalysisCalculations.ts)

### 3.1 Factor de Kilometraje

`export const calcularFactorKilometraje = (kilometrajeSeleccionado, autosSimilares, datos)`

Algoritmo:

1. Calcula kilometraje esperado: `antiguedad * 15000 km/año`  
2. Factor vs esperado: `kilometrajeSeleccionado / kmEsperadoTotal`  
3. Aplica bonificaciones/penalizaciones:  
   * ≤0.5: \+12% (muy poco uso)  
   * *1.5: \-15% (uso excesivo)*

### 3.2 Análisis de Demanda

`export const calcularDemandaAuto = (autosSimilares, datos, estadisticas)`

Factores ponderados:

* Antigüedad del vehículo (35%)  
* Competencia/oferta en mercado (30%)  
* Estabilidad de precios (20%)  
* Prestigio de marca (15%)

### 3.3 Análisis de Competencia

`export const calcularCompetenciaMercado = (autosSimilares, estadoSeleccionado, tipoVendedorSeleccionado)`

Variables:

* `factorCompetencia`: Número total de anuncios ajustado por filtros  
* `intensidadCompetencia`: Basado en dispersión de precios (coeficiente de variación)

## 4\. Integración con IA (calcular-tiempo-venta-ia)

### 4.1 Variables de Entrada

`interface CalculoTiempoRequest {`  
  `precioSeleccionado: number;`  
  `precioRecomendado: number;`  
  `datosVehiculo: {`  
    `marca, modelo, ano, kilometraje, estado, ciudad`  
  `};`  
  `estadisticasMercado?: {`  
    `demanda, competencia, tendencia`  
  `};`

`}`

### 4.2 Procesamiento IA

* Modelo: GPT-4o-mini  
* Prompt: Análisis contextual de mercado mexicano  
* Output: JSON estructurado con tiempo estimado y factores

## 5\. Visualización de Datos (AnalisisMercado.tsx)

### 5.1 Variables Calculadas en Memoria

`const posicionPrecio = ((precio - datos.rangoMinimo) / (datos.rangoMaximo - datos.rangoMinimo)) * 100;`

### 5.2 Distribución de Precios

`const distribucionPrecios = [`  
  `{ rango: "Muy Bajo", porcentaje: 8, color: "bg-green-500" },`  
  `{ rango: "Bajo", porcentaje: 17, color: "bg-yellow-500" },`  
  `// ... más rangos`

`];`

## 6\. Estados y Gestión de Memoria

### 6.1 Estados Principales (AnalisisPrecio.tsx)

* `autosSimilares`: Array de vehículos similares  
* `estadisticas`: Objeto con métricas calculadas  
* `precioSeleccionado`: Estado local del precio ajustado  
* `kilometrajeSeleccionado`: Estado local del kilometraje  
* `estadisticasKilometraje`: Métricas de kilometraje calculadas

### 6.2 Optimizaciones con useMemo

`const demandaAuto = useMemo(() => calcularDemandaAuto(autosSimilares, datos, estadisticas), [autosSimilares, datos, estadisticas]);`

`const competenciaMercado = useMemo(() => calcularCompetenciaMercado(autosSimilares, estadoSeleccionado, tipoVendedorSeleccionado), [autosSimilares, estadoSeleccionado, tipoVendedorSeleccionado]);`

## 7\. Sistema de Créditos y Autenticación

### 7.1 Control de Acceso

* `useCreditControl`: Hook para gestión de créditos  
* `AuthRequiredWrapper`: Componente de autenticación  
* Sistema de consumo de créditos tipificado

### 7.2 Validación de Créditos

`const creditConsumed = await consumeCredits(1, 'price_analysis', 'search', {`  
  `marca: formData.marca,`  
  `modelo: formData.modelo,`  
  `ano: formData.ano`

`});`

## 8\. Fuentes de Datos

### 8.1 Base de Datos Principal

* Tabla: `anuncios_vehiculos`  
* Campos clave: marca, modelo, año, precio, kilometraje, ubicacion, activo

### 8.2 APIs Externas

* MaxiPublica Catálogo: Estructura jerárquica de vehículos  
* MaxiPublica Market Intelligence: Precios y estadísticas de mercado

### 8.3 Datos Sintéticos

* Distribución de precios por rangos  
* Factores de demanda por marca  
* Algoritmos de depreciación

## 9\. Consideraciones Críticas

### 9.1 Manejo de Errores

* Fallbacks para APIs externas  
* Datos sintéticos cuando no hay información  
* Validaciones de entrada de usuario

### 9.2 Optimizaciones de Performance

* Memoización de cálculos complejos  
* Debouncing en controles interactivos  
* Paginación y límites en queries

### 9.3 Seguridad de Datos

* Validación de precios y rangos  
* Normalización de datos de entrada  
* Control de acceso por créditos

El sistema combina datos reales del mercado mexicano con algoritmos de análisis avanzados e inteligencia artificial para proporcionar valuaciones precisas y actualizadas.  