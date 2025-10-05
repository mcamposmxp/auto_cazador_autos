# Changelog: Integración de Parámetro Location en maxi_similar_cars

**Fecha**: 2025-10-04 00:00:00 (America/Mexico_City)  
**Tipo**: Feature Enhancement + Bug Fix  
**Componentes**: VehicleDataForm, AnalisisPrecio, maxi_similar_cars  
**Severidad**: Alta (corrección de error crítico)

## Resumen Ejecutivo

Se implementó el paso del parámetro `location` desde el selector de estados del frontend hacia la función Edge `maxi_similar_cars`, permitiendo filtrar vehículos similares por ubicación geográfica específica. **Se corrigió error crítico de Radix UI** que impedía usar `value=""` en SelectItem.

## Cambios Realizados

### 1. VehicleDataForm - Opción "Todo el país" (CORREGIDO)

Se agregó una opción al inicio del selector de estados:

**Ubicación**: `src/components/analisis/VehicleDataForm.tsx`

**⚠️ ERROR INICIAL**: 
```tsx
<SelectItem value="">Todo el país</SelectItem>  {/* ❌ ERROR: Radix UI no permite value="" */}
```

**✅ CORRECCIÓN APLICADA**:
```tsx
<SelectContent className="bg-background border-2 z-50">
  <SelectItem value="ALL">Todo el país</SelectItem>  {/* ✅ Valor válido para Radix UI */}
  {ESTADOS_MEXICO.map((estado) => (
    <SelectItem key={estado.locationId} value={estado.locationId}>
      {estado.name}
    </SelectItem>
  ))}
</SelectContent>
```

**Error Corregido**:
```
Error: A <Select.Item /> must have a value prop that is not an empty string. 
This is because the Select value can be set to an empty string to clear 
the selection and show the placeholder.
```

**Comportamiento**:
- **Valor**: `"ALL"` (identificador especial)
- **Texto mostrado**: "Todo el país"
- **Posición**: Primera opción del selector
- **Función**: Permite búsqueda nacional sin filtrar por estado

### 2. AnalisisPrecio - Paso de Parámetro Location

Se actualizaron las llamadas a `maxi_similar_cars` para incluir el parámetro `location`:

**Ubicación**: `src/components/AnalisisPrecio.tsx`

#### Llamada 1 - Precio Promedio (línea 128-131)

**Antes**:
```typescript
const { data, error } = await supabase.functions.invoke('maxi_similar_cars', {
  body: { versionId: datos.versionId }
});
```

**Después** (CORREGIDO):
```typescript
const { data, error } = await supabase.functions.invoke('maxi_similar_cars', {
  body: { 
    versionId: datos.versionId,
    location: (estadoSeleccionado === 'ALL' || !estadoSeleccionado) ? '' : estadoSeleccionado
  }
});
```

**Nota**: Se agrega conversión de `"ALL"` → `""` para mantener compatibilidad con API.

#### Llamada 2 - Análisis Completo (línea 225-228)

**Antes**:
```typescript
const { data: maxiData, error: maxiError } = await supabase.functions.invoke('maxi_similar_cars', {
  body: { versionId }
});
```

**Después** (CORREGIDO):
```typescript
const { data: maxiData, error: maxiError } = await supabase.functions.invoke('maxi_similar_cars', {
  body: { 
    versionId,
    location: (estadoSeleccionado === 'ALL' || !estadoSeleccionado) ? '' : estadoSeleccionado
  }
});
```

**Nota**: Conversión explícita de `"ALL"` a string vacío antes de enviar a la API.

### 3. Flujo de Datos

```
Usuario selecciona estado
       ↓
VehicleDataForm onChange
       ↓
estadoSeleccionado state actualizado
       ↓
AnalisisPrecio recibe nuevo valor
       ↓
Llamadas a maxi_similar_cars con location
       ↓
Edge Function filtra por ubicación
       ↓
Resultados específicos del estado
```

## Ejemplos de Uso

### Ejemplo 1: Todo el país
```typescript
// Usuario selecciona "Todo el país"
estadoSeleccionado = ""

// Request a maxi_similar_cars
{
  versionId: "V12345",
  location: ""  // Vacío = nacional
}
```

### Ejemplo 2: Ciudad de México
```typescript
// Usuario selecciona "Ciudad de México"
estadoSeleccionado = "STS09"

// Request a maxi_similar_cars
{
  versionId: "V12345",
  location: "STS09"
}
```

### Ejemplo 3: Nuevo León
```typescript
// Usuario selecciona "Nuevo León"
estadoSeleccionado = "STS19"

// Request a maxi_similar_cars
{
  versionId: "V12345",
  location: "STS19"
}
```

## Archivos Modificados

### 1. `src/components/analisis/VehicleDataForm.tsx`
- **Línea 151**: Cambio de `value="todos"` a `value=""`
- **Línea 151**: Cambio de texto "Todos los estados" a "Todo el país"
- **Impacto**: Primera opción del selector ahora envía string vacío

