# REPORTE TÉCNICO: FUENTE DE DATOS PARA PRECIO PROMEDIO DE MERCADO

## 1. Resumen Ejecutivo

### Descripción del Análisis
Este reporte detalla específicamente **dónde se obtienen los datos** `datos: MarketData` y `vehiculosSimilares` que alimentan el algoritmo principal de cálculo de precio promedio de mercado. El análisis se enfoca en el flujo de datos desde las fuentes originales hasta su utilización en los cálculos.

### Hallazgos Principales
- **`datos: MarketData`**: Se obtiene principalmente de la API MaxiPublica mediante la Edge Function `getCarMarketIntelligenceData`
- **`vehiculosSimilares`**: Se obtiene de la API MaxiPublica mediante la Edge Function `maxi_similar_cars`
- Ambos flujos utilizan el `versionId` del vehículo como identificador clave
- Existe un sistema de fallback que utiliza datos locales cuando no están disponibles los datos de MaxiPublica

---

## 2. Arquitectura de Fuentes de Datos

### Diagrama de Flujo de Datos

```
Usuario (Formulario) → versionId → Edge Functions → APIs MaxiPublica → Procesamiento → Algoritmos
                                      ↓
                              getCarMarketIntelligenceData
                                      ↓
                                [datos: MarketData]
                                      ↓
                              maxi_similar_cars  
                                      ↓
                              [vehiculosSimilares]
                                      ↓
                           calcularPrecioPromedio()
```

### APIs Involucradas

1. **MaxiPublica Market Intelligence API**
   - Endpoint: `https://api.maxipublica.com/v3/232AE09500000534D23EE1295785AA9834/example/{versionId}`
   - Propósito: Obtener `datos: MarketData` (precio sugerido)

2. **MaxiPublica Ads Sites API**
   - Endpoint: `https://api.maxipublica.com/v3/ads_sites/210000?categoryId={versionId}`
   - Propósito: Obtener `vehiculosSimilares` (anuncios similares)

---

## 3. Análisis Detallado: Origen de `datos: MarketData`

### 3.1 Punto de Origen
**Archivo**: `src/components/AnalisisPrecio.tsx`
**Función**: `cargarPrecioMercado()` (líneas 95-145)

```typescript
const cargarPrecioMercado = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('getCarMarketIntelligenceData', {
      body: { versionId: datos.versionId }
    });

    if (data?.suggestedPrice?.suggestedPricePublish && data.suggestedPrice.suggestedPricePublish > 0) {
      const precioRecomendado = data.suggestedPrice.suggestedPricePublish;
      setEstadisticas(prev => ({
        ...prev,
        precioRecomendado: precioRecomendado,
        precioPromedioMercado: precioRecomendado,  // ← AQUÍ SE ORIGINA MarketData
        precioPromedio: precioRecomendado
      }));
    }
  } catch (error) {
    // Manejo de errores
  }
};
```

### 3.2 Edge Function: getCarMarketIntelligenceData
**Archivo**: `supabase/functions/getCarMarketIntelligenceData/index.ts`

