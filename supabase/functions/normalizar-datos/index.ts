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

// Mapeos de normalización para marcas
const MARCAS_NORMALIZADAS = {
  'toyota': ['toyota', 'toyot', 'toyoya', 'tyota'],
  'honda': ['honda', 'hnda', 'honds'],
  'ford': ['ford', 'frd', 'for'],
  'chevrolet': ['chevrolet', 'chevy', 'chev', 'chevrolett', 'chevroleth'],
  'nissan': ['nissan', 'nisan', 'nissam'],
  'hyundai': ['hyundai', 'hyundayi', 'hundai'],
  'kia': ['kia', 'ki'],
  'volkswagen': ['volkswagen', 'vw', 'volks', 'volkswage'],
  'bmw': ['bmw', 'bm'],
  'mercedes-benz': ['mercedes', 'mercedes-benz', 'mercedesbenz', 'mb'],
  'audi': ['audi', 'audia'],
  'mazda': ['mazda', 'masda'],
  'subaru': ['subaru', 'subaru'],
  'mitsubishi': ['mitsubishi', 'mitsubishi', 'mitsub'],
};

// Función para normalizar marcas usando fuzzy matching
const normalizarMarca = async (marcaOriginal: string): Promise<{ marca_normalizada: string; confianza: number }> => {
  if (!marcaOriginal) return { marca_normalizada: '', confianza: 0 };
  
  const marcaLower = marcaOriginal.toLowerCase().trim();
  
  // Búsqueda exacta
  for (const [marcaNormal, variaciones] of Object.entries(MARCAS_NORMALIZADAS)) {
    if (variaciones.includes(marcaLower)) {
      return { marca_normalizada: marcaNormal, confianza: 1.0 };
    }
  }
  
  // Fuzzy matching usando distancia de Levenshtein
  let mejorCoincidencia = { marca: marcaLower, distancia: Infinity };
  
  for (const [marcaNormal, variaciones] of Object.entries(MARCAS_NORMALIZADAS)) {
    for (const variacion of variaciones) {
      const distancia = levenshteinDistance(marcaLower, variacion);
      if (distancia < mejorCoincidencia.distancia) {
        mejorCoincidencia = { marca: marcaNormal, distancia };
      }
    }
  }
  
  // Si la distancia es menor a 3, consideramos que es una coincidencia
  if (mejorCoincidencia.distancia <= 2) {
    const confianza = Math.max(0, 1 - (mejorCoincidencia.distancia / marcaLower.length));
    return { marca_normalizada: mejorCoincidencia.marca, confianza };
  }
  
  // Si no encontramos coincidencia, devolvemos la marca original
  return { marca_normalizada: marcaLower, confianza: 0.5 };
};

// Función para calcular distancia de Levenshtein
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Función para normalizar precios (formato mexicano)
const normalizarPrecio = (precioOriginal: string): number | null => {
  if (!precioOriginal) return null;
  
  // Eliminar caracteres no numéricos excepto punto y coma
  let precio = precioOriginal.toString().replace(/[^\d.,]/g, '');
  
  // En México: coma = separador de miles, punto = decimal
  // Ejemplos: "425,900" = 425900, "425,900.50" = 425900.50, "1,250,000" = 1250000
  
  // Si hay punto después de coma, es formato con decimales
  if (precio.includes(',') && precio.includes('.') && precio.lastIndexOf('.') > precio.lastIndexOf(',')) {
    // Formato: 1,250,000.50 -> remover comas, mantener punto
    precio = precio.replace(/,/g, '');
  } else if (precio.includes(',')) {
    // Formato: 425,900 (sin decimales) -> remover comas
    precio = precio.replace(/,/g, '');
  }
  
  const precioFloat = parseFloat(precio);
  return isNaN(precioFloat) ? null : precioFloat;
};

// Función para normalizar kilometraje (formato mexicano)
const normalizarKilometraje = (kilometrajeOriginal: string): number | null => {
  if (!kilometrajeOriginal) return null;
  
  let km = kilometrajeOriginal.toString().toLowerCase();
  
  // Eliminar texto común
  km = km.replace(/\b(km|kms|kilómetros|kilometros|millas|miles)\b/g, '');
  
  // Eliminar caracteres no numéricos excepto punto y coma
  km = km.replace(/[^\d.,]/g, '');
  
  // Aplicar misma lógica que precios para formato mexicano
  // "50,000" = 50000 km, "50,000.5" = 50000.5 km
  if (km.includes(',') && km.includes('.') && km.lastIndexOf('.') > km.lastIndexOf(',')) {
    // Formato: 50,000.5 -> remover comas, mantener punto
    km = km.replace(/,/g, '');
  } else if (km.includes(',')) {
    // Formato: 50,000 (sin decimales) -> remover comas
    km = km.replace(/,/g, '');
  }
  
  const kmFloat = parseFloat(km);
  return isNaN(kmFloat) ? null : kmFloat;
};

