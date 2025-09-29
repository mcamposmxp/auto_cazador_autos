import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOfferEmailRequest {
  toEmail: string;
  subject: string;
  messageHtml?: string;
  messageText?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toEmail, subject, messageHtml, messageText }: SendOfferEmailRequest = await req.json();

    if (!toEmail || !subject || (!messageHtml && !messageText)) {
      return new Response(
        JSON.stringify({ error: "toEmail, subject y messageHtml o messageText son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // TODO: Implement email service integration
    console.log('Email would be sent to:', toEmail, 'with subject:', subject);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email service not configured yet",
      toEmail,
      subject 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error en enviar-correo-oferta:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Error interno" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
