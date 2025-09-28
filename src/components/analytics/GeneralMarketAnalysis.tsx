import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown, Clock, Car, MapPin, Users, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOptimizedCharts, getOptimizedBarProps } from "@/hooks/useOptimizedCharts";

interface GeneralMarketFilters {
  ubicacion: string;
  periodo: string;
}

interface GeneralMarketAnalysisProps {
  filters: GeneralMarketFilters;
  onFiltersChange: (filters: GeneralMarketFilters) => void;
}

interface MarketStats {
  tiempoPromedioVenta: number;
  variacionTiempoVenta: {
    "1m": number;
    "3m": number;
    "6m": number;
    "1y": number;
  };
  stockDisponible: number;
  crecimientoStock: {
    "1m": number;
    "3m": number;
    "6m": number;
    "1y": number;
  };
  stockProfesionales: number;
  stockParticulares: number;
  porcentajeCredito: number;
}

interface VehiclesByYear {
  ano: number;
  cantidad: number;
  porcentaje: number;
}

interface TopBrand {
  marca: string;
  cantidad: number;
  porcentaje: number;
}

interface TopCity {
  ciudad: string;
  cantidad: number;
  porcentaje: number;
}

interface TopModel {
  modelo: string;
  marca: string;
  cantidad: number;
  tiempoPromedio: number;
  velocidad: 'Rápido' | 'Medio' | 'Lento';
  leads: number;
}

interface ModelLeads {
  modelo: string;
  marca: string;
  leads: number;
}

