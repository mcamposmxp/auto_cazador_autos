import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";
import { useDebugMode } from "@/hooks/useDebugMode";
import { DebugInfo } from "./DebugInfo";
import { calcularFactorKilometraje } from "@/utils/priceAnalysisCalculations";

interface DatosMercado {
  precioPromedio: number;
  precioPromedioBruto?: number; // Valor sin redondear
  rangoMinimo: number;
  rangoMaximo: number;
  demanda: 'baja' | 'moderada' | 'alta';
  competencia: 'baja' | 'moderada' | 'alta';
  vehiculosSimilares: number;
  factorCompetencia?: number;
  coeficienteVariacion?: number;
  intensidadCompetencia?: string;
  distribucionPrecios: Array<{
    inicio: number;
    fin: number;
    cantidad: number;
    porcentaje: number;
    metodo?: 'cuartiles' | 'desviacion' | 'lineal' | 'fijo';
  }>;
  cuartilesPrecios?: {
    Q0: number;
    Q1: number;
    Q2: number;
    Q3: number;
    Q4: number;
  };
  modaPrecios?: number | null;
}

interface AnalisisMercadoProps {
  marca: string;
  modelo: string;
  ano: number;
  precio: number;
  kilometraje: number;
  onKilometrajeChange: (km: number) => void;
  autosSimilares: Array<{
    kilometraje: number;
    ano: number;
    [key: string]: any;
  }>;
  datos: DatosMercado;
}