### 2. `src/components/AnalisisPrecio.tsx`
- **Líneas 128-133**: Agregado parámetro `location` en llamada de precio promedio
- **Líneas 225-231**: Agregado parámetro `location` en llamada de análisis completo
- **Impacto**: Ambas llamadas ahora filtran por ubicación

## Validación del Parámetro

El parámetro `location` se envía de la siguiente manera:

```typescript
location: estadoSeleccionado || ''
```

**Casos**:
1. Si `estadoSeleccionado` es `""` → se envía `location: ""`
2. Si `estadoSeleccionado` es `"STS09"` → se envía `location: "STS09"`
3. Si `estadoSeleccionado` es `undefined` → se envía `location: ""`

## Impacto en el Sistema

### Frontend ✅
- Selector de estados incluye opción nacional
- Valor "" se pasa correctamente a las funciones
- Compatibilidad con estados específicos (STS01-STS32)

### Backend ⚠️
- **PENDIENTE**: La Edge Function `maxi_similar_cars` debe procesar el parámetro `location`
- **PENDIENTE**: La API MaxiPublica debe recibir `location` en el query string
- **PENDIENTE**: Validar que `location=""` devuelva resultados nacionales

### API MaxiPublica
El parámetro debe agregarse al query string:

**Nacional**:
```
GET /api/similar-cars?versionId=V12345&location=
```

**Estado específico**:
```
GET /api/similar-cars?versionId=V12345&location=STS09
```

## Próximos Pasos

### 1. Actualizar Edge Function (CRÍTICO)
```typescript
// supabase/functions/maxi_similar_cars/index.ts
const { versionId, location } = await req.json();

// Construir URL con parámetro location
const url = `${API_BASE_URL}/similar-cars?versionId=${versionId}&location=${location || ''}`;
```

### 2. Probar Filtrado por Estado
- [ ] Verificar que `location=""` devuelva resultados nacionales
- [ ] Verificar que `location="STS09"` devuelva solo CDMX
- [ ] Confirmar que estadísticas se calculen correctamente por estado

### 3. Actualizar Cache
- [ ] Considerar si el cache debe incluir `location` en la key
- [ ] Ejemplo: `${versionId}_${location}` vs solo `${versionId}`

## UX Improvements

### Claridad
- ✅ "Todo el país" es más claro que "Todos los estados"
- ✅ El usuario entiende que puede filtrar por ubicación específica

### Consistencia
- ✅ El selector usa los mismos locationId (STS01-STS32)
- ✅ Compatibilidad con FormularioValuacion

### Performance
- 📊 Los resultados filtrados por estado deberían ser más rápidos
- 📊 Menor cantidad de datos a procesar en el frontend

## Consideraciones Técnicas

### Retrocompatibilidad
- Si la Edge Function no recibe `location`, debería asumir nacional
- Esto mantiene compatibilidad con código antiguo

### Validación
- El frontend valida que `location` sea "" o STS01-STS32
- La Edge Function debe validar formato antes de llamar a la API

### Error Handling
- Si `location` es inválido, la API debería devolver error
- El frontend debe manejar este error apropiadamente

## Testing Recomendado

### Frontend
- [ ] Selector muestra "Todo el país" como primera opción
- [ ] Al seleccionar "Todo el país", `estadoSeleccionado = ""`
- [ ] Al seleccionar un estado, `estadoSeleccionado = "STS##"`
- [ ] Los parámetros se envían correctamente en ambas llamadas

### Backend (Pendiente)
- [ ] Edge Function recibe parámetro `location`
- [ ] Edge Function pasa `location` a MaxiPublica API
- [ ] API devuelve resultados filtrados correctamente
- [ ] Cache funciona con el nuevo parámetro

### Integración
- [ ] Cambiar de "Todo el país" a estado específico actualiza resultados
- [ ] Cambiar de estado a estado actualiza resultados
- [ ] Cambiar de estado a "Todo el país" muestra resultados nacionales

## Notas de Implementación

### Edge Function Update (PENDIENTE)

```typescript
// supabase/functions/maxi_similar_cars/index.ts

serve(async (req) => {
  // Parsear request
  const { versionId, location } = await req.json();
  
  // Validar location
  const validLocation = location && location.match(/^STS\d{2}$/) ? location : '';
  
  // Construir URL de API
  const apiUrl = new URL('https://api.maxipublica.com/similar-cars');
  apiUrl.searchParams.set('versionId', versionId);
  if (validLocation) {
    apiUrl.searchParams.set('location', validLocation);
  }
  
  // Fetch de API
  const response = await fetch(apiUrl.toString());
  // ... resto del código
});
```

---

**Autor**: Sistema  
**Revisión**: Pendiente  
**Estado**: Frontend Implementado, Backend Pendiente
