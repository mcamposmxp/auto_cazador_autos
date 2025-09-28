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

// Configuraciones de extracción masiva
const ESTRATEGIAS_EXTRACCION = {
  categorias: ['autos', 'motos', 'camiones', 'autobuses'],
  marcas: [
    'toyota', 'honda', 'ford', 'chevrolet', 'nissan', 'volkswagen', 
    'bmw', 'mercedes-benz', 'audi', 'hyundai', 'kia', 'mazda',
    'subaru', 'jeep', 'dodge', 'ram', 'gmc', 'cadillac', 'infiniti', 'lexus'
  ],
  estados: [
    'distrito-federal', 'estado-de-mexico', 'jalisco', 'nuevo-leon',
    'puebla', 'guanajuato', 'veracruz', 'chihuahua', 'baja-california',
    'sonora', 'coahuila', 'tamaulipas', 'michoacan', 'oaxaca'
  ],
  precios: [
    { min: 0, max: 100000, label: '0-100k' },
    { min: 100000, max: 300000, label: '100k-300k' },
    { min: 300000, max: 500000, label: '300k-500k' },
    { min: 500000, max: 1000000, label: '500k-1M' },
    { min: 1000000, max: null, label: '1M+' }
  ]
};

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
];

// Utilidades
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Crear sesión de extracción
async function crearSesionExtraccion(configuracion: any) {
  const sesionId = crypto.randomUUID();
  
  console.log(`🎯 Creando sesión de extracción: ${sesionId}`);
  
  // Crear estadísticas iniciales
  const { error: errorStats } = await supabase
    .from('estadisticas_extraccion')
    .insert([{
      sesion_id: sesionId,
      estado_general: 'iniciando',
      total_urls_objetivo: configuracion.estimado_urls || 50000,
      porcentaje_completado: 0
    }]);
  
  if (errorStats) {
    console.error('❌ Error creando estadísticas:', errorStats);
  }
  
  return sesionId;
}

// Actualizar progreso
async function actualizarProgreso(sesionId: string, estrategia: string, parametro: string, datos: any) {
  const { error } = await supabase
    .from('progreso_extraccion')
    .upsert([{
      sesion_id: sesionId,
      estrategia,
      parametro,
      estado: datos.estado,
      urls_extraidas: datos.urls_extraidas || 0,
      anuncios_procesados: datos.anuncios_procesados || 0,
      paginas_procesadas: datos.paginas_procesadas || 0,
      errores_count: datos.errores_count || 0,
      tiempo_inicio: datos.tiempo_inicio,
      tiempo_fin: datos.tiempo_fin,
      detalles: datos.detalles || {}
    }], {
      onConflict: 'sesion_id,estrategia,parametro'
    });
  
  if (error) {
    console.error('❌ Error actualizando progreso:', error);
  }
}

// Construir URL de búsqueda MercadoLibre
function construirUrlML(estrategia: string, parametro: string, pagina: number = 1): string {
  const baseUrl = 'https://listado.mercadolibre.com.mx';
  
  switch (estrategia) {
    case 'categoria':
      // Para categorías, usar la URL base de MercadoLibre
      if (parametro === 'autos') {
        return `${baseUrl}/autos-camionetas/_Desde_${(pagina - 1) * 50 + 1}`;
      } else if (parametro === 'motos') {
        return `${baseUrl}/motos/_Desde_${(pagina - 1) * 50 + 1}`;
      } else if (parametro === 'camiones') {
        return `${baseUrl}/camiones/_Desde_${(pagina - 1) * 50 + 1}`;
      } else if (parametro === 'autobuses') {
        return `${baseUrl}/autobuses/_Desde_${(pagina - 1) * 50 + 1}`;
      }
      return `${baseUrl}/autos-camionetas/_Desde_${(pagina - 1) * 50 + 1}`;
    case 'marca':
      return `${baseUrl}/autos-camionetas/marca/${parametro}/_Desde_${(pagina - 1) * 50 + 1}`;
    case 'estado':
      return `${baseUrl}/autos-camionetas/${parametro}/_Desde_${(pagina - 1) * 50 + 1}`;
    case 'precio':
      const precio = ESTRATEGIAS_EXTRACCION.precios.find(p => p.label === parametro);
      if (!precio) return '';
      const minParam = precio.min ? `_PriceRange_${precio.min}` : '';
      const maxParam = precio.max ? `-${precio.max}` : '';
      return `${baseUrl}/autos-camionetas${minParam}${maxParam}/_Desde_${(pagina - 1) * 50 + 1}`;
    default:
      return '';
  }
}

