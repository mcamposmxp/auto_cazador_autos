import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  marca: string;
  modelo: string;
  ano: string;
  ciudad: string;
  periodo: string;
}

interface SalesPatternsProps {
  filters: Filters;
}

interface TopModel {
  modelo: string;
  marca: string;
  cantidad: number;
  tiempoPromedio: number;
  velocidad: 'Rápido' | 'Medio' | 'Lento';
}

interface ChartData {
  modelo: string;
  cantidad: number;
}

export function SalesPatterns({ filters }: SalesPatternsProps) {
  const [topModels, setTopModels] = useState<TopModel[]>([]);
  const [fastestModels, setFastestModels] = useState<TopModel[]>([]);
  const [slowestModels, setSlowestModels] = useState<TopModel[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    fetchSalesPatterns();
  }, [filters]);

  const fetchSalesPatterns = async () => {
    try {
      setLoading(true);
      
      // Construir query base para datos históricos de ventas
      let query = supabase
        .from('historico_ventas')
        .select('marca, modelo, ano, dias_en_mercado, precio_inicial, precio_venta, ubicacion, tipo_vendedor');

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

      // Aplicar filtro de período si es necesario - temporarily disabled to show all historical data
      // if (filters.periodo !== 'all') {
      //   const now = new Date();
      //   let startDate = new Date();
        
      //   switch (filters.periodo) {
      //     case '1m':
      //       startDate.setMonth(now.getMonth() - 1);
      //       break;
      //     case '3m':
      //       startDate.setMonth(now.getMonth() - 3);
      //       break;
      //     case '6m':
      //       startDate.setMonth(now.getMonth() - 6);
      //       break;
      //     case '1y':
      //       startDate.setFullYear(now.getFullYear() - 1);
      //       break;
      //   }
        
      //   query = query.gte('fecha_venta', startDate.toISOString());
      // }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching sales patterns:', error);
        return;
      }

      if (data && data.length > 0) {
        // Agrupar por modelo y marca
        const modelGroups = data.reduce((acc: any, item) => {
          const key = `${item.marca}-${item.modelo}`;
          if (!acc[key]) {
            acc[key] = {
              marca: item.marca,
              modelo: item.modelo,
              ventas: []
            };
          }
          acc[key].ventas.push(item);
          return acc;
        }, {});

        // Calcular estadísticas por modelo usando datos reales
        const modelsWithStats: TopModel[] = Object.values(modelGroups).map((group: any) => {
          const cantidad = group.ventas.length;
          // Calcular tiempo promedio real de venta
          const tiempoPromedio = Math.round(
            group.ventas.reduce((sum: number, venta: any) => sum + venta.dias_en_mercado, 0) / cantidad
          );
          
          let velocidad: 'Rápido' | 'Medio' | 'Lento' = 'Medio';
          if (tiempoPromedio < 30) velocidad = 'Rápido';
          else if (tiempoPromedio > 60) velocidad = 'Lento';

          return {
            marca: group.marca,
            modelo: group.modelo,
            cantidad,
            tiempoPromedio,
            velocidad
          };
        });

        // Ordenar por cantidad de ventas para tabla general (copias para no mutar el array original)
        const sortedByQuantity = [...modelsWithStats].sort((a, b) => b.cantidad - a.cantidad);
        
        // Ordenar por tiempo de venta con copias
        const sortedByTimeAsc = [...modelsWithStats].sort((a, b) => a.tiempoPromedio - b.tiempoPromedio);
        const sortedByTimeDesc = [...modelsWithStats].sort((a, b) => b.tiempoPromedio - a.tiempoPromedio);
        
        // Top 10 para la tabla general
        setTopModels(sortedByQuantity.slice(0, 10));
        
        // Top 10 más rápidos y más lentos sin duplicar modelos
        const fastestTop10 = sortedByTimeAsc.slice(0, 10);
        const fastestKeys = new Set(fastestTop10.map(m => `${m.marca}-${m.modelo}`));
        const slowestTop10 = sortedByTimeDesc.filter(m => !fastestKeys.has(`${m.marca}-${m.modelo}`)).slice(0, 10);
        setFastestModels(fastestTop10);
        setSlowestModels(slowestTop10);
        
        // Top 5 para el gráfico
        const top5ForChart = sortedByQuantity.slice(0, 5).map(model => ({
          modelo: `${model.marca} ${model.modelo}`,
          cantidad: model.cantidad
        }));
        setChartData(top5ForChart);

        // Generar insights basados en datos reales
        const newInsights = [];
        
        if (fastestTop10.length > 0) {
          const fastest = fastestTop10[0];
          newInsights.push(`${fastest.marca} ${fastest.modelo} se vende más rápido (${fastest.tiempoPromedio} días promedio)`);
        }
        
        if (slowestTop10.length > 0) {
          const slowest = slowestTop10[0];
          newInsights.push(`${slowest.marca} ${slowest.modelo} toma más tiempo en venderse (${slowest.tiempoPromedio} días promedio)`);
        }

        // Analizar diferencias entre profesionales y particulares
        const ventasProfesionales = data.filter(v => v.tipo_vendedor === 'profesional');
        const ventasParticulares = data.filter(v => v.tipo_vendedor === 'particular');
        
        if (ventasProfesionales.length > 0 && ventasParticulares.length > 0) {
          const promedioProfesionales = Math.round(
            ventasProfesionales.reduce((sum, v) => sum + v.dias_en_mercado, 0) / ventasProfesionales.length
          );
          const promedioParticulares = Math.round(
            ventasParticulares.reduce((sum, v) => sum + v.dias_en_mercado, 0) / ventasParticulares.length
          );
          
          if (promedioProfesionales < promedioParticulares) {
            newInsights.push(`Profesionales venden ${promedioParticulares - promedioProfesionales} días más rápido que particulares`);
          }
        }

        setInsights(newInsights);
      } else {
        // Si no hay datos, mostrar mensaje informativo
        setTopModels([]);
        setFastestModels([]);
        setSlowestModels([]);
        setChartData([]);
        setInsights(['No hay suficientes datos históricos para los filtros seleccionados']);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVelocityColor = (velocidad: string) => {
    switch (velocidad) {
      case 'Rápido': return 'bg-success text-success-foreground';
      case 'Lento': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            Anuncios: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Patrones de Venta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Modelos con Más Oferta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Tabla de modelos con más y menos oferta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 10 Modelos por Cantidad de Oferta
            </CardTitle>
            <CardDescription>Modelos con mayor y menor cantidad de anuncios en el mercado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Más oferta */}
              <div>
                <h4 className="font-semibold text-primary mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Mayor Oferta (Top 10)
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posición</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead className="text-center">Anuncios</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topModels.slice(0, 10).map((model, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-primary">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {model.marca} {model.modelo}
                        </TableCell>
                        <TableCell className="text-center font-bold text-primary">
                          {model.cantidad}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Menos oferta */}
              <div>
                <h4 className="font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 rotate-180" />
                  Menor Oferta (Top 10)
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posición</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead className="text-center">Anuncios</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topModels.slice(-10).reverse().map((model, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-muted-foreground">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {model.marca} {model.modelo}
                        </TableCell>
                        <TableCell className="text-center font-bold text-muted-foreground">
                          {model.cantidad}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección combinada: Velocidad de venta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Velocidad de Venta por Modelo
          </CardTitle>
          <CardDescription>Modelos más rápidos y más lentos en venderse</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Más rápidos */}
            <div>
              <h4 className="font-semibold text-success mb-4">⚡ Más Rápidos</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fastestModels.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {model.marca} {model.modelo}
                      </TableCell>
                      <TableCell className="text-center text-success font-medium">
                        {model.tiempoPromedio}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Más lentos */}
            <div>
              <h4 className="font-semibold text-destructive mb-4">🐌 Más Lentos</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slowestModels.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {model.marca} {model.modelo}
                      </TableCell>
                      <TableCell className="text-center text-destructive font-medium">
                        {model.tiempoPromedio}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights automáticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Insights del Mercado
          </CardTitle>
          <CardDescription>Patrones identificados automáticamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <Alert key={index}>
                <Info className="h-4 w-4" />
                <AlertDescription>{insight}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}