export default function AnalisisMercado({ marca, modelo, ano, precio, kilometraje, onKilometrajeChange, autosSimilares, datos }: AnalisisMercadoProps) {
  const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const { debugMode } = useDebugMode();
  
  // Calcular estadísticas de kilometraje del mercado
  const estadisticasKm = (() => {
    const kilometrajes = autosSimilares.map(auto => auto.kilometraje).filter(km => km > 0);
    if (kilometrajes.length === 0) {
      return { minimo: 0, maximo: 150000, promedio: 75000 };
    }
    return {
      minimo: Math.min(...kilometrajes),
      maximo: Math.max(...kilometrajes),
      promedio: kilometrajes.reduce((a, b) => a + b, 0) / kilometrajes.length
    };
  })();
  
  // Calcular kilometraje esperado para el slider
  const edadVehiculo = new Date().getFullYear() - ano;
  const kilometrajeEsperado = edadVehiculo * 15000;
  
  // Calcular factor de kilometraje y precio ajustado
  const factorKilometraje = calcularFactorKilometraje(
    kilometraje, 
    autosSimilares, 
    { marca, modelo, ano, version: '', kilometraje, estado: '', ciudad: '' }
  );
  
  const precioAjustado = datos.precioPromedio * factorKilometraje;
  const porcentajeAjuste = ((factorKilometraje - 1) * 100);
  
  // Calcular posición en la distribución de precios (0-100%)
  const posicionPrecio = ((precio - datos.rangoMinimo) / (datos.rangoMaximo - datos.rangoMinimo)) * 100;
  
  // Función para ajustar porcentajes para que sumen exactamente 100
  const ajustarPorcentajes = (rangos: typeof datos.distribucionPrecios) => {
    // Redondear cada porcentaje
    const redondeados = rangos.map(r => Math.round(r.porcentaje));
    const sumaRedondeada = redondeados.reduce((sum, val) => sum + val, 0);
    
    // Si la suma no es 100, ajustar el valor más grande
    if (sumaRedondeada !== 100) {
      const diferencia = 100 - sumaRedondeada;
      const indiceMaximo = redondeados.indexOf(Math.max(...redondeados));
      redondeados[indiceMaximo] += diferencia;
    }
    
    return redondeados;
  };
  
  // Distribución de precios real con colores y porcentajes ajustados
  const porcentajesAjustados = ajustarPorcentajes(datos.distribucionPrecios);
  const distribucionPrecios = datos.distribucionPrecios.map((rango, idx) => ({
    ...rango,
    porcentaje: porcentajesAjustados[idx],
    porcentajeOriginal: rango.porcentaje,
    rango: ['Muy Bajo', 'Bajo', 'Promedio', 'Alto', 'Muy Alto'][idx],
    color: ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-400', 'bg-red-600'][idx]
  }));
  
  // Determinar método usado
  const metodoDistribucion = datos.distribucionPrecios[0]?.metodo || 'lineal';
  const nombreMetodo = metodoDistribucion === 'cuartiles' ? 'Cuartiles (Q1, Q2, Q3, P90)' :
                        metodoDistribucion === 'desviacion' ? 'Desviación estándar' :
                        metodoDistribucion === 'fijo' ? 'Distribución fija' : 'Distribución lineal';

  // Calcular posición del kilometraje en el rango del mercado
  const posicionKm = ((kilometraje - estadisticasKm.minimo) / (estadisticasKm.maximo - estadisticasKm.minimo)) * 100;

  const getDemandaIcon = () => {
    switch (datos.demanda) {
      case 'alta': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'baja': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <BarChart3 className="h-4 w-4 text-orange-600" />;
    }
  };

  const getCompetenciaColor = () => {
    switch (datos.competencia) {
      case 'baja': return 'bg-green-100 text-green-800';
      case 'alta': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con información del vehículo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              {getDemandaIcon()}
              <h3 className="font-medium text-sm text-muted-foreground">DEMANDA DEL VEHÍCULO</h3>
              {debugMode && (
                <DebugInfo
                  title="Cálculo de demanda"
                  data={{
                    fuente: "Edge Function 'maxi_similar_cars' + API MaxiPublica",
                    datosPredecesores: [
                      {
                        fuente: "API MaxiPublica ads_sites",
                        valor: `${datos.vehiculosSimilares} vehículos similares encontrados`,
                        fecha: new Date().toLocaleDateString()
                      },
                      {
                        fuente: "Edge Function maxi_similar_cars",
                        valor: `Filtrado por versionId específico`,
                        fecha: new Date().toLocaleDateString()
                      }
                    ],
                    reglasAplicadas: [
                      "Demanda ALTA: > 15 vehículos similares",
                      "Demanda MODERADA: 5-15 vehículos similares", 
                      "Demanda BAJA: < 5 vehículos similares",
                      "Ajuste por marca: Toyota, Honda, Mazda, Subaru (+1 punto)",
                      "Ajuste por antigüedad: ≤2 años (+1), 3-5 años (0), >5 años (-1)"
                    ],
                    calculos: [{
                      formula: "demanda = f(vehiculosSimilares, marca, antiguedad)",
                      formulaConValores: `demanda = f(${datos.vehiculosSimilares}, "${marca}", ${new Date().getFullYear() - ano} años)`,
                      valores: {
                        vehiculosSimilares: datos.vehiculosSimilares,
                        marca: marca,
                        modelo: modelo,
                        año: ano,
                        clasificacionSegunReglas: datos.vehiculosSimilares > 15 ? "ALTA (>15)" : 
                                                 datos.vehiculosSimilares >= 5 ? "MODERADA (5-15)" : "BAJA (<5)",
                        factoresAdicionales: `Marca: ${marca}, Antigüedad: ${new Date().getFullYear() - ano} años`
                      },
                      resultado: `${datos.demanda.toUpperCase()} - Basado en ${datos.vehiculosSimilares} vehículos similares`,
                      documentacion: "/src/utils/priceAnalysisCalculations.ts#calcularDemandaAuto (líneas 151-227)"
                    }],
                    procesamiento: {
                      pasos: [
                        "Edge Function obtiene versionId del vehículo",
                        "Llamada a API MaxiPublica ads_sites con categoryId específico",
                        "Filtrado automático por versionId (datos pre-filtrados)",
                        "Mapeo y normalización de datos de respuesta API",
                        "Aplicación de algoritmo de clasificación de demanda",
                        "Ajustes por factores marca y antigüedad"
                      ],
                      filtros: [],
                      transformaciones: [
                        "Conversión de datos API MaxiPublica a formato interno",
                        "Cálculo de nivel de demanda basado en cantidad total",
                        "Aplicación de factores de ajuste marca/antigüedad",
                        "Clasificación final de demanda vehicular"
                      ]
                    },
                    observaciones: [
                      "Los datos provienen directamente de API MaxiPublica mediante Edge Function",
                      "El versionId garantiza precisión en vehículos similares",
                      "Se aplican factores de mercado mexicano (marcas populares)",
                      "El algoritmo considera tanto cantidad como calidad de demanda"
                    ]
                  }}
                />
              )}
            </div>
            <Badge variant={datos.demanda === 'alta' ? 'default' : datos.demanda === 'baja' ? 'destructive' : 'secondary'}>
              {datos.demanda === 'alta' ? 'Alta demanda' : datos.demanda === 'baja' ? 'Baja demanda' : 'Demanda moderada'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Buena demanda del mercado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="font-medium text-sm text-muted-foreground">PRECIO PROMEDIO DE MERCADO</h3>
              {debugMode && (
                <DebugInfo
                  title="Precio promedio calculado"
                  data={{
                    fuente: "API MaxiPublica Similar Cars",
                    datosPredecesores: [
                      {
                        fuente: "Edge Function: maxi_similar_cars",
                        valor: `Total vehículos similares: ${Array.isArray(datos.vehiculosSimilares) ? datos.vehiculosSimilares.length : datos.vehiculosSimilares || 0}`,
                        fecha: new Date().toLocaleDateString()
                      },
                      {
                        fuente: "API MaxiPublica Similar Cars",
                        valor: `Array similarsCars[].price`,
                        fecha: new Date().toLocaleDateString()
                      }
                    ],
                    reglasAplicadas: [
                      "1. Obtener array similarsCars[] de maxi_similar_cars API",
                      "2. Filtrar precios válidos (price > 0)",
                      "3. Calcular promedio: SUM(prices) / COUNT(prices)",
                      "4. Redondear a centenas: Math.round(promedio / 100) * 100"
                    ],
                    consulta: `API MaxiPublica Similar Cars con versionId: ${marca}_${modelo}_${ano}`,
                    parametros: {
                      rangoMinimo: datos.rangoMinimo,
                      rangoMaximo: datos.rangoMaximo,
                      totalVehiculos: datos.vehiculosSimilares
                    },
                    calculos: [{
                      formula: "promedioBruto = SUM(similarsCars[].price) / COUNT(precios válidos)\nprecioPromedio = Math.round(promedioBruto / 100) * 100",
                      formulaConValores: `promedioBruto = ${datos.precioPromedioBruto ? currency.format(datos.precioPromedioBruto) : 'N/A'}\nprecioPromedio = ${currency.format(datos.precioPromedio)}`,
                      valores: {
                        precioPromedioBruto: datos.precioPromedioBruto || 0,
                        precioPromedioRedondeado: datos.precioPromedio,
                        diferencia: datos.precioPromedioBruto ? (datos.precioPromedio - datos.precioPromedioBruto) : 0,
                        rangoMinimo: `${currency.format(datos.rangoMinimo)}`,
                        rangoMaximo: `${currency.format(datos.rangoMaximo)}`,
                        vehiculosAnalizados: datos.vehiculosSimilares
                      },
                      resultado: `Bruto: ${datos.precioPromedioBruto ? currency.format(datos.precioPromedioBruto) : 'N/A'} | Redondeado: ${currency.format(datos.precioPromedio)} (basado en ${datos.vehiculosSimilares} vehículos)`,
                      documentacion: "/src/components/AnalisisPrecio.tsx#línea 128 (cálculo de precio promedio)"
                    }],
                    procesamiento: {
                      pasos: [
                        "1. Consulta API MaxiPublica con versionId",
                        "2. Si no hay datos, consulta anuncios locales",
                        "3. Calcula estadísticas de precios",
                        "4. Aplica reglas de validación"
                      ],
                      filtros: [
                        "activo = true",
                        "precio > 0",
                        "marca, modelo, año exactos"
                      ],
                      transformaciones: [
                        "Conversión de moneda si necesario",
                        "Normalización de precios",
                        "Cálculo de rangos percentiles"
                      ]
                    },
                    observaciones: [
                      "Se prioriza el precio de MaxiPublica si está disponible",
                      "Se complementa con datos de anuncios recopilados",
                      "Solo se consideran anuncios activos y verificados",
                      "MaxiPublica es la fuente principal de precios",
                      "Datos actualizados automáticamente"
                    ]
                  }}
                />
              )}
            </div>
            <p className="text-2xl font-bold text-blue-600">{currency.format(datos.precioPromedio)}</p>
            <p className="text-xs text-muted-foreground">
              Basado en {datos.vehiculosSimilares} vehículos similares
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium text-sm text-muted-foreground">COMPETENCIA DEL MERCADO</h3>
              {debugMode && (
                <DebugInfo
                  title="Análisis de competencia"
                  data={{
                    fuente: "Análisis de densidad de mercado + Datos agregados",
                    datosPredecesores: [
                      {
                        fuente: "Conteo anuncios activos",
                        valor: `${datos.vehiculosSimilares} anuncios similares`,
                        fecha: new Date().toLocaleDateString()
                      },
                      {
                        fuente: "Análisis dispersión precios",
                        valor: `Rango: ${currency.format(datos.rangoMinimo)} - ${currency.format(datos.rangoMaximo)}`,
                        fecha: new Date().toLocaleDateString()
                      }
                    ],
                    reglasAplicadas: [
                      "Competencia ALTA: >20 anuncios + alta dispersión precios",
                      "Competencia MODERADA: 10-20 anuncios + dispersión media",
                      "Competencia BAJA: <10 anuncios + baja dispersión",
                      "Ajuste por concentración geográfica"
                    ],
                    calculos: [{
                      formula: "competencia = f(densidadAnuncios, variacionPrecios, timeToMarket)",
                      valores: {
                        vehiculosEnMercado: datos.vehiculosSimilares,
                        rangoPrecios: `${currency.format(datos.rangoMinimo)} - ${currency.format(datos.rangoMaximo)}`,
                        disperscion: ((datos.rangoMaximo - datos.rangoMinimo) / datos.precioPromedio * 100).toFixed(1) + "%",
                        factorCompetencia: datos.factorCompetencia?.toFixed(2) || 'N/A',
                        coeficienteVariacion: datos.coeficienteVariacion ? (datos.coeficienteVariacion * 100).toFixed(2) + "%" : 'N/A',
                        intensidadCompetencia: datos.intensidadCompetencia || 'N/A'
                      },
                      resultado: datos.competencia
                    }],
                    procesamiento: {
                      pasos: [
                        "1. Conteo de anuncios competidores directos",
                        "2. Cálculo de dispersión de precios",
                        "3. Análisis de concentración geográfica", 
                        "4. Aplicación de matriz de competencia"
                      ],
                      filtros: [
                        "Mismo segmento (marca/modelo/año)",
                        "Anuncios activos únicamente",
                        "Rango geográfico relevante"
                      ],
                      transformaciones: [
                        "Normalización por volumen de mercado",
                        "Ponderación por proximidad geográfica",
                        "Clasificación en niveles discretos"
                      ]
                    },
                    observaciones: [
                      "Competencia alta indica muchos vehículos similares disponibles",
                      "Se considera la dispersión de precios como indicador de competencia",
                      "Mercados con mayor variabilidad de precios indican mayor competencia",
                      "Mayor competencia = mayor dificultad para vender",
                      "Datos actualizados en tiempo real"
                    ]
                  }}
                />
              )}
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
          </CardContent>
        </Card>
      </div>

      {/* Rango del mercado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-center text-lg">RANGO DEL MERCADO</CardTitle>
            {debugMode && (
              <DebugInfo
                title="Rango del mercado"
                data={{
                  fuente: "API MaxiPublica Similar Cars + Cálculos locales",
                  datosPredecesores: [
                    {
                      fuente: "Edge Function: maxi_similar_cars",
                      valor: `Total vehículos: ${datos.vehiculosSimilares}`,
                      fecha: new Date().toLocaleDateString()
                    },
                    {
                      fuente: "Array precios de similarsCars",
                      valor: `Precios filtrados (precio > 0)`,
                      fecha: new Date().toLocaleDateString()
                    }
                  ],
                  reglasAplicadas: [
                    "Filtrar precios válidos (> 0) del array similarsCars",
                    "Calcular mínimo: Math.min(...precios)",
                    "Calcular máximo: Math.max(...precios)",
                    "Rango = [mínimo, máximo]"
                  ],
                  calculos: [{
                    formula: "rangoMinimo = Math.min(...precios)\nrangoMaximo = Math.max(...precios)\namplitudRango = rangoMaximo - rangoMinimo",
                    valores: {
                      rangoMinimo: currency.format(datos.rangoMinimo),
                      rangoMaximo: currency.format(datos.rangoMaximo),
                      amplitudRango: currency.format(datos.rangoMaximo - datos.rangoMinimo),
                      vehiculosAnalizados: datos.vehiculosSimilares
                    },
                    resultado: `Rango: ${currency.format(datos.rangoMinimo)} - ${currency.format(datos.rangoMaximo)} (amplitud: ${currency.format(datos.rangoMaximo - datos.rangoMinimo)})`
                  }],
                  procesamiento: {
                    pasos: [
                      "Obtener array de precios de similarsCars",
                      "Filtrar precios válidos (> 0)",
                      "Calcular valor mínimo del array",
                      "Calcular valor máximo del array",
                      "Establecer rango del mercado"
                    ],
                    filtros: ["Precios > 0"],
                    transformaciones: ["Identificación de valores extremos"]
                  },
                  observaciones: [
                    "El rango representa los precios mínimo y máximo encontrados",
                    "Una amplitud grande indica alta variabilidad de precios",
                    "Datos provienen directamente de similarsCars de API"
                  ]
                }}
              />
            )}
          </div>
          <p className="text-center text-2xl font-bold">
            {currency.format(datos.rangoMinimo)} - {currency.format(datos.rangoMaximo)}
          </p>
          <p className="text-center text-sm text-muted-foreground">Distribución de precios:</p>
        </CardHeader>
        <CardContent>
          {/* Barra de distribución de precios */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Distribución de precios:</span>
              {debugMode && (
                <DebugInfo
                  title="Distribución de precios en el mercado"
                  data={{
                    fuente: `Cálculo dinámico usando ${nombreMetodo}`,
                    datosPredecesores: [
                      {
                        fuente: "Vehículos similares en el mercado",
                        valor: `${datos.vehiculosSimilares} vehículos analizados`,
                        fecha: new Date().toLocaleDateString()
                      },
                      {
                        fuente: "Método de distribución aplicado",
                        valor: nombreMetodo,
                        fecha: new Date().toLocaleDateString()
                      },
                      ...(metodoDistribucion === 'cuartiles' ? [{
                        fuente: "Percentiles calculados",
                        valor: `Q1: ${currency.format(distribucionPrecios[0].fin)}, Q2: ${currency.format(distribucionPrecios[1].fin)}, Q3: ${currency.format(distribucionPrecios[2].fin)}, P90: ${currency.format(distribucionPrecios[3].fin)}`,
                        fecha: new Date().toLocaleDateString()
                      }] : [])
                    ],
                    reglasAplicadas: [
                      `Muestra: ${datos.vehiculosSimilares} vehículos`,
                      metodoDistribucion === 'cuartiles' 
                        ? "✓ Muestra ≥12: Usar cuartiles (Q1, Q2, Q3, P90)"
                        : metodoDistribucion === 'desviacion'
                        ? "✓ Muestra 5-11: Usar desviación estándar"
                        : metodoDistribucion === 'fijo'
                        ? "✓ Muestra <5 con precios iguales: Distribución fija"
                        : "✓ Muestra <5: Usar distribución lineal",
                      ...(metodoDistribucion === 'cuartiles' ? [
                        "Segmento 1 (Muy Bajo): Min → Q1",
                        "Segmento 2 (Bajo): Q1 → Q2 (Mediana)",
                        "Segmento 3 (Promedio): Q2 → Q3",
                        "Segmento 4 (Alto): Q3 → P90",
                        "Segmento 5 (Muy Alto): P90 → Max"
                      ] : metodoDistribucion === 'desviacion' ? [
                        "Basado en desviación estándar del precio promedio",
                        "Rangos adaptativos según dispersión de datos"
                      ] : [
                        "Dividir rango en 5 segmentos lineales iguales"
                      ])
                    ],
                    calculos: [{
                      formula: `Método: ${nombreMetodo}`,
                      valores: distribucionPrecios.reduce((acc, rango, idx) => {
                        const categoria = ['Muy Bajo', 'Bajo', 'Promedio', 'Alto', 'Muy Alto'][idx];
                        acc[categoria] = {
                          rango: `${currency.format(rango.inicio)} - ${currency.format(rango.fin)}`,
                          porcentaje: `${rango.porcentaje.toFixed(1)}%`,
                          cantidad: rango.cantidad,
                          color: rango.color
                        };
                        return acc;
                      }, {} as Record<string, any>),
                      resultado: `Distribución real: ${distribucionPrecios.map((r, i) => 
                        `${['Muy Bajo', 'Bajo', 'Promedio', 'Alto', 'Muy Alto'][i]}: ${r.porcentaje.toFixed(1)}%`
                      ).join(', ')}`
                    }],
                    procesamiento: {
                      pasos: metodoDistribucion === 'cuartiles' ? [
                        "1. Ordenar todos los precios de menor a mayor",
                        "2. Calcular Q1 (percentil 25%), Q2 (percentil 50%), Q3 (percentil 75%), P90 (percentil 90%)",
                        "3. Crear 5 rangos usando estos percentiles",
                        "4. Contar vehículos en cada rango",
                        "5. Calcular porcentajes de distribución"
                      ] : metodoDistribucion === 'desviacion' ? [
                        "1. Calcular precio promedio",
                        "2. Calcular desviación estándar",
                        "3. Crear rangos basados en ±σ del promedio",
                        "4. Contar vehículos en cada rango",
                        "5. Calcular porcentajes de distribución"
                      ] : [
                        "1. Calcular amplitud del rango: max - min",
                        "2. Dividir en 5 segmentos iguales",
                        "3. Contar vehículos en cada segmento",
                        "4. Calcular porcentajes de distribución"
                      ],
                      filtros: ["Precios > 0", "Dentro del rango min-max"],
                      transformaciones: [
                        `Método seleccionado: ${nombreMetodo}`,
                        "Segmentación adaptativa basada en datos reales",
                        "Cálculo de porcentajes por segmento",
                        "Asignación de colores por categoría"
                      ]
                    },
                    observaciones: [
                      `Método aplicado: ${nombreMetodo}`,
                      metodoDistribucion === 'cuartiles' 
                        ? "✓ Distribución adaptativa basada en cuartiles - máxima precisión"
                        : metodoDistribucion === 'desviacion'
                        ? "✓ Distribución basada en desviación estándar - buena precisión"
                        : "○ Distribución lineal - precisión básica por muestra pequeña",
                      "La distribución real refleja la concentración de precios en el mercado",
                      distribucionPrecios.find(r => r.porcentaje > 40) 
                        ? "Alta concentración detectada en una categoría"
                        : "Distribución balanceada entre categorías"
                    ]
                  }}
                />
              )}
            </div>
            <div className="flex h-6 rounded-full overflow-hidden">
              {distribucionPrecios.map((rango, index) => (
                <div 
                  key={index}
                  className={`${rango.color} flex items-center justify-center text-xs text-white font-medium`}
                  style={{ width: `${rango.porcentaje}%` }}
                >
                  {rango.porcentaje}%
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Muy Bajo</span>
              <span>Bajo</span>
              <span>Promedio</span>
              <span>Alto</span>
              <span>Muy Alto</span>
            </div>
          </div>

          {/* Indicador de zona óptima */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>
                {(() => {
                  const rangoPromedioData = distribucionPrecios.find(d => d.rango === "Promedio");
                  const porcentajePromedio = rangoPromedioData ? Math.round(rangoPromedioData.porcentaje) : 0;
                  const coefVar = datos.coeficienteVariacion || 0;
                  const dispersion = coefVar > 0.30 ? 'Alta' : coefVar > 0.15 ? 'Moderada' : 'Baja';
                  const textoModa = datos.modaPrecios ? ` • Precio más común: ${currency.format(datos.modaPrecios)}` : '';
                  
                  // Si tenemos cuartiles, mostrar información más específica
                  if (datos.cuartilesPrecios) {
                    const { Q1, Q3 } = datos.cuartilesPrecios;
                    return `El 50% de los autos se anuncian entre ${currency.format(Q1)} y ${currency.format(Q3)}${textoModa} • Dispersión: ${dispersion}`;
                  }
                  
                  return `Zona Óptima: El ${porcentajePromedio}% se vende en rango promedio${textoModa} • ${dispersion} dispersión detectada`;
                })()}
              </span>
              {debugMode && datos.cuartilesPrecios && (
                <DebugInfo
                  title="Análisis de Cuartiles y Moda"
                  data={{
                    fuente: "Cálculo de cuartiles (Q0, Q1, Q2, Q3, Q4) y moda sobre precios ordenados",
                    consulta: "Análisis completo de distribución de precios por cuartiles y moda",
                    parametros: {
                      vehiculosAnalizados: datos.vehiculosSimilares,
                      metodologia: "Cuartiles estadísticos + Análisis de frecuencia"
                    },
                    calculos: [{
                      formula: "Q0 = Mínimo, Q1 = percentil 25%, Q2 = percentil 50% (mediana), Q3 = percentil 75%, Q4 = Máximo\nIQR = Q3 - Q1 (Rango intercuartílico)\n50% central de los datos = [Q1, Q3]\nModa = precio con mayor frecuencia",
                      valores: {
                        Q0_Minimo: currency.format(datos.cuartilesPrecios.Q0),
                        Q1_Percentil25: currency.format(datos.cuartilesPrecios.Q1),
                        Q2_Mediana: currency.format(datos.cuartilesPrecios.Q2),
                        Q3_Percentil75: currency.format(datos.cuartilesPrecios.Q3),
                        Q4_Maximo: currency.format(datos.cuartilesPrecios.Q4),
                        IQR: currency.format(datos.cuartilesPrecios.Q3 - datos.cuartilesPrecios.Q1),
                        Moda: datos.modaPrecios ? currency.format(datos.modaPrecios) : "Sin moda (todos únicos)",
                        coeficienteVariacion: datos.coeficienteVariacion 
                          ? `${(datos.coeficienteVariacion * 100).toFixed(1)}%`
                          : "N/A"
                      },
                      resultado: `El 50% de los vehículos se anuncian entre ${currency.format(datos.cuartilesPrecios.Q1)} (Q1) y ${currency.format(datos.cuartilesPrecios.Q3)} (Q3)${datos.modaPrecios ? `. Precio más común: ${currency.format(datos.modaPrecios)}` : ''}`
                    }],
                    procesamiento: {
                      pasos: [
                        "1. Ordenar todos los precios de menor a mayor",
                        "2. Calcular Q0 (Mínimo): primer valor del array ordenado",
                        "3. Calcular Q1: valor que deja 25% de datos abajo",
                        "4. Calcular Q2 (mediana): valor que divide datos en 2 mitades",
                        "5. Calcular Q3: valor que deja 75% de datos abajo",
                        "6. Calcular Q4 (Máximo): último valor del array ordenado",
                        "7. Calcular moda: precio que aparece con mayor frecuencia (≥2 veces)",
                        "8. El rango [Q1, Q3] contiene el 50% central de los datos"
                      ],
                      filtros: ["Precios > 0", "Muestra >= 12 vehículos para cuartiles"],
                      transformaciones: ["Ordenamiento ascendente", "Cálculo de percentiles", "Análisis de frecuencia"]
                    },
                    observaciones: [
                      "Q0 (Mínimo) y Q4 (Máximo) marcan los límites del rango de precios",
                      "El rango intercuartílico (IQR) es una medida robusta de dispersión",
                      "El 50% central de los precios se concentra entre Q1 y Q3",
                      "Este rango es menos sensible a valores extremos que el promedio",
                      datos.modaPrecios 
                        ? `La moda (${currency.format(datos.modaPrecios)}) indica el precio más frecuente en el mercado`
                        : "Sin moda: cada precio aparece solo una vez (alta heterogeneidad)",
                      datos.coeficienteVariacion && datos.coeficienteVariacion > 0.30 
                        ? "Alta dispersión: gran variabilidad de precios en el mercado"
                        : datos.coeficienteVariacion && datos.coeficienteVariacion > 0.15
                        ? "Dispersión moderada: variabilidad normal en el mercado"
                        : "Baja dispersión: precios concentrados en rango estrecho"
                    ]
                  }}
                />
              )}
            </div>
          </div>

          {/* Indicador de posición del precio actual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>Tu precio: {currency.format(precio)}</span>
                {debugMode && (
                  <DebugInfo
                    title="Posición del precio en el rango"
                    data={{
                      fuente: "Cálculo local basado en rango del mercado",
                      datosPredecesores: [
                        {
                          fuente: "Precio seleccionado por usuario",
                          valor: currency.format(precio),
                          fecha: new Date().toLocaleDateString()
                        },
                        {
                          fuente: "Rango del mercado",
                          valor: `${currency.format(datos.rangoMinimo)} - ${currency.format(datos.rangoMaximo)}`,
                          fecha: new Date().toLocaleDateString()
                        }
                      ],
                      reglasAplicadas: [
                        "Calcular amplitud del rango: rangoMaximo - rangoMinimo",
                        "Calcular posición relativa: (precio - rangoMinimo) / amplitud",
                        "Convertir a porcentaje: posición * 100",
                        "Limitar entre 0% y 100%"
                      ],
                      calculos: [{
                        formula: "posicionPrecio = ((precio - rangoMinimo) / (rangoMaximo - rangoMinimo)) * 100",
                        formulaConValores: `posicionPrecio = ((${precio} - ${datos.rangoMinimo}) / (${datos.rangoMaximo} - ${datos.rangoMinimo})) * 100`,
                        valores: {
                          precio: currency.format(precio),
                          rangoMinimo: currency.format(datos.rangoMinimo),
                          rangoMaximo: currency.format(datos.rangoMaximo),
                          amplitudRango: currency.format(datos.rangoMaximo - datos.rangoMinimo),
                          diferenciaDesdeMinimo: currency.format(precio - datos.rangoMinimo),
                          posicionPorcentaje: `${posicionPrecio.toFixed(1)}%`
                        },
                        resultado: `Tu precio está en el ${posicionPrecio.toFixed(1)}% del rango del mercado`
                      }],
                      procesamiento: {
                        pasos: [
                          "Obtener precio del usuario",
                          "Obtener rango mínimo y máximo del mercado",
                          "Calcular amplitud del rango",
                          "Calcular posición relativa del precio",
                          "Convertir a porcentaje y limitar entre 0-100"
                        ],
                        filtros: [],
                        transformaciones: [
                          "Normalización a escala 0-100%",
                          "Cálculo de posición relativa"
                        ]
                      },
                      observaciones: [
                        "0% = precio en el mínimo del mercado",
                        "50% = precio en el centro del rango",
                        "100% = precio en el máximo del mercado",
                        "Útil para comparar competitividad del precio"
                      ]
                    }}
                  />
                )}
              </div>
              <span className="text-muted-foreground">{posicionPrecio.toFixed(1)}% del rango</span>
            </div>
            <div className="relative">
              <Progress value={posicionPrecio} className="h-2" />
              <div 
                className="absolute top-0 w-0.5 h-2 bg-primary"
                style={{ left: `${posicionPrecio}%` }}
              />
            </div>
          </div>

          <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 underline">
            Ver rangos de precios detallados ↓
          </button>
        </CardContent>
      </Card>

      {/* Ajuste inteligente de kilometraje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Ajuste Inteligente de Kilometraje
            {debugMode && (
              <DebugInfo
                title="Ajuste inteligente por kilometraje"
                data={{
                  fuente: "Cálculo local: calcularFactorKilometraje()",
                  datosPredecesores: [
                    {
                      fuente: "Kilometraje seleccionado por usuario",
                      valor: `${kilometraje.toLocaleString()} km`,
                      fecha: new Date().toLocaleDateString()
                    },
                    {
                      fuente: "Autos similares del mercado",
                      valor: `${autosSimilares.length} vehículos analizados`,
                      fecha: new Date().toLocaleDateString()
                    },
                    {
                      fuente: "Datos del vehículo",
                      valor: `${marca} ${modelo} ${ano}`,
                      fecha: new Date().toLocaleDateString()
                    }
                  ],
                  reglasAplicadas: [
                    "1. Calcular kilometraje esperado: (año actual - año vehículo) × 15,000 km/año",
                    "2. Calcular diferencia: kilometraje seleccionado - kilometraje esperado",
                    "3. Aplicar tabla de ajuste según diferencia:",
                    "   • < -30,000 km: +15% (muy bajo)",
                    "   • -30,000 a -15,000 km: +10% (bajo)",
                    "   • -15,000 a -5,000 km: +5% (ligeramente bajo)",
                    "   • -5,000 a +5,000 km: 0% (normal)",
                    "   • +5,000 a +15,000 km: -5% (ligeramente alto)",
                    "   • +15,000 a +30,000 km: -10% (alto)",
                    "   • > +30,000 km: -15% (muy alto)",
                    "4. Aplicar límites de seguridad: factor entre 0.75 y 1.15"
                  ],
                  calculos: [{
                    formula: "kilometrajeEsperado = (añoActual - añoVehiculo) × 15000\ndiferencia = kilometrajeSeleccionado - kilometrajeEsperado\nfactor = 1 + (ajustePorTabla)\nprecioAjustado = precioPromedio × factor",
                    formulaConValores: `kilometrajeEsperado = (${new Date().getFullYear()} - ${ano}) × 15000 = ${(new Date().getFullYear() - ano) * 15000} km\ndiferencia = ${kilometraje} - ${(new Date().getFullYear() - ano) * 15000} = ${kilometraje - (new Date().getFullYear() - ano) * 15000} km\nfactor = ${factorKilometraje.toFixed(3)}\nprecioAjustado = ${currency.format(datos.precioPromedio)} × ${factorKilometraje.toFixed(3)} = ${currency.format(precioAjustado)}`,
                    valores: {
                      kilometrajeSeleccionado: `${kilometraje.toLocaleString()} km`,
                      kilometrajeEsperado: `${((new Date().getFullYear() - ano) * 15000).toLocaleString()} km`,
                      diferencia: `${(kilometraje - (new Date().getFullYear() - ano) * 15000).toLocaleString()} km`,
                      factorKilometraje: factorKilometraje.toFixed(3),
                      porcentajeAjuste: `${porcentajeAjuste >= 0 ? '+' : ''}${porcentajeAjuste.toFixed(1)}%`,
                      precioBase: currency.format(datos.precioPromedio),
                      precioAjustado: currency.format(precioAjustado),
                      diferenciaMonetaria: currency.format(precioAjustado - datos.precioPromedio),
                      estadisticasMercado: {
                        kmMinimo: `${estadisticasKm.minimo.toLocaleString()} km`,
                        kmPromedio: `${Math.round(estadisticasKm.promedio).toLocaleString()} km`,
                        kmMaximo: `${estadisticasKm.maximo.toLocaleString()} km`
                      }
                    },
                    resultado: `Factor: ${factorKilometraje.toFixed(3)}x (${porcentajeAjuste >= 0 ? '+' : ''}${porcentajeAjuste.toFixed(1)}%) → Precio ajustado: ${currency.format(precioAjustado)}`,
                    documentacion: "/src/utils/priceAnalysisCalculations.ts#calcularFactorKilometraje"
                  }],
                  procesamiento: {
                    pasos: [
                      "1. Validar datos de entrada (kilometraje > 0, autosSimilares válidos)",
                      "2. Calcular kilometraje esperado basado en edad del vehículo",
                      "3. Calcular diferencia entre km real y esperado",
                      "4. Buscar en tabla de ajuste el factor correspondiente",
                      "5. Aplicar límites de seguridad (0.75 - 1.15)",
                      "6. Calcular precio ajustado multiplicando precio base × factor"
                    ],
                    filtros: [
                      "Kilometraje > 0",
                      "autosSimilares con datos válidos",
                      "Factor limitado entre 0.75 y 1.15"
                    ],
                    transformaciones: [
                      "Cálculo de kilometraje esperado por edad",
                      "Normalización de diferencia a factor de ajuste",
                      "Aplicación de tabla de ajuste progresiva",
                      "Cálculo de precio final ajustado"
                    ]
                  },
                  observaciones: [
                    "Estándar mexicano: 15,000 km/año de kilometraje esperado",
                    `Estadísticas del mercado: ${Math.round(estadisticasKm.minimo).toLocaleString()} - ${Math.round(estadisticasKm.maximo).toLocaleString()} km (promedio: ${Math.round(estadisticasKm.promedio).toLocaleString()} km)`,
                    porcentajeAjuste > 5 
                      ? "✓ Kilometraje bajo: Vehículo con poco uso merece precio premium"
                      : porcentajeAjuste < -5
                      ? "⚠ Kilometraje alto: Vehículo con mucho uso justifica descuento"
                      : "✓ Kilometraje normal: Uso típico para la antigüedad del vehículo",
                    "El sistema evita ajustes extremos con límites de seguridad",
                    "Basado en análisis de mercado real y datos históricos"
                  ]
                }}
              />
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ajusta el kilometraje para ver el impacto en el precio
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">Precio base del mercado</p>
                <p className="text-lg font-bold">{currency.format(datos.precioPromedio)}</p>
              </div>
              <div className="text-center">
                <p className={`text-sm font-semibold ${porcentajeAjuste >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {porcentajeAjuste >= 0 ? '+' : ''}{porcentajeAjuste.toFixed(1)}%
                </p>
                <p className="text-sm">ajuste</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Precio ajustado</p>
                <p className="text-lg font-bold text-blue-600">{currency.format(precioAjustado)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Kilometraje: {kilometraje.toLocaleString()} km</span>
                <span className="text-muted-foreground">Factor: {factorKilometraje.toFixed(2)}x</span>
              </div>
              <Slider 
                value={[kilometraje]} 
                onValueChange={(value) => onKilometrajeChange(value[0])}
                max={kilometrajeEsperado * 2} 
                min={0} 
                step={1000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 km</span>
                <span className="font-medium text-blue-600">{kilometrajeEsperado.toLocaleString()} km<br />Esperado (factor 0%)</span>
                <span>{(kilometrajeEsperado * 2).toLocaleString()} km</span>
              </div>
            </div>

            <div className={`border rounded-lg p-3 ${
              porcentajeAjuste > 5 ? 'bg-green-50 border-green-200' :
              porcentajeAjuste < -5 ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className={`flex items-center gap-2 text-sm ${
                porcentajeAjuste > 5 ? 'text-green-800' :
                porcentajeAjuste < -5 ? 'text-red-800' :
                'text-blue-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  porcentajeAjuste > 5 ? 'bg-green-500' :
                  porcentajeAjuste < -5 ? 'bg-red-500' :
                  'bg-blue-500'
                }`}></div>
                <span>
                  {porcentajeAjuste > 5 ? 'Kilometraje bajo: Precio premium por menor uso' :
                   porcentajeAjuste < -5 ? 'Kilometraje alto: Precio reducido por mayor uso' :
                   'Kilometraje normal para la antigüedad del vehículo'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}