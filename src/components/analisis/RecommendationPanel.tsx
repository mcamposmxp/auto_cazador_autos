import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ShoppingCart, Calendar } from "@/utils/iconImports";
import { formatPrice } from "@/utils/formatters";

interface RecommendationPanelProps {
  tiempoIA: any;
  cargandoIA: boolean;
  datos: {
    marca: string;
    modelo: string;
    ano: number;
    version: string;
  };
  precioSeleccionado: number;
  onCalcularTiempoIA: () => void;
}

export const RecommendationPanel = memo(function RecommendationPanel({
  tiempoIA,
  cargandoIA,
  datos,
  precioSeleccionado,
  onCalcularTiempoIA
}: RecommendationPanelProps) {
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Predicción de venta con IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!tiempoIA ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Obtén una predicción precisa del tiempo de venta usando inteligencia artificial
            </p>
            <Button 
              onClick={onCalcularTiempoIA}
              disabled={cargandoIA}
              className="w-full"
            >
              {cargandoIA ? "Calculando..." : "Calcular tiempo de venta con IA"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {tiempoIA.tiempo_estimado_dias} días
              </div>
              <p className="text-sm text-muted-foreground">
                Tiempo estimado de venta
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Fecha estimada</span>
                </div>
                <span className="text-sm text-blue-600 font-semibold">
                  {tiempoIA.fecha_venta_estimada}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Precio sugerido</span>
                </div>
                <span className="text-sm text-green-600 font-semibold">
                  {formatPrice(precioSeleccionado)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Factores considerados:</h4>
              <div className="grid grid-cols-2 gap-2">
                {tiempoIA.factores?.map((factor: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>

            {tiempoIA.recomendaciones && tiempoIA.recomendaciones.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recomendaciones:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {tiempoIA.recomendaciones.map((rec: string, index: number) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});