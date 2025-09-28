import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Car, Database, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PruebaExtraccion = () => {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [progreso, setProgreso] = useState<string>('');
  const { toast } = useToast();

  // Extracción directa y robusta de MercadoLibre
  const extraccionDirecta = async () => {
    setCargando(true);
    setResultado(null);
    setProgreso('Iniciando extracción directa de MercadoLibre...');

    try {
      setProgreso('🚀 Conectando con función de extracción...');
      
      // Use direct fetch with proper timeout
      const response = await fetch('https://qflkgtejwqudtceszguf.supabase.co/functions/v1/extraccion-directa-ml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGtndGVqd3F1ZHRjZXN6Z3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzQ4NDAsImV4cCI6MjA2OTE1MDg0MH0.23z2cICQB3TUhwC_1ncFfuv6Wm7POmUeIhp5bDMDdsU`,
        },
        body: JSON.stringify({ max_anuncios: 50 }),
        signal: AbortSignal.timeout(1200000) // 20 minutes timeout
      });

      setProgreso('📊 Procesando respuesta...');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Respuesta de extracción:", data);

      if (!data.success) {
        throw new Error(data.error || 'Error en la extracción');
      }

      setResultado({
        resultado: {
          resumen: {
            total_anuncios_procesados: data.stats?.anuncios_procesados || 0,
            total_urls_extraidas: data.stats?.urls_extraidas || 0,
            total_errores: data.stats?.errores || 0
          },
          duracion_minutos: Math.round((data.stats?.tiempo_segundos || 0) / 60)
        },
        estadisticas_bd: { total_anuncios_mercadolibre: data.stats?.total_en_bd || 0 },
        mensaje: data.message
      });
      
      const totalGuardados = data.stats?.anuncios_guardados || 0;
      const totalProcesados = data.stats?.anuncios_procesados || 0;
      
      toast({
        title: "🎉 Extracción Completada!",
        description: `${totalGuardados} anuncios guardados de ${totalProcesados} procesados`,
      });

      // Refresh page statistics
      await verEstadisticas();

    } catch (error: any) {
      console.error('Error en extracción directa:', error);
      toast({
        title: "Error en extracción",
        description: error.message || "Error al procesar la extracción",
        variant: "destructive",
      });
    } finally {
      setCargando(false);
      setProgreso('');
    }
  };

  // Extracción masiva (1000+ autos)
  const extraccionMasiva = async () => {
    setCargando(true);
    setResultado(null);
    setProgreso('Iniciando extracción masiva...');

    try {
      setProgreso('🚀 Configurando extracción masiva de todas las categorías...');
      
      const configMasiva = {
        estrategias: ['categorias'],
        max_elementos_por_estrategia: 5,
        max_paginas_por_elemento: 20,
        lote_size: 100,
        timeout_minutos: 120
      };
      
      toast({
        title: "🚀 Extracción Masiva Iniciada",
        description: "Esta operación puede tomar 1-2 horas. Procesando múltiples categorías.",
      });
      
      const { data, error } = await supabase.functions.invoke('extraccion-masiva-completa', {
        body: { configuracion: configMasiva }
      });

      if (error) {
        throw error;
      }

      setResultado(data);
      
      const totalAnuncios = data.resultado?.resumen?.total_anuncios_procesados || 0;
      const totalUrls = data.resultado?.resumen?.total_urls_extraidas || 0;
      const duracionMinutos = data.resultado?.duracion_minutos || 0;
      
      toast({
        title: "🎉 Extracción Masiva Completa",
        description: `${totalAnuncios} anuncios procesados de ${totalUrls} URLs en ${duracionMinutos} minutos`,
      });

    } catch (error: any) {
      console.error('Error en extracción masiva:', error);
      toast({
        title: "Error en extracción masiva",
        description: error.message || "La operación fue interrumpida",
        variant: "destructive",
      });
    } finally {
      setCargando(false);
      setProgreso('');
    }
  };

  // Ver estadísticas actuales
  const verEstadisticas = async () => {
    setCargando(true);
    setProgreso('Consultando estadísticas de la base de datos...');

    try {
      const { data, error } = await supabase.functions.invoke('prueba-extraccion', {
        body: {}
      });

      if (error) {
        throw error;
      }

      setResultado(data);
      
      toast({
        title: "Estadísticas actualizadas",
        description: `Base de datos con ${data.estadisticas?.anuncios_mercadolibre || 0} anuncios de MercadoLibre`,
      });

    } catch (error: any) {
      console.error('Error consultando estadísticas:', error);
      toast({
        title: "Error consultando estadísticas",
        description: error.message || "Error de conectividad",
        variant: "destructive",
      });
    } finally {
      setCargando(false);
      setProgreso('');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Sistema de Extracción MercadoLibre</h1>
          <p className="text-muted-foreground">
            Extrae datos de vehículos de forma automatizada y eficiente
          </p>
        </div>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Sistema de Extracción MercadoLibre
            </CardTitle>
            <CardDescription>
              Extrae datos de vehículos de forma automatizada y eficiente
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Progreso */}
            {progreso && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">{progreso}</span>
                </div>
              </div>
            )}

            {/* Botones principales */}
            <div className="grid gap-4">
              {/* Extracción Directa */}
              <Button 
                onClick={extraccionDirecta} 
                disabled={cargando}
                className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {cargando && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                <Car className="mr-2 h-5 w-5" />
                ✅ Extracción Directa (50 autos)
              </Button>
              
              {/* Extracción Masiva */}
              <Button 
                onClick={extraccionMasiva} 
                disabled={cargando}
                className="w-full h-16 text-lg bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {cargando && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                <Database className="mr-2 h-5 w-5" />
                🚀 Extracción Masiva (1000+ autos)
              </Button>
              
              {/* Ver Estadísticas */}
              <Button 
                onClick={verEstadisticas} 
                disabled={cargando}
                variant="outline"
                className="w-full h-12"
              >
                {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <BarChart className="mr-2 h-4 w-4" />
                📊 Estadísticas Actuales
              </Button>
            </div>
          </CardContent>
        </Card>

        {resultado && (
          <div className="space-y-4">
            {/* Estadísticas generales */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {resultado.estadisticas?.total_anuncios || resultado.estadisticas_bd?.total_anuncios_mercadolibre || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Anuncios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {resultado.estadisticas?.anuncios_mercadolibre || resultado.estadisticas_bd?.total_anuncios_mercadolibre || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">MercadoLibre</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {resultado.resultado?.resumen?.total_anuncios_procesados || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Procesados</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultados de la última extracción */}
            {resultado.resultado && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    Resultado de la Última Extracción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {resultado.resultado.resumen?.total_urls_extraidas || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">URLs Extraídas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {resultado.resultado.resumen?.total_anuncios_procesados || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Procesados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {resultado.resultado.resumen?.total_errores || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Errores</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {resultado.resultado.duracion_minutos || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Minutos</div>
                    </div>
                  </div>
                  
                  {resultado.mensaje && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{resultado.mensaje}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Últimos anuncios */}
            {(resultado.estadisticas?.ultimos_anuncios?.length > 0 || resultado.estadisticas_bd?.ultimos_anuncios?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Últimos Anuncios Extraídos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(resultado.estadisticas?.ultimos_anuncios || resultado.estadisticas_bd?.ultimos_anuncios || []).slice(0, 5).map((anuncio: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{anuncio.titulo || 'Sin título'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {anuncio.marca || 'N/A'} {anuncio.modelo || 'N/A'} {anuncio.ano || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-md">
                              {anuncio.url_anuncio}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              ${anuncio.precio?.toLocaleString() || anuncio.precio || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {anuncio.kilometraje ? `${anuncio.kilometraje.toLocaleString()} km` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PruebaExtraccion;