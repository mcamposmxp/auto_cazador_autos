Cálculo y Valores de la Sección "DEMANDA DEL VEHÍCULO"
Fuente de los Datos
Los valores se obtienen mediante la función calcularDemandaAuto() ubicada en /src/utils/priceAnalysisCalculations.ts, que recibe tres parámetros:

autosSimilares: Array de vehículos similares obtenidos de la base de datos
datos: Información del vehículo (marca, modelo, año, etc.)
estadisticas: Estadísticas calculadas del mercado
Sistema de Puntuación (Algoritmo de Cálculo)
El sistema utiliza un puntaje de demanda de 0 a 100 puntos, calculado con 4 factores principales:

1. Factor Antigüedad del Vehículo (35% del peso total)

const antiguedad = anoActual - datos.ano;

if (antiguedad <= 2) puntajeDemanda += 35;      // Vehículos muy nuevos
else if (antiguedad <= 5) puntajeDemanda += 28; // Vehículos nuevos
else if (antiguedad <= 8) puntajeDemanda += 20; // Vehículos de edad media
else if (antiguedad <= 12) puntajeDemanda += 12;// Vehículos usados
else puntajeDemanda += 5;                        // Vehículos antiguos
2. Factor Oferta/Competencia (30% del peso total)

const totalAnuncios = autosSimilares.length;

if (totalAnuncios <= 3) puntajeDemanda += 30;      // Muy poca oferta = alta demanda
else if (totalAnuncios <= 8) puntajeDemanda += 22; // Poca oferta = demanda buena
else if (totalAnuncios <= 15) puntajeDemanda += 15;// Oferta moderada
else if (totalAnuncios <= 25) puntajeDemanda += 8; // Mucha oferta
else puntajeDemanda += 3;                           // Oferta excesiva = baja demanda
3. Factor Estabilidad de Precios (20% del peso total)

const dispersionPrecios = Math.abs(precioMaximo - precioMinimo) / precioPromedio;

if (dispersionPrecios < 0.3) puntajeDemanda += 20;  // Precios estables = demanda consistente
else if (dispersionPrecios < 0.6) puntajeDemanda += 12; // Variación moderada
else puntajeDemanda += 5;                               // Alta variación = mercado inestable
4. Factor Prestigio de Marca (15% del peso total)

const marcasAlta = ['Toyota', 'Honda', 'Mazda', 'Subaru'];
const marcasMedia = ['Nissan', 'Chevrolet', 'Ford', 'Volkswagen', 'Hyundai', 'Kia'];

if (marcasAlta.includes(marca)) puntajeDemanda += 15;      // Marcas premium
else if (marcasMedia.includes(marca)) puntajeDemanda += 10; // Marcas populares
else puntajeDemanda += 5;                                   // Otras marcas
Clasificación de Niveles de Demanda
Basado en el puntaje total, se asignan los siguientes niveles:

| Puntaje | Nivel | Descripción | Color Badge | |---------|-------|-------------|-------------| | ≥ 75 puntos | "Muy alta demanda" | "Modelo muy solicitado" | Rojo (destructive) | | 55-74 puntos | "Alta demanda" | "Buena demanda del mercado" | Verde (default) | | 35-54 puntos | "Demanda moderada" | "Demanda equilibrada" | Azul (secondary) | | 20-34 puntos | "Baja demanda" | "Demanda limitada" | Naranja | | < 20 puntos | "Muy baja demanda" | "Mercado saturado" | Rojo |

Implementación en la Interfaz
En el componente AnalisisMercado.tsx (líneas 69-81), la información se muestra así:

<Badge variant={datos.demanda === 'alta' ? 'default' :
datos.demanda === 'baja' ? 'destructive' : 'secondary'}>
{datos.demanda === 'alta' ? 'Alta demanda' :
datos.demanda === 'baja' ? 'Baja demanda' : 'Demanda moderada'}
`</Badge>`

<p className="text-xs text-muted-foreground mt-1">
  Buena demanda del mercado
</p>
Transformación de Datos
Los niveles detallados de la función se simplifican a 3 categorías para la UI:

"Alta demanda": Incluye "Muy alta demanda" y "Alta demanda"
"Demanda moderada": Solo "Demanda moderada"
"Baja demanda": Incluye "Baja demanda" y "Muy baja demanda"
El texto fijo "Buena demanda del mercado" siempre se muestra independientemente del nivel calculado.

