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

// Lista de User-Agents para rotación
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

interface ExtraccionConfig {
  sitio_web: string;
  selectores: Record<string, string>;
  headers: Record<string, string>;
  delay_entre_requests: number;
  max_requests_por_minuto: number;
  user_agents: string[];
  proxies: string[];
}

interface LogExtraccion {
  sitio_web: string;
  url: string;
  estado: 'exito' | 'error' | 'bloqueado' | 'timeout';
  mensaje?: string;
  tiempo_respuesta?: number;
  ip_utilizada?: string;
  user_agent: string;
}

// Función para esperar con delay aleatorio
const randomDelay = (min: number, max: number) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Función para obtener User-Agent aleatorio
const getRandomUserAgent = (customAgents?: string[]): string => {
  const agents = customAgents && customAgents.length > 0 ? customAgents : USER_AGENTS;
  return agents[Math.floor(Math.random() * agents.length)];
};

// Función para generar hash del contenido
const generateContentHash = (data: any): string => {
  const content = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Función para extraer datos usando regex optimizada para MercadoLibre 2024
function extractData(html: string, selectores: Record<string, string>) {
  const data: any = {
    titulo: '',
    precio: null,
    precio_original: '',
    ano: null,
    kilometraje: null,
    kilometraje_original: '',
    marca: '',
    modelo: '',
    color: '',
    tipo_vehiculo: '',
    transmision: '',
    combustible: '',
    ubicacion: '',
    descripcion: '',
    email: '',
    telefono: '',
    imagenes: [],
    caracteristicas: {},
    datos_raw: {}
  };

  try {
    console.log(`🔍 Iniciando extracción de datos. HTML size: ${html.length} chars`);

    // Extracción MEJORADA para MercadoLibre - Título con múltiples patrones
    const tituloPatterns = [
      /<h1[^>]*class="[^"]*ui-pdp-title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<title>([^|<]+)(?:\s*\|\s*MercadoLibre)?<\/title>/i,
      /class="ui-pdp-title"[^>]*>([^<]+)</i,
      /"name"\s*:\s*"([^"]+)"/i,
      /<span[^>]*class="[^"]*ui-pdp-color--BLACK[^"]*"[^>]*>([^<]+)</i
    ];
    
    for (const pattern of tituloPatterns) {
      const match = html.match(pattern);
      if (match && match[1]?.trim() && match[1].trim().length > 5) {
        data.titulo = match[1].trim()
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"');
        console.log(`📝 Título extraído: "${data.titulo}"`);
        break;
      }
    }

    // Extracción MEJORADA para MercadoLibre - Precio con validación estricta
    const precioPatterns = [
      /<span[^>]*class="[^"]*andes-money-amount__fraction[^"]*"[^>]*>([0-9,]+)<\/span>/i,
      /<span[^>]*class="[^"]*price-tag-fraction[^"]*"[^>]*>([0-9,]+)<\/span>/i,
      /"price"\s*:\s*"?([0-9,]+)"?/i,
      /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i,
      /\$\s*([0-9,]+(?:\.[0-9]{2})?)/,
      /"amount"\s*:\s*([0-9.]+)/i,
      /precio[:\s]*\$?([0-9,]+)/i
    ];
    
    for (const pattern of precioPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const precioLimpio = match[1].replace(/,/g, '');
        const precioNumerico = parseFloat(precioLimpio);
        
        // Validación estricta: precio entre $10,000 y $15,000,000
        if (precioNumerico >= 10000 && precioNumerico <= 15000000) {
          data.precio_original = match[1];
          data.precio = precioNumerico;
          console.log(`💰 Precio extraído: $${data.precio} (original: "${data.precio_original}")`);
          break;
        } else {
          console.log(`❌ Precio inválido descartado: $${precioNumerico}`);
        }
      }
    }

    // Extracción MEJORADA para MercadoLibre - Año con múltiples estrategias
    const anoPatterns = [
      // Patrones estructurados
      /<td[^>]*>Año<\/td>\s*<td[^>]*>(\d{4})<\/td>/i,
      /<span[^>]*>Año[^<]*<\/span>\s*<span[^>]*>(\d{4})<\/span>/i,
      /"year"[^}]*?(\d{4})/i,
      /"modelYear"[^}]*?(\d{4})/i,
      // Patrones de texto
      /año[:\s]*(\d{4})/i,
      /modelo[:\s]*(\d{4})/i,
      /(\d{4})\s*(?:modelo|año)/i,
      // En el título
      /\b(19[8-9][0-9]|20[0-2][0-9])\b/g
    ];

    let anosEncontrados = [];
    for (const pattern of anoPatterns) {
      if (pattern.flags?.includes('g')) {
        const matches = [...html.matchAll(new RegExp(pattern.source, 'gi'))];
        for (const match of matches) {
          const ano = parseInt(match[1]);
          if (ano >= 1990 && ano <= 2025) {
            anosEncontrados.push(ano);
          }
        }
      } else {
        const match = html.match(pattern);
        if (match && match[1]) {
          const ano = parseInt(match[1]);
          if (ano >= 1990 && ano <= 2025) {
            anosEncontrados.push(ano);
          }
        }
      }
    }

    // Seleccionar el año más frecuente o más reciente
    if (anosEncontrados.length > 0) {
      const frecuencias = {};
      anosEncontrados.forEach(ano => {
        frecuencias[ano] = (frecuencias[ano] || 0) + 1;
      });
      
      data.ano = Object.keys(frecuencias)
        .map(Number)
        .sort((a, b) => frecuencias[b] - frecuencias[a] || b - a)[0];
      
      console.log(`📅 Año extraído: ${data.ano} (encontrados: ${anosEncontrados})`);
    }

    // Extracción MEJORADA para MercadoLibre - Kilometraje con validación estricta
    const kmPatterns = [
      // Patrones específicos de MercadoLibre
      /<td[^>]*>Kilómetros<\/td>\s*<td[^>]*>([\d,]+)<\/td>/i,
      /<span[^>]*>Kilómetros[^<]*<\/span>\s*<span[^>]*>([\d,]+)<\/span>/i,
      /(\d{1,3}(?:[,.]?\d{3})*)\s*km(?!\w)/i,
      /kilometraje[:\s]*(\d{1,3}(?:[,.]?\d{3})*)/i,
      /kilómetros[:\s]*(\d{1,3}(?:[,.]?\d{3})*)/i,
      /"mileage"[^}]*?(\d{1,6})/i,
      /"odometer"[^}]*?(\d{1,6})/i,
      /(\d{1,3}(?:[,.]?\d{3})*)\s*(?:kilómetros|kms)/i
    ];
    
    for (const pattern of kmPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const kmLimpio = match[1].replace(/[,.]/g, '');
        const kmNumerico = parseInt(kmLimpio);
        
        // Validación estricta: entre 1 y 500,000 km (rechazar valores como "2")
        if (kmNumerico >= 50 && kmNumerico <= 500000) {
          data.kilometraje_original = match[1];
          data.kilometraje = kmNumerico;
          console.log(`🛣️ Kilometraje extraído: ${data.kilometraje} km (original: "${data.kilometraje_original}")`);
          break;
        } else {
          console.log(`❌ Kilometraje inválido descartado: ${kmNumerico} km`);
        }
      }
    }

    // Extracción MEJORADA de marca y modelo con algoritmo avanzado
    if (data.titulo) {
      const marcasDB = [
        'toyota', 'honda', 'nissan', 'volkswagen', 'chevrolet', 'ford', 'hyundai', 'kia', 'mazda', 'subaru',
        'bmw', 'mercedes-benz', 'mercedes', 'audi', 'lexus', 'infiniti', 'acura', 'cadillac', 'lincoln', 'volvo',
        'jaguar', 'porsche', 'ferrari', 'lamborghini', 'bentley', 'rolls-royce', 'maserati', 'alfa romeo', 'alfa',
        'fiat', 'jeep', 'ram', 'dodge', 'chrysler', 'buick', 'gmc', 'tesla', 'mini', 'land rover', 'range rover',
        'suzuki', 'mitsubishi', 'isuzu', 'saab', 'peugeot', 'renault', 'citroen', 'seat', 'skoda', 'opel',
        'smart', 'dacia', 'lada', 'geely', 'byd', 'chery', 'great wall', 'jac', 'mg', 'haval', 'lynk co',
        'polestar', 'rivian', 'lucid', 'fisker', 'nio', 'xpeng', 'li auto', 'genesis', 'cupra', 'chirey'
      ];
      
      const tituloLower = data.titulo.toLowerCase();
      let marcaEncontrada = null;
      let posicionMarca = -1;
      
      // Buscar la marca más temprana en el título
      for (const marca of marcasDB) {
        const pos = tituloLower.indexOf(marca);
        if (pos !== -1 && (posicionMarca === -1 || pos < posicionMarca)) {
          marcaEncontrada = marca;
          posicionMarca = pos;
        }
      }
      
      if (marcaEncontrada) {
        data.marca = marcaEncontrada.split(' ').map(p => 
          p.charAt(0).toUpperCase() + p.slice(1)
        ).join(' ');
        
        // Extraer modelo de manera más inteligente
        const inicioModelo = posicionMarca + marcaEncontrada.length;
        const textoModelo = data.titulo.substring(inicioModelo).trim();
        const palabras = textoModelo.split(/[\s\-,]+/).filter(p => p.length > 0);
        
        if (palabras.length > 0) {
          // Filtrar palabras que no son parte del modelo
          const modeloPalabras = palabras.filter(palabra => {
            const p = palabra.toLowerCase();
            return !p.match(/^\d{4}$/) && // años
                   !p.match(/^[0-9.]+[lL]?$/) && // cilindrada
                   !p.match(/^(mt|at|cvt|automático|manual)$/i) && // transmisión
                   !p.match(/^(4x4|4x2|awd|fwd)$/i) && // tracción
                   !p.match(/^(gasolina|diesel|híbrido|eléctrico)$/i) && // combustible
                   p.length > 1;
          });
          
          data.modelo = modeloPalabras.slice(0, 2).join(' ');
        }
        
        console.log(`🚗 Marca extraída: "${data.marca}", Modelo: "${data.modelo}"`);
      }
    }

    // Extracción MEJORADA de ubicación con múltiples patrones
    const ubicacionPatterns = [
      // Datos estructurados JSON
      /"addressLocality"\s*:\s*"([^"]+)"/i,
      /"addressRegion"\s*:\s*"([^"]+)"/i,
      // Clases específicas de MercadoLibre
      /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i,
      /<span[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/span>/i,
      // Patrones de texto
      /ubicación[:\s]*([^<\n,]+)/i,
      /location[:\s]*([^<\n,]+)/i,
      /envío\s+a\s+([^<\n,]+)/i,
      /vendido\s+por[^<]*en\s+([^<\n,]+)/i
    ];
    
    for (const pattern of ubicacionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]?.trim() && match[1].trim().length > 2) {
        const ubicacion = match[1].trim()
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ');
        
        if (ubicacion.length >= 3 && ubicacion.length <= 100) {
          data.ubicacion = ubicacion;
          console.log(`📍 Ubicación extraída: "${data.ubicacion}"`);
          break;
        }
      }
    }

    // Extracción MEJORADA de imágenes con mejor filtrado
    const imagenesMatches = html.match(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s]*)?/gi);
    if (imagenesMatches) {
      const imagenesUnicas = Array.from(new Set(imagenesMatches))
        .filter(url => {
          const urlLower = url.toLowerCase();
          return !urlLower.includes('logo') &&
                 !urlLower.includes('icon') &&
                 !urlLower.includes('favicon') &&
                 !urlLower.includes('sprite') &&
                 !urlLower.includes('banner') &&
                 (urlLower.includes('mlstatic') || urlLower.includes('mlibre')); // Solo imágenes de MercadoLibre
        })
        .slice(0, 10);
      
      data.imagenes = imagenesUnicas;
      console.log(`🖼️ ${data.imagenes.length} imágenes encontradas`);
    }

    // Calcular score de calidad con validación estricta
    const camposRequeridos = ['titulo', 'precio', 'ano', 'marca'];
    const camposExtraidos = camposRequeridos.filter(campo => data[campo]);
    const score = camposExtraidos.length;
    const maxScore = camposRequeridos.length;
    
    // Penalizar datos claramente incorrectos
    let penalizacion = 0;
    if (data.kilometraje && data.kilometraje < 50) penalizacion += 1;
    if (data.ano && (data.ano < 1990 || data.ano > 2025)) penalizacion += 1;
    if (data.precio && (data.precio < 10000 || data.precio > 15000000)) penalizacion += 1;
    
    const scoreAjustado = Math.max(0, score - penalizacion);
    
    console.log(`📊 Score de extracción: ${scoreAjustado}/${maxScore} (título: ${!!data.titulo}, precio: ${!!data.precio}, año: ${!!data.ano}, marca: ${!!data.marca})`);
    
    if (penalizacion > 0) {
      console.log(`⚠️ Penalizaciones aplicadas: ${penalizacion} (kilometraje bajo, año inválido, precio fuera de rango)`);
    }

    if (scoreAjustado < 3) {
      console.log(`❌ Datos extraídos insuficientes (score: ${scoreAjustado}/${maxScore}). Revisando patrones...`);
    }

    return data;
  } catch (error) {
    console.error('❌ Error en extractData:', error);
    return data;
  }
}

