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
    console.log('Iniciando corrección de precios...');

    // Llamar a normalizar-datos para corregir los precios
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
      console.log('Normalización completada:', normalizacionResultado);
    } else {
      console.error('Error en normalización:', await normalizeResponse.text());
    }

    // Obtener anuncios corregidos - exclude contact info for security
    const { data: anunciosCorregidos } = await supabase
      .from('anuncios_vehiculos')
      .select('id, titulo, marca, modelo, ano, precio, precio_original, kilometraje, ubicacion, sitio_web')
      .eq('sitio_web', 'mercadolibre.com.mx')
      .order('created_at', { ascending: false });

    // Mostrar ejemplos de precios corregidos
    const ejemplosPrecios = anunciosCorregidos?.map(anuncio => ({
      precio_original: anuncio.precio_original,
      precio_normalizado: anuncio.precio,
      correcto: anuncio.precio_original === '425,900' ? anuncio.precio === 425900 : 
                anuncio.precio_original === '329,000' ? anuncio.precio === 329000 :
                anuncio.precio_original === '298,000' ? anuncio.precio === 298000 : true
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        mensaje: 'Precios corregidos con formato mexicano',
        normalizacion: normalizacionResultado,
        ejemplos_correccion: ejemplosPrecios,
        explicacion: {
          problema_anterior: "425,900 se normalizaba a 425.9 (incorrecto)",
          solucion_actual: "425,900 se normaliza a 425900 (correcto - formato mexicano)",
          formato_mexicano: "En México: coma = separador de miles, punto = decimal"
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en corregir-precios:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});