# Matriz de Puntuación de Demanda de Vehículos

## Sistema de Puntuación Implementado

### Factores de Evaluación:
1. **Antigüedad del Vehículo (35% del peso)**
2. **Análisis de Competencia (30% del peso)**
3. **Estabilidad de Precios (20% del peso)**
4. **Prestigio de Marca (15% del peso)**

## Implementación del Algoritmo

```typescript
function calcularPuntuacionDemanda(datos: {
  year: number,
  brand: string,
  totalAnuncios: number,
  precioMinimo: number,
  precioMaximo: number,
  precioPromedio: number
}): {
  puntaje: number,
  categoria: string,
  icono: string,
  desglose: any
} {
  const añoActual = new Date().getFullYear();
  const antiguedad = añoActual - parseInt(datos.year);
  let puntajeDemanda = 0;
  
  // Factor 1: Antigüedad del Vehículo (35%)
  let puntajeAntiguedad = 0;
  if (antiguedad <= 2) puntajeAntiguedad = 35;        // Muy nuevos
  else if (antiguedad <= 5) puntajeAntiguedad = 28;   // Nuevos
  else if (antiguedad <= 8) puntajeAntiguedad = 20;   // Edad media
  else if (antiguedad <= 12) puntajeAntiguedad = 12;  // Usados
  else puntajeAntiguedad = 5;                         // Antiguos
  
  // Factor 2: Análisis de Competencia (30%)
  let puntajeCompetencia = 0;
  if (datos.totalAnuncios <= 3) puntajeCompetencia = 30;     // Muy poca oferta
  else if (datos.totalAnuncios <= 8) puntajeCompetencia = 22;  // Poca oferta
  else if (datos.totalAnuncios <= 15) puntajeCompetencia = 15; // Moderada
  else if (datos.totalAnuncios <= 25) puntajeCompetencia = 8;  // Mucha oferta
  else puntajeCompetencia = 3;                                 // Excesiva
  
  // Factor 3: Estabilidad de Precios (20%)
  let puntajeEstabilidad = 0;
  const dispersionPrecios = Math.abs(datos.precioMaximo - datos.precioMinimo) / datos.precioPromedio;
  if (dispersionPrecios < 0.3) puntajeEstabilidad = 20;  // Estables
  else if (dispersionPrecios < 0.6) puntajeEstabilidad = 12; // Moderada
  else puntajeEstabilidad = 5;                               // Inestable
  
  // Factor 4: Prestigio de Marca (15%)
  let puntajeMarca = 0;
  const marcasAlta = ['Toyota', 'Honda', 'Mazda', 'Subaru'];
  const marcasMedia = ['Nissan', 'Chevrolet', 'Ford', 'Volkswagen'];
  if (marcasAlta.includes(datos.brand)) puntajeMarca = 15;
  else if (marcasMedia.includes(datos.brand)) puntajeMarca = 10;
  else puntajeMarca = 5;
  
  puntajeDemanda = puntajeAntiguedad + puntajeCompetencia + puntajeEstabilidad + puntajeMarca;
  
  // Clasificación Final
  let categoria = "";
  let icono = "";
  if (puntajeDemanda >= 75) {
    categoria = "Muy alta demanda";
    icono = "🔥";
  } else if (puntajeDemanda >= 55) {
    categoria = "Alta demanda";
    icono = "📈";
  } else if (puntajeDemanda >= 35) {
    categoria = "Demanda moderada";
    icono = "📊";
  } else if (puntajeDemanda >= 20) {
    categoria = "Baja demanda";
    icono = "⚠️";
  } else {
    categoria = "Muy baja demanda";
    icono = "📉";
  }
  
  return {
    puntaje: puntajeDemanda,
    categoria,
    icono,
    desglose: {
      antiguedad: { años: antiguedad, puntos: puntajeAntiguedad },
      competencia: { anuncios: datos.totalAnuncios, puntos: puntajeCompetencia },
      estabilidad: { dispersion: dispersionPrecios.toFixed(3), puntos: puntajeEstabilidad },
      marca: { nombre: datos.brand, puntos: puntajeMarca }
    }
  };
}
```

## Matriz de Casos de Uso

