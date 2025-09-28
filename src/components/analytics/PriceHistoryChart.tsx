import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  marca: string;
  modelo: string;
  ano: string;
  ciudad: string;
  periodo: string;
}

interface PriceHistoryChartProps {
  filters: Filters;
}

interface ChartData {
  mes: string;
  precio: number;
  fecha: string;
}

export function PriceHistoryChart({ filters }: PriceHistoryChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string>("");

  useEffect(() => {
    fetchPriceHistory();
  }, [filters]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      
      // Calcular fecha de inicio basada en el período
      const mesesAtras = parseInt(filters.periodo);
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - mesesAtras);

      // Construir query
      let query = supabase
        .from('anuncios_vehiculos')
        .select('precio, fecha_extraccion, marca, modelo, ano, ubicacion')
        .eq('activo', true)
        .gte('fecha_extraccion', fechaInicio.toISOString())
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

      const { data, error } = await query.order('fecha_extraccion', { ascending: true });

      if (error) {
        console.error('Error fetching price history:', error);
        return;
      }

      if (data && data.length > 0) {
        // Agrupar por mes y calcular precio promedio
        const groupedByMonth = data.reduce((acc: any, item) => {
          const fecha = new Date(item.fecha_extraccion);
          const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
          const mesNombre = fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
          
          if (!acc[mesKey]) {
            acc[mesKey] = {
              precios: [],
              mes: mesNombre,
              fecha: mesKey
            };
          }
          acc[mesKey].precios.push(item.precio);
          return acc;
        }, {});

        // Calcular promedios y crear datos del gráfico
        const chartData = Object.values(groupedByMonth).map((grupo: any) => ({
          mes: grupo.mes,
          precio: Math.round(grupo.precios.reduce((a: number, b: number) => a + b, 0) / grupo.precios.length),
          fecha: grupo.fecha
        }));

        setChartData(chartData);

        // Generar insight
        if (chartData.length >= 2) {
          const precioInicial = chartData[0].precio;
          const precioFinal = chartData[chartData.length - 1].precio;
          const variacion = ((precioFinal - precioInicial) / precioInicial * 100);
          
          if (Math.abs(variacion) > 1) {
            const direccion = variacion > 0 ? 'subió' : 'cayó';
            setInsight(`El precio ${direccion} un ${Math.abs(variacion).toFixed(1)}% en ${filters.periodo} meses`);
          } else {
            setInsight('Los precios se mantuvieron estables durante el período analizado');
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            Precio promedio: <span className="font-bold">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Histórico de Precios
          </CardTitle>
          <CardDescription>Evolución del precio promedio mensual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Histórico de Precios
        </CardTitle>
        <CardDescription>Evolución del precio promedio mensual</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insight && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{insight}</AlertDescription>
          </Alert>
        )}
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="mes" 
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis 
                className="text-muted-foreground"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="precio" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}