import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { vehiculo, autosSimilares, estadisticas } = await req.json();
    console.log('Analizando precios para:', vehiculo);
    console.log('Autos similares:', autosSimilares.length);
    // Preparar datos para la IA
    const precios = autosSimilares.map((auto)=>auto.precio).filter((precio)=>precio > 0);
    const preciosOrdenados = precios.sort((a, b)=>a - b);
    const estadisticasDetalladas = {
      total: precios.length,
      minimo: Math.min(...precios),
      maximo: Math.max(...precios),
      promedio: precios.reduce((sum, p)=>sum + p, 0) / precios.length,
      mediana: preciosOrdenados[Math.floor(preciosOrdenados.length / 2)],
      rango: Math.max(...precios) - Math.min(...precios),
      desviacionEstandar: Math.sqrt(precios.reduce((sum, p)=>sum + Math.pow(p - precios.reduce((s, price)=>s + price, 0) / precios.length, 2), 0) / precios.length)
    };
    const prompt = `
Eres un experto analista del mercado automotriz mexicano. Analiza los siguientes datos de precios de vehículos similares y crea rangos de precios inteligentes y dinámicos.

VEHÍCULO OBJETIVO:
- ${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.ano}
- Kilometraje: ${vehiculo.kilometraje.toLocaleString()} km
- Ubicación: ${vehiculo.ciudad}, ${vehiculo.estado}

ESTADÍSTICAS DE MERCADO:
- Total de vehículos: ${estadisticasDetalladas.total}
- Precio mínimo: $${estadisticasDetalladas.minimo.toLocaleString()}
- Precio máximo: $${estadisticasDetalladas.maximo.toLocaleString()}
- Precio promedio: $${estadisticasDetalladas.promedio.toLocaleString()}
- Mediana: $${estadisticasDetalladas.mediana.toLocaleString()}
- Rango: $${estadisticasDetalladas.rango.toLocaleString()}
- Desviación estándar: $${estadisticasDetalladas.desviacionEstandar.toLocaleString()}

PRECIOS DETALLADOS: [${precios.slice(0, 20).map((p)=>`$${p.toLocaleString()}`).join(', ')}${precios.length > 20 ? '...' : ''}]

INSTRUCCIONES:
1. Crea entre 3-5 rangos de precios basados en la distribución real de datos
2. Cada rango debe tener un nombre descriptivo (ej: "Precio Bajo", "Competitivo", "Premium")
3. Los rangos deben cubrir toda la distribución de precios sin solaparse
4. Asigna porcentajes realistas basados en la distribución actual
5. Incluye colores apropiados para cada rango (verde para buenos precios, amarillo para promedio, rojo para altos)
6. Proporciona una descripción útil para cada rango

Responde ÚNICAMENTE con un JSON válido en este formato:
{
  "rangos": [
    {
      "nombre": "Precio Excelente",
      "minimo": 150000,
      "maximo": 200000,
      "porcentaje": 25,
      "color": "text-green-600",
      "descripcion": "Precio muy competitivo, excelente oportunidad"
    }
  ],
  "recomendaciones": {
    "precioOptimo": 180000,
    "rangoRecomendado": "Precio Competitivo",
    "razonamiento": "Basado en el análisis de mercado..."
  }
}`;
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
            content: 'Eres un analista experto del mercado automotriz mexicano. Respondes únicamente con JSON válido y precisos análisis de precios.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }
    const generatedText = data.choices[0].message.content;
    console.log('Respuesta de IA:', generatedText);
    // Intentar parsear la respuesta JSON
    let analisisIA;
    try {
      analisisIA = JSON.parse(generatedText);
    } catch (parseError) {
      console.error('Error parsing IA response:', parseError);
      // Fallback: crear rangos básicos si la IA falla
      const rangosBasicos = crearRangosFallback(estadisticasDetalladas);
      analisisIA = {
        rangos: rangosBasicos,
        recomendaciones: {
          precioOptimo: estadisticasDetalladas.promedio,
          rangoRecomendado: "Precio Promedio",
          razonamiento: "Análisis basado en estadísticas básicas (IA no disponible)"
        }
      };
    }
    return new Response(JSON.stringify({
      success: true,
      analisis: analisisIA,
      estadisticas: estadisticasDetalladas
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error en analizar-rangos-precios-ia:', error);
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
function crearRangosFallback(estadisticas) {
  const { minimo, maximo, promedio } = estadisticas;
  const rango = maximo - minimo;
  if (rango === 0) {
    return [
      {
        nombre: "Precio Único",
        minimo: minimo,
        maximo: maximo,
        porcentaje: 100,
        color: "text-blue-600",
        descripcion: "Precio estándar del mercado"
      }
    ];
  }
  return [
    {
      nombre: "Precio Bajo",
      minimo: minimo,
      maximo: Math.round(minimo + rango * 0.33),
      porcentaje: 30,
      color: "text-green-600",
      descripcion: "Precio competitivo, buena oportunidad"
    },
    {
      nombre: "Precio Promedio",
      minimo: Math.round(minimo + rango * 0.33),
      maximo: Math.round(minimo + rango * 0.67),
      porcentaje: 40,
      color: "text-yellow-600",
      descripcion: "Precio de mercado estándar"
    },
    {
      nombre: "Precio Alto",
      minimo: Math.round(minimo + rango * 0.67),
      maximo: maximo,
      porcentaje: 30,
      color: "text-red-600",
      descripcion: "Precio premium o características especiales"
    }
  ];
}
