import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "@/utils/iconImports";
import { useToast } from "@/hooks/use-toast";
import { useTiempoVentaIA } from "@/hooks/useTiempoVentaIA";
import { useCreditControl } from "@/hooks/useCreditControl";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { VehicleDataForm } from "@/components/analisis/VehicleDataForm";
import { ComparisonTable } from "@/components/analisis/ComparisonTable";
import { RecommendationPanel } from "@/components/analisis/RecommendationPanel";
import AnalisisMercado from "@/components/AnalisisMercado";
import CreditControl from "./CreditControl";
import { NoCreditsDialog } from "./NoCreditsDialog";
import { formatPrice } from "@/utils/formatters";
import { 
  calcularDemandaAuto,
  calcularCompetenciaMercado,
  calcularDistribucionPrecios,
  calcularSugerenciaAjuste,
  calcularTiempoVenta,
  type AutoSimilar,
  type DatosVehiculo
} from "@/utils/priceAnalysisCalculations";

interface AnalisisPrecioProps {
  datos: DatosVehiculo;
  onVolver: () => void;
}

export function AnalisisPrecio({ datos, onVolver }: AnalisisPrecioProps) {
  const navigate = useNavigate();
  const [autosSimilares, setAutosSimilares] = useState<AutoSimilar[]>([]);
  const [vehiculosSimilaresMapi, setVehiculosSimilaresMapi] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    precioRecomendado: 0,
    precioMinimo: 0,
    precioMaximo: 0,
    precioPromedio: 0,
    precioPromedioMercado: 0,
    totalAnuncios: 0
  });
  const [precioSeleccionado, setPrecioSeleccionado] = useState(0);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>("todos");
  const [tipoVendedorSeleccionado, setTipoVendedorSeleccionado] = useState<string>("todos");
  const [kilometrajeSeleccionado, setKilometrajeSeleccionado] = useState(0);
  const [estadisticasKilometraje, setEstadisticasKilometraje] = useState({
    promedio: 0,
    minimo: 0,
    maximo: 0,
    rangoOptimo: { min: 0, max: 0 }
  });
  const [mostrarRangosDetallados, setMostrarRangosDetallados] = useState(false);
  const { toast } = useToast();
  const { resultado: tiempoIA, isLoading: cargandoIA, calcularTiempo } = useTiempoVentaIA();
  const { checkCredits, showUpgradeDialog, setShowUpgradeDialog } = useCreditControl();

  // Memoizar cálculos para evitar recálculos innecesarios
  const demandaAuto = useMemo(() => calcularDemandaAuto(autosSimilares, datos, estadisticas), [autosSimilares, datos, estadisticas]);
  const competenciaMercado = useMemo(() => calcularCompetenciaMercado(autosSimilares, estadoSeleccionado, tipoVendedorSeleccionado), [autosSimilares, estadoSeleccionado, tipoVendedorSeleccionado]);
  const sugerencia = useMemo(() => calcularSugerenciaAjuste(precioSeleccionado, estadisticas.precioPromedio), [precioSeleccionado, estadisticas.precioPromedio]);
  const distribucionPrecios = useMemo(() => calcularDistribucionPrecios(autosSimilares), [autosSimilares]);

  // Cálculo del ajuste por kilometraje en memoria
  const { precioAjustado, porcentajeAjuste } = useMemo(() => {
    if (!estadisticasKilometraje.promedio || estadisticasKilometraje.promedio === 0) {
      return { precioAjustado: estadisticas.precioRecomendado, porcentajeAjuste: 0 };
    }

    const diferenciaKm = kilometrajeSeleccionado - estadisticasKilometraje.promedio;
    // Por cada 10,000 km de diferencia, ajustar ±3%
    const ajustePorKm = (diferenciaKm / 10000) * 3;
    const precioBase = estadisticas.precioRecomendado;
    const precioConAjuste = precioBase * (1 - ajustePorKm / 100);
    
    return { 
      precioAjustado: Math.max(precioConAjuste, precioBase * 0.7), // Mínimo 70% del precio base
      porcentajeAjuste: -ajustePorKm 
    };
  }, [kilometrajeSeleccionado, estadisticasKilometraje, estadisticas.precioRecomendado]);

  useEffect(() => {
    // Cargar precio de MaxiPublica primero como fuente principal
    cargarPrecioMercado();
    cargarAnalisis();
  }, [datos, estadoSeleccionado, tipoVendedorSeleccionado]);

  const cargarPrecioMercado = async () => {
    if (!datos.versionId) {
      console.log('No version ID available, cannot get recommended price');
      toast({
        title: "Precio no disponible",
        description: "No se pudo obtener el precio recomendado sin el ID de versión del vehículo",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('getCarMarketIntelligenceData', {
        body: { versionId: datos.versionId }
      });

      if (error) {
        console.error('Error getting market intelligence data:', error);
        toast({
          title: "Error en precio",
          description: "No se pudo obtener el precio recomendado de MaxiPublica",
          variant: "destructive"
        });
        return;
      }

      if (data?.suggestedPrice?.suggestedPricePublish && data.suggestedPrice.suggestedPricePublish > 0) {
        const precioRecomendado = data.suggestedPrice.suggestedPricePublish;
        setEstadisticas(prev => ({
          ...prev,
          precioRecomendado: precioRecomendado,
          precioPromedioMercado: precioRecomendado,
          precioPromedio: precioRecomendado
        }));
      } else {
        console.log('No market data available from API');
        toast({
          title: "Datos no disponibles",
          description: "MaxiPublica no tiene datos de mercado para este vehículo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error calling market price API:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servicio de precios de MaxiPublica",
        variant: "destructive"
      });
    }
  };

  // Inicializar precio seleccionado cuando se cargan las estadísticas
  useEffect(() => {
    if (estadisticas.precioRecomendado > 0) {
      setPrecioSeleccionado(estadisticas.precioRecomendado);
    }
  }, [estadisticas.precioRecomendado]);

  // Inicializar kilometraje seleccionado cuando se cargan los datos
  useEffect(() => {
    if (datos.kilometraje > 0) {
      setKilometrajeSeleccionado(datos.kilometraje);
    }
  }, [datos.kilometraje]);

  const cargarAnalisis = useCallback(async () => {
    setCargando(true);
    try {
      // Obtener cantidad de vehículos similares desde maxi_similar_cars
      const versionId = datos.versionId;
      
      console.log('Llamando a maxi_similar_cars con versionId:', versionId);
      console.log('Datos del vehículo:', datos);
      
      try {
        const { data: maxiData, error: maxiError } = await supabase.functions.invoke('maxi_similar_cars', {
          body: { versionId }
        });
        
        console.log('Respuesta de maxi_similar_cars:', { maxiData, maxiError });
        
        if (!maxiError && maxiData?.similarsCars) {
          console.log('Cantidad de vehículos similares encontrados:', maxiData.similarsCars.length);
          setVehiculosSimilaresMapi(maxiData.similarsCars.length);
        } else {
          console.warn('No se encontraron datos válidos en maxi_similar_cars:', { maxiError, maxiData });
          setVehiculosSimilaresMapi(0);
        }
      } catch (maxiErr) {
        console.error('Error al obtener datos de maxi_similar_cars:', maxiErr);
        setVehiculosSimilaresMapi(0);
      }

      // Construir consulta con filtros
      let query = supabase
        .from('anuncios_vehiculos')
        .select('*')
        .eq('marca', datos.marca)
        .eq('modelo', datos.modelo)
        .eq('ano', datos.ano)
        .eq('activo', true);

      // Aplicar filtros adicionales si están seleccionados
      if (estadoSeleccionado !== "todos") {
        query = query.ilike('ubicacion', `%${estadoSeleccionado}%`);
      }

      const { data, error } = await query
        .order('precio', { ascending: true })
        .limit(20);

      if (error) {
        throw error;
      }

      const autosMapeados = data?.map(vehiculo => ({
        id: vehiculo.id,
        titulo: vehiculo.titulo || '',
        precio: vehiculo.precio || 0,
        kilometraje: vehiculo.kilometraje || 0,
        ano: vehiculo.ano || 0,
        ubicacion: vehiculo.ubicacion || '',
        sitio_web: vehiculo.sitio_web || '',
        url_anuncio: vehiculo.url_anuncio || ''
      })) || [];

      setAutosSimilares(autosMapeados);

      // Calcular estadísticas
      if (autosMapeados.length > 0) {
        const precios = autosMapeados.map(auto => auto.precio).filter(p => p > 0);

        if (precios.length > 0) {
          const estadisticasCalculadas = {
            totalAnuncios: autosMapeados.length,
            precioMinimo: Math.min(...precios),
            precioMaximo: Math.max(...precios),
            precioPromedio: precios.reduce((a, b) => a + b, 0) / precios.length,
            precioRecomendado: estadisticas.precioRecomendado || (precios.reduce((a, b) => a + b, 0) / precios.length),
            precioPromedioMercado: estadisticas.precioPromedioMercado || 0
          };

          setEstadisticas(prev => ({
            ...prev,
            ...estadisticasCalculadas
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar análisis:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el análisis de precios",
        variant: "destructive"
      });
    } finally {
      setCargando(false);
    }
  }, [datos, estadoSeleccionado, tipoVendedorSeleccionado, toast]);

  const manejarCalculoTiempoIA = async () => {
    const hasCredits = await checkCredits();
    if (!hasCredits) {
      return;
    }

    await calcularTiempo(
      precioSeleccionado,
      estadisticas.precioRecomendado,
      {
        marca: datos.marca,
        modelo: datos.modelo,
        ano: datos.ano,
        kilometraje: kilometrajeSeleccionado,
        estado: datos.estado,
        ciudad: datos.ciudad
      }
    );
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={onVolver}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a valuación
          </Button>
          
          <div className="flex items-center gap-4">
            <CreditControl />
          </div>
        </div>

        {/* Vehicle Info */}
        <Card>
          <CardHeader>
            <CardTitle>
              Análisis de precio: {datos.marca} {datos.modelo} {datos.ano}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Versión: {datos.version}
            </p>
          </CardContent>
        </Card>

        {/* Analysis Section - Restored to August 26th version */}
        <AnalisisMercado
          marca={datos.marca}
          modelo={datos.modelo}
          ano={datos.ano}
          precio={precioSeleccionado}
          kilometraje={kilometrajeSeleccionado}
          datos={{
            precioPromedio: estadisticas.precioPromedio,
            rangoMinimo: estadisticas.precioMinimo,
            rangoMaximo: estadisticas.precioMaximo,
            demanda: demandaAuto.nivel === 'alta' || demandaAuto.nivel === 'muy alta' ? 'alta' : 
                     demandaAuto.nivel === 'baja' || demandaAuto.nivel === 'muy baja' ? 'baja' : 'moderada',
            competencia: competenciaMercado.nivel === 'alta' || competenciaMercado.nivel === 'muy alta' || competenciaMercado.nivel === 'extrema' ? 'alta' : 
                        competenciaMercado.nivel === 'baja' || competenciaMercado.nivel === 'muy baja' ? 'baja' : 'moderada',
            vehiculosSimilares: vehiculosSimilaresMapi
          }}
        />

        {/* Controls and Recommendations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VehicleDataForm
            precioSeleccionado={precioSeleccionado}
            kilometrajeSeleccionado={kilometrajeSeleccionado}
            estadoSeleccionado={estadoSeleccionado}
            tipoVendedorSeleccionado={tipoVendedorSeleccionado}
            estadisticas={estadisticas}
            estadisticasKilometraje={estadisticasKilometraje}
            onPrecioChange={setPrecioSeleccionado}
            onKilometrajeChange={setKilometrajeSeleccionado}
            onEstadoChange={setEstadoSeleccionado}
            onTipoVendedorChange={setTipoVendedorSeleccionado}
            formatearPrecio={formatPrice}
          />

          <RecommendationPanel
            tiempoIA={tiempoIA}
            cargandoIA={cargandoIA}
            datos={datos}
            precioSeleccionado={precioSeleccionado}
            onCalcularTiempoIA={manejarCalculoTiempoIA}
          />
        </div>

        {/* Bottom - Comparison Table */}
        <ComparisonTable
          autosSimilares={autosSimilares}
          mostrarRangosDetallados={mostrarRangosDetallados}
          onToggleRangos={() => setMostrarRangosDetallados(!mostrarRangosDetallados)}
          formatearPrecio={formatPrice}
        />
      </div>

      {/* Diálogo de sin créditos */}
      <NoCreditsDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} />
    </div>
  );
}