import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { oferta_id } = await req.json();

    if (!oferta_id) {
      return new Response(
        JSON.stringify({ error: "oferta_id es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get offer details
    const { data: oferta, error: ofertaError } = await supabaseClient
      .from('ofertas')
      .select(`
        *,
        autos_venta (
          *,
          clientes (*)
        ),
        profiles (*)
      `)
      .eq('id', oferta_id)
      .single();

    if (ofertaError || !oferta) {
      return new Response(
        JSON.stringify({ error: "Oferta no encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get car owner's user_id from email
    const { data: ownerUser, error: ownerError } = await supabaseClient.auth.admin
      .listUsers({ page: 1, perPage: 1000 }); // Changed: getUserByEmail doesn't exist

    if (ownerError || !ownerUser) {
      console.log('Owner user not found, skipping notification');
      return new Response(
        JSON.stringify({ success: true, message: "Owner not registered" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const vehiculo = `${oferta.autos_venta.marca} ${oferta.autos_venta.modelo} ${oferta.autos_venta.ano}`;
    const profesional = oferta.profiles?.nombre || 'Un profesional';

    // Create notification for car owner
    const { error: notificationError } = await supabaseClient
      .from('notificaciones')
      .insert({
        user_id: ownerUser.user.id,
        titulo: 'Nueva oferta recibida',
        mensaje: `${profesional} ha enviado una oferta por tu ${vehiculo}. Monto: $${oferta.monto_oferta.toLocaleString()}`,
        tipo: 'success'
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});