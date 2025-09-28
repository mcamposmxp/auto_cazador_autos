import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, BarChart3, Target } from "lucide-react";

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
  const currency = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
  
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
            </div>
            <Badge variant={datos.demanda === 'alta' ? 'default' : datos.demanda === 'baja' ? 'destructive' : 'secondary'}>
              {datos.demanda === 'alta' ? 'Alta demanda' : datos.demanda === 'baja' ? 'Baja demanda' : 'Demanda moderada'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Buena demanda del mercado
            </p>
            <p className="text-xs text-muted-foreground">
              {ano} • {marca} {modelo} {ano}hp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 text-center">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">PRECIO PROMEDIO DE MERCADO</h3>
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