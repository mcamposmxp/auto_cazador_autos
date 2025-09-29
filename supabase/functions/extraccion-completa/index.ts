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

// Configuración de categorías de MercadoLibre Autos
const CATEGORIAS_ML = {
  'autos': {
    nombre: 'Autos',
    filtros: [
      '', // Sin filtro
      'usados',
      'nuevos',
      'seminuevos'
    ]
  },
  'motos': {
    nombre: 'Motocicletas',
    filtros: ['', 'usadas', 'nuevas']
  },
  'camiones': {
    nombre: 'Camiones',
    filtros: ['', 'usados', 'nuevos']
  },
  'autobuses': {
    nombre: 'Autobuses',
    filtros: ['']
  }
};

// Marcas principales para extracción específica
const MARCAS_PRINCIPALES = [
  'toyota', 'honda', 'ford', 'chevrolet', 'nissan', 
  'hyundai', 'kia', 'volkswagen', 'bmw', 'mercedes-benz',
  'audi', 'mazda', 'subaru', 'mitsubishi', 'jeep',
  'dodge', 'ram', 'gmc', 'cadillac', 'buick'
];

// Estados de México para extracción geográfica
const ESTADOS_MEXICO = [
  'distrito-federal', 'estado-de-mexico', 'jalisco', 'nuevo-leon',
  'puebla', 'guanajuato', 'veracruz', 'chihuahua', 'baja-california',
  'sonora', 'coahuila', 'oaxaca', 'tamaulipas', 'chiapas'
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const randomDelay = (min: number, max: number) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Función para construir URLs de búsqueda correctas
const construirUrlsBusqueda = (categoria: string, filtro: string = '', marca: string = '', estado: string = ''): string[] => {
  const baseUrl = 'https://autos.mercadolibre.com.mx';
  const urls: string[] = [];
  
  // URL base de categoría
  let url = `${baseUrl}/${categoria}`;
  
  // Agregar filtros
  if (filtro) url += `-${filtro}`;
  if (marca) url += `/${marca}`;
  if (estado) url += `/${estado}`;
  
  console.log(`🔗 URL construida: ${url}`);
  urls.push(url);
  
  return urls;
};

// Función CORREGIDA para extraer URLs de anuncios de una página
const extraerUrlsDeListado = async (urlBusqueda: string, maxPaginas: number = 3): Promise<string[]> => {
  console.log(`📋 Extrayendo URLs de: ${urlBusqueda}`);
  
  const todasLasUrls: string[] = [];
  
  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    const userAgent = getRandomUserAgent();
    await randomDelay(2000, 5000);
    
    try {
      const paginaUrl = `${urlBusqueda}?_from=${(pagina - 1) * 50}`;
      console.log(`📄 Procesando página ${pagina}: ${paginaUrl}`);
      
      const response = await fetch(paginaUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: AbortSignal.timeout(20000)
      });
      
      if (!response.ok) {
        console.log(`❌ Error HTTP ${response.status} en página ${pagina}`);
        if (response.status === 429) {
          console.log('Rate limit alcanzado, esperando más tiempo...');
          await randomDelay(10000, 15000);
          continue;
        }
        break;
      }
      
      const html = await response.text();
      console.log(`📄 HTML recibido: ${html.length} caracteres`);
      
      if (html.length < 1000) {
        console.log(`⚠️ HTML muy corto, posible problema de acceso`);
        break;
      }

      // ESTRATEGIA CORREGIDA: Buscar IDs MLM y construir URLs correctas
      const mlmIds: Set<string> = new Set();
      
      // Patrones mejorados para encontrar IDs MLM
      const patronesMLM = [
        /MLM-[0-9]+-[a-zA-Z0-9\-_]+/gi,
        /"(MLM-[0-9]+-[^"]+)"/gi,
        /'(MLM-[0-9]+-[^']+)'/gi,
        /href="[^"]*\/([A-Z]{3}-[0-9]+-[^"\/]*)/gi
      ];

      console.log(`🔍 Buscando IDs MLM en HTML...`);
      
      for (const patron of patronesMLM) {
        let match;
        while ((match = patron.exec(html)) !== null) {
          let mlmId = match[1] || match[0];
          
          // Limpiar el ID
          mlmId = mlmId.replace(/["']/g, '').replace(/_.*$/, '');
          
          // Validar formato MLM
          if (/^MLM-[0-9]+-[a-zA-Z0-9\-_]+$/.test(mlmId)) {
            mlmIds.add(mlmId);
          }
        }
      }

      console.log(`🔍 IDs MLM encontrados: ${mlmIds.size}`);
      
      if (mlmIds.size === 0) {
        console.log(`⚠️ No se encontraron IDs MLM en página ${pagina}`);
        console.log(`HTML preview:`, html.substring(0, 1500));
        break;
      }

      // Construir URLs correctas usando articulo.mercadolibre.com.mx
      const urlsEncontradas: string[] = [];
      for (const mlmId of mlmIds) {
        const url = `https://articulo.mercadolibre.com.mx/${mlmId}_JM`;
        urlsEncontradas.push(url);
        console.log(`✅ URL construida: ${url}`);
        
        // Limitar por página pero permitir más URLs
        if (urlsEncontradas.length >= 100) break;
      }

      const urlsUnicas = [...new Set(urlsEncontradas)];
      console.log(`📄 Página ${pagina}: ${urlsUnicas.length} URLs únicas encontradas`);
      
      if (urlsUnicas.length > 0) {
        console.log(`🔗 Primeras 3 URLs:`, urlsUnicas.slice(0, 3));
        todasLasUrls.push(...urlsUnicas);
      } else {
        console.log(`❌ No se encontraron URLs válidas en página ${pagina}, deteniendo...`);
        break;
      }
      
    } catch (error) {
      console.error(`❌ Error en página ${pagina}:`, error);
      break;
    }
  }
  
  const resultado = [...new Set(todasLasUrls)];
  console.log(`✅ Total de URLs encontradas: ${resultado.length}`);
  return resultado;
};