// Extraer URLs de una página de listado
async function extraerUrlsDePagina(url: string, maxUrls: number = 200): Promise<string[]> {
  const urlsEncontradas: string[] = [];
  
  try {
    console.log(`🔍 Extrayendo URLs de: ${url}`);
    
    await randomDelay(2000, 4000); // Delay entre requests
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.8,en;q=0.5,en-US;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(30000) // 30 segundo timeout
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log('⚠️ Rate limit detectado, esperando...');
        await randomDelay(10000, 20000);
        return urlsEncontradas;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`📄 HTML recibido: ${html.length} caracteres`);

    // Extraer MLM IDs usando regex más preciso
    const mlmPattern = /MLM\d{10,12}/g;
    const mlmIds = html.match(mlmPattern) || [];
    
    console.log(`🔍 MLM IDs encontrados: ${mlmIds.length}`);
    
    // Convertir MLM IDs a URLs completas y eliminar duplicados
    const mlmIdsUnicos = [...new Set(mlmIds)];
    
    for (const mlmId of mlmIdsUnicos) {
      if (urlsEncontradas.length >= maxUrls) break;
      
      const urlCompleta = `https://articulo.mercadolibre.com.mx/${mlmId}`;
      urlsEncontradas.push(urlCompleta);
    }

    console.log(`✅ URLs únicas extraídas: ${urlsEncontradas.length}`);
    return urlsEncontradas;

  } catch (error) {
    console.error(`❌ Error extrayendo URLs de ${url}:`, error);
    return urlsEncontradas;
  }
}

