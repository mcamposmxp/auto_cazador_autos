import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inicializar cliente Supabase
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Extraer URLs de MercadoLibre
async function extraerUrlsML(maxPaginas: number = 3): Promise<string[]> {
  const urlsEncontradas: string[] = [];
  
  console.log(`🔍 Extrayendo URLs de MercadoLibre - Máximo ${maxPaginas} páginas`);
  
  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    const urlBusqueda = `https://listado.mercadolibre.com.mx/autos-camionetas/_Desde_${(pagina - 1) * 50 + 1}`;
    console.log(`📄 Procesando página ${pagina}: ${urlBusqueda}`);
    
    try {
      await randomDelay(2000, 4000);
      
      const response = await fetch(urlBusqueda, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-MX,es;q=0.8,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log('⚠️ Rate limit detectado, esperando más tiempo...');
          await randomDelay(10000, 20000);
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`📄 HTML recibido de página ${pagina}: ${html.length} caracteres`);

      // Extraer MLM IDs
      const mlmPattern = /MLM\d{10,12}/g;
      const mlmIds = html.match(mlmPattern) || [];
      
      console.log(`🔍 MLM IDs encontrados en página ${pagina}: ${mlmIds.length}`);
      
      const mlmIdsUnicos = [...new Set(mlmIds)];
      
      for (const mlmId of mlmIdsUnicos) {
        const urlCompleta = `https://articulo.mercadolibre.com.mx/${mlmId}`;
        urlsEncontradas.push(urlCompleta);
        
        // Limitar para esta prueba
        if (urlsEncontradas.length >= 150) break;
      }

      console.log(`✅ Página ${pagina} completada. URLs acumuladas: ${urlsEncontradas.length}`);
      
      if (urlsEncontradas.length >= 150) {
        console.log(`🎯 Límite de URLs alcanzado (150), terminando extracción`);
        break;
      }

    } catch (error) {
      console.error(`❌ Error en página ${pagina}:`, error);
      continue;
    }
  }

  const urlsFinales = [...new Set(urlsEncontradas)];
  console.log(`🏁 Extracción completada: ${urlsFinales.length} URLs únicas encontradas`);
  
  return urlsFinales;
}

// Función principal simplificada
async function extraccionSimpleFuncional(maxAnuncios: number = 100) {
  const tiempoInicio = Date.now();
  
  console.log(`🚀 === INICIANDO EXTRACCIÓN SIMPLE FUNCIONAL ===`);
  console.log(`🎯 Objetivo: ${maxAnuncios} anuncios máximo`);
  
  const resultado = {
    tiempo_inicio: new Date(tiempoInicio).toISOString(),
    tiempo_fin: null as string | null,
    duracion_minutos: 0,
    urls_extraidas: 0,
    anuncios_procesados: 0,
    errores: [] as string[],
    exitoso: false
  };

  try {
    // 1. Extraer URLs de MercadoLibre
    console.log(`\n📡 === PASO 1: EXTRAYENDO URLs ===`);
    const urlsExtraidas = await extraerUrlsML(3); // Solo 3 páginas para empezar
    
    resultado.urls_extraidas = urlsExtraidas.length;
    console.log(`✅ URLs extraídas: ${urlsExtraidas.length}`);
    
    if (urlsExtraidas.length === 0) {
      throw new Error('No se pudieron extraer URLs de MercadoLibre');
    }

    // 2. Limitar URLs según objetivo
    const urlsParaProcesar = urlsExtraidas.slice(0, Math.min(maxAnuncios, urlsExtraidas.length));
    console.log(`📋 URLs para procesar: ${urlsParaProcesar.length}`);

    // 3. Procesar URLs con extractor-vehiculos
    console.log(`\n🚗 === PASO 2: PROCESANDO VEHÍCULOS ===`);
    
    // Procesar en lotes de 15 para evitar timeouts
    const tamañoLote = 15;
    let totalProcesados = 0;
    
    for (let i = 0; i < urlsParaProcesar.length; i += tamañoLote) {
      const lote = urlsParaProcesar.slice(i, i + tamañoLote);
      console.log(`📦 Procesando lote ${Math.floor(i/tamañoLote) + 1}: ${lote.length} URLs`);
      
      try {
        const respuestaLote = await supabase.functions.invoke('extractor-vehiculos', {
          body: {
            sitio_web: 'mercadolibre.com.mx',
            urls: lote
          }
        });

        if (respuestaLote.error) {
          throw new Error(respuestaLote.error.message);
        }

        const resultadoLote = respuestaLote.data;
        const procesadosLote = resultadoLote.procesados || 0;
        totalProcesados += procesadosLote;
        
        console.log(`✅ Lote completado: ${procesadosLote} anuncios procesados`);
        
        // Delay entre lotes
        await randomDelay(5000, 8000);
        
      } catch (error) {
        console.error(`❌ Error procesando lote:`, error);
        resultado.errores.push(`Lote ${Math.floor(i/tamañoLote) + 1}: ${error.message}`);
      }
    }

    resultado.anuncios_procesados = totalProcesados;
    resultado.exitoso = true;
    
    console.log(`🎉 EXTRACCIÓN COMPLETADA EXITOSAMENTE`);
    console.log(`📊 Resumen: ${totalProcesados} anuncios procesados de ${urlsExtraidas.length} URLs`);

  } catch (error) {
    console.error(`❌ Error en extracción:`, error);
    resultado.errores.push(error.message);
  }

  const tiempoFin = Date.now();
  resultado.tiempo_fin = new Date(tiempoFin).toISOString();
  resultado.duracion_minutos = Math.round((tiempoFin - tiempoInicio) / 60000);
  
  console.log(`⏰ Duración total: ${resultado.duracion_minutos} minutos`);
  
  return resultado;
}

// Servidor HTTP
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { max_anuncios } = await req.json();
    const maxAnuncios = max_anuncios || 100;

    console.log(`🚀 Iniciando extracción simple funcional para ${maxAnuncios} anuncios`);

    const resultado = await extraccionSimpleFuncional(maxAnuncios);

    // Obtener estadísticas finales
    const { data: estadisticasFinales } = await supabase
      .from('anuncios_vehiculos')
      .select('id')
      .eq('sitio_web', 'mercadolibre.com.mx');

    const totalAnunciosML = estadisticasFinales?.length || 0;

    return new Response(JSON.stringify({
      success: resultado.exitoso,
      mensaje: resultado.exitoso 
        ? `🎉 Extracción exitosa: ${resultado.anuncios_procesados} anuncios procesados`
        : `❌ Extracción con errores: ${resultado.errores.length} errores encontrados`,
      resultado,
      estadisticas_bd: {
        total_anuncios_mercadolibre: totalAnunciosML,
        anuncios_nuevos_sesion: resultado.anuncios_procesados
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error en extracción simple funcional:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      mensaje: '❌ Error durante la extracción simple funcional'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});