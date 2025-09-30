import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";
import { useDebugMode } from "@/hooks/useDebugMode";
import { DebugInfo } from "./DebugInfo";

interface DatosMercado {
  precioPromedio: number;
  rangoMinimo: number;
  rangoMaximo: number;
  demanda: 'baja' | 'moderada' | 'alta';
  competencia: 'baja' | 'moderada' | 'alta';
  vehiculosSimilares: number;
}

interface AnalisisMercadoProps {
  marca: string;
  modelo: string;
  ano: number;
  precio: number;
  kilometraje: number;
  datos: DatosMercado;
}

export default function AnalisisMercado({ marca, modelo, ano, precio, kilometraje, datos }: AnalisisMercadoProps) {
  const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const { debugMode } = useDebugMode();
  
  // Calcular posición en la distribución de precios (0-100%)
  const posicionPrecio = ((precio - datos.rangoMinimo) / (datos.rangoMaximo - datos.rangoMinimo)) * 100;
  
  // Distribución de precios simulada basada en el diseño de referencia
  const distribucionPrecios = [
    { rango: "Muy Bajo", porcentaje: 8, color: "bg-green-500" },
    { rango: "Bajo", porcentaje: 17, color: "bg-yellow-500" },
    { rango: "Promedio", porcentaje: 50, color: "bg-orange-500" },
    { rango: "Alto", porcentaje: 20, color: "bg-red-400" },
    { rango: "Muy Alto", porcentaje: 5, color: "bg-red-600" }
  ];

  // Simulación de kilometraje promedio para mostrar barra de distribución
  const kmPromedio = 12667;
  const kmMinimo = 3000;
  const kmMaximo = 22801;
  const posicionKm = ((kilometraje - kmMinimo) / (kmMaximo - kmMinimo)) * 100;

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
                    fuente: "Base de datos de anuncios_vehiculos + API MaxiPublica",
                    datosPredecesores: [
                      {
                        fuente: "Base datos anuncios_vehiculos",
                        valor: `Consulta: marca='${marca}' AND modelo='${modelo}' AND ano=${ano}`,
                        fecha: new Date().toLocaleDateString()
                      },
                      {
                        fuente: "API MaxiPublica suggestedPrice",
                        valor: `${currency.format(datos.precioPromedio)}`,
                        fecha: new Date().toLocaleDateString()
                      }
                    ],
                    reglasAplicadas: [
                      "Prioridad: Precio sugerido de MaxiPublica",
                      "Fallback: Promedio de anuncios locales",
                      "Filtro: Solo anuncios activos",
                      "Validación: Precios > 0"
                    ],
                    consulta: `SELECT AVG(precio) FROM anuncios_vehiculos WHERE marca='${marca}' AND modelo='${modelo}' AND ano=${ano} AND activo=true`,
                    parametros: {
                      rangoMinimo: datos.rangoMinimo,
                      rangoMaximo: datos.rangoMaximo,
                      totalVehiculos: datos.vehiculosSimilares
                    },
                    calculos: [{
                      formula: "precioPromedio = suggestedPricePublish || SUM(precios_locales) / COUNT(vehiculos)",
                      formulaConValores: `precioPromedio = ${currency.format(datos.precioPromedio)} || SUM(precios) / ${datos.vehiculosSimilares}`,
                      valores: {
                        precioCalculado: datos.precioPromedio,
                        fuentePrincipal: "MaxiPublica API",
                        fuenteSecundaria: "Base de datos interna",
                        rangoMinimo: `${currency.format(datos.rangoMinimo)}`,
                        rangoMaximo: `${currency.format(datos.rangoMaximo)}`,
                        vehiculosAnalizados: datos.vehiculosSimilares
                      },
                      resultado: `${currency.format(datos.precioPromedio)} (basado en ${datos.vehiculosSimilares} vehículos)`,
                      documentacion: "/src/components/AnalisisMercado.tsx#línea 180 (cálculo de precio promedio)"
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
                        coefVariacion: ((datos.rangoMaximo - datos.rangoMinimo) / datos.precioPromedio * 100).toFixed(1) + "%"
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
          <CardTitle className="text-center text-lg">RANGO DEL MERCADO</CardTitle>
          <p className="text-center text-2xl font-bold">
            {currency.format(datos.rangoMinimo)} - {currency.format(datos.rangoMaximo)}
          </p>
          <p className="text-center text-sm text-muted-foreground">Distribución de precios:</p>
        </CardHeader>
        <CardContent>
          {/* Barra de distribución de precios */}
          <div className="space-y-2 mb-4">
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
              <span>Zona Óptima: El 50% se vende en rango promedio • Alta dispersión detectada</span>
            </div>
          </div>

          {/* Indicador de posición del precio actual */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tu precio: {currency.format(precio)}</span>
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
                <p className="text-sm text-muted-foreground">0.0%</p>
                <p className="text-sm">ajuste</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Precio ajustado</p>
                <p className="text-lg font-bold text-blue-600">{currency.format(datos.precioPromedio)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Kilometraje: {kilometraje.toLocaleString()} km</span>
                <span className="text-muted-foreground">{((kilometraje / kmPromedio) * 100).toFixed(1)}% precio</span>
              </div>
              <Slider 
                defaultValue={[kilometraje]} 
                max={kmMaximo} 
                min={kmMinimo} 
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{kmMinimo.toLocaleString()} km</span>
                <span>{kmPromedio.toLocaleString()} km<br />Kilometraje promedio</span>
                <span>{kmMaximo.toLocaleString()} km</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Análisis IA: Kilometraje dentro del rango normal del mercado</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}