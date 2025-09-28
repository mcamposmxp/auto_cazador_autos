import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY no configurada');
    }
    const solicitud = await req.json();
    console.log('Generando recomendaciones para:', solicitud.vehiculo);
    // Análisis contextual mejorado
    const diferenciaPrecio = (solicitud.vehiculo.precio / solicitud.mercado.precioPromedio - 1) * 100;
    const edadVehiculo = new Date().getFullYear() - solicitud.vehiculo.ano;
    const kmPromedioPorAno = edadVehiculo * 15000;
    const esKmAlto = solicitud.vehiculo.kilometraje > kmPromedioPorAno * 1.3;
    const esKmBajo = solicitud.vehiculo.kilometraje < kmPromedioPorAno * 0.7;
    const esVehiculoPremium = solicitud.vehiculo.precio > 400000;
    const descripcionCorta = solicitud.vehiculo.descripcion.length < 100;
    const pocasFotos = solicitud.vehiculo.cantidadImagenes < 8;
    const prompt = `ANÁLISIS PROFESIONAL DE OPTIMIZACIÓN DE ANUNCIO AUTOMOTRIZ - MÉXICO

PERFIL DEL VEHÍCULO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Vehículo: ${solicitud.vehiculo.marca} ${solicitud.vehiculo.modelo} ${solicitud.vehiculo.ano}
• Antigüedad: ${edadVehiculo} años
• Kilometraje: ${solicitud.vehiculo.kilometraje.toLocaleString()} km (${esKmAlto ? 'ALTO' : esKmBajo ? 'BAJO' : 'NORMAL'} para su edad)
• Ubicación: ${solicitud.vehiculo.ciudad}
• Categoría: ${esVehiculoPremium ? 'PREMIUM/LUJO' : 'ESTÁNDAR'}

ANÁLISIS DE PRECIO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Precio actual: $${solicitud.vehiculo.precio.toLocaleString()} MXN
• Precio mercado: $${solicitud.mercado.precioPromedio.toLocaleString()} MXN
• Diferencia: ${diferenciaPrecio > 0 ? '+' : ''}${diferenciaPrecio.toFixed(1)}% vs mercado
• Status precio: ${Math.abs(diferenciaPrecio) > 15 ? '🔴 CRÍTICO' : Math.abs(diferenciaPrecio) > 8 ? '🟡 ATENCIÓN' : '🟢 COMPETITIVO'}

ANÁLISIS DE MERCADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Competencia: ${solicitud.mercado.competencia} vehículos similares
• Demanda: ${solicitud.mercado.demanda.toUpperCase()}
• Tiempo en mercado: ${solicitud.contexto.diasEnMercado} días

ESTADO DEL ANUNCIO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Fotos: ${solicitud.vehiculo.cantidadImagenes} ${pocasFotos ? '⚠️ INSUFICIENTES' : '✅ ADECUADAS'}
• Descripción: ${solicitud.vehiculo.descripcion.length} caracteres ${descripcionCorta ? '⚠️ MUY CORTA' : '✅ ADECUADA'}
• Descripción actual: "${solicitud.vehiculo.descripcion.slice(0, 100)}${solicitud.vehiculo.descripcion.length > 100 ? '...' : ''}"

Proporciona recomendaciones específicas y accionables en formato JSON con la siguiente estructura:

{
  "recomendaciones": [
    {
      "tipo": "precio|fotos|descripcion|mercado|tiempo|posicionamiento",
      "prioridad": "alta|media|baja",
      "titulo": "Título conciso de la recomendación",
      "descripcion": "Explicación detallada del problema/oportunidad",
      "accion": "Acción específica a tomar",
      "impacto": "Beneficio esperado"
    }
  ],
  "resumen": "Resumen general del estado del anuncio",
  "puntuacion_general": 85
}

CRITERIOS DE ANÁLISIS:
1. PRECIO: Compara con mercado, considera depreciación, competitividad
2. FOTOS: Evalúa cantidad (recomendado 8-12), calidad sugerida
3. DESCRIPCIÓN: Longitud, detalles técnicos, historia del vehículo
4. MERCADO: Posición vs competencia, timing de venta
5. TIEMPO: Urgencia según días en mercado
6. POSICIONAMIENTO: Destacar ventajas únicas

Considera el mercado mexicano, precios en pesos, y preferencias locales. Sé específico y práctico.`;
    // Función de reintento con backoff exponencial
    const intentarOpenAI = async (intentos = 3)=>{
      for(let i = 0; i < intentos; i++){
        try {
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
                  content: 'Eres un consultor experto en venta de automóviles usados en México con 20+ años de experiencia. Especializas en marketing automotriz, pricing estratégico y optimización de anuncios. Conoces profundamente el comportamiento del comprador mexicano, tendencias estacionales, y mejores prácticas digitales. Proporcionas recomendaciones específicas, prácticas y basadas en datos reales del mercado mexicano.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_completion_tokens: 2000,
              temperature: 0.4,
              response_format: {
                type: "json_object"
              }
            })
          });
          if (response.status === 429) {
            // Rate limit - esperar antes del siguiente intento
            const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000; // Backoff exponencial con jitter
            console.log(`Rate limit alcanzado, esperando ${Math.round(waitTime)}ms antes del intento ${i + 2}`);
            if (i < intentos - 1) {
              await new Promise((resolve)=>setTimeout(resolve, waitTime));
              continue;
            }
          }
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error de OpenAI:', response.status, errorText);
            throw new Error(`Error de OpenAI: ${response.status} ${response.statusText}`);
          }
          return response;
        } catch (error) {
          console.error(`Intento ${i + 1} fallido:`, error);
          if (i === intentos - 1) throw error;
          // Esperar antes del siguiente intento (backoff exponencial)
          const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
          console.log(`Esperando ${Math.round(waitTime)}ms antes del siguiente intento`);
          await new Promise((resolve)=>setTimeout(resolve, waitTime));
        }
      }
      throw new Error('Todos los intentos fallaron');
    };
    const response = await intentarOpenAI(3);
    const data = await response.json();
    const contenidoIA = data.choices[0].message.content;
    let respuestaIA;
    try {
      respuestaIA = JSON.parse(contenidoIA);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Respuesta de IA malformada');
    }
    // Validar estructura de respuesta
    if (!respuestaIA.recomendaciones || !Array.isArray(respuestaIA.recomendaciones)) {
      throw new Error('Formato de recomendaciones inválido');
    }
    // Filtrar y validar recomendaciones
    const recomendacionesValidas = respuestaIA.recomendaciones.filter((rec)=>rec.tipo && rec.prioridad && rec.titulo && rec.descripcion && rec.accion);
    const respuestaFinal = {
      recomendaciones: recomendacionesValidas,
      resumen: respuestaIA.resumen || 'Análisis completado',
      puntuacion_general: respuestaIA.puntuacion_general || 75
    };
    console.log(`Generadas ${recomendacionesValidas.length} recomendaciones`);
    return new Response(JSON.stringify(respuestaFinal), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error en generar-recomendaciones-ia:', error);
    // Respuesta de fallback
    const fallbackResponse = {
      recomendaciones: [
        {
          tipo: 'mercado',
          prioridad: 'media',
          titulo: 'Análisis en progreso',
          descripcion: 'El sistema está procesando tu anuncio para generar recomendaciones personalizadas.',
          accion: 'Vuelve a intentar en unos minutos',
          impacto: 'Optimización continua'
        }
      ],
      resumen: 'Error temporal en el análisis',
      puntuacion_general: 70
    };
    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
