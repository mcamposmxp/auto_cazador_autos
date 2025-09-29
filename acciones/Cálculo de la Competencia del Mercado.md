Cálculo de la Competencia del Mercado
Origen de los Datos:
La competencia del mercado se calcula usando la función calcularCompetenciaMercado() en src/utils/priceAnalysisCalculations.ts, que toma como parámetros:

autosSimilares: Array de vehículos similares obtenidos de la consulta SQL
estadoSeleccionado: Estado/ubicación seleccionada en los filtros
tipoVendedorSeleccionado: Tipo de vendedor seleccionado
Proceso de Cálculo:
1. Factor de Competencia Base

let factorCompetencia = totalAnuncios; // Cantidad de vehículos similares encontrados
2. Ajustes por Filtros Aplicados
Si estadoSeleccionado === "todos": factorCompetencia *= 1.3 (más competencia nacional)
Si tipoVendedorSeleccionado === "todos": factorCompetencia *= 1.2 (más competencia incluyendo ambos tipos)
3. Análisis de Dispersión de Precios
Se calcula el coeficiente de variación de los precios para determinar la intensidad:

Coeficiente > 0.4: intensidadCompetencia = "agresiva" (precios muy dispersos)
Coeficiente < 0.15: intensidadCompetencia = "estable" (precios similares)
Intermedio: intensidadCompetencia = "normal"
Niveles de Competencia y Rangos:
| Factor Competencia | Nivel | Descripción | Color | |-------------------|--------|-------------|--------| | ≤ 4 | Muy baja competencia | "Excelente oportunidad de venta" | Verde esmeralda | | 5-8 | Baja competencia | "Buenas condiciones del mercado" | Verde | | 9-15 | Competencia moderada | "Mercado equilibrado" | Azul | | 16-25 | Alta competencia | "Mercado muy competitivo" | Naranja | | > 25 | Competencia extrema | "Mercado saturado" | Rojo |

Visualización en la UI:
En AnalisisMercado.tsx, la sección se muestra así:


<div className="flex items-center gap-2 mb-2">
  <Target className="h-4 w-4 text-blue-600" />
  <h3 className="font-medium text-sm text-muted-foreground">COMPETENCIA DEL MERCADO</h3>
</div>
<Badge className={getCompetenciaColor()}>
  Competencia {datos.competencia}
</Badge>
<div className="flex justify-between text-xs text-muted-foreground mt-2">
  <span>Mercado equilibrado</span>
</div>
<div className="flex justify-between text-xs text-muted-foreground">
  <span>Precio</span>
  <span>Normal</span>
</div>
Posibles Valores que se Muestran:
Título: "COMPETENCIA DEL MERCADO"
Badge Principal:
"Competencia muy baja"
"Competencia baja"
"Competencia moderada"
"Competencia alta"
"Competencia extrema"
Descripción fija: "Mercado equilibrado"
Etiquetas fijas: "Precio" / "Normal"
Ejemplo de Cálculo:
Si hay 12 vehículos similares, estado "todos" y vendedor "profesional":

Factor base: 12
Ajuste por estado: 12 × 1.3 = 15.6
Resultado: "Competencia moderada" con descripción "Mercado equilibrado"
El sistema utiliza tanto la cantidad de competidores como la variabilidad de precios para determinar qué tan competitivo está el mercado para ese vehículo específico.

Ahora puedo explicarte completamente cómo se calcula y obtiene la información para la sección "COMPETENCIA DEL MERCADO":

Cálculo de la Competencia del Mercado
Origen de los Datos:
La competencia del mercado se calcula usando la función calcularCompetenciaMercado() en src/utils/priceAnalysisCalculations.ts, que toma como parámetros:

autosSimilares: Array de vehículos similares obtenidos de la consulta SQL
estadoSeleccionado: Estado/ubicación seleccionada en los filtros
tipoVendedorSeleccionado: Tipo de vendedor seleccionado
Proceso de Cálculo:
1. Factor de Competencia Base

let factorCompetencia = totalAnuncios; // Cantidad de vehículos similares encontrados
2. Ajustes por Filtros Aplicados
Si estadoSeleccionado === "todos": factorCompetencia *= 1.3 (más competencia nacional)
Si tipoVendedorSeleccionado === "todos": factorCompetencia *= 1.2 (más competencia incluyendo ambos tipos)
3. Análisis de Dispersión de Precios
Se calcula el coeficiente de variación de los precios para determinar la intensidad:

Coeficiente > 0.4: intensidadCompetencia = "agresiva" (precios muy dispersos)
Coeficiente < 0.15: intensidadCompetencia = "estable" (precios similares)
Intermedio: intensidadCompetencia = "normal"
Niveles de Competencia y Rangos:
| Factor Competencia | Nivel | Descripción | Color | |-------------------|--------|-------------|--------| | ≤ 4 | Muy baja competencia | "Excelente oportunidad de venta" | Verde esmeralda | | 5-8 | Baja competencia | "Buenas condiciones del mercado" | Verde | | 9-15 | Competencia moderada | "Mercado equilibrado" | Azul | | 16-25 | Alta competencia | "Mercado muy competitivo" | Naranja | | > 25 | Competencia extrema | "Mercado saturado" | Rojo |

Visualización en la UI:
En AnalisisMercado.tsx, la sección se muestra así:


<div className="flex items-center gap-2 mb-2">
  <Target className="h-4 w-4 text-blue-600" />
  <h3 className="font-medium text-sm text-muted-foreground">COMPETENCIA DEL MERCADO</h3>
</div>
<Badge className={getCompetenciaColor()}>
  Competencia {datos.competencia}
</Badge>
<div className="flex justify-between text-xs text-muted-foreground mt-2">
  <span>Mercado equilibrado</span>
</div>
<div className="flex justify-between text-xs text-muted-foreground">
  <span>Precio</span>
  <span>Normal</span>
</div>
Posibles Valores que se Muestran:
Título: "COMPETENCIA DEL MERCADO"
Badge Principal:
"Competencia muy baja"
"Competencia baja"
"Competencia moderada"
"Competencia alta"
"Competencia extrema"
Descripción fija: "Mercado equilibrado"
Etiquetas fijas: "Precio" / "Normal"
Ejemplo de Cálculo:
Si hay 12 vehículos similares, estado "todos" y vendedor "profesional":

Factor base: 12
Ajuste por estado: 12 × 1.3 = 15.6
Resultado: "Competencia moderada" con descripción "Mercado equilibrado"
El sistema utiliza tanto la cantidad de competidores como la variabilidad de precios para determinar qué tan competitivo está el mercado para ese vehículo específico.




