import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EstadoVerificacion {
  verificado: boolean;
  estado: 'pendiente' | 'en_revision' | 'verificado' | 'rechazado';
  comentarios?: string;
  fecha_verificacion?: string;
  puede_ofertar: boolean;
}

export function useVerificacionProfesionales() {
  const [estadoVerificacion, setEstadoVerificacion] = useState<EstadoVerificacion | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const verificarEstadoProfesional = useCallback(async (profesionalId?: string) => {
    if (!profesionalId) return null;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profesionales')
        .select('estado_verificacion, activo, fecha_verificacion, comentarios_verificacion')
        .eq('id', profesionalId)
        .single();

      if (error) throw error;

      if (!data) return null;

      const estado: EstadoVerificacion = {
        verificado: data.estado_verificacion === 'verificado',
        estado: data.estado_verificacion as 'pendiente' | 'en_revision' | 'verificado' | 'rechazado',
        comentarios: data.comentarios_verificacion,
        fecha_verificacion: data.fecha_verificacion,
        puede_ofertar: data.activo && data.estado_verificacion === 'verificado'
      };

      setEstadoVerificacion(estado);
      return estado;
    } catch (error) {
      console.error('Error verificando estado del profesional:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const mostrarMensajeVerificacion = useCallback((estado: EstadoVerificacion) => {
    switch (estado.estado) {
      case 'pendiente':
        toast({
          title: "Verificación Pendiente",
          description: "Tu cuenta profesional está pendiente de verificación. No puedes hacer ofertas hasta ser verificado.",
          variant: "destructive"
        });
        break;
      case 'en_revision':
        toast({
          title: "En Revisión",
          description: "Tu documentación está siendo revisada. Te notificaremos del resultado pronto.",
          variant: "default"
        });
        break;
      case 'rechazado':
        toast({
          title: "Verificación Rechazada",
          description: estado.comentarios || "Tu solicitud de verificación fue rechazada. Contacta al soporte.",
          variant: "destructive"
        });
        break;
    }
  }, [toast]);

  return {
    estadoVerificacion,
    loading,
    verificarEstadoProfesional,
    mostrarMensajeVerificacion
  };
}