Perfecto, ahora tengo toda la información necesaria. Basándome en el análisis del código, puedo explicar completamente cómo se calcula y obtiene la información de la sección "DEMANDA DEL VEHÍCULO".

Cálculo y Valores de la Sección "DEMANDA DEL VEHÍCULO"
Fuente de los Datos
Los valores se obtienen mediante la función calcularDemandaAuto() ubicada en /src/utils/priceAnalysisCalculations.ts, que recibe tres parámetros:

autosSimilares: Array de vehículos similares obtenidos de la base de datos
datos: Información del vehículo (marca, modelo, año, etc.)
estadisticas: Estadísticas calculadas del mercado
Sistema de Puntuación (Algoritmo de Cálculo)
El sistema utiliza un puntaje de demanda de 0 a 100 puntos, calculado con 4 factores principales:

1. Factor Antigüedad del Vehículo (35% del peso total)

const antiguedad = anoActual - datos.ano;

if (antiguedad <= 2) puntajeDemanda += 35;      // Vehículos muy nuevos
else if (antiguedad <= 5) puntajeDemanda += 28; // Vehículos nuevos
else if (antiguedad <= 8) puntajeDemanda += 20; // Vehículos de edad media
else if (antiguedad <= 12) puntajeDemanda += 12;// Vehículos usados
else puntajeDemanda += 5;                        // Vehículos antiguos
2. Factor Oferta/Competencia (30% del peso total)

const totalAnuncios = autosSimilares.length;

if (totalAnuncios <= 3) puntajeDemanda += 30;      // Muy poca oferta = alta demanda
else if (totalAnuncios <= 8) puntajeDemanda += 22; // Poca oferta = demanda buena
else if (totalAnuncios <= 15) puntajeDemanda += 15;// Oferta moderada
else if (totalAnuncios <= 25) puntajeDemanda += 8; // Mucha oferta
else puntajeDemanda += 3;                           // Oferta excesiva = baja demanda
3. Factor Estabilidad de Precios (20% del peso total)

const dispersionPrecios = Math.abs(precioMaximo - precioMinimo) / precioPromedio;

if (dispersionPrecios < 0.3) puntajeDemanda += 20;  // Precios estables = demanda consistente
else if (dispersionPrecios < 0.6) puntajeDemanda += 12; // Variación moderada
else puntajeDemanda += 5;                               // Alta variación = mercado inestable
4. Factor Prestigio de Marca (15% del peso total)

const marcasAlta = ['Toyota', 'Honda', 'Mazda', 'Subaru'];
const marcasMedia = ['Nissan', 'Chevrolet', 'Ford', 'Volkswagen', 'Hyundai', 'Kia'];

if (marcasAlta.includes(marca)) puntajeDemanda += 15;      // Marcas premium
else if (marcasMedia.includes(marca)) puntajeDemanda += 10; // Marcas populares
else puntajeDemanda += 5;                                   // Otras marcas
Clasificación de Niveles de Demanda
Basado en el puntaje total, se asignan los siguientes niveles:

| Puntaje | Nivel | Descripción | Color Badge | |---------|-------|-------------|-------------| | ≥ 75 puntos | "Muy alta demanda" | "Modelo muy solicitado" | Rojo (destructive) | | 55-74 puntos | "Alta demanda" | "Buena demanda del mercado" | Verde (default) | | 35-54 puntos | "Demanda moderada" | "Demanda equilibrada" | Azul (secondary) | | 20-34 puntos | "Baja demanda" | "Demanda limitada" | Naranja | | < 20 puntos | "Muy baja demanda" | "Mercado saturado" | Rojo |

Implementación en la Interfaz
En el componente AnalisisMercado.tsx (líneas 69-81), la información se muestra así:

<Badge variant={datos.demanda === 'alta' ? 'default' :
datos.demanda === 'baja' ? 'destructive' : 'secondary'}>
{datos.demanda === 'alta' ? 'Alta demanda' :
datos.demanda === 'baja' ? 'Baja demanda' : 'Demanda moderada'}
`</Badge>`

<p className="text-xs text-muted-foreground mt-1">
  Buena demanda del mercado
</p>
Transformación de Datos
Los niveles detallados de la función se simplifican a 3 categorías para la UI:

"Alta demanda": Incluye "Muy alta demanda" y "Alta demanda"
"Demanda moderada": Solo "Demanda moderada"
"Baja demanda": Incluye "Baja demanda" y "Muy baja demanda"
**El texto fijo "Buena demanda del mercado" siempre se muestra independientemente del nivel calculado.**
