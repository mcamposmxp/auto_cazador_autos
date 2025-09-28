import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MapPin, AlertTriangle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  marca: string;
  modelo: string;
  ano: string;
  ciudad: string;
  periodo: string;
}

interface StockAnalysisProps {
  filters: Filters;
}

interface StockData {
  categoria: string;
  cantidad: number;
}

export function StockAnalysis({ filters }: StockAnalysisProps) {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<string>("");

  useEffect(() => {
    fetchStockData();
  }, [filters]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      
      // Query para stock local - exclude contact info for security
      let localQuery = supabase
        .from('anuncios_vehiculos')
        .select('id', { count: 'exact', head: true })
        .eq('activo', true);

      // Query para stock nacional - exclude contact info for security
      let nationalQuery = supabase
        .from('anuncios_vehiculos')
        .select('id', { count: 'exact', head: true })
        .eq('activo', true);

      // Aplicar filtros base (marca, modelo, año)
      if (filters.marca !== 'all') {
        localQuery = localQuery.eq('marca', filters.marca);
        nationalQuery = nationalQuery.eq('marca', filters.marca);
      }
      if (filters.modelo !== 'all') {
        localQuery = localQuery.eq('modelo', filters.modelo);
        nationalQuery = nationalQuery.eq('modelo', filters.modelo);
      }
      if (filters.ano !== 'all') {
        localQuery = localQuery.eq('ano', parseInt(filters.ano));
        nationalQuery = nationalQuery.eq('ano', parseInt(filters.ano));
      }

      // Aplicar filtro de ciudad solo al local
      if (filters.ciudad !== 'all') {
        localQuery = localQuery.ilike('ubicacion', `%${filters.ciudad}%`);
      }

      const [localResult, nationalResult] = await Promise.all([
        localQuery,
        nationalQuery
      ]);

      const stockLocal = localResult.count || 0;
      const stockNacional = nationalResult.count || 0;

      const data: StockData[] = [
        { categoria: 'Stock Local', cantidad: stockLocal },
        { categoria: 'Stock Nacional', cantidad: stockNacional }
      ];

      setStockData(data);

      // Generar alerta dinámica
      if (filters.ciudad !== 'all') {
        const porcentajeLocal = stockNacional > 0 ? (stockLocal / stockNacional) * 100 : 0;
        
        if (stockLocal < 5) {
          setAlert(`Solo ${stockLocal} unidades en ${filters.ciudad} → Oportunidad de subir precio.`);
        } else if (porcentajeLocal > 30) {
          setAlert(`Sobreoferta en ${filters.ciudad} → Considera ajustar tu precio.`);
        } else {
          setAlert(`Stock equilibrado en ${filters.ciudad} (${stockLocal} unidades disponibles).`);
        }
      } else {
        setAlert(`Total de ${stockNacional} unidades disponibles a nivel nacional.`);
      }

    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            Cantidad: <span className="font-bold">{payload[0].value} unidades</span>
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
            <MapPin className="h-5 w-5" />
            Análisis de Stock Local
          </CardTitle>
          <CardDescription>Comparación de inventario local vs nacional</CardDescription>
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
          <MapPin className="h-5 w-5" />
          Análisis de Stock Local
        </CardTitle>
        <CardDescription>Comparación de inventario local vs nacional</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alert && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{alert}</AlertDescription>
          </Alert>
        )}
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="categoria" 
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis 
                className="text-muted-foreground"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="cantidad" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stockData.find(d => d.categoria === 'Stock Local')?.cantidad || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Unidades locales
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stockData.find(d => d.categoria === 'Stock Nacional')?.cantidad || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Unidades nacionales
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}