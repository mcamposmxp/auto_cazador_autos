import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Create Supabase client for auth verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    });
    // Check if user is authenticated (optional - fallback available)
    const authHeader = req.headers.get('Authorization');
    let isAuthenticated = false;
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (!userError && user) {
          isAuthenticated = true;
          userId = user.id;
        }
      } catch (error) {
        console.log('Auth verification failed, proceeding with fallback');
      }
    }
    const requestData = await req.json();
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({
        error: 'AI service not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check credits if user is authenticated
    if (isAuthenticated && userId) {
      const { data, error } = await supabase.rpc('consume_credits', {
        p_user_id: userId,
        p_credits: 1,
        p_action_type: 'ai_analysis',
        p_resource_info: {
          marca: requestData.datosVehiculo.marca,
          modelo: requestData.datosVehiculo.modelo,
          ano: requestData.datosVehiculo.ano
        }
      });
      if (error || !data) {
        console.log('Insufficient credits, returning fallback');
        return new Response(JSON.stringify(calculateFallbackTime(requestData)), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        });
      }
    }
    // Calcular diferencia porcentual del precio
    const diferenciaPorcentual = (requestData.precioSeleccionado - requestData.precioRecomendado) / requestData.precioRecomendado * 100;
    // Preparar prompt para la IA mejorado
    const currentMonth = new Date().toLocaleString('es-MX', {
      month: 'long'
    });
    const esTemporadaAlta = [
      11,
      12,
      1
    ].includes(new Date().getMonth() + 1); // Nov-Ene
    const edadVehiculo = new Date().getFullYear() - requestData.datosVehiculo.ano;
    const esVehiculoPremium = requestData.precioSeleccionado > 500000;
    const prompt = `CONTEXTO: Análisis de tiempo de venta para vehículo usado en México - ${currentMonth} 2024.

DATOS DEL VEHÍCULO:
- Marca/Modelo: ${requestData.datosVehiculo.marca} ${requestData.datosVehiculo.modelo}
- Año: ${requestData.datosVehiculo.ano} (${edadVehiculo} años de antigüedad)
- Kilometraje: ${requestData.datosVehiculo.kilometraje.toLocaleString()} km
- Estado: ${requestData.datosVehiculo.estado}
- Ciudad: ${requestData.datosVehiculo.ciudad}
- Categoría: ${esVehiculoPremium ? 'Premium/Lujo' : 'Estándar'}

ANÁLISIS DE PRECIOS:
- Precio objetivo: $${requestData.precioSeleccionado.toLocaleString()} MXN
- Precio mercado: $${requestData.precioRecomendado.toLocaleString()} MXN
- Diferencia: ${diferenciaPorcentual.toFixed(1)}% ${diferenciaPorcentual > 0 ? 'por ENCIMA' : 'por DEBAJO'} del mercado

CONTEXTO DE MERCADO:
- Demanda actual: ${requestData.estadisticasMercado?.demanda || 'Media'}
- Competencia: ${requestData.estadisticasMercado?.competencia || 'Media'}
- Tendencia: ${requestData.estadisticasMercado?.tendencia || 'Estable'}
- Temporada: ${esTemporadaAlta ? 'Alta (fin de año)' : 'Regular'}

FACTORES CRÍTICOS A CONSIDERAR:
1. Impacto de precio vs mercado (peso: 40%)
2. Edad y depreciación del vehículo (peso: 25%)
3. Kilometraje vs promedio esperado (peso: 20%)
4. Demanda estacional y regional (peso: 15%)

Responde ÚNICAMENTE con un JSON válido en este formato exacto:
{
  "tiempoEstimado": [número de días],
  "velocidadVenta": "[rapida|moderada|lenta]",
  "explicacion": "[explicación breve de 1-2 líneas]",
  "consejos": ["[consejo 1]", "[consejo 2]", "[consejo 3]"],
  "factores": {
    "precio": "[impacto del precio]",
    "demanda": "[nivel de demanda]",
    "competencia": "[nivel de competencia]",
    "condicion": "[estado del vehículo]"
  }
}

Considera:
- Si el precio está 10% por encima del recomendado, aumenta el tiempo significativamente
- Si está 20% o más arriba, será muy difícil de vender
- Un precio 10% por debajo vende más rápido
- Vehículos más nuevos y con menos km se venden más rápido
- La demanda y competencia local afectan directamente el tiempo
- Época del año (considera si es temporada alta o baja para autos)`;
    console.log('Calling OpenAI API for time estimation...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto valuador automotriz especializado en el mercado mexicano. Tienes 15+ años analizando tiempos de venta de vehículos usados. Responde siempre con JSON válido, sé preciso y considera factores estacionales, económicos y regionales de México.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: {
          type: "json_object"
        }
      })
    });
    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      // Fallback calculation
      const fallbackResult = calculateFallbackTime(requestData);
      return new Response(JSON.stringify(fallbackResult), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('AI Response:', aiResponse);
    // Parse AI response
    let resultado;
    try {
      resultado = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw response:', aiResponse);
      // Fallback calculation
      resultado = calculateFallbackTime(requestData);
    }
    // Validate and sanitize response
    resultado.tiempoEstimado = Math.max(1, Math.min(365, resultado.tiempoEstimado || 30));
    resultado.velocidadVenta = [
      'rapida',
      'moderada',
      'lenta'
    ].includes(resultado.velocidadVenta) ? resultado.velocidadVenta : 'moderada';
    console.log('Final result:', resultado);
    return new Response(JSON.stringify(resultado), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in calcular-tiempo-venta-ia function:', error);
    // Return fallback calculation on error
    try {
      const requestData = await req.json();
      const fallbackResult = calculateFallbackTime(requestData);
      return new Response(JSON.stringify(fallbackResult), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch  {
      return new Response(JSON.stringify({
        error: 'Error calculating selling time',
        tiempoEstimado: 30,
        velocidadVenta: 'moderada',
        explicacion: 'Error al calcular tiempo estimado',
        consejos: [],
        factores: {
          precio: 'Normal',
          demanda: 'Media',
          competencia: 'Media',
          condicion: 'Buena'
        }
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
});
function calculateFallbackTime(requestData) {
  const diferenciaPorcentual = (requestData.precioSeleccionado - requestData.precioRecomendado) / requestData.precioRecomendado * 100;
  let tiempoBase = 30; // días base
  // Ajustar por precio
  if (diferenciaPorcentual > 20) {
    tiempoBase = 90;
  } else if (diferenciaPorcentual > 10) {
    tiempoBase = 60;
  } else if (diferenciaPorcentual < -10) {
    tiempoBase = 15;
  } else if (diferenciaPorcentual < -5) {
    tiempoBase = 20;
  }
  // Ajustar por edad del vehículo
  const currentYear = new Date().getFullYear();
  const edad = currentYear - requestData.datosVehiculo.ano;
  if (edad > 10) {
    tiempoBase += 15;
  } else if (edad > 5) {
    tiempoBase += 10;
  }
  // Determinar velocidad de venta
  let velocidadVenta;
  if (tiempoBase <= 20) {
    velocidadVenta = 'rapida';
  } else if (tiempoBase <= 45) {
    velocidadVenta = 'moderada';
  } else {
    velocidadVenta = 'lenta';
  }
  return {
    tiempoEstimado: tiempoBase,
    velocidadVenta,
    explicacion: `Estimación basada en precio ${diferenciaPorcentual > 0 ? 'superior' : diferenciaPorcentual < 0 ? 'inferior' : 'similar'} al mercado`,
    consejos: [
      'Manten un precio que se encuentre en el rango promedio',
      'Manten el vehiculo en excelentes condiciones para evitar que te bajen el precio',
      'El precio final de venta dependera del estado de tu auto'
    ],
    factores: {
      precio: diferenciaPorcentual > 10 ? 'Alto' : diferenciaPorcentual < -5 ? 'Bajo' : 'Adecuado',
      demanda: requestData.estadisticasMercado?.demanda || 'Media',
      competencia: requestData.estadisticasMercado?.competencia || 'Media',
      condicion: requestData.datosVehiculo.estado
    }
  };
}
