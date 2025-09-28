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

// Función para calcular similitud de texto usando Jaccard Index
const jaccardSimilarity = (text1: string, text2: string): number => {
  if (!text1 || !text2) return 0;
  
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

// Función para calcular similitud usando distancia de Levenshtein normalizada
const levenshteinSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLen);
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

// Función para calcular similitud de precios
const priceSimilarity = (price1: number, price2: number): number => {
  if (!price1 || !price2) return 0;
  
  const diff = Math.abs(price1 - price2);
  const avg = (price1 + price2) / 2;
  
  // Si la diferencia es menos del 10% del promedio, consideramos alta similitud
  const percentDiff = diff / avg;
  
  if (percentDiff <= 0.05) return 1.0; // Menos del 5% de diferencia
  if (percentDiff <= 0.10) return 0.8; // Menos del 10% de diferencia
  if (percentDiff <= 0.20) return 0.6; // Menos del 20% de diferencia
  if (percentDiff <= 0.30) return 0.4; // Menos del 30% de diferencia
  
  return 0;
};

// Función para calcular similitud de kilometraje
const mileageSimilarity = (km1: number, km2: number): number => {
  if (!km1 || !km2) return 0;
  
  const diff = Math.abs(km1 - km2);
  const avg = (km1 + km2) / 2;
  
  // Si la diferencia es menos del 15% del promedio
  const percentDiff = diff / avg;
  
  if (percentDiff <= 0.05) return 1.0;
  if (percentDiff <= 0.15) return 0.8;
  if (percentDiff <= 0.25) return 0.6;
  if (percentDiff <= 0.35) return 0.4;
  
  return 0;
};

// Función principal para calcular similitud entre dos anuncios
const calcularSimilitud = (anuncio1: any, anuncio2: any): { score: number; tipo: string; detalles: any } => {
  const similitudes: any = {};
  
  // 1. Similitud exacta por hash de contenido
  if (anuncio1.hash_contenido && anuncio2.hash_contenido && 
      anuncio1.hash_contenido === anuncio2.hash_contenido) {
    return {
      score: 1.0,
      tipo: 'exacto',
      detalles: { razon: 'hash_contenido_identico' }
    };
  }
  
  // 2. Similitud por datos principales (marca, modelo, año)
  let scoreData = 0;
  let matches = 0;
  
  if (anuncio1.marca && anuncio2.marca) {
    const marcaSim = levenshteinSimilarity(anuncio1.marca, anuncio2.marca);
    similitudes.marca = marcaSim;
    scoreData += marcaSim * 0.4;
    if (marcaSim > 0.8) matches++;
  }
  
  if (anuncio1.modelo && anuncio2.modelo) {
    const modeloSim = levenshteinSimilarity(anuncio1.modelo, anuncio2.modelo);
    similitudes.modelo = modeloSim;
    scoreData += modeloSim * 0.3;
    if (modeloSim > 0.8) matches++;
  }
  
  if (anuncio1.ano && anuncio2.ano) {
    const anoSim = anuncio1.ano === anuncio2.ano ? 1.0 : 0;
    similitudes.ano = anoSim;
    scoreData += anoSim * 0.3;
    if (anoSim > 0.8) matches++;
  }
  
  // 3. Similitud por precio
  if (anuncio1.precio && anuncio2.precio) {
    similitudes.precio = priceSimilarity(anuncio1.precio, anuncio2.precio);
  }
  
  // 4. Similitud por kilometraje
  if (anuncio1.kilometraje && anuncio2.kilometraje) {
    similitudes.kilometraje = mileageSimilarity(anuncio1.kilometraje, anuncio2.kilometraje);
  }
  
  // 5. Similitud de texto (título y descripción)
  let scoreTexto = 0;
  
  if (anuncio1.titulo && anuncio2.titulo) {
    const tituloSim = Math.max(
      jaccardSimilarity(anuncio1.titulo, anuncio2.titulo),
      levenshteinSimilarity(anuncio1.titulo, anuncio2.titulo)
    );
    similitudes.titulo = tituloSim;
    scoreTexto += tituloSim * 0.6;
  }
  
  if (anuncio1.descripcion && anuncio2.descripcion) {
    const descripcionSim = jaccardSimilarity(anuncio1.descripcion, anuncio2.descripcion);
    similitudes.descripcion = descripcionSim;
    scoreTexto += descripcionSim * 0.4;
  }
  
  // Calcular score final
  let scoreFinal = 0;
  let peso = 0;
  
  // Peso por datos principales
  if (scoreData > 0) {
    scoreFinal += scoreData * 0.5;
    peso += 0.5;
  }
  
  // Peso por texto
  if (scoreTexto > 0) {
    scoreFinal += scoreTexto * 0.3;
    peso += 0.3;
  }
  
  // Peso por precio
  if (similitudes.precio > 0) {
    scoreFinal += similitudes.precio * 0.1;
    peso += 0.1;
  }
  
  // Peso por kilometraje
  if (similitudes.kilometraje > 0) {
    scoreFinal += similitudes.kilometraje * 0.1;
    peso += 0.1;
  }
  
  const scoreNormalizado = peso > 0 ? scoreFinal / peso : 0;
  
  // Determinar tipo de similitud
  let tipo = 'fuzzy_text';
  if (matches >= 2 && (similitudes.precio > 0.6 || similitudes.kilometraje > 0.6)) {
    tipo = 'datos_principales';
  }
  
  return {
    score: Math.round(scoreNormalizado * 100) / 100,
    tipo,
    detalles: similitudes
  };
};

