# Cambio: Fuente de Datos para Precio Promedio de Mercado

**Fecha**: 2025-09-30 13:28:00 America/Mexico_City
**Tipo**: Cambio de Funcionalidad
**Componentes Afectados**: `AnalisisPrecio.tsx`, `AnalisisMercado.tsx`

## Descripción del Cambio

Se modificó la fuente de datos del cálculo de **PRECIO PROMEDIO DE MERCADO** para obtener el promedio real de vehículos similares en lugar de usar el precio sugerido de publicación.

### Cambio Implementado

#### ANTES (Fuente Original)
- **Edge Function**: `getCarMarketIntelligenceData`
- **Campo utilizado**: `suggestedPrice.suggestedPricePublish`
- **Tipo**: Precio sugerido único proporcionado por MaxiPublica API

#### DESPUÉS (Nueva Fuente)
- **Edge Function**: `maxi_similar_cars`
- **Campo utilizado**: Array `similarsCars[].price`
- **Cálculo**: Promedio aritmético de todos los precios válidos (> 0)
- **Fórmula**: `precioPromedio = SUM(similarsCars[].price) / COUNT(precios válidos)`

## Motivación

El precio sugerido de publicación (`suggestedPricePublish`) es un valor único estimado por MaxiPublica, pero no refleja el promedio real del mercado basado en vehículos actualmente disponibles. 

Al calcular el promedio desde los precios de vehículos similares reales, se obtiene:
1. Mayor precisión del mercado actual
2. Reflejo real de la competencia
3. Datos más actualizados y dinámicos

## Archivos Modificados

### 1. `src/components/AnalisisPrecio.tsx`

**Función modificada**: `cargarPrecioMercado()`

```typescript
// ANTES
const { data, error } = await supabase.functions.invoke('getCarMarketIntelligenceData', {
  body: { versionId: datos.versionId }
});

if (data?.suggestedPrice?.suggestedPricePublish && data.suggestedPrice.suggestedPricePublish > 0) {
  const precioRecomendado = data.suggestedPrice.suggestedPricePublish;
  setEstadisticas(prev => ({
    ...prev,
    precioRecomendado: precioRecomendado,
    precioPromedioMercado: precioRecomendado,
    precioPromedio: precioRecomendado
  }));
}

// DESPUÉS
const { data, error } = await supabase.functions.invoke('maxi_similar_cars', {
  body: { versionId: datos.versionId }
});

if (data?.similarsCars && Array.isArray(data.similarsCars) && data.similarsCars.length > 0) {
  const precios = data.similarsCars
    .map((car: any) => car.price)
    .filter((price: number) => price > 0);
  
  if (precios.length > 0) {
    const precioPromedioCalculado = precios.reduce((a: number, b: number) => a + b, 0) / precios.length;
    
    setEstadisticas(prev => ({
      ...prev,
      precioRecomendado: precioPromedioCalculado,
      precioPromedioMercado: precioPromedioCalculado,
      precioPromedio: precioPromedioCalculado
    }));
  }
}
```

### 2. `src/components/AnalisisMercado.tsx`

**Componente modificado**: Popup de Debug "Precio promedio calculado"

```typescript
// ACTUALIZADO para reflejar nueva fuente
datosPredecesores: [
  {
    fuente: "Edge Function: maxi_similar_cars",
    valor: `Total vehículos similares: ${Array.isArray(datos.vehiculosSimilares) ? datos.vehiculosSimilares.length : datos.vehiculosSimilares || 0}`,
    fecha: new Date().toLocaleDateString()
  },
  {
    fuente: "API MaxiPublica Similar Cars",
    valor: `Precio promedio: ${currency.format(datos.precioPromedio)}`,
    fecha: new Date().toLocaleDateString()
  }
],
reglasAplicadas: [
  "1. Obtener array similarsCars[] de maxi_similar_cars API",
  "2. Filtrar precios válidos (price > 0)",
  "3. Calcular promedio: SUM(prices) / COUNT(prices)",
  "4. Validación: Mínimo 1 vehículo similar con precio válido"
]
```

## Impacto en el Sistema

### Positivo ✅
1. **Mayor precisión**: Refleja el mercado real actual
2. **Más transparente**: Basado en datos verificables (lista de vehículos)
3. **Dinámico**: Se actualiza automáticamente con cambios en el mercado
4. **Consistencia**: Usa la misma fuente que otros análisis de mercado

### Consideraciones ⚠️
1. **Dependencia**: Requiere que `maxi_similar_cars` tenga datos disponibles
2. **Variabilidad**: El promedio puede fluctuar más que un precio sugerido fijo
3. **Filtros**: El resultado puede variar según los filtros de estado/vendedor aplicados

## Validaciones Implementadas

```typescript
// 1. Verificar que similarsCars sea un array válido
if (data?.similarsCars && Array.isArray(data.similarsCars))

// 2. Filtrar solo precios válidos
.filter((price: number) => price > 0)

// 3. Verificar que haya al menos un precio válido
if (precios.length > 0)

// 4. Calcular promedio
const precioPromedioCalculado = precios.reduce((a, b) => a + b, 0) / precios.length;
```

## Logs de Debugging

```typescript
console.log(`Precio promedio calculado desde ${precios.length} vehículos similares:`, precioPromedioCalculado);
```

## Testing Recomendado

1. ✅ Verificar que el precio promedio se calcula correctamente
2. ✅ Comprobar manejo de casos sin vehículos similares
3. ✅ Validar filtrado de precios inválidos (≤ 0)
4. ✅ Revisar popup de debug muestra información correcta
5. ⚠️ Probar con diferentes versionId para asegurar cobertura
6. ⚠️ Validar comportamiento con filtros de estado/vendedor

## Compatibilidad

- ✅ Totalmente compatible con el código existente
- ✅ No requiere cambios en base de datos
- ✅ Mantiene la misma interfaz de estados
- ✅ Los componentes que usan `precioPromedio` funcionan sin cambios

## Mantenimiento Futuro

### Monitoreo Sugerido
- Revisar logs de `maxi_similar_cars` para asegurar disponibilidad de datos
- Monitorear casos donde no hay vehículos similares disponibles
- Evaluar si se necesita un fallback a `suggestedPricePublish`

### Posibles Mejoras
1. Implementar caché del precio promedio calculado
2. Agregar ponderación por fecha de publicación (más peso a anuncios recientes)
3. Excluir outliers (precios extremadamente altos/bajos)
4. Agregar indicador de confianza basado en cantidad de vehículos

## Conclusión

Este cambio mejora la precisión del precio promedio de mercado al basarse en datos reales de vehículos similares actualmente disponibles, proporcionando una referencia más confiable para los usuarios del sistema de valuación.
