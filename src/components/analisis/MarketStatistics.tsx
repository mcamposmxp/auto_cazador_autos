import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, BarChart3, AlertTriangle, Flame, Shield } from "@/utils/iconImports";

interface MarketStatisticsProps {
  estadisticas: {
    totalAnuncios: number;
    precioPromedio: number;
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
}

export const MarketStatistics = memo(function MarketStatistics({
  estadisticas,
  demandaAuto,
  competenciaMercado,
  formatearPrecio
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
              <div className="text-lg font-semibold">
                {formatearPrecio(estadisticas.precioPromedio)}
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