// Proceso de extracción para una estrategia específica
async function procesarEstrategia(
  sesionId: string, 
  estrategia: string, 
  configuracion: any,
  timeoutTime: number
): Promise<any> {
  const resultados = {
    estrategia,
    elementos_procesados: 0,
    urls_extraidas: 0,
    anuncios_procesados: 0,
    errores: [],
    tiempo_inicio: new Date().toISOString(),
    tiempo_fin: null as string | null
  };

  console.log(`\n🎯 === PROCESANDO ESTRATEGIA: ${estrategia.toUpperCase()} ===`);
  
  const elementos = ESTRATEGIAS_EXTRACCION[estrategia as keyof typeof ESTRATEGIAS_EXTRACCION];
  console.log(`🔍 Elementos disponibles para ${estrategia}:`, elementos);
  
  if (!elementos) {
    console.error(`❌ Estrategia desconocida: ${estrategia}`);
    return resultados;
  }

  // Limitar elementos según configuración
  const elementosLimitados = Array.isArray(elementos) 
    ? elementos.slice(0, configuracion.max_elementos_por_estrategia || 10)
    : elementos;
    
  console.log(`🎯 Elementos limitados para procesar:`, elementosLimitados);

  for (const elemento of elementosLimitados) {
    // Verificar timeout
    if (Date.now() > timeoutTime) {
      console.log(`⏰ Timeout alcanzado para estrategia ${estrategia}`);
      break;
    }

    const parametro = typeof elemento === 'object' ? elemento.label : elemento;
    console.log(`\n📌 Procesando ${estrategia}: ${parametro}`);

    // Registrar inicio del elemento
    await actualizarProgreso(sesionId, estrategia, parametro, {
      estado: 'procesando',
      tiempo_inicio: new Date().toISOString(),
      detalles: { elemento: parametro }
    });

    const urlsDelElemento: string[] = [];
    const maxPaginas = configuracion.max_paginas_por_elemento || 15;

    // Extraer URLs de múltiples páginas
    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      if (Date.now() > timeoutTime) break;

      const urlBusqueda = construirUrlML(estrategia, parametro, pagina);
      if (!urlBusqueda) {
        console.log(`❌ No se pudo construir URL para estrategia: ${estrategia}, parametro: ${parametro}, pagina: ${pagina}`);
        continue;
      }

      console.log(`📄 Página ${pagina}/${maxPaginas}: ${urlBusqueda}`);

      try {
        const urlsPagina = await extraerUrlsDePagina(urlBusqueda, 200);
        urlsDelElemento.push(...urlsPagina);
        
        // Si no encontramos URLs, probablemente hemos llegado al final
        if (urlsPagina.length === 0) {
          console.log(`🏁 No hay más URLs en página ${pagina}, terminando para ${parametro}`);
          break;
        }

        console.log(`✅ Página ${pagina}: ${urlsPagina.length} URLs extraídas`);

      } catch (error) {
        console.error(`❌ Error en página ${pagina}:`, error);
        resultados.errores.push(`${parametro} página ${pagina}: ${error.message}`);
        
        // Delay extra en caso de error
        await randomDelay(5000, 10000);
      }
    }

    // Eliminar duplicados y procesar URLs
    const urlsUnicas = [...new Set(urlsDelElemento)];
    console.log(`🔢 URLs únicas para ${parametro}: ${urlsUnicas.length}`);

    if (urlsUnicas.length > 0) {
      // Enviar URLs para procesamiento en lotes
      const loteSize = configuracion.lote_size || 500;
      const lotes = [];
      
      for (let i = 0; i < urlsUnicas.length; i += loteSize) {
        lotes.push(urlsUnicas.slice(i, i + loteSize));
      }

      console.log(`📦 Procesando ${lotes.length} lotes de URLs para ${parametro}`);

      let anunciosProcesados = 0;
      for (const [indice, lote] of lotes.entries()) {
        if (Date.now() > timeoutTime) break;

        console.log(`🚀 Procesando lote ${indice + 1}/${lotes.length} (${lote.length} URLs)`);

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
          anunciosProcesados += resultadoLote.procesados || 0;
          
          console.log(`✅ Lote ${indice + 1} completado: ${resultadoLote.procesados} anuncios procesados`);

        } catch (error) {
          console.error(`❌ Error procesando lote ${indice + 1}:`, error);
          resultados.errores.push(`${parametro} lote ${indice + 1}: ${error.message}`);
        }

        // Delay entre lotes
        await randomDelay(3000, 6000);
      }

      resultados.anuncios_procesados += anunciosProcesados;
    }

    // Actualizar progreso del elemento
    await actualizarProgreso(sesionId, estrategia, parametro, {
      estado: 'completado',
      urls_extraidas: urlsUnicas.length,
      anuncios_procesados: resultados.anuncios_procesados,
      tiempo_fin: new Date().toISOString(),
      detalles: { 
        elemento: parametro,
        urls_extraidas: urlsUnicas.length,
        paginas_procesadas: Math.min(maxPaginas, urlsDelElemento.length)
      }
    });

    resultados.elementos_procesados++;
    resultados.urls_extraidas += urlsUnicas.length;

    console.log(`✅ ${parametro} completado: ${urlsUnicas.length} URLs, ${resultados.anuncios_procesados} anuncios`);
  }

  resultados.tiempo_fin = new Date().toISOString();
  console.log(`🏁 Estrategia ${estrategia} completada: ${resultados.elementos_procesados} elementos procesados`);
  
  return resultados;
}

