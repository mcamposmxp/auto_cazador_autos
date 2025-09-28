import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { toEmail, subject, messageHtml, messageText } = await req.json();
    if (!toEmail || !subject || !messageHtml && !messageText) {
      return new Response(JSON.stringify({
        error: "toEmail, subject y messageHtml o messageText son requeridos"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const emailResponse = await resend.emails.send({
      from: "Autos App <onboarding@resend.dev>",
      to: [
        toEmail
      ],
      subject,
      html: messageHtml,
      text: messageText
    });
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error en enviar-correo-oferta:", error);
    return new Response(JSON.stringify({
      error: error.message || "Error interno"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
