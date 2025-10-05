import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, BarChart3, AlertTriangle, Flame, Shield } from "@/utils/iconImports";
import { DebugInfo } from "@/components/DebugInfo";

interface MarketStatisticsProps {
  estadisticas: {
    totalAnuncios: number;
    precioPromedio: number;
    precioPromedioBruto?: number;
    precioMinimo: number;
    precioMaximo: number;
    precioRecomendado: number;
  };
  demandaAuto: {
    nivel: string;
    descripcion: string;
    icono: any;
    color: string;
    bgColor: string;
    borderColor: string;
  };
  competenciaMercado: {
    nivel: string;
    descripcion: string;
    icono: any;
    color: string;
    bgColor: string;
    borderColor: string;
    cantidad: number;
    intensidad: string;
  };
  formatearPrecio: (precio: number) => string;
  versionId?: string;
  estadoSeleccionado?: string;
  tipoVendedorSeleccionado?: string;
}

export const MarketStatistics = memo(function MarketStatistics({
  estadisticas,
  demandaAuto,
  competenciaMercado,
  formatearPrecio,
  versionId,
  estadoSeleccionado,
  tipoVendedorSeleccionado
}: MarketStatisticsProps) {
  
  // Map icon strings to actual icon components
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return Flame;
      case 'TrendingUp': return TrendingUp;
      case 'TrendingDown': return TrendingDown;
      case 'BarChart3': return BarChart3;
      case 'AlertTriangle': return AlertTriangle;
      case 'Shield': return Shield;
      default: return BarChart3;
    }
  };
  
  const DemandIcon = getIconComponent(demandaAuto.icono);
  const CompetitionIcon = getIconComponent(competenciaMercado.icono);

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas del mercado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {estadisticas.totalAnuncios}
              </div>
              <div className="text-sm text-muted-foreground">Anuncios similares</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="text-lg font-semibold">
                  {formatearPrecio(estadisticas.precioPromedio)}
                </div>
                {versionId && (
                  <DebugInfo
                    title="Precio promedio calculado"
                    data={{
                      fuente: "API MaxiPublica - maxi_similar_cars",
                      consulta: `supabase.functions.invoke('maxi_similar_cars', { body: { versionId: "${versionId}", location: "${estadoSeleccionado === 'ALL' || !estadoSeleccionado ? '' : estadoSeleccionado}" } })`,
                      parametros: {
                        "1️⃣ PARÁMETROS RECIBIDOS EN COMPONENTE": "---",
                        versionId: versionId,
                        estadoSeleccionado: estadoSeleccionado || 'No especificado',
                        tipoVendedorSeleccionado: tipoVendedorSeleccionado || 'No especificado',
                        "": "",
                        "2️⃣ LLAMADA A EDGE FUNCTION": "---",
                        "Función": "maxi_similar_cars",
                        "Método": "supabase.functions.invoke()",
                        "body.versionId": versionId,
                        "body.location": estadoSeleccionado === 'ALL' || !estadoSeleccionado ? "'' (vacío)" : estadoSeleccionado,
                        " ": "",
                        "3️⃣ LLAMADA A API MAXIPUBLICA": "---",
                        "Endpoint": "https://api.maxipublica.com/v3/ads_sites/210000",
                        "Método HTTP": "GET",
                        "Headers.Authorization": "Bearer <token>",
                        "  ": "",
                        "4️⃣ QUERY STRING ENVIADO A MAXIPUBLICA": "---",
                        "categoryId": versionId,
                        "locationId": estadoSeleccionado === 'ALL' || !estadoSeleccionado ? "'' (búsqueda nacional)" : estadoSeleccionado,
                        "transmission": "TRANS-AUTOMATICA",
                        "kilometers": "'' (sin filtro)",
                        "origin": "web",
                        "   ": "",
                        "URL COMPLETA": estadoSeleccionado === 'ALL' || !estadoSeleccionado 
                          ? `https://api.maxipublica.com/v3/ads_sites/210000?categoryId=${versionId}&locationId=&transmission=TRANS-AUTOMATICA&kilometers=&origin=web`
                          : `https://api.maxipublica.com/v3/ads_sites/210000?categoryId=${versionId}&locationId=${estadoSeleccionado}&transmission=TRANS-AUTOMATICA&kilometers=&origin=web`
                      },
                      calculos: [{
                        formula: "precioPromedio = SUM(precios_validos) / COUNT(precios_validos)",
                        valores: {
                          total_vehiculos_similares: estadisticas.totalAnuncios,
                          precio_promedio_bruto: estadisticas.precioPromedioBruto || estadisticas.precioPromedio,
                          precio_promedio_redondeado: estadisticas.precioPromedio,
                          redondeo: "Centenas (Math.round(precio / 100) * 100)"
                        },
                        resultado: `${formatearPrecio(estadisticas.precioPromedio)} (de ${estadisticas.totalAnuncios} vehículos)`
                      }],
                      procesamiento: {
                        pasos: [
                          "1. Llamada a Edge Function 'maxi_similar_cars'",
                          "2. Edge Function llama a API MaxiPublica con parámetros transformados",
                          "3. Filtrado de vehículos con precio > 0",
                          "4. Cálculo del promedio aritmético",
                          "5. Redondeo a centenas"
                        ],
                        filtros: [
                          `Estado: ${estadoSeleccionado === 'ALL' ? 'Todo el país (location vacío)' : estadoSeleccionado || 'Todo el país (no especificado)'}`,
                          `Tipo vendedor: ${tipoVendedorSeleccionado || 'Todos (no se filtra por tipo)'}`,
                          "Solo precios válidos (> 0)"
                        ],
                        transformaciones: [
                          "Extracción de array de precios desde similarsCars",
                          "Redondeo a centenas para presentación",
                          "Cálculo de estadísticas de mercado"
                        ]
                      },
                      observaciones: [
                        "El parámetro 'location' vacío significa búsqueda a nivel nacional",
                        "El valor 'ALL' del frontend se convierte en '' (vacío) para la API",
                        "El tipo de vendedor actualmente NO se envía a la API (pendiente implementar)"
                      ]
                    }}
                  />
                )}
              </div>
              <div className="text-sm text-muted-foreground">Precio promedio</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {formatearPrecio(estadisticas.precioMinimo)}
              </div>
              <div className="text-sm text-muted-foreground">Más económico</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">
                {formatearPrecio(estadisticas.precioMaximo)}
              </div>
              <div className="text-sm text-muted-foreground">Más costoso</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demanda del vehículo */}
      <Card className={`border ${demandaAuto.borderColor} ${demandaAuto.bgColor}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${demandaAuto.bgColor}`}>
                <DemandIcon className={`h-5 w-5 ${demandaAuto.color}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${demandaAuto.color}`}>
                  {demandaAuto.nivel}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {demandaAuto.descripcion}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={demandaAuto.color}>
              Demanda
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Competencia del mercado */}
      <Card className={`border ${competenciaMercado.borderColor} ${competenciaMercado.bgColor}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${competenciaMercado.bgColor}`}>
                <CompetitionIcon className={`h-5 w-5 ${competenciaMercado.color}`} />
              </div>
              <div>
                <h3 className={`font-semibold ${competenciaMercado.color}`}>
                  {competenciaMercado.nivel}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {competenciaMercado.descripcion}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {competenciaMercado.cantidad} anuncios similares • Competencia {competenciaMercado.intensidad}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={competenciaMercado.color}>
              Competencia
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});