// Función principal de extracción masiva completa
async function extraccionMasivaCompleta(configuracion: any) {
  const tiempoInicio = Date.now();
  const timeoutMs = (configuracion.timeout_minutos || 180) * 60 * 1000; // 3 horas por defecto
  const timeoutTime = tiempoInicio + timeoutMs;
  
  console.log(`🚀 === INICIANDO EXTRACCIÓN MASIVA COMPLETA ===`);
  console.log(`⏰ Timeout configurado: ${configuracion.timeout_minutos || 180} minutos`);
  
  // Crear sesión
  const sesionId = await crearSesionExtraccion(configuracion);
  
  const resultadoFinal = {
    sesion_id: sesionId,
    tiempo_inicio: new Date(tiempoInicio).toISOString(),
    tiempo_fin: null as string | null,
    duracion_minutos: 0,
    estrategias_procesadas: [] as any[],
    resumen: {
      total_urls_extraidas: 0,
      total_anuncios_procesados: 0,
      total_errores: 0,
      estrategias_completadas: 0
    },
    configuracion_utilizada: configuracion
  };

  // Procesar cada estrategia habilitada
  const estrategiasHabilitadas = configuracion.estrategias || ['categorias', 'marcas', 'estados'];
  console.log(`🎯 Estrategias habilitadas a procesar:`, estrategiasHabilitadas);
  
  for (const estrategia of estrategiasHabilitadas) {
    if (Date.now() > timeoutTime) {
      console.log(`⏰ Timeout general alcanzado antes de procesar ${estrategia}`);
      break;
    }

    console.log(`\n🎯 === INICIANDO ESTRATEGIA: ${estrategia.toUpperCase()} ===`);
    
    try {
      const resultadoEstrategia = await procesarEstrategia(sesionId, estrategia, configuracion, timeoutTime);
      console.log(`✅ Resultado de estrategia ${estrategia}:`, resultadoEstrategia);
      
      resultadoFinal.estrategias_procesadas.push(resultadoEstrategia);
      
      // Actualizar resumen
      resultadoFinal.resumen.total_urls_extraidas += resultadoEstrategia.urls_extraidas;
      resultadoFinal.resumen.total_anuncios_procesados += resultadoEstrategia.anuncios_procesados;
      resultadoFinal.resumen.total_errores += resultadoEstrategia.errores.length;
      resultadoFinal.resumen.estrategias_completadas++;

      console.log(`✅ Estrategia ${estrategia} completada exitosamente`);
      console.log(`📊 Resumen parcial - URLs: ${resultadoFinal.resumen.total_urls_extraidas}, Anuncios: ${resultadoFinal.resumen.total_anuncios_procesados}`);
      
    } catch (error) {
      console.error(`❌ Error en estrategia ${estrategia}:`, error);
      resultadoFinal.estrategias_procesadas.push({
        estrategia,
        error: error.message,
        tiempo_inicio: new Date().toISOString(),
        tiempo_fin: new Date().toISOString()
      });
    }

    // Delay entre estrategias
    await randomDelay(2000, 4000);
  }

  const tiempoFin = Date.now();
  resultadoFinal.tiempo_fin = new Date(tiempoFin).toISOString();
  resultadoFinal.duracion_minutos = Math.round((tiempoFin - tiempoInicio) / 60000);

  // Actualizar estadísticas finales
  await supabase
    .from('estadisticas_extraccion')
    .update({
      estado_general: 'completado',
      total_urls_extraidas: resultadoFinal.resumen.total_urls_extraidas,
      total_anuncios_procesados: resultadoFinal.resumen.total_anuncios_procesados,
      total_errores: resultadoFinal.resumen.total_errores,
      porcentaje_completado: 100
    })
    .eq('sesion_id', sesionId);

  console.log(`🏁 === EXTRACCIÓN MASIVA COMPLETA FINALIZADA ===`);
  console.log(`📊 Resumen: ${resultadoFinal.resumen.total_anuncios_procesados} anuncios procesados en ${resultadoFinal.duracion_minutos} minutos`);
  
  return resultadoFinal;
}

// Servidor HTTP
serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { configuracion } = await req.json();

    console.log('🚀 Iniciando extracción masiva completa con configuración recibida:', JSON.stringify(configuracion, null, 2));

    // Configuración por defecto optimizada
    const configCompleta = {
      estrategias: ['categorias', 'marcas', 'estados'], 
      max_elementos_por_estrategia: 15, // Procesar máximo 15 elementos por estrategia
      max_paginas_por_elemento: 20, // Hasta 20 páginas por elemento
      lote_size: 400, // Procesar URLs en lotes de 400
      timeout_minutos: 240, // 4 horas máximo
      estimado_urls: 100000, // Estimación inicial
      ...configuracion
    };

    // Ejecutar extracción masiva
    const resultado = await extraccionMasivaCompleta(configCompleta);

    // Obtener estadísticas finales de la base de datos
    const { data: estadisticasFinales } = await supabase
      .from('anuncios_vehiculos')
      .select('id')
      .eq('sitio_web', 'mercadolibre.com.mx');

    const totalAnunciosML = estadisticasFinales?.length || 0;

    return new Response(JSON.stringify({
      success: true,
      mensaje: '🎉 Extracción masiva completa finalizada exitosamente',
      resultado,
      estadisticas_bd: {
        total_anuncios_mercadolibre: totalAnunciosML,
        anuncios_nuevos_sesion: resultado.resumen.total_anuncios_procesados
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error en extracción masiva completa:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      mensaje: '❌ Error durante la extracción masiva completa'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});