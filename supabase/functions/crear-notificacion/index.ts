import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id?: string;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  es_global?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, titulo, mensaje, tipo, es_global = false }: NotificationRequest = await req.json();

    if (!titulo || !mensaje || !tipo) {
      return new Response(
        JSON.stringify({ error: "titulo, mensaje y tipo son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data, error } = await supabaseClient
      .from('notificaciones')
      .insert({
        user_id: es_global ? null : user_id,
        titulo,
        mensaje,
        tipo,
        es_global
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Notification created:', data);

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});