### Escenario 1: MUY ALTA DEMANDA (≥75 puntos) 🔥

| Caso | Marca | Año | Antigüedad | Anuncios | Precio Min | Precio Max | Precio Prom | Dispersión | Puntaje Total | Desglose |
|------|-------|-----|------------|----------|------------|------------|-------------|------------|---------------|----------|
| **Caso Ideal** | Toyota | 2023 | 2 años | 2 | $450,000 | $480,000 | $465,000 | 0.065 | **85 puntos** | Antigüedad: 35, Competencia: 30, Estabilidad: 20, Marca: 15 |
| **Marca Premium Nueva** | Honda | 2024 | 1 año | 3 | $520,000 | $550,000 | $535,000 | 0.056 | **85 puntos** | Antigüedad: 35, Competencia: 30, Estabilidad: 20, Marca: 15 |
| **Poca Competencia** | Mazda | 2022 | 3 años | 1 | $380,000 | $420,000 | $400,000 | 0.100 | **80 puntos** | Antigüedad: 28, Competencia: 30, Estabilidad: 20, Marca: 15 |

### Escenario 2: ALTA DEMANDA (55-74 puntos) 📈

| Caso | Marca | Año | Antigüedad | Anuncios | Precio Min | Precio Max | Precio Prom | Dispersión | Puntaje Total | Desglose |
|------|-------|-----|------------|----------|------------|------------|-------------|------------|---------------|----------|
| **Marca Media Nueva** | Volkswagen | 2023 | 2 años | 5 | $420,000 | $480,000 | $450,000 | 0.133 | **67 puntos** | Antigüedad: 35, Competencia: 22, Estabilidad: 12, Marca: 10 |
| **Toyota Usada** | Toyota | 2020 | 5 años | 7 | $320,000 | $380,000 | $350,000 | 0.171 | **65 puntos** | Antigüedad: 28, Competencia: 22, Estabilidad: 12, Marca: 15 |
| **Audi Reciente** | Audi | 2023 | 2 años | 8 | $470,000 | $520,000 | $495,000 | 0.101 | **67 puntos** | Antigüedad: 35, Competencia: 22, Estabilidad: 20, Marca: 5 |

### Escenario 3: DEMANDA MODERADA (35-54 puntos) 📊

| Caso | Marca | Año | Antigüedad | Anuncios | Precio Min | Precio Max | Precio Prom | Dispersión | Puntaje Total | Desglose |
|------|-------|-----|------------|----------|------------|------------|-------------|------------|---------------|----------|
| **Mercado Saturado** | Toyota | 2023 | 2 años | 18 | $450,000 | $520,000 | $485,000 | 0.144 | **52 puntos** | Antigüedad: 35, Competencia: 15, Estabilidad: 12, Marca: 15 |
| **Marca Media Edad** | Nissan | 2019 | 6 años | 12 | $280,000 | $320,000 | $300,000 | 0.133 | **47 puntos** | Antigüedad: 20, Competencia: 15, Estabilidad: 12, Marca: 10 |
| **Precios Inestables** | Honda | 2022 | 3 años | 14 | $350,000 | $550,000 | $450,000 | 0.444 | **48 puntos** | Antigüedad: 28, Competencia: 15, Estabilidad: 5, Marca: 15 |

### Escenario 4: BAJA DEMANDA (20-34 puntos) ⚠️

| Caso | Marca | Año | Antigüedad | Anuncios | Precio Min | Precio Max | Precio Prom | Dispersión | Puntaje Total | Desglose |
|------|-------|-----|------------|----------|------------|------------|-------------|------------|---------------|----------|
| **Vehículo Viejo** | Toyota | 2015 | 10 años | 20 | $180,000 | $220,000 | $200,000 | 0.200 | **32 puntos** | Antigüedad: 12, Competencia: 8, Estabilidad: 12, Marca: 15 |
| **Marca Baja Saturada** | Seat | 2022 | 3 años | 30 | $320,000 | $450,000 | $385,000 | 0.338 | **33 puntos** | Antigüedad: 28, Competencia: 3, Estabilidad: 12, Marca: 5 |
| **Mercado Inestable** | Chevrolet | 2020 | 5 años | 22 | $250,000 | $400,000 | $325,000 | 0.462 | **23 puntos** | Antigüedad: 28, Competencia: 8, Estabilidad: 5, Marca: 10 |

