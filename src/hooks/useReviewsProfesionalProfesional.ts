import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface ReviewProfesionalProfesional {
  id: string;
  profesional_evaluador_id: string;
  profesional_evaluado_id: string;
  transaccion_id?: string;
  tipo_interaccion: string;
  calificacion: number;
  comentario?: string;
  aspectos: Json;
  evidencia_transaccion: Json;
  estado_revision: string;
  fecha_transaccion: string;
  created_at: string;
  updated_at: string;
  profesional_evaluador?: {
    negocio_nombre: string;
  };
  profesional_evaluado?: {
    negocio_nombre: string;
  };
}

export interface StatsProfesionalProfesional {
  id: string;
  profesional_id: string;
  calificacion_promedio_vendedor: number;
  total_reviews_vendedor: number;
  calificacion_promedio_comprador: number;
  total_reviews_comprador: number;
  reputacion_general: number;
  badge_vendedor: string;
  badge_comprador: string;
  created_at: string;
  updated_at: string;
}

export interface TransaccionDisponible {
  id: string;
  auto_venta_id: string;
  profesional_id: string;
  monto_oferta: number;
  created_at: string;
  profesional?: {
    negocio_nombre: string;
  };
  auto_venta?: {
    marca: string;
    modelo: string;
    ano: number;
  };
  review_existente?: ReviewProfesionalProfesional;
}