// Función para registrar log de extracción
const registrarLog = async (log: LogExtraccion): Promise<void> => {
  try {
    const { error } = await supabase
      .from('logs_extraccion')
      .insert(log);
      
    if (error) {
      console.error('Error registrando log:', error);
    }
  } catch (error) {
    console.error('Error registrando log:', error);
  }
};

// Función principal de extracción
const extraerAnuncio = async (url: string, config: ExtraccionConfig): Promise<any> => {
  const startTime = Date.now();
  const userAgent = getRandomUserAgent(config.user_agents);
  
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    ...config.headers
  };

  try {
    // Delay aleatorio antes de la petición
    await randomDelay(config.delay_entre_requests, config.delay_entre_requests * 2);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(30000) // Timeout de 30 segundos
    });
    
    const tiempoRespuesta = Date.now() - startTime;
    
    if (!response.ok) {
      const log: LogExtraccion = {
        sitio_web: config.sitio_web,
        url,
        estado: response.status === 429 ? 'bloqueado' : 'error',
        mensaje: `HTTP ${response.status}: ${response.statusText}`,
        tiempo_respuesta: tiempoRespuesta,
        user_agent: userAgent
      };
      
      await registrarLog(log);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const datosExtraidos = extractData(html, config.selectores);
    
    // Generar hash del contenido
    const hashContenido = generateContentHash(datosExtraidos);
    
    // Preparar datos para insertar
    const anuncioData = {
      url_anuncio: url,
      sitio_web: config.sitio_web,
      titulo: datosExtraidos.titulo || '',
      precio_original: datosExtraidos.precio_original,
      precio: datosExtraidos.precio ? parseFloat(datosExtraidos.precio.toString()) : null,
      marca: datosExtraidos.marca,
      modelo: datosExtraidos.modelo,
      ano: datosExtraidos.ano ? parseInt(datosExtraidos.ano.toString()) : null,
      kilometraje_original: datosExtraidos.kilometraje_original,
      kilometraje: datosExtraidos.kilometraje ? parseInt(datosExtraidos.kilometraje.toString()) : null,
      combustible: datosExtraidos.combustible,
      transmision: datosExtraidos.transmision,
      tipo_vehiculo: datosExtraidos.tipo_vehiculo,
      color: datosExtraidos.color,
      descripcion: datosExtraidos.descripcion,
      ubicacion: datosExtraidos.ubicacion,
      telefono: datosExtraidos.telefono,
      email: datosExtraidos.email,
      imagenes: datosExtraidos.imagenes || [],
      caracteristicas: datosExtraidos.caracteristicas || {},
      datos_raw: datosExtraidos,
      hash_contenido: hashContenido,
      estado_normalizacion: 'pendiente'
    };
    
    // Verificar si ya existe el anuncio
    const { data: existente } = await supabase
      .from('anuncios_vehiculos')
      .select('id')
      .eq('url_anuncio', url)
      .single();
    
    if (existente) {
      // Actualizar anuncio existente
      const { error } = await supabase
        .from('anuncios_vehiculos')
        .update({
          ...anuncioData,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('url_anuncio', url);
        
      if (error) throw error;
    } else {
      // Insertar nuevo anuncio
      const { error } = await supabase
        .from('anuncios_vehiculos')
        .insert(anuncioData);
        
      if (error) throw error;
    }
    
    // Registrar log exitoso
    const log: LogExtraccion = {
      sitio_web: config.sitio_web,
      url,
      estado: 'exito',
      tiempo_respuesta: tiempoRespuesta,
      user_agent: userAgent
    };
    
    await registrarLog(log);
    
    return {
      success: true,
      data: anuncioData,
      tiempo_respuesta: tiempoRespuesta
    };
    
  } catch (error) {
    const tiempoRespuesta = Date.now() - startTime;
    const estado = error.name === 'TimeoutError' ? 'timeout' : 'error';
    
    const log: LogExtraccion = {
      sitio_web: config.sitio_web,
      url,
      estado,
      mensaje: error.message,
      tiempo_respuesta: tiempoRespuesta,
      user_agent: userAgent
    };
    
    await registrarLog(log);
    
    throw error;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sitio_web, urls } = await req.json();
    
    if (!sitio_web || !urls || !Array.isArray(urls)) {
      return new Response(
        JSON.stringify({ error: 'sitio_web y urls son requeridos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Obtener configuración del sitio
    const { data: config, error: configError } = await supabase
      .from('configuracion_extraccion')
      .select('*')
      .eq('sitio_web', sitio_web)
      .eq('activo', true)
      .single();
    
    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: `No se encontró configuración para ${sitio_web}` }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const resultados = [];
    const errores = [];
    
    // Procesar URLs respetando límites de velocidad
    for (const url of urls) {
      try {
        const resultado = await extraerAnuncio(url, config);
        resultados.push({ url, ...resultado });
      } catch (error) {
        errores.push({ url, error: error.message });
      }
      
      // Delay entre requests para evitar bloqueos
      if (urls.indexOf(url) < urls.length - 1) {
        await randomDelay(config.delay_entre_requests, config.delay_entre_requests * 1.5);
      }
    }
    
    // Actualizar última extracción
    await supabase
      .from('configuracion_extraccion')
      .update({ ultima_extraccion: new Date().toISOString() })
      .eq('sitio_web', sitio_web);
    
    return new Response(
      JSON.stringify({
        success: true,
        sitio_web,
        procesados: resultados.length,
        errores: errores.length,
        resultados,
        errores
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error en extractor-vehiculos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});