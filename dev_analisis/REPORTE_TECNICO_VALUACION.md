# Reporte Técnico - Sistema de Valuación de Vehículos

## Resumen Ejecutivo

El sistema de valuación de vehículos implementado en la ruta `/valuacion` es un módulo complejo que combina múltiples fuentes de datos, cálculos algorítmicos e integración con APIs externas (MaxiPublica) e inteligencia artificial (OpenAI) para proporcionar análisis de precios de vehículos usados en tiempo real.

---

## Componentes Principales

### 1. Componente Principal: `ValuacionAuto.tsx`

**Ubicación:** `src/components/ValuacionAuto.tsx`

**Función:** Componente orquestador principal que maneja el flujo de la valuación.

**Variables principales:**
- `mostrarAnalisis: boolean` - Controla si se muestra el formulario o el análisis
- `datosVehiculo: DatosVehiculo | null` - Almacena los datos del vehículo ingresados

**Flujo de datos:**
1. Renderiza `FormularioValuacion` inicialmente
2. Al recibir datos, cambia a `AnalisisPrecio`
3. Implementa `AuthRequiredWrapper` para autenticación obligatoria

---

## Sistema de Captura de Datos

### 2. Formulario de Valuación: `FormularioValuacion.tsx`

**Ubicación:** `src/components/FormularioValuacion.tsx`

**Variables de estado principales:**
```typescript
interface DatosVehiculo {
  marca: string;           // Nombre de la marca
  modelo: string;          // Nombre del modelo
  ano: number;             // Año del vehículo
  version: string;         // Versión específica
  versionId?: string;      // ID interno de MaxiPublica
  kilometraje: number;     // Kilometraje actual
  estado: string;          // Estado del vehículo
  ciudad: string;          // Ciudad/ubicación
}
```

**Variables de interfaz:**
- `marcas: CatalogItem[]` - Lista de marcas disponibles (desde MaxiPublica)
- `modelos: CatalogItem[]` - Modelos de la marca seleccionada
- `anos: CatalogItem[]` - Años disponibles para el modelo
- `versiones: CatalogItem[]` - Versiones específicas del año

**Estados de carga:**
- `cargando: boolean` - Carga general
- `cargandoModelos: boolean` - Carga específica de modelos
- `cargandoAnos: boolean` - Carga específica de años
- `cargandoVersiones: boolean` - Carga específica de versiones

**Origen de datos:**
- **Edge Function:** `catalogo-vehiculos` - Llama a la API de MaxiPublica
- **Endpoint:** `https://api.maxipublica.com/v3/catalog/mx/mxp/`
- **Autenticación:** Variable de entorno `autorizationCatalogoMP`

---

## Sistema de Análisis de Precios

### 3. Análisis Principal: `AnalisisPrecio.tsx`

**Ubicación:** `src/components/AnalisisPrecio.tsx`

**Variables de estado críticas:**
```typescript
const [autosSimilares, setAutosSimilares] = useState<AutoSimilar[]>([]);
const [estadisticas, setEstadisticas] = useState({
  precioRecomendado: 0,      // Precio de MaxiPublica
  precioMinimo: 0,           // Precio mínimo encontrado
  precioMaximo: 0,           // Precio máximo encontrado
  precioPromedio: 0,         // Promedio de anuncios similares
  precioPromedioMercado: 0,  // Promedio del mercado
  totalAnuncios: 0           // Cantidad de anuncios encontrados
});
```

**Variables de interacción:**
- `precioSeleccionado: number` - Precio que el usuario quiere analizar
- `estadoSeleccionado: string` - Filtro por estado geográfico
- `tipoVendedorSeleccionado: string` - Filtro por tipo de vendedor
- `kilometrajeSeleccionado: number` - Kilometraje para análisis

**Fuentes de datos:**
1. **MaxiPublica Market Intelligence:** Edge function `getCarMarketIntelligenceData`
2. **Base de datos interna:** Tabla `anuncios_vehiculos`
3. **Análisis AI:** Edge function `calcular-tiempo-venta-ia`

---

## Origen de Datos y APIs

### 4. Edge Functions del Sistema

#### A. `catalogo-vehiculos`
**Ubicación:** `supabase/functions/catalogo-vehiculos/index.ts`

**Propósito:** Obtener catálogo jerárquico de vehículos
- **API Externa:** MaxiPublica Catalog API
- **URL Base:** `https://api.maxipublica.com/v3/catalog/mx/mxp/`
- **Parámetros:** `catalogId` (para navegación jerárquica)
- **Autenticación:** `autorizationCatalogoMP` (secret)

**Datos retornados:**
```typescript
interface CatalogItem {
  id: string;      // ID único del item
  name: string;    // Nombre visible
  action: string;  // Acción posible (next/rules)
  level: number;   // Nivel en jerarquía
  children?: CatalogItem[]; // Items hijos
}
```

