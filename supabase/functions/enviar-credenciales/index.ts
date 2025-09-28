import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { CredencialesProfesional } from './_templates/credenciales-profesional.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface EnviarCredencialesRequest {
  nombreProfesional: string
  nombreNegocio: string
  email: string
  password: string
  panelUrl: string
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      nombreProfesional, 
      nombreNegocio, 
      email, 
      password, 
      panelUrl 
    }: EnviarCredencialesRequest = await req.json()

    // Validate required fields
    if (!nombreProfesional || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    // Render the email template
    const html = await renderAsync(
      React.createElement(CredencialesProfesional, {
        nombreProfesional,
        nombreNegocio: nombreNegocio || 'Su empresa',
        email,
        password,
        panelUrl: panelUrl || `${new URL(req.url).origin}/panel-profesionales`,
      })
    )

    // Send the email
    const emailResponse = await resend.emails.send({
      from: 'Sistema de Ofertas <onboarding@resend.dev>',
      to: [email],
      subject: '🔑 Credenciales de acceso al Sistema de Ofertas',
      html,
    })

    console.log('Credenciales enviadas exitosamente:', emailResponse)

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Credenciales enviadas por correo electrónico',
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error('Error enviando credenciales:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error enviando correo electrónico',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    )
  }
}

Deno.serve(handler)