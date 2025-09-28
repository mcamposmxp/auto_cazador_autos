import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // URLs de ejemplo de MercadoLibre para probar
    const urlsEjemplo = [
      'https://autos.mercadolibre.com.mx/MLM-1234567890-toyota-corolla-2020-automatico',
      'https://autos.mercadolibre.com.mx/MLM-1234567891-honda-civic-2019-manual',
      'https://autos.mercadolibre.com.mx/MLM-1234567892-nissan-sentra-2021-cvt'
    ];

    // Llamar a la función extractor-vehiculos
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/extractor-vehiculos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        sitio_web: 'mercadolibre.com.mx',
        urls: urlsEjemplo
      })
    });

    if (!response.ok) {
      throw new Error(`Error llamando extractor: ${response.status}`);
    }

    const resultado = await response.json();

    // Ahora llamar a normalizar-datos
    const normalizeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/normalizar-datos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        limite: 10,
        sitio_web: 'mercadolibre.com.mx'
      })
    });

    let normalizacionResultado = {};
    if (normalizeResponse.ok) {
      normalizacionResultado = await normalizeResponse.json();
    }

    // Finalmente llamar a detectar-duplicados
    const duplicatesResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/detectar-duplicados`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        limite: 50,
        umbral_similitud: 0.7
      })
    });

    let duplicadosResultado = {};
    if (duplicatesResponse.ok) {
      duplicadosResultado = await duplicatesResponse.json();
    }

    // Obtener estadísticas de la base de datos con logging detallado
    console.log('Obteniendo estadísticas de anuncios...');
    
    const { count: totalAnuncios, error: errorTotal } = await supabase
      .from('anuncios_vehiculos')
      .select('*', { count: 'exact', head: true });
    
    console.log('Total anuncios:', totalAnuncios, 'Error:', errorTotal);

    const { count: anunciosML, error: errorML } = await supabase
      .from('anuncios_vehiculos')
      .select('*', { count: 'exact', head: true })
      .eq('sitio_web', 'mercadolibre.com.mx');
    
    console.log('Anuncios ML:', anunciosML, 'Error:', errorML);

    const { data: ultimosAnuncios, error: errorUltimos } = await supabase
      .from('anuncios_vehiculos')
      .select('id, titulo, marca, modelo, ano, precio, ubicacion, fecha_extraccion')
      .eq('sitio_web', 'mercadolibre.com.mx')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Últimos anuncios:', ultimosAnuncios?.length, 'Error:', errorUltimos);

    return new Response(
      JSON.stringify({
        success: true,
        prueba_completa: {
          extraccion: resultado,
          normalizacion: normalizacionResultado,
          duplicados: duplicadosResultado
        },
        estadisticas: {
          total_anuncios: totalAnuncios || 0,
          anuncios_mercadolibre: anunciosML || 0,
          ultimos_anuncios: ultimosAnuncios || []
        },
        mensaje: 'Prueba completa del sistema de extracción para MercadoLibre México'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en prueba-extraccion:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        mensaje: 'Error durante la prueba de extracción'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});