// Función principal de extracción completa con optimizaciones
const extraccionCompleta = async (
  configuracion: {
    incluir_categorias: string[],
    incluir_marcas: string[],
    incluir_estados: string[],
    max_paginas_por_seccion: number,
    max_anuncios_total: number
  }
): Promise<any> => {
  
  const inicioTiempo = Date.now();
  const TIMEOUT_MAX = 120000; // 2 minutos máximo
  
  console.log('🚀 Iniciando extracción completa OPTIMIZADA de MercadoLibre');
  console.log('⚙️ Configuración:', configuracion);
  console.log(`⏱️ Timeout máximo configurado: ${TIMEOUT_MAX/1000} segundos`);
  
  const resultados = {
    secciones_procesadas: 0,
    urls_totales: 0,
    urls_por_seccion: {} as Record<string, number>,
    errores: [] as string[],
    tiempo_ejecucion: 0
  };
  
  let todasLasUrls: string[] = [];
  let timeoutReached = false;
  
  // Función para verificar timeout
  const verificarTimeout = () => {
    const tiempoTranscurrido = Date.now() - inicioTiempo;
    if (tiempoTranscurrido > TIMEOUT_MAX) {
      timeoutReached = true;
      throw new Error(`Timeout alcanzado: ${tiempoTranscurrido}ms > ${TIMEOUT_MAX}ms`);
    }
    return tiempoTranscurrido;
  };
  
  try {
    // Procesar solo la primera categoría para evitar timeout
    const categoria = configuracion.incluir_categorias[0] || 'autos';
    
    if (!CATEGORIAS_ML[categoria as keyof typeof CATEGORIAS_ML]) {
      throw new Error(`Categoría no válida: ${categoria}`);
    }
    
    const configCategoria = CATEGORIAS_ML[categoria as keyof typeof CATEGORIAS_ML];
    console.log(`\n🏷️ Procesando categoría: ${configCategoria.nombre}`);
    
    // Procesar TODOS los filtros para maximizar resultados
    const filtrosLimitados = configCategoria.filtros;
    
    for (const filtro of filtrosLimitados) {
      verificarTimeout();
      
      console.log(`🔍 Procesando filtro: ${filtro || 'sin filtro'}`);
      
      const urlsGenerales = construirUrlsBusqueda(categoria, filtro);
      
      for (const urlBusqueda of urlsGenerales) {
        try {
          verificarTimeout();
          
          console.log(`📡 Extrayendo de: ${urlBusqueda}`);
          const urls = await extraerUrlsDeListado(urlBusqueda, configuracion.max_paginas_por_seccion);
          
          console.log(`✅ URLs extraídas: ${urls.length}`);
          
          // Verificar que las URLs son correctas
          const urlsValidas = urls.filter(url => url.includes('MLM-') && url.includes('articulo.mercadolibre.com.mx'));
          console.log(`✅ URLs válidas de ML: ${urlsValidas.length}`);
          
          todasLasUrls.push(...urlsValidas);
          
          const seccionKey = `${categoria}-${filtro || 'general'}`;
          resultados.urls_por_seccion[seccionKey] = urlsValidas.length;
          resultados.secciones_procesadas++;
          
          console.log(`📊 Sección ${seccionKey}: ${urlsValidas.length} URLs válidas`);
          
          if (todasLasUrls.length >= configuracion.max_anuncios_total) {
            console.log(`🛑 Límite de ${configuracion.max_anuncios_total} URLs alcanzado`);
            break;
          }
          
        } catch (error) {
          const errorMsg = `Error en ${categoria}-${filtro}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          resultados.errores.push(errorMsg);
        }
      }
      
      if (todasLasUrls.length >= configuracion.max_anuncios_total) break;
    }
    
    const urlsUnicas = [...new Set(todasLasUrls)];
    resultados.urls_totales = urlsUnicas.length;
    
    console.log(`\n📈 === RESUMEN DE EXTRACCIÓN ===`);
    console.log(`🏷️ Secciones procesadas: ${resultados.secciones_procesadas}`);
    console.log(`🔗 URLs únicas encontradas: ${urlsUnicas.length}`);
    console.log(`❌ Errores: ${resultados.errores.length}`);
    console.log(`⏱️ Tiempo transcurrido: ${verificarTimeout()}ms`);
    
    if (urlsUnicas.length > 0) {
      console.log(`\n🔍 Ejemplos de URLs encontradas:`);
      urlsUnicas.slice(0, 5).forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
      
      // Procesar URLs en lotes pequeños
      const LOTE_SIZE = 3;
      let procesados = 0;
      let exitosos = 0;
      
      console.log(`\n🔄 Iniciando procesamiento en lotes de ${LOTE_SIZE} URLs`);
      
      for (let i = 0; i < urlsUnicas.length; i += LOTE_SIZE) {
        if (timeoutReached) break;
        
        const lote = urlsUnicas.slice(i, i + LOTE_SIZE);
        console.log(`🔄 Procesando lote ${Math.floor(i/LOTE_SIZE) + 1} (${lote.length} URLs)`);
        
        try {
          const resultadoLote = await supabase.functions.invoke('extractor-vehiculos', {
            body: {
              sitio_web: 'mercadolibre.com.mx',
              urls: lote
            }
          });
          
          if (resultadoLote.error) {
            console.error('❌ Error en lote:', resultadoLote.error);
            resultados.errores.push(`Error en lote: ${resultadoLote.error.message}`);
          } else {
            console.log(`✅ Lote procesado correctamente`);
            if (resultadoLote.data) {
              procesados += resultadoLote.data.procesados || 0;
              exitosos += resultadoLote.data.exitosos || 0;
            }
          }
        } catch (error) {
          console.error('❌ Error procesando lote:', error);
          resultados.errores.push(`Error procesando lote: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        await randomDelay(3000, 5000);
      }
      
      console.log(`🎯 Anuncios procesados: ${procesados}, exitosos: ${exitosos}`);
      
      return {
        ...resultados,
        anuncios_procesados: procesados,
        anuncios_exitosos: exitosos,
        timestamp: new Date().toISOString()
      };
    } else {
      console.log(`\n⚠️ NO SE ENCONTRARON URLs - Verificar selectores de extracción`);
      return {
        ...resultados,
        anuncios_procesados: 0,
        anuncios_exitosos: 0,
        timestamp: new Date().toISOString(),
        error_critico: 'No se encontraron URLs válidas'
      };
    }
    
  } catch (error) {
    resultados.tiempo_ejecucion = Date.now() - inicioTiempo;
    console.error(`💥 Error crítico en extracción completa:`, error);
    resultados.errores.push(`Error crítico: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      ...resultados,
      anuncios_procesados: 0,
      anuncios_exitosos: 0,
      timestamp: new Date().toISOString(),
      error_critico: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      categorias = ['autos'],
      marcas = [],
      estados = [],
      max_paginas_por_seccion = 3,
      max_anuncios_total = 50
    } = await req.json();
    
    console.log('Extracción completa solicitada con configuración:', {
      categorias, marcas, estados, max_paginas_por_seccion, max_anuncios_total
    });
    
    const resultado = await extraccionCompleta({
      incluir_categorias: categorias,
      incluir_marcas: marcas,
      incluir_estados: estados,
      max_paginas_por_seccion,
      max_anuncios_total
    });
    
    // Obtener estadísticas finales
    const { count: totalAnuncios } = await supabase
      .from('anuncios_vehiculos')
      .select('*', { count: 'exact', head: true });

    const { count: anunciosML } = await supabase
      .from('anuncios_vehiculos')
      .select('*', { count: 'exact', head: true })
      .eq('sitio_web', 'mercadolibre');
    
    return new Response(
      JSON.stringify({
        success: true,
        extraccion_completa: resultado,
        estadisticas_bd: {
          total_anuncios: totalAnuncios || 0,
          anuncios_mercadolibre: anunciosML || 0
        },
        mensaje: `Extracción completa finalizada. ${resultado.secciones_procesadas} secciones procesadas, ${resultado.anuncios_exitosos || 0} anuncios extraídos exitosamente.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en extraccion-completa:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});