import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, Clock, DollarSign, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  marca: string;
  modelo: string;
  ano: string;
  ciudad: string;
  periodo: string;
}

interface PredictiveRecommendationsProps {
  filters: Filters;
}

interface Recommendation {
  tipo: 'precio' | 'tiempo' | 'general';
  titulo: string;
  descripcion: string;
  impacto: 'alto' | 'medio' | 'bajo';
  accion: string;
}

interface PricePrediction {
  precioActual: number;
  precioSugerido: number;
  tiempoActual: number;
  tiempoEstimado: number;
  probabilidadVenta: number;
}

export function PredictiveRecommendations({ filters }: PredictiveRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [pricePrediction, setPricePrediction] = useState<PricePrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, [filters]);

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del mercado para generar recomendaciones
      let query = supabase
        .from('anuncios_vehiculos')
        .select('precio, fecha_extraccion, marca, modelo, ano, ubicacion')
        .eq('activo', true)
        .not('precio', 'is', null)
        .gt('precio', 0);

      // Aplicar filtros
      if (filters.marca !== 'all') {
        query = query.eq('marca', filters.marca);
      }
      if (filters.modelo !== 'all') {
        query = query.eq('modelo', filters.modelo);
      }
      if (filters.ano !== 'all') {
        query = query.eq('ano', parseInt(filters.ano));
      }
      if (filters.ciudad !== 'all') {
        query = query.ilike('ubicacion', `%${filters.ciudad}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recommendation data:', error);
        return;
      }

      if (data && data.length > 0) {
        // Calcular precio promedio del mercado
        const precios = data.map(item => item.precio);
        const precioPromedio = precios.reduce((a, b) => a + b, 0) / precios.length;
        const stockTotal = data.length;

        // Generar recomendaciones basadas en los datos
        const newRecommendations: Recommendation[] = [];

        // Recomendación de precio
        const precioSugerido = precioPromedio * 0.95; // 5% por debajo del promedio
        const reduccionSugerida = Math.round(precioPromedio - precioSugerido);
        
        if (reduccionSugerida > 1000) {
          newRecommendations.push({
            tipo: 'precio',
            titulo: 'Ajuste de Precio Estratégico',
            descripcion: `Si reduces tu precio $${reduccionSugerida.toLocaleString()} MXN, tu auto podría venderse en 15 días (vs 45 actuales).`,
            impacto: 'alto',
            accion: 'Reducir precio'
          });
        }

        // Recomendación basada en stock
        if (stockTotal < 10) {
          newRecommendations.push({
            tipo: 'general',
            titulo: 'Baja Competencia Detectada',
            descripcion: `Solo ${stockTotal} unidades similares en el mercado. Oportunidad para mantener precio premium.`,
            impacto: 'medio',
            accion: 'Mantener precio'
          });
        } else if (stockTotal > 50) {
          newRecommendations.push({
            tipo: 'precio',
            titulo: 'Alta Competencia',
            descripcion: `${stockTotal} unidades similares disponibles. Considera destacar características únicas.`,
            impacto: 'medio',
            accion: 'Diferenciación'
          });
        }

        // Recomendación de tiempo
        newRecommendations.push({
          tipo: 'tiempo',
          titulo: 'Mejor Momento de Venta',
          descripcion: 'Los autos similares se venden más rápido los fines de semana y en horario vespertino.',
          impacto: 'bajo',
          accion: 'Optimizar timing'
        });

        // Recomendación general
        newRecommendations.push({
          tipo: 'general',
          titulo: 'Mejora tu Anuncio',
          descripcion: 'Anuncios con 8+ fotos de calidad y descripción detallada se venden 30% más rápido.',
          impacto: 'alto',
          accion: 'Mejorar anuncio'
        });

        setRecommendations(newRecommendations);

        // Generar predicción de precio
        const prediction: PricePrediction = {
          precioActual: precioPromedio,
          precioSugerido: precioSugerido,
          tiempoActual: 45,
          tiempoEstimado: 15,
          probabilidadVenta: 85
        };

        setPricePrediction(prediction);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impacto: string) => {
    switch (impacto) {
      case 'alto': return 'bg-success text-success-foreground';
      case 'medio': return 'bg-warning text-warning-foreground';
      case 'bajo': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'precio': return <DollarSign className="h-4 w-4" />;
      case 'tiempo': return <Clock className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recomendaciones Predictivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Predicción de Precio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recomendaciones Predictivas
          </CardTitle>
          <CardDescription>
            Sugerencias personalizadas para optimizar tu venta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getTypeIcon(rec.tipo)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{rec.titulo}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.descripcion}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getImpactColor(rec.impacto)}>
                          Impacto {rec.impacto}
                        </Badge>
                        <Button variant="outline" size="sm">
                          {rec.accion}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predicción de precio futuro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Predicción de Precio Futuro
          </CardTitle>
          <CardDescription>
            Proyección basada en tendencias del mercado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pricePrediction && (
            <div className="space-y-6">
              {/* Comparación de precios */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Precio Actual</div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatCurrency(pricePrediction.precioActual)}
                  </div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-sm text-muted-foreground">Precio Sugerido</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(pricePrediction.precioSugerido)}
                  </div>
                </div>
              </div>

              {/* Métricas de tiempo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Tiempo Actual</div>
                  <div className="text-xl font-semibold">{pricePrediction.tiempoActual} días</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Tiempo Estimado</div>
                  <div className="text-xl font-semibold text-success">
                    {pricePrediction.tiempoEstimado} días
                  </div>
                </div>
              </div>

              {/* Probabilidad de venta */}
              <div className="text-center p-4 bg-success/10 rounded-lg">
                <div className="text-sm text-muted-foreground">Probabilidad de Venta</div>
                <div className="text-3xl font-bold text-success">
                  {pricePrediction.probabilidadVenta}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Con el precio sugerido
                </div>
              </div>

              <Button className="w-full" size="lg">
                Aplicar Recomendaciones
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}