#### B. `getCarMarketIntelligenceData`
**Ubicación:** `supabase/functions/getCarMarketIntelligenceData/index.ts`

**Propósito:** Obtener precio recomendado oficial
- **API Externa:** MaxiPublica Market Intelligence
- **URL:** `https://api.maxipublica.com/v3/232AE09500000534D23EE1295785AA9834/example/{versionId}`
- **Autenticación:** `market_intelligence_authorization` (secret)

**Datos críticos retornados:**
```typescript
{
  suggestedPrice: {
    suggestedPricePublish: number; // Precio recomendado para publicar
  }
}
```

#### C. `calcular-tiempo-venta-ia`
**Ubicación:** `supabase/functions/calcular-tiempo-venta-ia/index.ts`

**Propósito:** Análisis AI del tiempo de venta
- **API Externa:** OpenAI GPT-4o-mini
- **Variable de entorno:** `OPENAI_API_KEY`
- **Consumo de créditos:** 1 crédito por consulta

**Datos de entrada:**
```typescript
interface CalculoTiempoRequest {
  precioSeleccionado: number;
  precioRecomendado: number;
  datosVehiculo: DatosVehiculo;
  estadisticasMercado?: EstadisticasMercado;
}
```

**Datos de salida:**
```typescript
interface CalculoTiempoResponse {
  tiempoEstimado: number;              // Días estimados
  velocidadVenta: 'rapida' | 'moderada' | 'lenta';
  explicacion: string;                 // Explicación del análisis
  consejos: string[];                  // Consejos prácticos
  factores: {
    precio: string;
    demanda: string;
    competencia: string;
    condicion: string;
  };
}
```

---

## Sistema de Cálculos

### 5. Utilidades de Cálculo: `priceAnalysisCalculations.ts`

**Ubicación:** `src/utils/priceAnalysisCalculations.ts`

**Funciones principales:**

#### A. `calcularDemandaAuto()`
**Variables analizadas:**
- Antigüedad del vehículo (35% peso)
- Cantidad de anuncios similares (30% peso)
- Dispersión de precios (20% peso)
- Reconocimiento de marca (15% peso)

**Retorna:**
```typescript
{
  nivel: string;        // "Alta demanda", "Demanda moderada", etc.
  descripcion: string;  // Descripción detallada
  icono: string;        // Icono recomendado
  color: string;        // Color de texto
  bgColor: string;      // Color de fondo
  borderColor: string;  // Color de borde
}
```

#### B. `calcularCompetenciaMercado()`
**Variables analizadas:**
- Número total de anuncios similares
- Filtros aplicados (estado, tipo vendedor)
- Coeficiente de variación de precios

#### C. `calcularFactorKilometraje()`
**Algoritmo:**
- Calcula kilometraje esperado: `años_antiguedad * 15000 km/año`
- Aplica factores de ajuste:
  - ≤50% esperado: +12% precio
  - 50-70%: +8% precio
  - 70-90%: +4% precio
  - 90-110%: Sin cambio
  - 110-130%: -4% precio
  - 130-150%: -8% precio
  - >150%: -15% precio

---

## Sistema de Control de Créditos

### 6. Hook de Control: `useCreditControl.ts`

**Ubicación:** `src/hooks/useCreditControl.ts`

**Variables de estado:**
- `isLoading: boolean` - Estado de carga
- `error: string | null` - Errores de validación
- `showUpgradeDialog: boolean` - Control de modal de upgrade

**Funciones principales:**

#### A. `checkCredits()`
**Proceso:**
1. Verifica autenticación del usuario
2. Consulta tabla `user_credits` en Supabase
3. Valida `credits_available > 0`

#### B. `consumeCredits()`
**Proceso:**
1. Llama edge function `consume-credits-typed`
2. Registra transacción en `credit_transactions`
3. Ejecuta sistema de referidos si aplica

---

## Base de Datos

### 7. Tablas Relacionadas

#### A. `anuncios_vehiculos`
**Campos utilizados:**
- `marca`, `modelo`, `ano` - Filtros de búsqueda
- `precio` - Para cálculos estadísticos
- `kilometraje` - Para comparativas
- `ubicacion` - Filtros geográficos
- `activo` - Estado del anuncio

#### B. `user_credits`
**Campos utilizados:**
- `credits_available` - Créditos disponibles
- `credits_used_searches` - Créditos usados en búsquedas
- `plan_type` - Tipo de plan del usuario

#### C. `api_tokens`
**Función:** Almacena tokens de MaxiPublica
- **Actualización:** Automática cada 30 minutos vía cron job
- **Campos:** `token`, `expiration_date`, `seller_id`

---

## Visualización de Datos

### 8. Componente de Análisis de Mercado: `AnalisisMercado.tsx`

**Ubicación:** `src/components/AnalisisMercado.tsx`

