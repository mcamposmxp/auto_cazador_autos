import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingDown, 
  Camera, 
  FileText, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface RecomendacionesIAProps {
  anuncio: {
    id: string;
    marca: string;
    modelo: string;
    ano: number;
    kilometraje: number;
    precio: number;
    estado: string;
    descripcion?: string;
    imagenes?: string[];
    ciudad?: string;
    created_at?: string;
  };
  datosMercado?: {
    precioPromedio: number;
    competencia: number;
    demanda: string;
  };
}

interface Recomendacion {
  tipo: 'precio' | 'fotos' | 'descripcion' | 'mercado' | 'tiempo' | 'posicionamiento';
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  accion: string;
  impacto: string;
}

const iconosRecomendacion = {
  precio: TrendingDown,
  fotos: Camera,
  descripcion: FileText,
  mercado: Users,
  tiempo: Clock,
  posicionamiento: DollarSign
};

const coloresPrioridad = {
  alta: 'destructive',
  media: 'default',
  baja: 'secondary'
} as const;

export const RecomendacionesIA: React.FC<RecomendacionesIAProps> = ({ 
  anuncio, 
  datosMercado 
}) => {
  // Generar recomendaciones fallback inmediatamente al instanciar el componente
  const recomendacionesIniciales = useMemo(() => {
    const recomendaciones: Recomendacion[] = [];

    // Calcular días en mercado desde fecha de publicación
    const diasEnMercado = anuncio.created_at ? 
      Math.floor((Date.now() - new Date(anuncio.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Recomendaciones basadas en antigüedad del anuncio (SIEMPRE mostrar)
    if (diasEnMercado >= 90) {
      recomendaciones.push({
        tipo: 'tiempo',
        prioridad: 'alta',
        titulo: 'Acción inmediata requerida',
        descripcion: `Tu ${anuncio.marca} ${anuncio.modelo} lleva ${diasEnMercado} días sin venderse. Es crítico tomar acción.`,
        accion: 'Enviar urgentemente a red de profesionales o subasta',
        impacto: 'Evita pérdida mayor de valor y tiempo'
      });
    } else if (diasEnMercado >= 60) {
      recomendaciones.push({
        tipo: 'tiempo',
        prioridad: 'alta',
        titulo: 'Considerar alternativas de venta',
        descripcion: `${diasEnMercado} días en mercado indica necesidad de cambio de estrategia.`,
        accion: 'Enviar a la red de profesionales o considerar subasta',
        impacto: 'Acelera significativamente el proceso de venta'
      });
    } else if (diasEnMercado >= 45) {
      recomendaciones.push({
        tipo: 'tiempo',
        prioridad: 'alta',
        titulo: 'Optimización urgente necesaria',
        descripcion: `${diasEnMercado} días en mercado. Tiempo de hacer cambios agresivos.`,
        accion: 'Reducir precio 8-12% y evaluar red de profesionales',
        impacto: 'Previene llegar a la zona crítica de +60 días'
      });
    } else if (diasEnMercado >= 30) {
      recomendaciones.push({
        tipo: 'tiempo',
        prioridad: 'media',
        titulo: 'Revisar estrategia de venta',
        descripcion: `${diasEnMercado} días sin venta. Es momento de ajustes importantes.`,
        accion: 'Reducir precio 5-7% y mejorar fotos/descripción',
        impacto: 'Evita que el anuncio se perciba como problemático'
      });
    } else if (diasEnMercado >= 15) {
      recomendaciones.push({
        tipo: 'tiempo',
        prioridad: 'media',
        titulo: 'Ajustes preventivos recomendados',
        descripcion: `${diasEnMercado} días en mercado. Buen momento para optimizar.`,
        accion: 'Revisar precio competitivo y mejorar presentación',
        impacto: 'Mantiene momentum antes de la zona de riesgo'
      });
    } else if (diasEnMercado >= 7) {
      recomendaciones.push({
        tipo: 'tiempo',
        prioridad: 'baja',
        titulo: 'Monitoreo semanal',
        descripcion: `${diasEnMercado} días publicado. Tiempo normal, pero vigila el progreso.`,
        accion: 'Evaluar respuesta del mercado y pequeños ajustes',
        impacto: 'Optimización temprana para mejor resultado'
      });
    } else {
      recomendaciones.push({
        tipo: 'tiempo',
        prioridad: 'baja',
        titulo: 'Anuncio reciente',
        descripcion: `${diasEnMercado} días publicado. Dale tiempo al mercado para responder.`,
        accion: 'Monitorear métricas y preparar ajustes si es necesario',
        impacto: 'Establece bases para seguimiento efectivo'
      });
    }

    // Análisis de precio basado en datos de mercado
    if (datosMercado && anuncio.precio > datosMercado.precioPromedio * 1.12) {
      recomendaciones.push({
        tipo: 'precio',
        prioridad: 'alta',
        titulo: 'Precio por encima del mercado',
        descripcion: `Tu ${anuncio.marca} ${anuncio.modelo} está ${((anuncio.precio / datosMercado.precioPromedio - 1) * 100).toFixed(1)}% por encima del promedio de mercado`,
        accion: `Considera reducir el precio a $${Math.round(datosMercado.precioPromedio).toLocaleString()}`,
        impacto: 'Alto potencial de incrementar interés de compradores'
      });
    } else if (datosMercado && anuncio.precio < datosMercado.precioPromedio * 0.9) {
      recomendaciones.push({
        tipo: 'precio',
        prioridad: 'baja',
        titulo: 'Precio competitivo',
        descripcion: `Tu ${anuncio.marca} ${anuncio.modelo} tiene un precio ${((1 - anuncio.precio / datosMercado.precioPromedio) * 100).toFixed(1)}% por debajo del promedio`,
        accion: 'Podrías aumentar ligeramente el precio (2-3%)',
        impacto: 'Potencial de mayor rentabilidad'
      });
    } else if (datosMercado) {
      recomendaciones.push({
        tipo: 'precio',
        prioridad: 'baja',
        titulo: 'Precio alineado al mercado',
        descripcion: `Tu precio está cercano al promedio (${Math.round(datosMercado.precioPromedio).toLocaleString()})`,
        accion: 'Mantener precio y optimizar presentación',
        impacto: 'Mantiene visibilidad y conversión'
      });
    }

    // Análisis de fotos específico por vehículo
    const cantidadImagenes = anuncio.imagenes?.length || 0;
    if (cantidadImagenes < 5) {
      const esLujo = anuncio.precio > 300000 || anuncio.marca.toLowerCase().includes('bmw') || anuncio.marca.toLowerCase().includes('mercedes') || anuncio.marca.toLowerCase().includes('audi');
      recomendaciones.push({
        tipo: 'fotos',
        prioridad: esLujo ? 'alta' : 'media',
        titulo: cantidadImagenes === 0 ? 'Sin fotografías' : 'Pocas fotografías',
        descripcion: `Tu ${anuncio.marca} ${anuncio.modelo} ${anuncio.ano} solo tiene ${cantidadImagenes} foto${cantidadImagenes !== 1 ? 's' : ''}. ${esLujo ? 'Vehículos premium necesitan 10+ fotos' : 'Se recomiendan 8-10 fotos'}`,
        accion: `Agregar ${esLujo ? Math.max(10 - cantidadImagenes, 5) : Math.max(8 - cantidadImagenes, 3)} fotos más`,
        impacto: `${esLujo ? 'Crítico' : 'Importante'} para generar confianza del comprador`
      });
    }

    // Análisis de descripción específico
    const descripcionLength = anuncio.descripcion?.length || 0;
    if (descripcionLength < 50) {
      const esComplejo = anuncio.kilometraje > 100000 || anuncio.ano < 2018;
      recomendaciones.push({
        tipo: 'descripcion',
        prioridad: esComplejo ? 'alta' : 'media',
        titulo: descripcionLength === 0 ? 'Sin descripción' : 'Descripción muy corta',
        descripcion: `Tu ${anuncio.marca} ${anuncio.modelo} necesita más detalles. ${esComplejo ? 'Vehículos con más años/km requieren explicaciones detalladas' : 'Una buena descripción aumenta la confianza'}`,
        accion: `Agregar detalles sobre ${esComplejo ? 'historial de mantenimiento, estado real' : 'características y condición'}`,
        impacto: 'Reduce dudas y aumenta conversión significativamente'
      });
    }

    // Análisis de kilometraje: alto o bajo
    const kmPromedioPorAno = Math.max(15000, (new Date().getFullYear() - anuncio.ano) * 15000);
    if (anuncio.kilometraje > kmPromedioPorAno * 1.4) {
      recomendaciones.push({
        tipo: 'posicionamiento',
        prioridad: 'media',
        titulo: 'Kilometraje alto para el año',
        descripcion: `Tu ${anuncio.marca} ${anuncio.modelo} ${anuncio.ano} tiene ${anuncio.kilometraje.toLocaleString()} km, por encima del promedio esperado`,
        accion: 'Destacar mantenimiento, reparaciones y pruebas mecánicas',
        impacto: 'Mitiga preocupaciones sobre el alto kilometraje'
      });
    } else if (anuncio.kilometraje < kmPromedioPorAno * 0.7) {
      recomendaciones.push({
        tipo: 'posicionamiento',
        prioridad: 'baja',
        titulo: 'Kilometraje bajo destacado',
        descripcion: `${anuncio.kilometraje.toLocaleString()} km es bajo para un ${anuncio.ano}.`,
        accion: 'Resaltar uso moderado y estado interior/exterior',
        impacto: 'Aumenta disposición a pagar mejor precio'
      });
    }

    // Demanda y competencia
    if (datosMercado) {
      if (datosMercado.demanda === 'alta') {
        recomendaciones.push({
          tipo: 'posicionamiento',
          prioridad: 'media',
          titulo: 'Demanda alta en tu segmento',
          descripcion: `Aprovecha la demanda para destacar ventajas competitivas`,
          accion: 'Mejorar fotos y validar precio ligeramente al alza (1-2%)',
          impacto: 'Mayor interés y mejores ofertas'
        });
      } else if (datosMercado.demanda === 'baja') {
        recomendaciones.push({
          tipo: 'posicionamiento',
          prioridad: 'alta',
          titulo: 'Demanda baja actualmente',
          descripcion: 'Se requiere optimizar precio y presentación para destacar',
          accion: 'Reducir precio 3-5% y mejorar descripción/fotos',
          impacto: 'Aumenta visibilidad en listados'
        });
      }

      if (datosMercado.competencia > 12) {
        recomendaciones.push({
          tipo: 'posicionamiento',
          prioridad: 'media',
          titulo: 'Alta competencia en tu zona',
          descripcion: `Compites con ~${datosMercado.competencia} anuncios similares`,
          accion: 'Destacar equipamiento único y condiciones favorables',
          impacto: 'Mejora tasa de clics y contactos'
        });
      } else if (datosMercado.competencia < 5) {
        recomendaciones.push({
          tipo: 'posicionamiento',
          prioridad: 'baja',
          titulo: 'Baja competencia',
          descripcion: 'Pocos anuncios similares activos',
          accion: 'Mantener precio actual y calidad de anuncio',
          impacto: 'Sostiene buen posicionamiento'
        });
      }
    }

    // Siempre agregar al menos una recomendación útil si no hay ninguna
    if (recomendaciones.length === 0) {
      recomendaciones.push({
        tipo: 'fotos',
        prioridad: 'media',
        titulo: 'Optimizar presentación',
        descripcion: `Tu ${anuncio.marca} ${anuncio.modelo} ${anuncio.ano} puede destacar más con mejores fotos`,
        accion: 'Tomar fotos en diferentes ángulos y con buena iluminación',
        impacto: 'Incrementa significativamente el interés de compradores'
      });
    }

    return recomendaciones;
  }, [anuncio.imagenes?.length, anuncio.descripcion?.length, anuncio.marca, anuncio.modelo, anuncio.ano, anuncio.precio, anuncio.kilometraje, anuncio.created_at, datosMercado?.precioPromedio, datosMercado?.demanda, datosMercado?.competencia]);

  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>(recomendacionesIniciales);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [source, setSource] = useState<'fallback' | 'ai'>('fallback');

  const generarRecomendaciones = useCallback(async () => {
    if (isAIGenerating) return; // Prevenir múltiples llamadas simultáneas
    setError(null);
    setIsAIGenerating(true);

    try {
      // Verificar caché primero
      const cacheKey = `recomendaciones_${anuncio.id}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheExpiry = localStorage.getItem(`${cacheKey}_expiry`);
      
      if (cached && cacheExpiry && new Date().getTime() < parseInt(cacheExpiry)) {
        const cachedData = JSON.parse(cached);
        // Solo usar caché si tiene recomendaciones reales, no mensajes de progreso
        if (cachedData.recomendaciones && Array.isArray(cachedData.recomendaciones) && cachedData.recomendaciones.length > 0) {
          const tieneRecomendacionesReales = cachedData.recomendaciones.every((rec: any) => 
            rec.titulo && rec.descripcion && rec.accion && rec.titulo !== 'Análisis en progreso'
          );
          
          if (tieneRecomendacionesReales) {
            setRecomendaciones(cachedData.recomendaciones);
            setSource('ai');
            setIsAIGenerating(false);
            return;
          }
        }
      }

      // Preparar datos para la IA
      const datosParaIA = {
        vehiculo: {
          marca: anuncio.marca,
          modelo: anuncio.modelo,
          ano: anuncio.ano,
          kilometraje: anuncio.kilometraje,
          precio: anuncio.precio,
          descripcion: anuncio.descripcion || '',
          cantidadImagenes: anuncio.imagenes?.length || 0,
          ciudad: anuncio.ciudad || 'No especificada'
        },
        mercado: {
          precioPromedio: datosMercado?.precioPromedio || anuncio.precio,
          competencia: datosMercado?.competencia || 0,
          demanda: datosMercado?.demanda || 'media'
        },
        contexto: {
          fechaAnalisis: new Date().toISOString().split('T')[0],
          diasEnMercado: anuncio.created_at ? 
            Math.floor((Date.now() - new Date(anuncio.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
        }
      };

      const { data, error: functionError } = await supabase.functions.invoke('generar-recomendaciones-ia', {
        body: datosParaIA
      });

      logger.debug('Respuesta de IA:', data);

      // Solo actualizar si tenemos recomendaciones reales válidas
      if (!functionError && data?.recomendaciones && Array.isArray(data.recomendaciones) && data.recomendaciones.length > 0) {
        const tieneRecomendacionesReales = data.recomendaciones.every((rec: any) => 
          rec.titulo && rec.descripcion && rec.accion && 
          rec.titulo !== 'Análisis en progreso' &&
          !rec.titulo.toLowerCase().includes('procesando') &&
          !rec.titulo.toLowerCase().includes('generando')
        );
        
        if (tieneRecomendacionesReales) {
          setRecomendaciones(data.recomendaciones);
          setSource('ai');
          
          // Guardar en caché por 1 hora
          const expiryTime = new Date().getTime() + (60 * 60 * 1000);
          localStorage.setItem(cacheKey, JSON.stringify(data));
          localStorage.setItem(`${cacheKey}_expiry`, expiryTime.toString());
          // Recomendaciones IA aplicadas correctamente
        } else {
          // IA devolvió mensajes de progreso, manteniendo fallback
        }
      } else if (functionError) {
        logger.warn('Error en IA, manteniendo fallback:', functionError.message);
        setError('Las recomendaciones de IA no están disponibles temporalmente');
      }
    } catch (err) {
      logger.error('Error generando recomendaciones:', err);
      setError('Error al generar recomendaciones con IA');
    } finally {
      setIsAIGenerating(false);
    }
  }, [anuncio.id, isAIGenerating, datosMercado]);

  useEffect(() => {
    // Asegurar que las recomendaciones iniciales estén cargadas
    // Recomendaciones iniciales cargadas
    setRecomendaciones(recomendacionesIniciales);
    setSource('fallback');
    
    // Intentar generar con IA en background - solo una vez por anuncio
    const timeoutId = setTimeout(() => {
      generarRecomendaciones();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [anuncio.id]);

  // Eliminar el estado de loading para mostrar recomendaciones inmediatamente
  
  if (error && recomendaciones.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <span className="text-sm text-muted-foreground">{error}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={generarRecomendaciones}
          className="ml-auto"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  // Estado del componente actualizado

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Recomendaciones {source === 'ai' ? 'IA' : 'Básicas'}
          </span>
          {isAIGenerating && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 animate-spin" />
              <span>Optimizando con IA...</span>
            </div>
          )}
          {error && source === 'fallback' && (
            <Badge variant="outline" className="text-xs">
              Modo offline
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={generarRecomendaciones}
          disabled={isLoading || isAIGenerating}
        >
          Actualizar
        </Button>
      </div>
      
      {recomendaciones.length === 0 ? (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm text-muted-foreground">
            ¡Excelente! Tu anuncio está bien optimizado
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {recomendaciones.map((rec, index) => {
            const IconComponent = iconosRecomendacion[rec.tipo];
            return (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <IconComponent className="h-4 w-4 mt-0.5 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{rec.titulo}</span>
                    <Badge variant={coloresPrioridad[rec.prioridad]} className="text-xs">
                      {rec.prioridad}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {rec.descripcion}
                  </p>
                  <div className="text-xs">
                    <span className="font-medium text-primary">{rec.accion}</span>
                    {rec.impacto && (
                      <span className="text-muted-foreground"> • {rec.impacto}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};