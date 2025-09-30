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
import { useDebugMode } from "@/hooks/useDebugMode";
import { DebugInfo } from "./DebugInfo";
import { DebugToggle } from "./DebugToggle";

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
    precioPromedioBruto: 0, // Valor sin redondear
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
  const { debugMode } = useDebugMode();

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
      // Obtener datos de vehículos similares desde maxi_similar_cars
      const { data, error } = await supabase.functions.invoke('maxi_similar_cars', {
        body: { versionId: datos.versionId }
      });

      if (error) {
        console.error('Error getting similar cars data:', error);
        toast({
          title: "Error en precio",
          description: "No se pudo obtener el precio promedio de vehículos similares",
          variant: "destructive"
        });
        return;
      }

      // Calcular promedio de precios desde similarsCars
      if (data?.similarsCars && Array.isArray(data.similarsCars) && data.similarsCars.length > 0) {
        const precios = data.similarsCars
          .map((car: any) => car.price)
          .filter((price: number) => price > 0);
        
        if (precios.length > 0) {
          const promedioBase = precios.reduce((a: number, b: number) => a + b, 0) / precios.length;
          const precioPromedioCalculado = Math.round(promedioBase / 100) * 100; // Redondeo a centenas
          
          console.log(`Precio promedio calculado desde ${precios.length} vehículos similares:`, precioPromedioCalculado);
          console.log(`Precio promedio bruto (sin redondear):`, promedioBase);
          
          setEstadisticas(prev => ({
            ...prev,
            precioRecomendado: precioPromedioCalculado,
            precioPromedioMercado: precioPromedioCalculado,
            precioPromedio: precioPromedioCalculado,
            precioPromedioBruto: promedioBase // Guardar valor sin redondear
          }));
        } else {
          console.log('No hay precios válidos en los vehículos similares');
          toast({
            title: "Datos no disponibles",
            description: "No se encontraron precios válidos en vehículos similares",
            variant: "destructive"
          });
        }
      } else {
        console.log('No similar cars data available from API');
        toast({
          title: "Datos no disponibles",
          description: "No se encontraron vehículos similares para este modelo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error calling similar cars API:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servicio de vehículos similares",
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
      // Obtener datos completos desde maxi_similar_cars
      const versionId = datos.versionId;
      
      console.log('Llamando a maxi_similar_cars con versionId:', versionId);
      console.log('Datos del vehículo:', datos);
      
      try {
        const { data: maxiData, error: maxiError } = await supabase.functions.invoke('maxi_similar_cars', {
          body: { versionId }
        });
        
        console.log('Respuesta de maxi_similar_cars:', { maxiData, maxiError });
        
        if (!maxiError && maxiData?.similarsCars && maxiData.similarsCars.length > 0) {
          console.log('Cantidad de vehículos similares encontrados:', maxiData.similarsCars.length);
          setVehiculosSimilaresMapi(maxiData.similarsCars.length);
          
          // Mapear datos de maxi_similar_cars al formato esperado
          const autosMapeados = maxiData.similarsCars.map((vehiculo: any) => ({
            id: vehiculo.id,
            marca: vehiculo.brand,
            ano: parseInt(vehiculo.year),
            modelo: vehiculo.model,
            version: vehiculo.trim,
            kilometraje: vehiculo.odometer,
            // Campos adicionales para otros cálculos y análisis
            precio: vehiculo.price,
            condition: vehiculo.condition,
            traction: vehiculo.traction,
            energy: vehiculo.energy,
            transmission: vehiculo.transmission,
            bodyType: vehiculo.bodyType,
            armored: vehiculo.armored,
            currency: vehiculo.currency,
            status: vehiculo.status,
            permalink: vehiculo.permalink,
            thumbnail: vehiculo.thumbnail,
            dateCreated: vehiculo.dateCreated,
            daysInStock: vehiculo.daysInStock,
            sellerType: vehiculo.sellerType,
            address_line: vehiculo.address_line,
            zip_code: vehiculo.zip_code,
            subneighborhood: vehiculo.subneighborhood,
            neighborhood: vehiculo.neighborhood,
            city: vehiculo.city,
            state: vehiculo.state,
            country: vehiculo.country,
            latitude: vehiculo.latitude,
            longitude: vehiculo.longitude,
            // Campos compatibles con la interfaz anterior
            titulo: `${vehiculo.brand} ${vehiculo.model} ${vehiculo.year}`,
            ubicacion: `${vehiculo.city || ''}, ${vehiculo.state || ''}`.replace(/^, /, ''),
            sitio_web: vehiculo.siteId || 'mercadolibre',
            url_anuncio: vehiculo.permalink || ''
          }));

          // Aplicar filtros adicionales por estado si están seleccionados
          let autosFilterados = autosMapeados;
          if (estadoSeleccionado !== "todos") {
            autosFilterados = autosMapeados.filter(auto => 
              auto.state?.toLowerCase().includes(estadoSeleccionado.toLowerCase()) ||
              auto.city?.toLowerCase().includes(estadoSeleccionado.toLowerCase()) ||
              auto.ubicacion?.toLowerCase().includes(estadoSeleccionado.toLowerCase())
            );
          }

          setAutosSimilares(autosFilterados);

          // Calcular estadísticas usando datos de maxi_similar_cars
          if (autosFilterados.length > 0) {
            const precios = autosFilterados.map(auto => auto.precio).filter(p => p > 0);
            const kilometrajes = autosFilterados.map(auto => auto.kilometraje).filter(k => k > 0);

            if (precios.length > 0) {
              const promedioBruto = precios.reduce((a, b) => a + b, 0) / precios.length;
              const promedioRedondeado = Math.round(promedioBruto / 100) * 100;
              
              const estadisticasCalculadas = {
                totalAnuncios: autosFilterados.length,
                precioMinimo: Math.min(...precios),
                precioMaximo: Math.max(...precios),
                precioPromedio: promedioRedondeado,
                precioPromedioBruto: promedioBruto,
                precioRecomendado: estadisticas.precioRecomendado || promedioRedondeado,
                precioPromedioMercado: estadisticas.precioPromedioMercado || 0
              };

              setEstadisticas(prev => ({
                ...prev,
                ...estadisticasCalculadas
              }));

              // Calcular estadísticas de kilometraje
              if (kilometrajes.length > 0) {
                const promedioKm = kilometrajes.reduce((a, b) => a + b, 0) / kilometrajes.length;
                const minimoKm = Math.min(...kilometrajes);
                const maximoKm = Math.max(...kilometrajes);
                
                setEstadisticasKilometraje({
                  promedio: promedioKm,
                  minimo: minimoKm,
                  maximo: maximoKm,
                  rangoOptimo: {
                    min: Math.max(0, promedioKm - (promedioKm * 0.2)), // 20% menos del promedio
                    max: promedioKm + (promedioKm * 0.2) // 20% más del promedio
                  }
                });
              }
            }
          } else {
            console.log('No se encontraron vehículos tras aplicar filtros');
            setAutosSimilares([]);
            setEstadisticas(prev => ({
              ...prev,
              totalAnuncios: 0,
              precioMinimo: 0,
              precioMaximo: 0,
              precioPromedio: 0
            }));
          }
        } else {
          console.warn('No se encontraron datos válidos en maxi_similar_cars:', { maxiError, maxiData });
          setVehiculosSimilaresMapi(0);
          setAutosSimilares([]);
        }
      } catch (maxiErr) {
        console.error('Error al obtener datos de maxi_similar_cars:', maxiErr);
        setVehiculosSimilaresMapi(0);
        setAutosSimilares([]);
        throw maxiErr;
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
            <DebugToggle variant="button" />
            <CreditControl />
          </div>
        </div>

        {/* Vehicle Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Análisis de precio: {datos.marca} {datos.modelo} {datos.ano}</span>
              {debugMode && (
                  <DebugInfo
                    title="Datos del vehículo"
                    data={{
                      fuente: "Formulario de usuario + API MaxiPublica",
                      consulta: `getCarMarketIntelligenceData(versionId: "${datos.versionId}")`,
                      parametros: {
                        marca: datos.marca,
                        modelo: datos.modelo,
                        año: datos.ano,
                        versión: datos.version,
                        kilometraje: datos.kilometraje,
                        estado: datos.estado,
                        ciudad: datos.ciudad,
                        versionId: datos.versionId
                      },
                      calculos: [{
                        formula: "datosVehiculo = validarCatalogo(marca, modelo, año) && obtenerVersionId(version) && consultarAPI(versionId)",
                        valores: {
                          entrada_marca: datos.marca,
                          entrada_modelo: datos.modelo,
                          entrada_año: datos.ano,
                          entrada_version: datos.version,
                          versionId_obtenido: datos.versionId,
                          estado_validacion: "✓ Válido en catálogo",
                          api_consultada: "MaxiPublica getCarMarketIntelligenceData"
                        },
                        resultado: `Vehículo identificado: ${datos.marca} ${datos.modelo} ${datos.ano} (${datos.version}) - Version ID: ${datos.versionId}`
                      }],
                      datosPredecesores: [
                        {
                          fuente: "Formulario usuario",
                          valor: `${datos.marca} ${datos.modelo} ${datos.ano} - ${datos.version}`,
                          fecha: new Date().toLocaleDateString()
                        },
                        {
                          fuente: "API MaxiPublica",
                          valor: `Version ID: ${datos.versionId}`,
                          fecha: new Date().toLocaleDateString()
                        }
                      ],
                      reglasAplicadas: [
                        "Validación de marca y modelo en catálogo",
                        "Verificación de version ID válido",
                        "Aplicación de filtros por año de fabricación"
                      ],
                      procesamiento: {
                        pasos: [
                          "Recepción de datos del formulario",
                          "Validación de campos obligatorios",
                          "Búsqueda de version ID en catálogo",
                          "Consulta a API MaxiPublica para precio recomendado"
                        ],
                        filtros: [
                          "Marca y modelo exactos",
                          "Año de fabricación",
                          "Versión específica del vehículo"
                        ],
                        transformaciones: [
                          "Normalización de nombres de marca/modelo",
                          "Conversión de version ID a formato API",
                          "Estructuración de datos para análisis"
                        ]
                      },
                      observaciones: [
                        "Datos proporcionados directamente por el usuario",
                        "Version ID utilizado para consultas de API externas",
                        "Precio base obtenido de MaxiPublica como referencia principal"
                      ]
                    }}
                  />
              )}
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
            precioPromedioBruto: estadisticas.precioPromedioBruto,
            rangoMinimo: estadisticas.precioMinimo,
            rangoMaximo: estadisticas.precioMaximo,
            demanda: demandaAuto.nivel.toLowerCase().includes('alta') ? 'alta' : 
                     demandaAuto.nivel.toLowerCase().includes('baja') ? 'baja' : 'moderada',
            competencia: competenciaMercado.nivel === 'alta' || competenciaMercado.nivel === 'muy alta' || competenciaMercado.nivel === 'extrema' ? 'alta' : 
                        competenciaMercado.nivel === 'baja' || competenciaMercado.nivel === 'muy baja' ? 'baja' : 'moderada',
            vehiculosSimilares: vehiculosSimilaresMapi,
            factorCompetencia: competenciaMercado.factorCompetencia,
            coeficienteVariacion: competenciaMercado.coeficienteVariacion,
            intensidadCompetencia: competenciaMercado.intensidad,
            distribucionPrecios: distribucionPrecios
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