# Corrección de valor inicial del slider de kilometraje

**Fecha:** 2025-09-30 18:45:00 America/Mexico_City  
**Tipo:** Corrección de funcionalidad  
**Componentes afectados:** `AnalisisPrecio.tsx`, `MisAutosProfesional.tsx`

## Problema identificado

El deslizador de la sección "Ajuste Inteligente de Kilometraje" iniciaba en 0 km por defecto, lo cual no representa un valor realista para vehículos usados y no coincide con las especificaciones del sistema documentadas en `dev_analisis/REPORTE_TECNICO_AJUSTE_KILOMETRAJE.md`.

## Contexto técnico

De acuerdo al reporte técnico de Ajuste de Kilometraje:
- El sistema calcula un **kilometraje esperado** basado en el estándar mexicano de **15,000 km/año**
- Fórmula: `kilometrajeEsperado = edadVehículo × 15,000 km`
- Este valor representa el punto de referencia neutral (factor 1.00x) para el cálculo de ajustes de precio

### Comportamiento anterior
```typescript
const [kilometrajeSeleccionado, setKilometrajeSeleccionado] = useState(0);
```
- El slider siempre iniciaba en 0 km
- No reflejaba la edad del vehículo
- El usuario tenía que ajustar manualmente desde un valor irreal

### Comportamiento esperado
- El slider debe iniciar en el **kilometraje esperado** según la edad del vehículo
- Si el usuario ingresó un kilometraje específico, usar ese valor
- Si no hay kilometraje del usuario, calcular y usar el esperado automáticamente

## Solución implementada

### 1. Cálculo de kilometraje esperado (`AnalisisPrecio.tsx`)

```typescript
// Calcular kilometraje esperado basado en edad del vehículo (15,000 km/año)
const kilometrajeEsperado = useMemo(() => {
  const añoActual = new Date().getFullYear();
  const edadVehiculo = añoActual - datos.ano;
  return edadVehiculo * 15000;
}, [datos.ano]);
```

**Ubicación:** Líneas 56-61  
**Lógica:** 
- Calcula la edad del vehículo: `añoActual - datos.ano`
- Multiplica por el estándar de 15,000 km/año
- Se memoiza para evitar recálculos innecesarios

### 2. Inicialización inteligente del slider

```typescript
// Inicializar kilometraje seleccionado cuando se cargan los datos
useEffect(() => {
  if (datos.kilometraje > 0) {
    setKilometrajeSeleccionado(datos.kilometraje);
  } else {
    // Si no hay kilometraje del usuario, usar el esperado según edad del vehículo
    setKilometrajeSeleccionado(kilometrajeEsperado);
  }
}, [datos.kilometraje, kilometrajeEsperado]);
```

**Ubicación:** Líneas 181-188  
**Lógica prioritaria:**
1. Si `datos.kilometraje > 0`: usar el valor ingresado por el usuario
2. Si no hay kilometraje: usar el `kilometrajeEsperado` calculado

### 3. Actualización en componente demo (`MisAutosProfesional.tsx`)

```typescript
// Calcular kilometraje esperado basado en edad del vehículo (15,000 km/año)
const calcularKmEsperado = (anoVehiculo: number) => {
  const añoActual = new Date().getFullYear();
  const edadVehiculo = añoActual - anoVehiculo;
  return edadVehiculo * 15000;
};

// Al seleccionar un auto para análisis
onClick={async () => {
  const hasAccess = await checkWeeklyMarketAccess(auto.id);
  if (hasAccess) {
    setSelectedAuto(auto);
    // Inicializar kilometraje: usar el del auto o el esperado según edad
    const kmInicial = auto.kilometraje > 0 
      ? auto.kilometraje 
      : calcularKmEsperado(auto.ano);
    setSelectedKm(kmInicial);
    setMarketAccessStatus({ ...marketAccessStatus, [auto.id]: true });
  }
}}
```

**Ubicación:** Líneas 69-75, 560-574  
**Propósito:** Aplicar la misma lógica al componente de demostración para profesionales, calculando el km esperado cuando se selecciona un auto para análisis

## Ejemplos de funcionamiento

### Ejemplo 1: Vehículo 2020 (sin kilometraje especificado)
```
Año actual: 2025
Edad vehículo: 2025 - 2020 = 5 años
Kilometraje esperado: 5 × 15,000 = 75,000 km
→ Slider inicia en 75,000 km (factor 1.00x)
```

### Ejemplo 2: Vehículo 2018 con kilometraje bajo
```
Año actual: 2025
Edad vehículo: 7 años
Kilometraje esperado: 105,000 km
Usuario ingresó: 45,000 km
→ Slider inicia en 45,000 km (valor del usuario)
→ Factor ajuste: ~0.87x (descuento por bajo kilometraje)
```

### Ejemplo 3: Vehículo 2023 nuevo
```
Año actual: 2025
Edad vehículo: 2 años
Kilometraje esperado: 30,000 km
→ Slider inicia en 30,000 km
```

## Impacto en la experiencia de usuario

### Antes
❌ Slider siempre en 0 km  
❌ Usuario debía ajustar desde un valor irreal  
❌ No había contexto sobre el kilometraje esperado  
❌ Confusión sobre el punto de referencia del ajuste  

### Después
✅ Slider inicia en valor realista según edad del vehículo  
✅ Representa el punto neutro del ajuste (factor 1.00x)  
✅ El usuario puede ajustar hacia arriba o abajo según su caso  
✅ Coherente con la documentación técnica del sistema  
✅ Mejor comprensión del impacto del kilometraje en el precio  

## Validación técnica

### Archivos modificados
- `src/components/AnalisisPrecio.tsx` (líneas 56-61, 181-188)
- `src/components/MisAutosProfesional.tsx` (líneas 69-75, 560-574)

### Dependencias del cálculo
- `datos.ano`: Año del vehículo (entrada del usuario)
- Estándar mexicano: 15,000 km/año (constante del sistema)
- Función auxiliar: `calcularFactorKilometraje()` en `priceAnalysisCalculations.ts`

### Reglas de negocio aplicadas
1. **Prioridad al usuario:** Si ingresó kilometraje, usar ese valor
2. **Fallback inteligente:** Si no hay input, calcular esperado
3. **Estándar de mercado:** 15,000 km/año (México)
4. **Memoización:** Evitar recálculos en cada render
5. **Punto neutro:** Kilometraje esperado = factor 1.00x (sin ajuste)

## Referencias técnicas

- **Reporte técnico:** `dev_analisis/REPORTE_TECNICO_AJUSTE_KILOMETRAJE.md`
- **Función de cálculo:** `src/utils/priceAnalysisCalculations.ts#calcularFactorKilometraje`
- **Componente UI:** `src/components/AnalisisMercado.tsx` (líneas 116-117, posicionamiento del slider)
- **Estándar mexicano:** 15,000 km/año de uso promedio

## Próximos pasos

- ✅ Slider inicia en valor esperado según edad
- ✅ Se respeta el kilometraje del usuario si está disponible
- ⏳ Considerar personalización regional del estándar km/año
- ⏳ Mostrar indicador visual del "kilometraje esperado" en el slider

## Conclusión

El slider ahora inicia en un valor realista que representa el kilometraje esperado según la edad del vehículo, alineándose con la documentación técnica del sistema y mejorando la experiencia del usuario al proporcionar un punto de referencia neutral (factor 1.00x) desde el cual ajustar.
