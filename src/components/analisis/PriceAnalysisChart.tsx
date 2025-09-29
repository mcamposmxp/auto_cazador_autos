import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from "@/utils/iconImports";

interface PriceAnalysisChartProps {
  precioSeleccionado: number;
  estadisticas: {
    precioRecomendado: number;
    precioPromedio: number;
    precioMinimo: number;
    precioMaximo: number;
  };
  precioAjustado: number;
  porcentajeAjuste: number;
  sugerencia: {
    tipo: string;
    porcentaje: number;
    beneficio: string;
    color: string;
  };
  distribucionPrecios: Array<{
    inicio: number;
    fin: number;
    cantidad: number;
    porcentaje: number;
  }>;
  formatearPrecio: (precio: number) => string;
}

export const PriceAnalysisChart = memo(function PriceAnalysisChart({
  precioSeleccionado,
  estadisticas,
  precioAjustado,
  porcentajeAjuste,
  sugerencia,
  distribucionPrecios,
  formatearPrecio
}: PriceAnalysisChartProps) {

  const calcularPrecioVentaEstimado = () => {
    // Validar que hay un precio recomendado válido
    if (!estadisticas.precioRecomendado || estadisticas.precioRecomendado <= 0) {
      return { minimo: 0, maximo: 0 };
    }
    
    const minimo = Math.round(estadisticas.precioRecomendado * 0.85);
    const maximo = Math.round(estadisticas.precioRecomendado * 0.95);
    return { minimo, maximo };
  };

  const precioVenta = calcularPrecioVentaEstimado();

  return (
    <div className="space-y-6">
      {/* Precio recomendado principal */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Precio recomendado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">
                {formatearPrecio(precioSeleccionado)}
              </div>
              {porcentajeAjuste !== 0 && (
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={porcentajeAjuste > 0 ? "default" : "secondary"}>
                    {porcentajeAjuste > 0 ? "+" : ""}{Math.round(porcentajeAjuste)}% por kilometraje
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="font-semibold text-green-700">Venta rápida</div>
                <div className="text-green-600">{formatearPrecio(precioVenta.minimo)}</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-semibold text-blue-700">Venta óptima</div>
                <div className="text-blue-600">{formatearPrecio(precioVenta.maximo)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sugerencia de ajuste */}
      {sugerencia.tipo !== "mantener" && (
        <Card className={`border border-${sugerencia.color}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {sugerencia.tipo === "reducir" ? (
                <TrendingDown className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingUp className="h-5 w-5 text-green-500" />
              )}
              <div>
                <h4 className="font-semibold">
                  Sugerencia: {sugerencia.tipo} precio {sugerencia.porcentaje}%
                </h4>
                <p className="text-sm text-muted-foreground">
                  Para {sugerencia.beneficio}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribución de precios */}
      {distribucionPrecios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribución de precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribucionPrecios.map((rango, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      {formatearPrecio(rango.inicio)} - {formatearPrecio(rango.fin)}
                    </span>
                    <span className="font-semibold">
                      {rango.cantidad} autos ({Math.round(rango.porcentaje)}%)
                    </span>
                  </div>
                  <Progress value={rango.porcentaje} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});