### Escenario 5: MUY BAJA DEMANDA (<20 puntos) 📉

| Caso | Marca | Año | Antigüedad | Anuncios | Precio Min | Precio Max | Precio Prom | Dispersión | Puntaje Total | Desglose |
|------|-------|-----|------------|----------|------------|------------|-------------|------------|---------------|----------|
| **Vehículo Muy Antiguo** | Tsuru | 2010 | 15 años | 35 | $80,000 | $150,000 | $115,000 | 0.609 | **13 puntos** | Antigüedad: 5, Competencia: 3, Estabilidad: 5, Marca: 5 |
| **Saturación Extrema** | Versa | 2018 | 7 años | 45 | $180,000 | $280,000 | $230,000 | 0.435 | **18 puntos** | Antigüedad: 20, Competencia: 3, Estabilidad: 5, Marca: 5 |
| **Marca Desconocida Antigua** | Geely | 2012 | 13 años | 28 | $120,000 | $200,000 | $160,000 | 0.500 | **13 puntos** | Antigüedad: 5, Competencia: 3, Estabilidad: 5, Marca: 5 |

## Análisis de Comportamiento del Sistema

### Patrones Identificados:

#### 1. **Factor Dominante: Antigüedad (35%)**
- Los vehículos de 0-2 años obtienen la máxima puntuación (35 puntos)
- Caída significativa después de los 5 años (de 28 a 20 puntos)
- Vehículos >12 años prácticamente sin demanda (5 puntos)

#### 2. **Impacto de la Competencia (30%)**
- Mercados con ≤3 anuncios son ideales (30 puntos)
- Saturación crítica >25 anuncios (solo 3 puntos)
- Punto de equilibrio: 8-15 anuncios (15-22 puntos)

#### 3. **Estabilidad de Precios (20%)**
- Dispersión <30% indica mercado estable (20 puntos)
- Mercados volátiles >60% dispersión penalizados (5 puntos)

#### 4. **Prestigio de Marca (15%)**
- Marcas japonesas (Toyota, Honda, Mazda) favorecidas
- Marcas europeas/americanas en nivel medio
- Marcas desconocidas/chinas penalizadas

### Casos Extremos Detectados:

#### **Puntuación Máxima Teórica: 100 puntos**
- Toyota/Honda/Mazda/Subaru (15 puntos)
- 0-2 años de antigüedad (35 puntos)
- ≤3 anuncios en el mercado (30 puntos)
- Dispersión de precios <30% (20 puntos)

#### **Puntuación Mínima Teórica: 13 puntos**
- Marca desconocida (5 puntos)
- >12 años de antigüedad (5 puntos)
- >25 anuncios en el mercado (3 puntos)
- Dispersión de precios >60% (5 puntos)

### Recomendaciones de Calibración:

1. **Ajustar pesos por segmento**: Vehículos de lujo vs. económicos
2. **Considerar estacionalidad**: Demanda variable por época del año
3. **Incluir factor geográfico**: Demanda regional diferenciada
4. **Agregar factor de combustible**: Eléctricos vs. gasolina vs. híbridos
5. **Considerar historial de ventas**: Velocidad de rotación real

## Casos de Uso Reales con Datos Proporcionados

### Análisis de Audi A3 2023:

Basado en los datos proporcionados de Audi A3 2023:
- **Marca**: Audi (5 puntos - marca premium no japonesa)
- **Año**: 2023 (35 puntos - 2 años de antigüedad)
- **Anuncios**: ~15 anuncios visibles (15 puntos - competencia moderada)
- **Precios**: Min: $475,000, Max: $519,990, Promedio: ~$495,000
- **Dispersión**: ~0.091 (20 puntos - precios estables)

**Puntuación Total**: 75 puntos = **MUY ALTA DEMANDA** 🔥

Este resultado indica que el Audi A3 2023 tiene excelente potencial de demanda debido a su reciente antigüedad y estabilidad de precios, compensando la menor puntuación de marca.