export function GeneralMarketAnalysis({ filters, onFiltersChange }: GeneralMarketAnalysisProps) {
  const [loading, setLoading] = useState(true);
  const chartConfig = useOptimizedCharts();
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [vehiclesByYear, setVehiclesByYear] = useState<VehiclesByYear[]>([]);
  const [topBrands, setTopBrands] = useState<TopBrand[]>([]);
  const [leastBrands, setLeastBrands] = useState<TopBrand[]>([]);
  const [topCities, setTopCities] = useState<TopCity[]>([]);
  const [leastCities, setLeastCities] = useState<TopCity[]>([]);
  const [fastestModels, setFastestModels] = useState<TopModel[]>([]);
  const [slowestModels, setSlowestModels] = useState<TopModel[]>([]);
  const [topModelsByOffers, setTopModelsByOffers] = useState<TopModel[]>([]);
  const [leastModelsByOffers, setLeastModelsByOffers] = useState<TopModel[]>([]);
  const [topModelsByLeads, setTopModelsByLeads] = useState<ModelLeads[]>([]);
  const [leastModelsByLeads, setLeastModelsByLeads] = useState<ModelLeads[]>([]);

  const [ubicaciones, setUbicaciones] = useState(["Todo el país", "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana"]);

  const fetchGeneralMarketData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Construir query base - exclude contact info for security
      let query = supabase
        .from('anuncios_vehiculos')
        .select('id, titulo, marca, modelo, ano, precio, precio_original, kilometraje, ubicacion, sitio_web, url_anuncio, activo, fecha_extraccion');

      // Aplicar filtro de ubicación
      if (filters.ubicacion !== "Todo el país") {
        query = query.ilike('ubicacion', `%${filters.ubicacion}%`);
      }

      const { data: anuncios, error } = await query;

      if (error) {
        console.error('Error fetching general market data:', error);
        return;
      }

      if (anuncios && anuncios.length > 0) {
        // Calcular estadísticas de mercado
        const totalAnuncios = anuncios.length;
        
        // Simular datos para demostración
        const stats: MarketStats = {
          tiempoPromedioVenta: 45,
          variacionTiempoVenta: {
            "1m": -2.5,
            "3m": 1.8,
            "6m": -5.2,
            "1y": 3.4
          },
          stockDisponible: totalAnuncios,
          crecimientoStock: {
            "1m": 5.2,
            "3m": -2.8,
            "6m": 12.5,
            "1y": -8.1
          },
          stockProfesionales: Math.round(totalAnuncios * 0.65),
          stockParticulares: Math.round(totalAnuncios * 0.35),
          porcentajeCredito: 78.5
        };

        setMarketStats(stats);

        // Agrupar por año
        const yearGroups = anuncios.reduce((acc: any, item) => {
          if (!acc[item.ano]) acc[item.ano] = 0;
          acc[item.ano]++;
          return acc;
        }, {});

        const vehiclesByYearData = Object.entries(yearGroups)
          .map(([ano, cantidad]: [string, any]) => ({
            ano: parseInt(ano),
            cantidad,
            porcentaje: (cantidad / totalAnuncios) * 100
          }))
          .filter(item => item.ano >= new Date().getFullYear() - 5)
          .sort((a, b) => b.ano - a.ano);

        setVehiclesByYear(vehiclesByYearData);

        // Top marcas
        const brandGroups = anuncios.reduce((acc: any, item) => {
          if (item.marca) {
            if (!acc[item.marca]) acc[item.marca] = 0;
            acc[item.marca]++;
          }
          return acc;
        }, {});

        const brandEntries = Object.entries(brandGroups)
          .map(([marca, cantidad]: [string, any]) => ({
            marca,
            cantidad,
            porcentaje: (cantidad / totalAnuncios) * 100
          }))
          .sort((a, b) => b.cantidad - a.cantidad);

        setTopBrands(brandEntries.slice(0, 5));
        setLeastBrands(brandEntries.slice(-10).reverse());

        // Top ciudades
        const cityGroups = anuncios.reduce((acc: any, item) => {
          if (item.ubicacion) {
            const ciudad = item.ubicacion.split(',')[0]?.trim() || 'Sin ubicación';
            if (!acc[ciudad]) acc[ciudad] = 0;
            acc[ciudad]++;
          }
          return acc;
        }, {});

        const cityEntries = Object.entries(cityGroups)
          .map(([ciudad, cantidad]: [string, any]) => ({
            ciudad,
            cantidad,
            porcentaje: (cantidad / totalAnuncios) * 100
          }))
          .sort((a, b) => b.cantidad - a.cantidad);

        setTopCities(cityEntries.slice(0, 10));
        setLeastCities(cityEntries.slice(-10).reverse());

        // Análisis de modelos por velocidad de venta y ofertas
        const modelGroups = anuncios.reduce((acc: any, item) => {
          if (item.marca && item.modelo) {
            const key = `${item.marca}-${item.modelo}`;
            if (!acc[key]) {
              acc[key] = {
                marca: item.marca,
                modelo: item.modelo,
                anuncios: []
              };
            }
            acc[key].anuncios.push(item);
          }
          return acc;
        }, {});

        const modelsWithStats: TopModel[] = Object.values(modelGroups).map((group: any) => {
          const cantidad = group.anuncios.length;
          // Simular tiempo promedio de venta basado en cantidad (más anuncios = más lento)
          const tiempoPromedio = Math.round(30 + (cantidad / 10) + Math.random() * 20);
          const leads = Math.round(cantidad * (0.5 + Math.random() * 2)); // Simular leads
          
          let velocidad: 'Rápido' | 'Medio' | 'Lento' = 'Medio';
          if (tiempoPromedio < 35) velocidad = 'Rápido';
          else if (tiempoPromedio > 50) velocidad = 'Lento';

          return {
            marca: group.marca,
            modelo: group.modelo,
            cantidad,
            tiempoPromedio,
            velocidad,
            leads
          };
        });

        // Ordenar modelos por velocidad de venta
        const sortedBySpeed = [...modelsWithStats].sort((a, b) => a.tiempoPromedio - b.tiempoPromedio);
        setFastestModels(sortedBySpeed.slice(0, 10));
        setSlowestModels(sortedBySpeed.slice(-10).reverse());

        // Top modelos por cantidad de ofertas
        const sortedByOffers = [...modelsWithStats].sort((a, b) => b.cantidad - a.cantidad);
        setTopModelsByOffers(sortedByOffers.slice(0, 10));
        setLeastModelsByOffers(sortedByOffers.slice(-10).reverse());

        // Top modelos por leads
        const sortedByLeads = [...modelsWithStats].sort((a, b) => b.leads - a.leads);
        setTopModelsByLeads(sortedByLeads.slice(0, 10).map(m => ({
          modelo: m.modelo,
          marca: m.marca,
          leads: m.leads
        })));
        setLeastModelsByLeads(sortedByLeads.slice(-10).reverse().map(m => ({
          modelo: m.modelo,
          marca: m.marca,
          leads: m.leads
        })));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGeneralMarketData();
  }, [fetchGeneralMarketData]);

  const getVariationColor = (value: number) => {
    return value >= 0 ? 'text-success' : 'text-destructive';
  };

  const getVariationIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-muted rounded animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Análisis de Mercado General
            </h2>
            <p className="text-muted-foreground">
              Insights generales del mercado automotriz
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Datos
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Filtros de Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicación</label>
              <Select value={filters.ubicacion} onValueChange={(value) => onFiltersChange({...filters, ubicacion: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {ubicaciones.map((ubicacion) => (
                    <SelectItem key={ubicacion} value={ubicacion}>
                      {ubicacion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período de Análisis</label>
              <Select value={filters.periodo} onValueChange={(value) => onFiltersChange({...filters, periodo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 mes</SelectItem>
                  <SelectItem value="3m">3 meses</SelectItem>
                  <SelectItem value="6m">6 meses</SelectItem>
                  <SelectItem value="1y">1 año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas principales */}
      {marketStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio de Venta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketStats.tiempoPromedioVenta} días</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getVariationIcon(marketStats.variacionTiempoVenta[filters.periodo as keyof typeof marketStats.variacionTiempoVenta])}
                <span className={getVariationColor(marketStats.variacionTiempoVenta[filters.periodo as keyof typeof marketStats.variacionTiempoVenta])}>
                  {marketStats.variacionTiempoVenta[filters.periodo as keyof typeof marketStats.variacionTiempoVenta] > 0 ? '+' : ''}
                  {marketStats.variacionTiempoVenta[filters.periodo as keyof typeof marketStats.variacionTiempoVenta]}%
                </span>
                <span>vs período anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Disponible</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketStats.stockDisponible.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getVariationIcon(marketStats.crecimientoStock[filters.periodo as keyof typeof marketStats.crecimientoStock])}
                <span className={getVariationColor(marketStats.crecimientoStock[filters.periodo as keyof typeof marketStats.crecimientoStock])}>
                  {marketStats.crecimientoStock[filters.periodo as keyof typeof marketStats.crecimientoStock] > 0 ? '+' : ''}
                  {marketStats.crecimientoStock[filters.periodo as keyof typeof marketStats.crecimientoStock]}%
                </span>
                <span>vs período anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock por Tipo</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Profesionales</span>
                  <span className="font-medium">{marketStats.stockProfesionales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Particulares</span>
                  <span className="font-medium">{marketStats.stockParticulares.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Autos con Crédito</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{marketStats.porcentajeCredito}%</div>
              <p className="text-xs text-muted-foreground">del total de anuncios</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Velocidad de venta por modelo - Moved up */}

      {/* Velocidad de venta por modelo */}
      <Card>
        <CardHeader>
          <CardTitle>Velocidad de Venta por Modelo</CardTitle>
          <CardDescription>Modelos más rápidos y más lentos en venderse</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-success mb-4">⚡ Más Rápidos (Top 10)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posición</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                    <TableHead className="text-center">Velocidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fastestModels.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-success">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{model.marca} {model.modelo}</TableCell>
                      <TableCell className="text-center text-success font-bold">{model.tiempoPromedio}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-success/10 text-success border-success/20">
                          {model.velocidad}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold text-destructive mb-4">🐌 Más Lentos (Top 10)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posición</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-center">Días</TableHead>
                    <TableHead className="text-center">Velocidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slowestModels.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-destructive">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{model.marca} {model.modelo}</TableCell>
                      <TableCell className="text-center text-destructive font-bold">{model.tiempoPromedio}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                          {model.velocidad}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 modelos por leads - Moved right below velocity section */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Modelos por Leads</CardTitle>
          <CardDescription>Modelos que generan más y menos interés de compradores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-primary mb-4">🎯 Más Demandados (Top 10)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posición</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topModelsByLeads.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-primary">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{model.marca} {model.modelo}</TableCell>
                      <TableCell className="text-center text-primary font-bold">{model.leads}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold text-muted-foreground mb-4">📉 Menos Demandados (Bottom 10)</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posición</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leastModelsByLeads.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-muted-foreground">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{model.marca} {model.modelo}</TableCell>
                      <TableCell className="text-center text-muted-foreground font-bold">{model.leads}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top modelos por cantidad de oferta */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Modelos por Cantidad de Oferta</CardTitle>
          <CardDescription>Modelos con mayor y menor cantidad de anuncios disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-primary mb-4">📈 Mayor Oferta</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posición</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-center">Anuncios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topModelsByOffers.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-primary">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{model.marca} {model.modelo}</TableCell>
                      <TableCell className="text-center font-bold text-primary">{model.cantidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold text-muted-foreground mb-4">📉 Menor Oferta</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posición</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead className="text-center">Anuncios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leastModelsByOffers.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-muted-foreground">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{model.marca} {model.modelo}</TableCell>
                      <TableCell className="text-center font-bold text-muted-foreground">{model.cantidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Vehículos por año - Moved to end */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Año de Vehículos</CardTitle>
          <CardDescription>Últimos 5 años disponibles en el mercado</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehiclesByYear}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ano" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'cantidad' ? `${value} vehículos` : `${value.toFixed(1)}%`,
                  name === 'cantidad' ? 'Cantidad' : 'Porcentaje'
                ]}
              />
              <Bar dataKey="cantidad" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top marcas - Moved to end */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Marcas con Mayor Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posición</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-center">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topBrands.map((brand, index) => (
                  <TableRow key={brand.marca}>
                    <TableCell className="font-medium text-primary">#{index + 1}</TableCell>
                    <TableCell className="font-medium">{brand.marca}</TableCell>
                    <TableCell className="text-center">{brand.cantidad}</TableCell>
                    <TableCell className="text-center">{brand.porcentaje.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Marcas con Menor Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posición</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-center">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leastBrands.map((brand, index) => (
                  <TableRow key={brand.marca}>
                    <TableCell className="font-medium text-muted-foreground">#{index + 1}</TableCell>
                    <TableCell className="font-medium">{brand.marca}</TableCell>
                    <TableCell className="text-center">{brand.cantidad}</TableCell>
                    <TableCell className="text-center">{brand.porcentaje.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Top ciudades - Moved to end */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Ciudades con Mayor Concentración</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posición</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead className="text-center">Inventario</TableHead>
                  <TableHead className="text-center">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCities.map((city, index) => (
                  <TableRow key={city.ciudad}>
                    <TableCell className="font-medium text-primary">#{index + 1}</TableCell>
                    <TableCell className="font-medium">{city.ciudad}</TableCell>
                    <TableCell className="text-center">{city.cantidad}</TableCell>
                    <TableCell className="text-center">{city.porcentaje.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Ciudades con Menor Concentración</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posición</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead className="text-center">Inventario</TableHead>
                  <TableHead className="text-center">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leastCities.map((city, index) => (
                  <TableRow key={city.ciudad}>
                    <TableCell className="font-medium text-muted-foreground">#{index + 1}</TableCell>
                    <TableCell className="font-medium">{city.ciudad}</TableCell>
                    <TableCell className="text-center">{city.cantidad}</TableCell>
                    <TableCell className="text-center">{city.porcentaje.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}