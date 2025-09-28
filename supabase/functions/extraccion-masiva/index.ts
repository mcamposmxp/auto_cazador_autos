import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
// User agents para rotación
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];
const getRandomUserAgent = ()=>USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const randomDelay = (min, max)=>{
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve)=>setTimeout(resolve, delay));
};
// Función para extraer URLs de anuncios de una página de búsqueda
const extraerUrlsDeListado = async (urlBusqueda, pagina)=>{
  console.log(`Extrayendo URLs de página ${pagina}: ${urlBusqueda}`);
  const userAgent = getRandomUserAgent();
  await randomDelay(2000, 4000);
  try {
    const response = await fetch(`${urlBusqueda}&_from=${(pagina - 1) * 50}`, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    // Extraer URLs de anuncios usando patrones comunes de MercadoLibre
    const urlPattern = /href="([^"]*\/MLM-\d+[^"]*)/g;
    const urls = [];
    let match;
    while((match = urlPattern.exec(html)) !== null){
      let url = match[1];
      // Asegurar URL completa
      if (url.startsWith('/')) {
        url = 'https://autos.mercadolibre.com.mx' + url;
      }
      // Filtrar URLs válidas de anuncios
      if (url.includes('MLM-') && url.includes('autos.mercadolibre.com.mx')) {
        urls.push(url);
      }
    }
    // Eliminar duplicados
    const urlsUnicas = [
      ...new Set(urls)
    ];
    console.log(`Encontradas ${urlsUnicas.length} URLs en página ${pagina}`);
    return urlsUnicas;
  } catch (error) {
    console.error(`Error extrayendo página ${pagina}:`, error);
    return [];
  }
};
// Función principal de extracción masiva
const extraccionMasiva = async (termino = 'autos', maxPaginas = 5, maxAnunciosPorPagina = 10)=>{
  console.log(`Iniciando extracción masiva: ${termino}, ${maxPaginas} páginas`);
  const urlBase = `https://autos.mercadolibre.com.mx/${termino}`;
  let totalUrls = [];
  let paginasExitosas = 0;
  // Extraer URLs de múltiples páginas
  for(let pagina = 1; pagina <= maxPaginas; pagina++){
    try {
      const urls = await extraerUrlsDeListado(urlBase, pagina);
      if (urls.length === 0) {
        console.log(`No se encontraron URLs en página ${pagina}, deteniendo...`);
        break;
      }
      // Limitar URLs por página
      const urlsLimitadas = urls.slice(0, maxAnunciosPorPagina);
      totalUrls.push(...urlsLimitadas);
      paginasExitosas++;
      console.log(`Página ${pagina}: ${urlsLimitadas.length} URLs agregadas`);
    } catch (error) {
      console.error(`Error en página ${pagina}:`, error);
    }
  }
  console.log(`Total de URLs encontradas: ${totalUrls.length}`);
  if (totalUrls.length === 0) {
    return {
      success: false,
      error: 'No se encontraron URLs para extraer',
      paginas_procesadas: paginasExitosas
    };
  }
  // Llamar al extractor con las URLs encontradas usando service role
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/extractor-vehiculos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    },
    body: JSON.stringify({
      sitio_web: 'mercadolibre.com.mx',
      urls: totalUrls
    })
  });
  const resultadoExtraccion = await response.json();
  return {
    success: true,
    termino_busqueda: termino,
    paginas_procesadas: paginasExitosas,
    urls_encontradas: totalUrls.length,
    resultado_extraccion: resultadoExtraccion
  };
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { termino = 'autos', max_paginas = 3, max_anuncios_por_pagina = 15 } = await req.json();
    console.log(`Extracción masiva solicitada: ${termino}, ${max_paginas} páginas, ${max_anuncios_por_pagina} por página`);
    const resultado = await extraccionMasiva(termino, max_paginas, max_anuncios_por_pagina);
    // Obtener estadísticas actualizadas
    const { count: totalAnuncios } = await supabase.from('anuncios_vehiculos').select('*', {
      count: 'exact',
      head: true
    });
    const { count: anunciosML } = await supabase.from('anuncios_vehiculos').select('*', {
      count: 'exact',
      head: true
    }).eq('sitio_web', 'mercadolibre.com.mx');
    return new Response(JSON.stringify({
      ...resultado,
      estadisticas_finales: {
        total_anuncios: totalAnuncios || 0,
        anuncios_mercadolibre: anunciosML || 0
      },
      mensaje: `Extracción masiva completada. Se procesaron ${resultado.paginas_procesadas} páginas`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error en extraccion-masiva:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