// Función para normalizar año
const normalizarAno = (anoOriginal: any): number | null => {
  if (!anoOriginal) return null;
  
  const ano = parseInt(anoOriginal.toString());
  const currentYear = new Date().getFullYear();
  
  // Validar que el año esté en un rango razonable
  if (isNaN(ano) || ano < 1900 || ano > currentYear + 1) {
    return null;
  }
  
  return ano;
};

// Función principal de normalización
const normalizarAnuncio = async (anuncio: any): Promise<any> => {
  try {
    const marcaNormalizada = await normalizarMarca(anuncio.marca);
    const precioNormalizado = normalizarPrecio(anuncio.precio_original);
    const kilometrajeNormalizado = normalizarKilometraje(anuncio.kilometraje_original);
    const anoNormalizado = normalizarAno(anuncio.ano);
    
    // Actualizar anuncio con datos normalizados
    const datosNormalizados = {
      marca: marcaNormalizada.marca_normalizada,
      precio: precioNormalizado,
      kilometraje: kilometrajeNormalizado,
      ano: anoNormalizado,
      estado_normalizacion: 'procesado'
    };
    
    const { error: updateError } = await supabase
      .from('anuncios_vehiculos')
      .update(datosNormalizados)
      .eq('id', anuncio.id);
    
    if (updateError) {
      throw updateError;
    }
    
    // Guardar información de normalización de marca si es nueva
    if (marcaNormalizada.marca_normalizada && marcaNormalizada.confianza > 0.7) {
      const { error: marcaError } = await supabase
        .from('marcas_normalizadas')
        .upsert({
          marca_original: anuncio.marca,
          marca_normalizada: marcaNormalizada.marca_normalizada,
          confianza: marcaNormalizada.confianza
        }, { 
          onConflict: 'marca_original'
        });
        
      if (marcaError) {
        console.error('Error guardando marca normalizada:', marcaError);
      }
    }
    
    return {
      id: anuncio.id,
      success: true,
      cambios: datosNormalizados
    };
    
  } catch (error) {
    // Marcar como error
    await supabase
      .from('anuncios_vehiculos')
      .update({ estado_normalizacion: 'error' })
      .eq('id', anuncio.id);
    
    return {
      id: anuncio.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limite = 50, sitio_web } = await req.json();
    
    // Construir query para obtener anuncios pendientes - exclude contact info for security
    let query = supabase
      .from('anuncios_vehiculos')
      .select('id, titulo, marca, modelo, ano, precio, precio_original, kilometraje, ubicacion, sitio_web, datos_raw')
      .eq('estado_normalizacion', 'pendiente')
      .eq('activo', true)
      .limit(limite);
    
    if (sitio_web) {
      query = query.eq('sitio_web', sitio_web);
    }
    
    const { data: anuncios, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (!anuncios || anuncios.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          mensaje: 'No hay anuncios pendientes de normalización',
          procesados: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Procesando ${anuncios.length} anuncios para normalización`);
    
    // Procesar anuncios en paralelo (máximo 10 a la vez)
    const BATCH_SIZE = 10;
    const resultados = [];
    
    for (let i = 0; i < anuncios.length; i += BATCH_SIZE) {
      const batch = anuncios.slice(i, i + BATCH_SIZE);
      const promesas = batch.map(anuncio => normalizarAnuncio(anuncio));
      const resultadosBatch = await Promise.all(promesas);
      resultados.push(...resultadosBatch);
      
      // Pequeño delay entre batches
      if (i + BATCH_SIZE < anuncios.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const exitosos = resultados.filter(r => r.success).length;
    const errores = resultados.filter(r => !r.success).length;
    
    return new Response(
      JSON.stringify({
        success: true,
        procesados: resultados.length,
        exitosos,
        errores,
        resultados: resultados.slice(0, 10) // Solo mostrar los primeros 10 resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en normalizar-datos:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});