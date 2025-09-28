import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificacionVerificacionRequest {
  profesional_id: string;
  nuevo_estado: 'verificado' | 'rechazado';
  comentarios?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { profesional_id, nuevo_estado, comentarios }: NotificacionVerificacionRequest = await req.json();

    console.log('Notificando cambio de verificación:', { profesional_id, nuevo_estado });

    // Obtener información del profesional
    const { data: profesional, error: profError } = await supabase
      .from('profesionales')
      .select('user_id, negocio_nombre')
      .eq('id', profesional_id)
      .single();

    if (profError || !profesional?.user_id) {
      console.error('Error obteniendo profesional:', profError);
      return new Response(
        JSON.stringify({ error: 'Profesional no encontrado' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // Crear notificación según el estado
    let titulo: string;
    let mensaje: string;
    let tipo: string;

    if (nuevo_estado === 'verificado') {
      titulo = '🎉 ¡Cuenta Verificada!';
      mensaje = `Tu cuenta profesional "${profesional.negocio_nombre}" ha sido verificada exitosamente. Ya puedes hacer ofertas y acceder a todas las funcionalidades.`;
      tipo = 'verificacion_aprobada';
    } else {
      titulo = '❌ Verificación Rechazada';
      mensaje = `Tu solicitud de verificación para "${profesional.negocio_nombre}" fue rechazada. ${comentarios ? `Motivo: ${comentarios}` : 'Revisa los documentos y vuelve a intentar.'}`;
      tipo = 'verificacion_rechazada';
    }

    // Insertar notificación
    const { error: notifError } = await supabase
      .from('notificaciones')
      .insert({
        user_id: profesional.user_id,
        titulo,
        mensaje,
        tipo
      });

    if (notifError) {
      console.error('Error creando notificación:', notifError);
      return new Response(
        JSON.stringify({ error: 'Error creando notificación' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    // También crear entrada en historial de verificaciones
    const { error: historialError } = await supabase
      .from('historial_verificaciones')
      .insert({
        profesional_id,
        accion: nuevo_estado,
        comentarios: comentarios || `Estado cambiado a ${nuevo_estado}`,
        realizado_por: null // Sistema automático
      });

    if (historialError) {
      console.error('Error en historial:', historialError);
      // No es crítico, continuamos
    }

    console.log('Notificación enviada exitosamente');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notificación enviada',
        titulo,
        mensaje
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Error en notificar-cambio-verificacion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);