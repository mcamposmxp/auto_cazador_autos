import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from '@/hooks/useAuthSession';

interface InteraccionProfesionalB2B {
  id: string;
  profesional_iniciador_id: string;
  profesional_receptor_id: string;
  auto_inventario_id: string;
  primera_interaccion: string;
  telefono_revelado: boolean;
  elegible_evaluacion: boolean;
  fecha_limite_evaluacion: string;
  evaluaciones_reveladas: boolean;
  created_at: string;
  updated_at: string;
}

interface EvaluacionPendiente {
  id: string;
  interaccion_id: string;
  evaluador_id: string;
  evaluado_id: string;
  tipo_interaccion: 'compra' | 'venta';
  calificacion: number;
  aspectos: any;
  comentario?: string;
  fecha_evaluacion: string;
  revelada: boolean;
}

interface AutoParaInteraccion {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  precio_actual: number;
  imagen_url?: string;
  profesional_propietario: {
    id: string;
    negocio_nombre: string;
    telefono?: string;
  };
  interaccion?: InteraccionProfesionalB2B;
  mensajes_count: number;
  ultimo_mensaje?: string;
}

export function useMensajeriaProfesional() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthSession();

  const obtenerMiProfesionalId = async (): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('profesionales')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error obteniendo profesional ID:', error);
      return null;
    }
  };

  const obtenerAutosDisponibles = async (): Promise<AutoParaInteraccion[]> => {
    setCargando(true);
    setError(null);
    
    try {
      const miProfesionalId = await obtenerMiProfesionalId();
      if (!miProfesionalId) return [];

      // Obtener autos de otros profesionales (excluyendo los propios)
      const { data: autos, error: autosError } = await supabase
        .from('autos_profesional_inventario')
        .select(`
          id,
          marca,
          modelo,
          ano,
          precio_actual,
          imagen_url,
          profesional_id
        `)
        .eq('estado', 'activo')
        .neq('profesional_id', miProfesionalId);

      if (autosError) throw autosError;

      // Obtener datos de profesionales por separado
      const profesionalIds = (autos || []).map(auto => auto.profesional_id);
      const { data: profesionales } = await supabase
        .from('profesionales')
        .select('id, negocio_nombre, telefono')
        .in('id', profesionalIds);

      const profesionalesMap = Object.fromEntries(
        (profesionales || []).map(p => [p.id, p])
      );

      // Para cada auto, verificar si hay interacción existente
      const autosConInteraccion = await Promise.all(
        (autos || []).map(async (auto) => {
          const profesional = profesionalesMap[auto.profesional_id];
          
          // Buscar interacción existente
          const { data: interaccion } = await supabase
            .from('interacciones_profesional_profesional')
            .select('*')
            .eq('auto_inventario_id', auto.id)
            .or(`profesional_iniciador_id.eq.${miProfesionalId},profesional_receptor_id.eq.${miProfesionalId}`)
            .single();

          // Contar mensajes si hay interacción
          let mensajesCount = 0;
          let ultimoMensaje = '';

          if (interaccion) {
            const { data: mensajes } = await supabase
              .from('mensajes_profesional_profesional')
              .select('mensaje, created_at')
              .eq('interaccion_id', interaccion.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (mensajes && mensajes.length > 0) {
              const { count } = await supabase
                .from('mensajes_profesional_profesional')
                .select('*', { count: 'exact', head: true })
                .eq('interaccion_id', interaccion.id);

              mensajesCount = count || 0;
              ultimoMensaje = mensajes[0].mensaje;
            }
          }

          return {
            id: auto.id,
            marca: auto.marca,
            modelo: auto.modelo,
            ano: auto.ano,
            precio_actual: auto.precio_actual,
            imagen_url: auto.imagen_url,
            profesional_propietario: {
              id: profesional?.id || auto.profesional_id,
              negocio_nombre: profesional?.negocio_nombre || 'Profesional',
              telefono: profesional?.telefono,
            },
            interaccion,
            mensajes_count: mensajesCount,
            ultimo_mensaje: ultimoMensaje
          };
        })
      );

      return autosConInteraccion;
    } catch (error) {
      console.error('Error obteniendo autos disponibles:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      return [];
    } finally {
      setCargando(false);
    }
  };

  const iniciarInteraccion = async (autoInventarioId: string): Promise<string | null> => {
    setCargando(true);
    setError(null);

    try {
      const miProfesionalId = await obtenerMiProfesionalId();
      if (!miProfesionalId) throw new Error('No se encontró el profesional');

      // Obtener el propietario del auto
      const { data: auto, error: autoError } = await supabase
        .from('autos_profesional_inventario')
        .select('profesional_id')
        .eq('id', autoInventarioId)
        .single();

      if (autoError) throw autoError;

      // Crear interacción
      const { data: interaccion, error: interaccionError } = await supabase
        .from('interacciones_profesional_profesional')
        .insert({
          profesional_iniciador_id: miProfesionalId,
          profesional_receptor_id: auto.profesional_id,
          auto_inventario_id: autoInventarioId
        })
        .select()
        .single();

      if (interaccionError) throw interaccionError;

      return interaccion.id;
    } catch (error) {
      console.error('Error iniciando interacción:', error);
      setError(error instanceof Error ? error.message : 'Error iniciando interacción');
      return null;
    } finally {
      setCargando(false);
    }
  };

  const obtenerInteraccionesPendientesEvaluacion = async (): Promise<any[]> => {
    setCargando(true);
    setError(null);

    try {
      const miProfesionalId = await obtenerMiProfesionalId();
      if (!miProfesionalId) return [];

      const { data, error } = await supabase
        .from('interacciones_profesional_profesional')
        .select(`
          *,
          autos_profesional_inventario:auto_inventario_id(
            marca,
            modelo,
            ano,
            precio_actual
          )
        `)
        .eq('elegible_evaluacion', true)
        .eq('evaluaciones_reveladas', false)
        .or(`profesional_iniciador_id.eq.${miProfesionalId},profesional_receptor_id.eq.${miProfesionalId}`);

      if (error) throw error;

      // Obtener nombres de profesionales por separado
      const profesionalIds = (data || []).reduce((acc: string[], item) => {
        acc.push(item.profesional_iniciador_id, item.profesional_receptor_id);
        return acc;
      }, []);

      const { data: profesionales } = await supabase
        .from('profesionales')
        .select('id, negocio_nombre')
        .in('id', profesionalIds);

      const profesionalesMap = Object.fromEntries(
        (profesionales || []).map(p => [p.id, p])
      );

      // Verificar cuáles ya tienen evaluación del usuario actual
      const interaccionesConEstado = await Promise.all(
        (data || []).map(async (interaccion) => {
          const { data: evaluacionExistente } = await supabase
            .from('evaluaciones_profesional_pendientes')
            .select('id, calificacion, comentario')
            .eq('interaccion_id', interaccion.id)
            .eq('evaluador_id', miProfesionalId)
            .single();

          const profesionalIniciador = profesionalesMap[interaccion.profesional_iniciador_id];
          const profesionalReceptor = profesionalesMap[interaccion.profesional_receptor_id];

          return {
            ...interaccion,
            mi_evaluacion_existente: evaluacionExistente,
            es_iniciador: interaccion.profesional_iniciador_id === miProfesionalId,
            nombre_otro_profesional: interaccion.profesional_iniciador_id === miProfesionalId 
              ? profesionalReceptor?.negocio_nombre || 'Profesional'
              : profesionalIniciador?.negocio_nombre || 'Profesional'
          };
        })
      );

      return interaccionesConEstado;
    } catch (error) {
      console.error('Error obteniendo interacciones para evaluación:', error);
      setError(error instanceof Error ? error.message : 'Error obteniendo interacciones');
      return [];
    } finally {
      setCargando(false);
    }
  };

  const crearEvaluacionPendiente = async (evaluacion: {
    interaccion_id: string;
    evaluado_id: string;
    tipo_interaccion: 'compra' | 'venta';
    calificacion: number;
    aspectos?: any;
    comentario?: string;
  }): Promise<boolean> => {
    setCargando(true);
    setError(null);

    try {
      const miProfesionalId = await obtenerMiProfesionalId();
      if (!miProfesionalId) throw new Error('No se encontró el profesional');

      const { error } = await supabase
        .from('evaluaciones_profesional_pendientes')
        .insert({
          ...evaluacion,
          evaluador_id: miProfesionalId
        });

      if (error) throw error;

      // Award credits for evaluation if it has a comment
      if (evaluacion.comentario && evaluacion.comentario.trim().length > 0) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: rewardData } = await supabase.functions.invoke('award-evaluation-credits', {
              body: {
                user_id: user.id,
                interaction_type: 'profesional_profesional',
                interaction_id: evaluacion.interaccion_id,
                evaluation_has_comment: true
              }
            });

            if (rewardData?.success) {
              console.log(`Credits awarded: ${rewardData.credits_awarded}`);
            }
          }
        } catch (rewardError) {
          console.log('Could not award credits:', rewardError);
        }
      }

      // Ejecutar función para verificar si se deben revelar evaluaciones
      await supabase.rpc('verificar_y_revelar_evaluaciones');

      return true;
    } catch (error) {
      console.error('Error creando evaluación:', error);
      setError(error instanceof Error ? error.message : 'Error creando evaluación');
      return false;
    } finally {
      setCargando(false);
    }
  };

  const obtenerEvaluacionesReveladas = async (): Promise<any[]> => {
    setCargando(true);
    setError(null);

    try {
      const miProfesionalId = await obtenerMiProfesionalId();
      if (!miProfesionalId) return [];

      const { data, error } = await supabase
        .from('reviews_profesional_profesional')
        .select(`
          *,
          profesional_evaluador:profesional_evaluador_id(
            negocio_nombre
          ),
          profesional_evaluado:profesional_evaluado_id(
            negocio_nombre
          )
        `)
        .or(`profesional_evaluador_id.eq.${miProfesionalId},profesional_evaluado_id.eq.${miProfesionalId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo evaluaciones reveladas:', error);
      setError(error instanceof Error ? error.message : 'Error obteniendo evaluaciones');
      return [];
    } finally {
      setCargando(false);
    }
  };

  return {
    cargando,
    error,
    obtenerMiProfesionalId,
    obtenerAutosDisponibles,
    iniciarInteraccion,
    obtenerInteraccionesPendientesEvaluacion,
    crearEvaluacionPendiente,
    obtenerEvaluacionesReveladas
  };
}