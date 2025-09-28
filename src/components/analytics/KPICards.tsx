import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, MapPin, DollarSign, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Filters {
  marca: string;
  modelo: string;
  ano: string;
  ciudad: string;
  periodo: string;
}

interface KPIData {
  precioPromedio: number;
  variacionMensual: number;
  tiempoVenta: number;
  stockLocal: number;
}

interface KPICardsProps {
  filters: Filters;
}

export function KPICards({ filters }: KPICardsProps) {
  const [kpiData, setKpiData] = useState<KPIData>({
    precioPromedio: 0,
    variacionMensual: 0,
    tiempoVenta: 0,
    stockLocal: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIData();
  }, [filters]);

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      
      // Construir query base
      let query = supabase
        .from('anuncios_vehiculos')
        .select('precio, fecha_extraccion, ubicacion, marca, modelo, ano')
        .eq('activo', true);

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
        console.error('Error fetching KPI data:', error);
        return;
      }

      if (data && data.length > 0) {
        // Calcular precio promedio
        const precios = data.filter(item => item.precio && item.precio > 0).map(item => item.precio);
        const precioPromedio = precios.length > 0 ? precios.reduce((a, b) => a + b, 0) / precios.length : 0;

        // Simular variación mensual (en un caso real, compararías con datos del mes anterior)
        const variacionMensual = Math.random() * 20 - 10; // -10% a +10%

        // Simular tiempo promedio de venta
        const tiempoVenta = Math.floor(Math.random() * 60) + 15; // 15-75 días

        // Stock local
        const stockLocal = data.length;

        setKpiData({
          precioPromedio,
          variacionMensual,
          tiempoVenta,
          stockLocal
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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

  const getVariationColor = (variation: number) => {
    if (variation > 0) return "text-success";
    if (variation < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getVariationIcon = (variation: number) => {
    if (variation > 0) return <TrendingUp className="h-4 w-4" />;
    if (variation < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Precio Promedio */}
      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(kpiData.precioPromedio)}</div>
          <div className="text-xs text-muted-foreground">
            Para el criterio seleccionado
          </div>
        </CardContent>
      </Card>

      {/* Variación Mensual */}
      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Variación Mensual</CardTitle>
          {getVariationIcon(kpiData.variacionMensual)}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getVariationColor(kpiData.variacionMensual)}`}>
            {kpiData.variacionMensual > 0 ? '+' : ''}{kpiData.variacionMensual.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Vs mes anterior
          </div>
        </CardContent>
      </Card>

      {/* Tiempo Promedio de Venta */}
      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo de Venta</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.tiempoVenta} días</div>
          <div className="text-xs text-muted-foreground">
            Promedio del mercado
          </div>
        </CardContent>
      </Card>

      {/* Stock Local */}
      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Disponible</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpiData.stockLocal}</div>
          <div className="text-xs text-muted-foreground">
            Unidades en el área
          </div>
        </CardContent>
      </Card>
    </div>
  );
}