export function useReviewsProfesionalProfesional() {
  const [reviews, setReviews] = useState<ReviewProfesionalProfesional[]>([]);
  const [statsProf, setStatsProf] = useState<StatsProfesionalProfesional | null>(null);
  const [transaccionesDisponibles, setTransaccionesDisponibles] = useState<TransaccionDisponible[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { toast } = useToast();

  const obtenerReviewsProfesionalProfesional = useCallback(async (profesionalId: string) => {
    if (!profesionalId) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      const { data: reviewsData, error } = await supabase
        .from('reviews_profesional_profesional')
        .select('*')
        .eq('profesional_evaluado_id', profesionalId)
        .eq('estado_revision', 'activa')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener datos de profesionales por separado para evitar errores de join
      const reviewsConProfesionales = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const [evaluadorRes, evaluadoRes] = await Promise.all([
            supabase
              .from('profesionales')
              .select('negocio_nombre')
              .eq('id', review.profesional_evaluador_id)
              .maybeSingle(),
            supabase
              .from('profesionales')
              .select('negocio_nombre')
              .eq('id', review.profesional_evaluado_id)
              .maybeSingle()
          ]);

          return {
            ...review,
            profesional_evaluador: evaluadorRes.data,
            profesional_evaluado: evaluadoRes.data
          };
        })
      );

      setReviews(reviewsConProfesionales);
      return reviewsConProfesionales;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast({
        title: "Error",
        description: "Error al obtener reviews profesional-profesional",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const obtenerStatsProfesionalProfesional = useCallback(async (profesionalId: string) => {
    if (!profesionalId) return null;
    
    try {
      const { data, error } = await supabase
        .from('stats_profesional_profesional')
        .select('*')
        .eq('profesional_id', profesionalId)
        .maybeSingle();

      if (error) throw error;
      setStatsProf(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    }
  }, []);

  const obtenerTransaccionesParaReview = useCallback(async (profesionalId: string) => {
    if (!profesionalId) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      // Obtener ofertas aceptadas donde este profesional fue quien hizo la oferta
      const { data: ofertasData, error: ofertasError } = await supabase
        .from('ofertas')
        .select(`
          id,
          auto_venta_id,
          profesional_id,
          monto_oferta,
          created_at,
          autos_venta!inner(marca, modelo, ano)
        `)
        .eq('profesional_id', profesionalId)
        .eq('estado', 'aceptada')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (ofertasError) throw ofertasError;

      // Filtrar solo transacciones que ya pasaron el período de enfriamiento (48 horas)
      const transaccionesElegibles = (ofertasData || []).filter(oferta => {
        const fechaOferta = new Date(oferta.created_at);
        const ahora = new Date();
        const diferencia = ahora.getTime() - fechaOferta.getTime();
        const horasTranscurridas = diferencia / (1000 * 60 * 60);
        return horasTranscurridas >= 48;
      });

      // Obtener reviews existentes
      const transaccionesCompletas = await Promise.all(
        transaccionesElegibles.map(async (oferta) => {
          const { data: reviewData } = await supabase
            .from('reviews_profesional_profesional')
            .select('*')
            .eq('transaccion_id', oferta.id)
            .eq('profesional_evaluador_id', profesionalId)
            .maybeSingle();

          return {
            ...oferta,
            auto_venta: oferta.autos_venta,
            review_existente: reviewData
          };
        })
      );

      setTransaccionesDisponibles(transaccionesCompletas);
      return transaccionesCompletas;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast({
        title: "Error",
        description: "Error al obtener transacciones para review",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const crearReviewProfesionalProfesional = useCallback(async (review: {
    profesional_evaluado_id: string;
    transaccion_id: string;
    tipo_interaccion: 'compra' | 'venta' | 'colaboracion';
    calificacion: number;
    comentario?: string;
    aspectos?: Json;
    evidencia_transaccion?: Json;
    fecha_transaccion: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener el profesional evaluador (el usuario actual)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");
      
      const { data: profesionalData, error: profesionalError } = await supabase
        .from('profesionales')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profesionalError) throw profesionalError;

      const { data, error } = await supabase
        .from('reviews_profesional_profesional')
        .insert({
          ...review,
          profesional_evaluador_id: profesionalData.id
        })
        .select()
        .single();

      if (error) throw error;

      // Award credits for evaluation if it has a comment
      if (review.comentario && review.comentario.trim().length > 0) {
        try {
          const { data: rewardData } = await supabase.functions.invoke('award-evaluation-credits', {
            body: {
              user_id: user.id,
              interaction_type: 'profesional_profesional',
              interaction_id: review.transaccion_id,
              evaluation_has_comment: true
            }
          });

          if (rewardData?.success) {
            toast({
              title: "¡Evaluación enviada!",
              description: `Has recibido ${rewardData.credits_awarded} créditos gratis por tu evaluación. Te quedan ${rewardData.remaining_evaluation_credits} créditos disponibles este mes.`
            });
          } else {
            toast({
              title: "Evaluación enviada",
              description: "Review creada correctamente"
            });
          }
        } catch (rewardError) {
          console.log('Could not award credits:', rewardError);
          toast({
            title: "Evaluación enviada",
            description: "Review creada correctamente"
          });
        }
      } else {
        toast({
          title: "Evaluación enviada",
          description: "Review creada correctamente"
        });
      }
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const actualizarReviewProfesionalProfesional = useCallback(async (
    reviewId: string,
    updates: Partial<ReviewProfesionalProfesional>
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews_profesional_profesional')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const disputarReview = useCallback(async (reviewId: string, motivo: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews_profesional_profesional')
        .update({
          estado_revision: 'disputada',
          evidencia_transaccion: {
            disputa: {
              fecha: new Date().toISOString(),
              motivo
            }
          }
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const memoizedReturn = useMemo(() => ({
    reviews,
    statsProf,
    transaccionesDisponibles,
    loading,
    error,
    obtenerReviewsProfesionalProfesional,
    obtenerStatsProfesionalProfesional,
    obtenerTransaccionesParaReview,
    crearReviewProfesionalProfesional,
    actualizarReviewProfesionalProfesional,
    disputarReview
  }), [
    reviews,
    statsProf,
    transaccionesDisponibles,
    loading,
    error,
    obtenerReviewsProfesionalProfesional,
    obtenerStatsProfesionalProfesional,
    obtenerTransaccionesParaReview,
    crearReviewProfesionalProfesional,
    actualizarReviewProfesionalProfesional,
    disputarReview
  ]);

  return memoizedReturn;
}