**Variables calculadas:**
```typescript
interface DatosMercado {
  precioPromedio: number;     // Precio promedio del mercado
  rangoMinimo: number;        // Precio mínimo encontrado
  rangoMaximo: number;        // Precio máximo encontrado
  demanda: 'baja' | 'moderada' | 'alta';
  competencia: 'baja' | 'moderada' | 'alta';
  vehiculosSimilares: number; // Cantidad de vehículos similares
}
```

**Elementos visuales:**
- **Distribución de precios:** Barra con 5 rangos porcentuales
- **Indicador de posición:** Muestra dónde está el precio del usuario
- **Ajuste de kilometraje:** Slider interactivo con impacto en precio

**Cálculos en tiempo real:**
- `posicionPrecio`: Posición del precio en el rango (0-100%)
- `posicionKm`: Posición del kilometraje vs promedio

---

## Integración con Sistemas Externos

### 9. APIs de MaxiPublica

#### A. Autenticación
- **Tokens:** Almacenados en tabla `api_tokens`
- **Renovación:** Automática cada 30 minutos
- **Edge Function:** `api_tokens` con cron job

#### B. Endpoints utilizados:
1. **Catálogo:** `/v3/catalog/mx/mxp/`
2. **Market Intelligence:** `/v3/232AE09500000534D23EE1295785AA9834/example/`

### 10. OpenAI Integration

**Modelo:** GPT-4o-mini
**Uso:** Análisis de tiempo de venta con contexto mexicano
**Fallback:** Sistema de cálculo local si API falla

---

## Flujo Completo de Datos

### 11. Secuencia de Operaciones

1. **Carga inicial:**
   ```
   Usuario accede /valuacion → AuthRequiredWrapper → ValuacionAuto
   ```

2. **Catálogo de vehículos:**
   ```
   FormularioValuacion → catalogo-vehiculos → MaxiPublica API → Estado marcas
   ```

3. **Selección cascada:**
   ```
   Marca → modelos → años → versiones (cada paso llama catalogo-vehiculos)
   ```

4. **Análisis de precio:**
   ```
   Envío formulario → AnalisisPrecio → Multiple data sources:
   - getCarMarketIntelligenceData (precio recomendado)
   - Query anuncios_vehiculos (comparativas)
   - priceAnalysisCalculations (algoritmos)
   ```

5. **Análisis AI (opcional):**
   ```
   Click "Calcular tiempo" → useTiempoVentaIA → calcular-tiempo-venta-ia → OpenAI
   ```

---

## Rendimiento y Optimización

### 12. Estrategias Implementadas

#### A. Memoización
- `useMemo` para cálculos complejos en `AnalisisPrecio`
- Cache en `useTiempoVentaIA` para evitar llamadas repetidas

#### B. Carga diferida
- Estados de carga independientes por componente
- Fallbacks locales si APIs fallan

#### C. Control de créditos
- Verificación antes de operaciones costosas
- Fallbacks gratuitos para usuarios sin créditos

---

## Variables de Entorno Críticas

### 13. Secrets de Supabase

1. `autorizationCatalogoMP` - Token para catálogo MaxiPublica
2. `market_intelligence_authorization` - Token para precios MaxiPublica
3. `OPENAI_API_KEY` - Clave para análisis AI
4. `MP_APPKEY` y `MP_SECRETKEY` - Credenciales para renovación de tokens

---

## Puntos de Mejora Identificados

### 14. Recomendaciones Técnicas

#### A. Rendimiento
- Implementar paginación en consultas de `anuncios_vehiculos`
- Cache de Redis para consultas frecuentes
- Optimización de índices en base de datos

#### B. Experiencia de Usuario
- Loading skeletons más específicos
- Indicadores de progreso en análisis AI
- Modo offline con datos cached

#### C. Datos
- Validación más estricta de datos de MaxiPublica
- Sistema de alertas para tokens expirados
- Backup de datos críticos

---

## Métricas y Monitoreo

### 15. Variables de Seguimiento

#### A. Uso del sistema
- Consultas por usuario/día
- Tiempo promedio de análisis
- Tasa de conversión formulario → análisis

#### B. Calidad de datos
- Porcentaje de respuestas exitosas de MaxiPublica
- Precisión de precios recomendados
- Tiempo de respuesta de APIs

#### C. Créditos
- Consumo promedio por consulta
- Distribución de tipos de usuario
- Eficiencia del sistema de fallbacks

---

## Conclusiones

El sistema de valuación es una pieza compleja que integra múltiples tecnologías y fuentes de datos para proporcionar análisis precisos de precios vehiculares. Su arquitectura modular permite mantenimiento independiente de componentes, mientras que el sistema de fallbacks asegura disponibilidad continua incluso cuando servicios externos fallan.

La implementación actual balancea precisión con rendimiento, utilizando caching inteligente y cálculos optimizados para proporcionar resultados en tiempo real a los usuarios.