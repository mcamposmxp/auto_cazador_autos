import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAsyncOperation } from "@/hooks/useAsyncOperation";
import { Json } from "@/integrations/supabase/types";

export interface ReviewProfesional {
  id: string;
  profesional_id: string;
  cliente_id: string;
  oferta_id: string;
  calificacion: number;
  comentario?: string;
  aspectos: Json;
  created_at: string;
  updated_at: string;
  pendiente?: boolean;
  cliente?: {
    nombre_apellido: string;
  };
}

export interface StatsProfesional {
  id: string;
  profesional_id: string;
  calificacion_promedio: number;
  total_reviews: number;
  total_ofertas_enviadas: number;
  total_ofertas_aceptadas: number;
  tasa_respuesta: number;
  badge_confianza: string;
}

export interface OfertaParaReview {
  id: string;
  auto_venta_id: string;
  profesional_id: string;
  monto_oferta: number;
  estado: string;
  created_at: string;
  profesional?: {
    negocio_nombre: string;
    telefono?: string;
  };
  auto_venta?: {
    marca: string;
    modelo: string;
    ano: number;
  };
  review_existente?: ReviewProfesional;
}

export function useReviewsProfesionales() {
  const [reviews, setReviews] = useState<ReviewProfesional[]>([]);
  const [statsProf, setStatsProf] = useState<StatsProfesional | null>(null);
  const [ofertasParaReview, setOfertasParaReview] = useState<OfertaParaReview[]>([]);

  const { execute, loading } = useAsyncOperation({
    errorMessage: "Error en la operación de reviews"
  });

  const obtenerReviewsProfesional = useCallback(async (profesionalId: string) => {
    return await execute(async () => {
      const { data: reviewsData, error } = await supabase
        .from('reviews_profesionales')
        .select('*')
        .eq('profesional_id', profesionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener datos de clientes por separado
      const reviewsConClientes = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: clienteData } = await supabase
            .from('clientes')
            .select('nombre_apellido')
            .eq('id', review.cliente_id)
            .single();

          return {
            ...review,
            cliente: clienteData
          };
        })
      );

      setReviews(reviewsConClientes);
      return reviewsConClientes;
    });
  }, [execute]);

  const obtenerStatsProfesional = useCallback(async (profesionalId: string) => {
    return await execute(async () => {
      const { data, error } = await supabase
        .from('stats_profesionales')
        .select('*')
        .eq('profesional_id', profesionalId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setStatsProf(data);
      return data;
    });
  }, [execute]);

  const obtenerOfertasParaReview = useCallback(async (clienteId: string) => {
    return await execute(async () => {
      // Obtenemos profesionales para evaluar basados en interacciones
      const { data, error } = await supabase
        .from('interacciones_profesionales')
        .select(`
          id,
          oferta_id,
          profesional_id,
          primera_interaccion,
          evaluaciones_reveladas
        `)
        .eq('cliente_id', clienteId)
        .eq('elegible_evaluacion', true);

      if (error) throw error;

      // Obtener los datos relacionados por separado
      const ofertasCompletas = await Promise.all(
        (data || []).map(async (interaccion) => {
          const [ofertaData, profesionalData, autoData, reviewData, evaluacionPendiente] = await Promise.all([
            supabase
              .from('ofertas')
              .select('id, monto_oferta, estado, created_at, auto_venta_id')
              .eq('id', interaccion.oferta_id)
              .single(),
            supabase
              .from('profesionales')
              .select('negocio_nombre, telefono')
              .eq('id', interaccion.profesional_id)
              .single(),
            supabase
              .from('autos_venta')
              .select('marca, modelo, ano')
              .eq('id', interaccion.oferta_id)
              .single(),
            supabase
              .from('reviews_profesionales')
              .select('*')
              .eq('oferta_id', interaccion.oferta_id)
              .eq('cliente_id', clienteId)
              .maybeSingle(),
            supabase
              .from('evaluaciones_cliente_profesional_pendientes')
              .select('*')
              .eq('interaccion_id', interaccion.id)
              .eq('evaluador_id', clienteId)
              .eq('tipo_evaluador', 'cliente')
              .maybeSingle()
          ]);

          // Si la oferta no existe, usar datos por defecto
          const oferta = ofertaData.data || {
            id: interaccion.oferta_id,
            monto_oferta: 0,
            estado: 'interaccion',
            created_at: interaccion.primera_interaccion,
            auto_venta_id: ''
          };

          // Determinar si ya hay una evaluación (pendiente o revelada)
          const reviewExistente = reviewData.data || (evaluacionPendiente.data ? {
            id: evaluacionPendiente.data.id,
            profesional_id: interaccion.profesional_id,
            cliente_id: clienteId,
            oferta_id: interaccion.oferta_id,
            calificacion: evaluacionPendiente.data.calificacion,
            comentario: evaluacionPendiente.data.comentario || '',
            aspectos: evaluacionPendiente.data.aspectos,
            created_at: evaluacionPendiente.data.created_at,
            updated_at: evaluacionPendiente.data.updated_at,
            pendiente: !evaluacionPendiente.data.revelada
          } : undefined);

          return {
            id: oferta.id,
            auto_venta_id: oferta.auto_venta_id,
            profesional_id: interaccion.profesional_id,
            monto_oferta: oferta.monto_oferta,
            estado: oferta.estado,
            created_at: oferta.created_at,
            profesional: profesionalData.data,
            auto_venta: autoData.data,
            review_existente: reviewExistente
          };
        })
      );

      setOfertasParaReview(ofertasCompletas);
      return ofertasCompletas;
    });
  }, [execute]);

  const crearReview = useCallback(async (review: {
    profesional_id: string;
    cliente_id: string;
    oferta_id: string;
    calificacion: number;
    comentario?: string;
    aspectos?: Json;
  }) => {
    return await execute(async () => {
      // Obtener el ID de la interacción
      const { data: interaccion, error: interaccionError } = await supabase
        .from('interacciones_profesionales')
        .select('id')
        .eq('cliente_id', review.cliente_id)
        .eq('profesional_id', review.profesional_id)
        .eq('oferta_id', review.oferta_id)
        .single();

      if (interaccionError) throw interaccionError;

      // Crear evaluación pendiente en lugar de review directa
      const { data, error } = await supabase
        .from('evaluaciones_cliente_profesional_pendientes')
        .insert({
          interaccion_id: interaccion.id,
          evaluador_id: review.cliente_id,
          evaluado_id: review.profesional_id,
          tipo_evaluador: 'cliente',
          calificacion: review.calificacion,
          aspectos: review.aspectos,
          comentario: review.comentario
        })
        .select()
        .single();

      if (error) throw error;

      // Award credits for evaluation if it has a comment
      if (review.comentario && review.comentario.trim().length > 0) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: rewardData } = await supabase.functions.invoke('award-evaluation-credits', {
              body: {
                user_id: user.id,
                interaction_type: 'cliente_profesional',
                interaction_id: review.oferta_id,
                evaluation_has_comment: true
              }
            });

            if (rewardData?.success) {
              // Esta notificación se mostrará en el componente que llama a esta función
              console.log(`Credits awarded: ${rewardData.credits_awarded}`);
            }
          }
        } catch (rewardError) {
          console.log('Could not award credits:', rewardError);
        }
      }

      // Ejecutar función para verificar si se deben revelar evaluaciones
      await supabase.rpc('verificar_y_revelar_evaluaciones_cliente_profesional');

      return data;
    });
  }, [execute]);

  const actualizarReview = useCallback(async (
    reviewId: string,
    updates: Partial<ReviewProfesional>
  ) => {
    return await execute(async () => {
      const { data, error } = await supabase
        .from('reviews_profesionales')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    });
  }, [execute]);

  return {
    reviews,
    statsProf,
    ofertasParaReview,
    loading,
    obtenerReviewsProfesional,
    obtenerStatsProfesional,
    obtenerOfertasParaReview,
    crearReview,
    actualizarReview
  };
}