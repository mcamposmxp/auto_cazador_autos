import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];
const getRandomUserAgent = ()=>USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const urlPrueba = 'https://autos.mercadolibre.com.mx/autos';
    console.log(`Diagnosticando URL: ${urlPrueba}`);
    const userAgent = getRandomUserAgent();
    console.log(`User-Agent: ${userAgent}`);
    const response = await fetch(urlPrueba, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'DNT': '1',
        'Connection': 'keep-alive'
      },
      signal: AbortSignal.timeout(15000)
    });
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `HTTP ${response.status}`,
        status: response.status,
        statusText: response.statusText
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const html = await response.text();
    console.log(`HTML Length: ${html.length}`);
    // Buscar patrones comunes de MercadoLibre
    const patterns = [
      /href="([^"]*\/MLM-\d+[^"]*)/g,
      /href="([^"]*mercadolibre[^"]*MLM-\d+[^"]*)/g,
      /"url":"([^"]*MLM-\d+[^"]*)"/g,
      /MLM-\d+/g // Solo los IDs para ver si están en el HTML
    ];
    const resultados = {
      html_preview: html.substring(0, 2000),
      total_length: html.length,
      status: response.status,
      content_type: response.headers.get('content-type'),
      patterns_found: {}
    };
    patterns.forEach((pattern, index)=>{
      const matches = [
        ...html.matchAll(pattern)
      ];
      resultados.patterns_found[`pattern_${index}`] = {
        pattern: pattern.toString(),
        matches_count: matches.length,
        first_matches: matches.slice(0, 10).map((m)=>m[0])
      };
    });
    // Buscar específicamente estructuras de MercadoLibre
    const mlStructures = [
      'ui-search-result',
      'ui-search-item',
      'ui-search-link',
      'shops__item',
      'item__info',
      'andes-card',
      'ui-recommendation-item'
    ];
    resultados.ml_structures = {};
    mlStructures.forEach((structure)=>{
      const regex = new RegExp(structure, 'gi');
      const matches = html.match(regex);
      resultados.ml_structures[structure] = matches ? matches.length : 0;
    });
    // Buscar enlaces que contengan "MLM"
    const mlmRegex = /href="[^"]*MLM[^"]*"/gi;
    const mlmLinks = [
      ...html.matchAll(mlmRegex)
    ];
    resultados.mlm_links = {
      count: mlmLinks.length,
      examples: mlmLinks.slice(0, 10).map((m)=>m[0])
    };
    // Verificar si hay JavaScript que carga contenido dinámico
    const hasReact = html.includes('react') || html.includes('React');
    const hasVue = html.includes('vue') || html.includes('Vue');
    const hasAngular = html.includes('angular') || html.includes('Angular');
    const hasAjax = html.includes('ajax') || html.includes('fetch');
    resultados.dynamic_content = {
      has_react: hasReact,
      has_vue: hasVue,
      has_angular: hasAngular,
      has_ajax: hasAjax,
      likely_spa: hasReact || hasVue || hasAngular
    };
    console.log('Diagnóstico completado:', JSON.stringify(resultados, null, 2));
    return new Response(JSON.stringify({
      success: true,
      url_tested: urlPrueba,
      diagnosis: resultados,
      recommendation: resultados.dynamic_content.likely_spa ? 'La página parece usar contenido dinámico. Necesitamos un enfoque diferente.' : 'La página es estática. Los patrones pueden necesitar ajuste.'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
