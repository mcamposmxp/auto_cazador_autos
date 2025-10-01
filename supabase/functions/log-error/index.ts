import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const errorData = await req.json();

    // Validar datos requeridos
    if (!errorData.category || !errorData.severity || !errorData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: category, severity, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener user_id del header de autorización si existe
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    // Preparar datos para inserción
    const logEntry = {
      category: errorData.category,
      severity: errorData.severity,
      message: errorData.message,
      error_code: errorData.errorCode || null,
      user_id: userId,
      endpoint: errorData.details?.endpoint || null,
      status_code: errorData.details?.statusCode || null,
      request_data: errorData.details?.requestData || null,
      stack_trace: errorData.details?.stackTrace || null,
      user_agent: errorData.details?.userAgent || null,
      url: errorData.details?.url || null,
      context: errorData.context || null,
    };

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('error_logs')
      .insert(logEntry)
      .select()
      .single();

    if (error) {
      console.error('[log-error] Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save log', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[log-error] Log saved successfully: ${errorData.category}/${errorData.severity}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        logId: data.id,
        message: 'Error log saved successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[log-error] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
