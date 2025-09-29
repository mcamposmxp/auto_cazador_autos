import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Email functionality removed - needs implementation

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

    // Email functionality disabled - needs proper implementation
    console.log('Credenciales para:', { nombreProfesional, email });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Función desactivada - necesita implementación de email',
      credentials: { nombreProfesional, email }
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

serve(handler)