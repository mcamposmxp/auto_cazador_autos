import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCreditControl } from './useCreditControl';
import { useAIPerformanceMonitor } from './useAIPerformanceMonitor';

interface DatosVehiculo {
  marca: string;
  modelo: string;
  ano: number;
  kilometraje: number;
  estado: string;
  ciudad: string;
}

interface EstadisticasMercado {
  demanda: string;
  competencia: string;
  tendencia: string;
}

interface ResultadoTiempoIA {
  tiempoEstimado: number;
  velocidadVenta: 'rapida' | 'moderada' | 'lenta';
  explicacion: string;
  consejos: string[];
  factores: {
    precio: string;
    demanda: string;
    competencia: string;
    condicion: string;
  };
}

interface UseTiempoVentaIA {
  resultado: ResultadoTiempoIA | null;
  isLoading: boolean;
  error: string | null;
  calcularTiempo: (
    precioSeleccionado: number,
    precioRecomendado: number,
    datosVehiculo: DatosVehiculo,
    estadisticasMercado?: EstadisticasMercado
  ) => Promise<void>;
}

// Cache para evitar llamadas repetidas
const cache = new Map<string, ResultadoTiempoIA>();

export const useTiempoVentaIA = (): UseTiempoVentaIA => {
  const [resultado, setResultado] = useState<ResultadoTiempoIA | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { checkCredits, consumeCredits, showUpgradeDialog } = useCreditControl();
  const { recordRequest, recordSuccess, recordError } = useAIPerformanceMonitor();

  const calcularTiempo = useCallback(async (
    precioSeleccionado: number,
    precioRecomendado: number,
    datosVehiculo: DatosVehiculo,
    estadisticasMercado?: EstadisticasMercado
  ) => {
    // Crear clave para cache
    const cacheKey = `${precioSeleccionado}-${precioRecomendado}-${datosVehiculo.marca}-${datosVehiculo.modelo}-${datosVehiculo.ano}`;
    
    // Verificar cache
    if (cache.has(cacheKey)) {
      const requestId = recordRequest('tiempo-venta', true);
      recordSuccess(requestId);
      setResultado(cache.get(cacheKey)!);
      return;
    }

    // Check if user has credits for AI analysis
    const hasCredits = await checkCredits();
    if (!hasCredits) {
      // Return fallback without consuming credits
      const fallback: ResultadoTiempoIA = {
        tiempoEstimado: 30,
        velocidadVenta: 'moderada',
        explicacion: 'Estimación aproximada (créditos insuficientes para análisis de IA)',
        consejos: [
          'Regístrate o actualiza tu plan para obtener análisis detallados de IA.',
          'Mantén un precio competitivo dentro del rango promedio del mercado.',
          'El precio final de venta dependerá del estado específico de tu auto.'
        ],
        factores: {
          precio: 'Normal',
          demanda: 'Media',
          competencia: 'Media',
          condicion: datosVehiculo.estado
        }
      };
      setResultado(fallback);
      return;
    }

    setIsLoading(true);
    setError(null);

    const requestId = recordRequest('tiempo-venta', false);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('calcular-tiempo-venta-ia', {
        body: {
          precioSeleccionado,
          precioRecomendado,
          datosVehiculo,
          estadisticasMercado
        }
      });

      if (functionError) {
        console.error('Error calling AI function:', functionError);
        throw new Error('Error al calcular tiempo de venta');
      }

      if (!data) {
        throw new Error('No se recibió respuesta del servicio');
      }

      // Consume credits for AI analysis
      await consumeCredits(1, 'ai_analysis', 'search', {
        marca: datosVehiculo.marca,
        modelo: datosVehiculo.modelo,
        ano: datosVehiculo.ano,
        precio_seleccionado: precioSeleccionado,
        precio_recomendado: precioRecomendado
      });

      // Guardar en cache
      cache.set(cacheKey, data);
      setResultado(data);
      recordSuccess(requestId, data);

    } catch (err) {
      console.error('Error en useTiempoVentaIA:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      recordError(requestId, errorMessage);
      
      // Fallback local
      const fallback: ResultadoTiempoIA = {
        tiempoEstimado: 30,
        velocidadVenta: 'moderada',
        explicacion: 'Estimación aproximada (servicio no disponible)',
        consejos: [
          'Mantén un precio competitivo dentro del rango promedio del mercado.',
          'Conserva el vehículo en excelentes condiciones para evitar reducciones significativas en el precio.',
          'El kilometraje muestra el uso del auto, pero el cuidado y las condiciones generales son factores clave para determinar su valor real.',
          'El precio final de venta dependerá del estado específico de tu auto.'
        ],
        factores: {
          precio: 'Normal',
          demanda: 'Media',
          competencia: 'Media',
          condicion: datosVehiculo.estado
        }
      };
      setResultado(fallback);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    resultado,
    isLoading,
    error,
    calcularTiempo
  };
};