```typescript
// Llamada a API MaxiPublica
const apiUrl = `https://api.maxipublica.com/v3/232AE09500000534D23EE1295785AA9834/example/${versionId}`;
const response = await fetch(apiUrl, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${authorization}`,
    'Content-Type': 'application/json'
  }
});
```

### 3.3 Estructura de Datos de MaxiPublica (MarketData)
```json
{
  "suggestedPrice": {
    "suggestedPricePublish": 440000,    // ← Valor principal usado
    "averagePriceSale": 388600,
    "averagePricePurchase": 352200
  },
  "averageSalesTime": { "averageTime": 38 },
  "certainty": 4,
  "avgPrice": 440000
}
```

### 3.4 Transformación a Estado de la Aplicación
**Archivo**: `src/components/AnalisisPrecio.tsx` (líneas 41-48)

```typescript
const [estadisticas, setEstadisticas] = useState({
  precioRecomendado: 0,        // ← suggestedPricePublish
  precioMinimo: 0,
  precioMaximo: 0,
  precioPromedio: 0,
  precioPromedioMercado: 0,    // ← DATOS PRINCIPALES MarketData
  totalAnuncios: 0
});
```

---

## 4. Análisis Detallado: Origen de `vehiculosSimilares`

### 4.1 Punto de Origen
**Archivo**: `src/components/AnalisisPrecio.tsx`
**Función**: `cargarAnalisis()` (líneas 161-301)

```typescript
const cargarAnalisis = useCallback(async () => {
  try {
    const { data: maxiData, error: maxiError } = await supabase.functions.invoke('maxi_similar_cars', {
      body: { versionId }  // ← Mismo versionId que MarketData
    });
    
    if (!maxiError && maxiData?.similarsCars && maxiData.similarsCars.length > 0) {
      // Mapear datos de maxi_similar_cars al formato esperado
      const autosMapeados = maxiData.similarsCars.map((vehiculo: any) => ({
        id: vehiculo.id,
        precio: vehiculo.price,    // ← PRECIOS PARA EL ALGORITMO
        kilometraje: vehiculo.odometer,
        ano: parseInt(vehiculo.year),
        marca: vehiculo.brand,
        modelo: vehiculo.model,
        // ... más campos
      }));
      
      setAutosSimilares(autosFilterados);  // ← AQUÍ SE ORIGINAN vehiculosSimilares
    }
  } catch (error) {
    // Manejo de errores
  }
}, [datos, estadoSeleccionado, tipoVendedorSeleccionado, toast]);
```

### 4.2 Edge Function: maxi_similar_cars
**Archivo**: `supabase/functions/maxi_similar_cars/index.ts`

```typescript
// Obtener token de base de datos
const { data: tokenData } = await supabase
  .from('api_tokens')
  .select('token')
  .single();

// Llamada a API MaxiPublica
const apiUrl = `https://api.maxipublica.com/v3/ads_sites/210000?categoryId=${versionId}`;
const response = await fetch(apiUrl, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 4.3 Estructura de Respuesta API MaxiPublica (vehiculosSimilares)
```json
{
  "similarsCars": [
    {
      "id": "string",
      "price": 350000,          // ← Precio para algoritmo
      "odometer": 45000,        // ← Kilometraje
      "brand": "Toyota",
      "model": "Camry",
      "year": "2020",
      "condition": "Usado",
      "city": "Ciudad de México",
      "state": "CDMX",
      "permalink": "url_anuncio"
    }
    // ... más vehículos similares
  ]
}
```

### 4.4 Mapeo a Interface AutoSimilar
**Archivo**: `src/utils/priceAnalysisCalculations.ts` (líneas 3-12)

```typescript
export interface AutoSimilar {
  id: string;
  titulo: string;
  precio: number;           // ← vehiculo.price de MaxiPublica
  kilometraje: number;      // ← vehiculo.odometer de MaxiPublica  
  ano: number;              // ← parseInt(vehiculo.year)
  ubicacion: string;
  sitio_web: string;
  url_anuncio: string;
}
```

---

## 5. Flujo Completo del Algoritmo Principal

### 5.1 Cómo se Conectan los Datos en el Algoritmo

```typescript
// PSEUDO-CÓDIGO del algoritmo real
function calcularPrecioPromedio(datos: MarketData): number {
  // 1. datos.suggestedPricePublish viene de getCarMarketIntelligenceData
  if (datos.suggestedPricePublish && datos.suggestedPricePublish > 0) {
    return datos.suggestedPricePublish;  // ← Fuente: MaxiPublica Market Intelligence
  }
  
  // 2. vehiculosSimilares viene de maxi_similar_cars  
  const precios = vehiculosSimilares    // ← Fuente: MaxiPublica Ads Sites
    .map(v => v.precio)                 // ← v.precio = vehiculo.price de API
    .filter(p => p > 0);
  
  if (precios.length > 0) {
    return precios.reduce((a, b) => a + b, 0) / precios.length;
  }
  
  // 3. Fallback: Consultar base de datos interna (no implementado actualmente)
  return calcularPromedioBaseDatos(marca, modelo, ano);
}
```

### 5.2 Implementación Real en el Código
**Archivo**: `src/components/AnalisisMercado.tsx` (líneas 169-195)

```typescript
// Los datos se calculan en tiempo real usando useMemo
const datos: DatosMercado = useMemo(() => ({
  precioPromedio: estadisticas.precioPromedioMercado || estadisticas.precioRecomendado,
  rangoMinimo: estadisticas.precioMinimo,
  rangoMaximo: estadisticas.precioMaximo,
  vehiculosSimilares: autosSimilares.length
}), [estadisticas, autosSimilares]);
```

---

## 6. Configuración de Autenticación

### 6.1 Tokens de API MaxiPublica

#### Market Intelligence API
```typescript
// Almacenado en Supabase Secrets
const authorization = Deno.env.get('market_intelligence_authorization');
// Valor: fdaa9f033b*** (token estático)
```

#### Ads Sites API  
```typescript
// Almacenado en tabla 'api_tokens' de Supabase
const { data: tokenData } = await supabase
  .from('api_tokens')
  .select('token')
  .single();
// Valor: token dinámico que se actualiza periódicamente
```

### 6.2 Identificador Clave: versionId
```typescript
// El versionId es el puente entre todas las APIs
// Ejemplo: "v_1_4_2_35_3" para Audi A3 2023 35 Dynamic
const versionId = datos.versionId;  // Obtenido del catálogo de vehículos
```

---

## 7. Cálculos Específicos con Datos Reales

### 7.1 Cálculo de Precio Promedio de Mercado
**Archivo**: `src/components/AnalisisPrecio.tsx` (líneas 233-250)

```typescript
// Usando datos de vehiculosSimilares de maxi_similar_cars
if (autosFilterados.length > 0) {
  const precios = autosFilterados.map(auto => auto.precio).filter(p => p > 0);
  
  if (precios.length > 0) {
    const estadisticasCalculadas = {
      precioPromedio: precios.reduce((a, b) => a + b, 0) / precios.length,  // ← CÁLCULO REAL
      precioMinimo: Math.min(...precios),
      precioMaximo: Math.max(...precios),
      precioRecomendado: estadisticas.precioRecomendado || (precios.reduce((a, b) => a + b, 0) / precios.length),
      precioPromedioMercado: estadisticas.precioPromedioMercado || 0  // ← DE MaxiPublica
    };
  }
}
```

### 7.2 Jerarquía de Fuentes de Datos

1. **Prioridad 1**: `estadisticas.precioPromedioMercado` (MaxiPublica Market Intelligence)
2. **Prioridad 2**: Promedio calculado de `vehiculosSimilares` (MaxiPublica Ads Sites)  
3. **Prioridad 3**: Base de datos interna (no implementado)

---

## 8. Dependencias y Prerequisitos

### 8.1 Datos Requeridos para el Flujo
```typescript
// Datos de entrada necesarios
interface DatosVehiculo {
  versionId?: string;    // ← CRÍTICO: Sin esto no funcionan las APIs
  marca: string;
  modelo: string;
  ano: number;
  version: string;
  kilometraje: number;
  estado: string;
  ciudad: string;
}
```

### 8.2 Estados de Respuesta de APIs

#### Estados de getCarMarketIntelligenceData
- **Éxito**: `data.suggestedPrice.suggestedPricePublish > 0`
- **Sin datos**: `suggestedPricePublish = null` o `0`
- **Error**: Excepción capturada, toast de error

#### Estados de maxi_similar_cars
- **Éxito**: `data.similarsCars.length > 0`
- **Sin datos**: `similarsCars = []` 
- **Error**: Excepción capturada, array vacío

---

## 9. Logs y Trazabilidad

### 9.1 Logs de Edge Functions

#### getCarMarketIntelligenceData
```
INFO Making API call to: https://api.maxipublica.com/v3/232AE09500000534D23EE1295785AA9834/example/v_1_4_2_35_3
INFO Using authorization token (first 10 chars): fdaa9f033b
INFO API response received: { suggestedPrice: { suggestedPricePublish: 440000, ... } }
```

#### maxi_similar_cars
```
INFO Llamando a maxi_similar_cars con versionId: v_1_4_2_35_3
INFO Cantidad de vehículos similares encontrados: 36
INFO Respuesta de maxi_similar_cars: { similarsCars: [...] }
```

### 9.2 Logs de Frontend
```
console.log('Datos del vehículo:', datos);
console.log('Llamando a maxi_similar_cars con versionId:', versionId);
console.log('Respuesta de maxi_similar_cars:', { maxiData, maxiError });
```

---

## 10. Escenarios de Fallo y Recuperación

### 10.1 Escenario: MaxiPublica Market Intelligence No Disponible
```typescript
// Si getCarMarketIntelligenceData falla
if (error) {
  toast({
    title: "Error en precio",
    description: "No se pudo obtener el precio recomendado de MaxiPublica",
    variant: "destructive"
  });
  // El sistema continúa usando solo vehiculosSimilares
}
```

### 10.2 Escenario: No Hay Vehículos Similares
```typescript
// Si maxi_similar_cars no devuelve datos
if (maxiData.similarsCars.length === 0) {
  setAutosSimilares([]);
  setEstadisticas(prev => ({
    ...prev,
    totalAnuncios: 0,
    precioMinimo: 0,
    precioMaximo: 0,
    precioPromedio: 0
  }));
}
```

### 10.3 Fallback Completo
```typescript
// Si ambas APIs fallan, el algoritmo usa:
// 1. Precio base de catálogo interno
// 2. Estimaciones basadas en año/marca/modelo
// 3. Valores por defecto seguros
```

---

## 11. Validaciones y Controles de Calidad

### 11.1 Validación de versionId
```typescript
if (!datos.versionId) {
  console.log('No version ID available, cannot get recommended price');
  toast({
    title: "Precio no disponible",
    description: "No se pudo obtener el precio recomendado sin el ID de versión del vehículo",
    variant: "destructive"
  });
  return;
}
```

### 11.2 Validación de Precios
```typescript
// Filtro de precios válidos
const precios = autosFilterados.map(auto => auto.precio).filter(p => p > 0);

// Validación de respuesta API
if (data?.suggestedPrice?.suggestedPricePublish && data.suggestedPrice.suggestedPricePublish > 0) {
  // Procesar solo si hay precio válido
}
```

### 11.3 Manejo de Datos Inconsistentes
```typescript
// Protección contra división por cero
if (precios.length > 0) {
  return precios.reduce((a, b) => a + b, 0) / precios.length;
}

// Valores por defecto seguros
return calcularPromedioBaseDatos(marca, modelo, ano) || 0;
```

---

## 12. Conclusiones

### 12.1 Fuentes de Datos Identificadas

#### `datos: MarketData`
- **Fuente primaria**: API MaxiPublica Market Intelligence
- **Edge Function**: `getCarMarketIntelligenceData`
- **Campo clave**: `suggestedPrice.suggestedPricePublish`
- **Almacenamiento**: Estado React `estadisticas.precioPromedioMercado`

#### `vehiculosSimilares`
- **Fuente primaria**: API MaxiPublica Ads Sites  
- **Edge Function**: `maxi_similar_cars`
- **Campo clave**: Array `similarsCars[].price`
- **Almacenamiento**: Estado React `autosSimilares`

### 12.2 Dependencias Críticas

1. **versionId**: Identificador común requerido por ambas APIs
2. **Tokens de autenticación**: Diferentes para cada API
3. **Conectividad**: Ambas APIs son externas y requieren internet
4. **Estructura de respuesta**: Mapeo específico de campos de MaxiPublica

### 12.3 Flujo de Datos Completo

```
Usuario → versionId → [getCarMarketIntelligenceData + maxi_similar_cars] → MaxiPublica APIs → 
[MarketData + vehiculosSimilares] → calcularPrecioPromedio() → Precio final
```

### 12.4 Puntos de Mejora Identificados

1. **Cache de datos**: No existe cache para reducir llamadas a APIs
2. **Fallback completo**: El tercer nivel de fallback no está implementado  
3. **Validación cruzada**: No se valida consistencia entre ambas fuentes
4. **Timeout**: No hay timeout configurado para las llamadas API

Este análisis confirma que el algoritmo de precio promedio depende completamente de APIs externas de MaxiPublica, con el versionId como elemento central que conecta ambas fuentes de datos.