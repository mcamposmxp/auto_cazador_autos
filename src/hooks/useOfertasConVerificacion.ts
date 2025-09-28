import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfesionales } from "@/hooks/useProfesionales";
import { useVerificacionProfesionales } from "@/hooks/useVerificacionProfesionales";

export function useOfertasConVerificacion() {
  const [enviandoOferta, setEnviandoOferta] = useState(false);
  const { toast } = useToast();
  const { profesionalActual } = useProfesionales();
  const { verificarEstadoProfesional, mostrarMensajeVerificacion } = useVerificacionProfesionales();

  const validarYEnviarOferta = useCallback(async (
    autoVentaId: string,
    montoOferta: number,
    comentarios?: string
  ) => {
    if (!profesionalActual) {
      toast({
        title: "Error",
        description: "Debes tener una cuenta profesional para hacer ofertas",
        variant: "destructive"
      });
      return false;
    }

    try {
      setEnviandoOferta(true);

      // Verificar estado actual del profesional
      const estadoVerificacion = await verificarEstadoProfesional(profesionalActual.id);

      if (!estadoVerificacion) {
        toast({
          title: "Error",
          description: "No se pudo verificar tu estado de cuenta",
          variant: "destructive"
        });
        return false;
      }

      // Validar que puede hacer ofertas
      if (!estadoVerificacion.puede_ofertar) {
        mostrarMensajeVerificacion(estadoVerificacion);
        return false;
      }

      // Si está verificado, proceder con la oferta
      const { data, error } = await supabase
        .from('ofertas')
        .insert({
          auto_venta_id: autoVentaId,
          profesional_id: profesionalActual.user_id, // Usar user_id para la política RLS
          monto_oferta: montoOferta,
          comentarios: comentarios || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error enviando oferta:', error);
        
        // Manejar error específico de política RLS
        if (error.message.includes('row-level security') || error.message.includes('verificado')) {
          toast({
            title: "Oferta Rechazada",
            description: "Solo profesionales verificados pueden hacer ofertas. Tu cuenta aún no está verificada.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo enviar la oferta. Inténtalo de nuevo.",
            variant: "destructive"
          });
        }
        return false;
      }

      toast({
        title: "Oferta Enviada",
        description: "Tu oferta ha sido enviada exitosamente"
      });

      return true;
    } catch (error) {
      console.error('Error en validarYEnviarOferta:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
      return false;
    } finally {
      setEnviandoOferta(false);
    }
  }, [profesionalActual, verificarEstadoProfesional, mostrarMensajeVerificacion, toast]);

  const verificarAccesoOfertas = useCallback(async () => {
    if (!profesionalActual) return false;

    const estadoVerificacion = await verificarEstadoProfesional(profesionalActual.id);
    
    if (!estadoVerificacion?.puede_ofertar) {
      if (estadoVerificacion) {
        mostrarMensajeVerificacion(estadoVerificacion);
      }
      return false;
    }

    return true;
  }, [profesionalActual, verificarEstadoProfesional, mostrarMensajeVerificacion]);

  return {
    enviandoOferta,
    validarYEnviarOferta,
    verificarAccesoOfertas
  };
}