// Función para guardar relación de similitud
const guardarSimilitud = async (anuncio1Id: string, anuncio2Id: string, similitud: any): Promise<void> => {
  try {
    const { error } = await supabase
      .from('anuncios_similares')
      .upsert({
        anuncio_1_id: anuncio1Id,
        anuncio_2_id: anuncio2Id,
        tipo_similitud: similitud.tipo,
        score_similitud: similitud.score,
        detalles: similitud.detalles
      }, {
        onConflict: 'anuncio_1_id,anuncio_2_id,tipo_similitud'
      });
    
    if (error) {
      console.error('Error guardando similitud:', error);
    }
  } catch (error) {
    console.error('Error guardando similitud:', error);
  }
};

// Función principal de detección de duplicados
const detectarDuplicados = async (limite: number, umbralSimilitud: number = 0.7): Promise<any> => {
  // Obtener anuncios activos ordenados por fecha de creación
  const { data: anuncios, error } = await supabase
    .from('anuncios_vehiculos')
    .select('id, marca, modelo, ano, precio, kilometraje, titulo, descripcion, hash_contenido, created_at')
    .eq('activo', true)
    .order('created_at', { ascending: false })
    .limit(limite);
  
  if (error) {
    throw error;
  }
  
  if (!anuncios || anuncios.length < 2) {
    return {
      procesados: anuncios?.length || 0,
      comparaciones: 0,
      duplicados_encontrados: 0,
      duplicados: []
    };
  }
  
  const duplicados = [];
  let comparaciones = 0;
  
  // Comparar cada anuncio con todos los posteriores
  for (let i = 0; i < anuncios.length - 1; i++) {
    for (let j = i + 1; j < anuncios.length; j++) {
      comparaciones++;
      
      const similitud = calcularSimilitud(anuncios[i], anuncios[j]);
      
      if (similitud.score >= umbralSimilitud) {
        duplicados.push({
          anuncio_1: anuncios[i],
          anuncio_2: anuncios[j],
          similitud
        });
        
        // Guardar en base de datos
        await guardarSimilitud(anuncios[i].id, anuncios[j].id, similitud);
      }
    }
  }
  
  return {
    procesados: anuncios.length,
    comparaciones,
    duplicados_encontrados: duplicados.length,
    duplicados: duplicados.slice(0, 20) // Limitar resultados mostrados
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limite = 100, umbral_similitud = 0.7 } = await req.json();
    
    console.log(`Iniciando detección de duplicados con limite: ${limite}, umbral: ${umbral_similitud}`);
    
    const resultado = await detectarDuplicados(limite, umbral_similitud);
    
    return new Response(
      JSON.stringify({
        success: true,
        ...resultado
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en detectar-duplicados:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});