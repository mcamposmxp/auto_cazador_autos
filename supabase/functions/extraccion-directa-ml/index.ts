// Edge function for direct MercadoLibre extraction
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Get random user agent
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
// Random delay
async function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve)=>setTimeout(resolve, delay));
}
// Extract URLs from MercadoLibre search pages
async function extractMLMurls(maxPages = 2) {
  const urls1 = [];
  console.log(`🔍 Extrayendo URLs de ${maxPages} páginas de MercadoLibre...`);
  for(let page = 1; page <= maxPages; page++){
    try {
      const searchUrl = `https://listado.mercadolibre.com.mx/autos-camionetas/_Desde_${(page - 1) * 50 + 1}`;
      console.log(`📄 Procesando página ${page}: ${searchUrl}`);
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) {
        console.error(`❌ Error en página ${page}: ${response.status}`);
        continue;
      }
      const html = await response.text();
      console.log(`📄 HTML recibido de página ${page}: ${html.length} caracteres`);
      // Extract MLM IDs using regex
      const mlmIdRegex = /MLM\d{10,}/g;
      const mlmIds = html.match(mlmIdRegex) || [];
      const uniqueIds = [
        ...new Set(mlmIds)
      ];
      console.log(`🔍 ${uniqueIds.length} MLM IDs únicos encontrados en página ${page}`);
      // Convert to full URLs
      const pageUrls = uniqueIds.map((id)=>`https://articulo.mercadolibre.com.mx/${id}`);
      urls1.push(...pageUrls);
      console.log(`✅ Página ${page} completada. URLs acumuladas: ${urls1.length}`);
      // Delay between pages
      if (page < maxPages) {
        await randomDelay(2000, 4000);
      }
    } catch (error) {
      console.error(`❌ Error procesando página ${page}:`, error);
    }
  }
  const uniqueUrls = [
    ...new Set(urls1)
  ];
  console.log(`🏁 Extracción completada: ${uniqueUrls.length} URLs únicas encontradas`);
  return uniqueUrls;
}
// Extract data from a single vehicle page
async function extractVehicleData(url) {
  try {
    console.log(`🔍 Extrayendo datos de: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      },
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      console.error(`❌ Error HTTP ${response.status} para ${url}`);
      return null;
    }
    const html = await response.text();
    console.log(`📄 HTML recibido: ${html.length} caracteres`);
    // Extract title
    const titleMatch = html.match(/<h1[^>]*class="[^"]*ui-pdp-title[^"]*"[^>]*>([^<]+)</i);
    const titulo = titleMatch ? titleMatch[1].trim() : '';
    // Extract price
    const priceMatch = html.match(/class="[^"]*price-tag-fraction[^"]*"[^>]*>([^<]+)</i);
    const precioStr = priceMatch ? priceMatch[1].replace(/[^\d]/g, '') : '0';
    const precio = parseInt(precioStr) || 0;
    // Extract year - find the first 4-digit number that looks like a year
    const yearMatches = html.match(/\b(19|20)\d{2}\b/g) || [];
    const validYears = yearMatches.filter((year)=>{
      const y = parseInt(year);
      return y >= 1990 && y <= new Date().getFullYear() + 1;
    });
    const ano = validYears.length > 0 ? parseInt(validYears[0]) : 0;
    // Extract brand and model from title
    const titleLower = titulo.toLowerCase();
    const brandKeywords = [
      'toyota',
      'honda',
      'nissan',
      'volkswagen',
      'ford',
      'chevrolet',
      'hyundai',
      'kia',
      'mazda',
      'suzuki',
      'bmw',
      'audi',
      'mercedes'
    ];
    let marca = '';
    let modelo = '';
    for (const brand of brandKeywords){
      if (titleLower.includes(brand)) {
        marca = brand.charAt(0).toUpperCase() + brand.slice(1);
        // Extract model (word after brand)
        const brandIndex = titleLower.indexOf(brand);
        const afterBrand = titulo.substring(brandIndex + brand.length).trim();
        const modelMatch = afterBrand.match(/^\s*(\w+)/);
        modelo = modelMatch ? modelMatch[1].toLowerCase() : '';
        break;
      }
    }
    // Extract mileage
    const mileageMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*km/i);
    const kilometrajeStr = mileageMatch ? mileageMatch[1].replace(/[.,]/g, '') : '0';
    const kilometraje = parseInt(kilometrajeStr) || 0;
    // Extract location
    const locationMatch = html.match(/class="[^"]*ui-pdp-color--GRAY[^"]*"[^>]*>([^<]*(?:Estado|Ciudad|Municipio)[^<]*)</i) || html.match(/class="[^"]*ui-pdp-media__title[^"]*"[^>]*>([^<]*)</i);
    const ubicacion = locationMatch ? locationMatch[1].trim() : '';
    // Extract images
    const imageMatches = html.match(/https:\/\/[^"']*\.jpg/g) || [];
    const imagenes = [
      ...new Set(imageMatches)
    ].slice(0, 10);
    const vehicleData = {
      titulo,
      precio,
      ano,
      marca,
      modelo,
      kilometraje,
      ubicacion,
      url_anuncio: url,
      sitio_web: 'MercadoLibre',
      imagenes,
      datos_raw: {
        html_length: html.length
      }
    };
    console.log(`✅ Datos extraídos: ${titulo} - $${precio} - ${ano} - ${marca} ${modelo}`);
    return vehicleData;
  } catch (error) {
    console.error(`❌ Error extrayendo datos de ${url}:`, error);
    return null;
  }
}
// Save vehicle data to database
async function saveVehicleData(vehicleData) {
  try {
    const { error } = await supabase.from('anuncios_vehiculos').upsert({
      titulo: vehicleData.titulo,
      precio: vehicleData.precio,
      ano: vehicleData.ano,
      marca: vehicleData.marca,
      modelo: vehicleData.modelo,
      kilometraje: vehicleData.kilometraje,
      ubicacion: vehicleData.ubicacion,
      url_anuncio: vehicleData.url_anuncio,
      sitio_web: vehicleData.sitio_web,
      imagenes: vehicleData.imagenes,
      datos_raw: vehicleData.datos_raw,
      fecha_extraccion: new Date().toISOString(),
      activo: true
    }, {
      onConflict: 'url_anuncio'
    });
    if (error) {
      console.error('❌ Error guardando en BD:', error);
      return false;
    }
    console.log('✅ Vehículo guardado en BD');
    return true;
  } catch (error) {
    console.error('❌ Error guardando vehículo:', error);
    return false;
  }
}
// Main extraction function
async function extractVehicles(maxVehicles = 50) {
  console.log(`🚀 Iniciando extracción directa de MercadoLibre (máximo ${maxVehicles} anuncios)`);
  const startTime = Date.now();
  let processedCount = 0;
  let savedCount = 0;
  let errorCount = 0;
  try {
    // Step 1: Extract URLs
    console.log('\n📡 === PASO 1: EXTRAYENDO URLs ===');
    const urls1 = await extractMLMurls(2);
    if (urls1.length === 0) {
      throw new Error('No se encontraron URLs para procesar');
    }
    const urlsToProcess = urls1.slice(0, maxVehicles);
    console.log(`📋 URLs para procesar: ${urlsToProcess.length}`);
    // Step 2: Process vehicles in small batches
    console.log('\n🚗 === PASO 2: PROCESANDO VEHÍCULOS ===');
    const batchSize = 10;
    for(let i = 0; i < urlsToProcess.length; i += batchSize){
      const batch = urlsToProcess.slice(i, i + batchSize);
      console.log(`\n📦 Procesando lote ${Math.floor(i / batchSize) + 1}: ${batch.length} URLs`);
      for (const url of batch){
        try {
          const vehicleData = await extractVehicleData(url);
          processedCount++;
          if (vehicleData && vehicleData.titulo && vehicleData.precio > 0) {
            const saved = await saveVehicleData(vehicleData);
            if (saved) savedCount++;
          }
          // Progress update
          const progress = Math.round(processedCount / urlsToProcess.length * 100);
          console.log(`📊 Progreso: ${processedCount}/${urlsToProcess.length} (${progress}%)`);
          await randomDelay(1000, 2000);
        } catch (error) {
          console.error(`❌ Error procesando ${url}:`, error);
          errorCount++;
        }
      }
      console.log(`✅ Lote completado: ${savedCount} anuncios guardados`);
      // Delay between batches
      if (i + batchSize < urlsToProcess.length) {
        await randomDelay(3000, 5000);
      }
    }
  } catch (error) {
    console.error('❌ Error en extracción:', error);
    errorCount++;
  }
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  console.log('\n🏁 === EXTRACCIÓN COMPLETADA ===');
  console.log(`⏱️  Tiempo total: ${duration} segundos`);
  console.log(`📊 Anuncios procesados: ${processedCount}`);
  console.log(`💾 Anuncios guardados: ${savedCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  // Get final stats from database
  const { data: totalStats } = await supabase.from('anuncios_vehiculos').select('id', {
    count: 'exact'
  });
  return {
    success: true,
    stats: {
      urls_extraidas: urls.length,
      anuncios_procesados: processedCount,
      anuncios_guardados: savedCount,
      errores: errorCount,
      tiempo_segundos: duration,
      total_en_bd: totalStats?.length || 0
    },
    message: `Extracción completada: ${savedCount} anuncios guardados en ${duration} segundos`
  };
}
// Main handler
Deno.serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Método no permitido'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    const { max_anuncios = 50 } = await req.json();
    console.log(`🚀 === INICIANDO EXTRACCIÓN DIRECTA ===`);
    console.log(`🎯 Objetivo: ${max_anuncios} anuncios máximo`);
    const result = await extractVehicles(max_anuncios);
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error en función:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
