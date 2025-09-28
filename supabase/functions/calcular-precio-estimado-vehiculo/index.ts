import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { marca, modelo, ano, kilometraje } = await req.json();

    if (!marca || !modelo || !ano) {
      return new Response(
        JSON.stringify({ error: 'Marca, modelo y año son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculando precio para: ${marca} ${modelo} ${ano}`);

    // Buscar vehículos similares en anuncios_vehiculos
    const { data: vehiculosSimilares, error } = await supabaseClient
      .from('anuncios_vehiculos')
      .select('precio, kilometraje, ano')
      .ilike('marca', `%${marca}%`)
      .ilike('modelo', `%${modelo}%`)
      .gte('ano', ano - 2) // Rango de 2 años antes
      .lte('ano', ano + 2) // Rango de 2 años después
      .not('precio', 'is', null)
      .gt('precio', 0)
      .eq('activo', true)
      .limit(50);

    if (error) {
      console.error('Error consultando vehículos similares:', error);
      throw error;
    }

    if (!vehiculosSimilares || vehiculosSimilares.length === 0) {
      // Si no hay datos específicos, usar un rango basado en año y marca
      const precioBase = calcularPrecioBasePorMarca(marca, ano);
      const precioEstimado = Math.round(precioBase * 0.70); // 30% menos

      return new Response(
        JSON.stringify({
          precio_estimado: precioEstimado,
          precio_mercado: precioBase,
          vehiculos_encontrados: 0,
          metodo: 'estimacion_base'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular precio promedio ponderado por similitud
    let totalPrecio = 0;
    let totalPesos = 0;

    for (const vehiculo of vehiculosSimilares) {
      // Calcular peso basado en similitud de año y kilometraje
      const diferenciaTiempo = Math.abs(vehiculo.ano - ano);
      const pesoTiempo = Math.max(0.1, 1 - (diferenciaTiempo * 0.2));
      
      // Si hay kilometraje, considerar diferencia
      let pesoKilometraje = 1;
      if (kilometraje && vehiculo.kilometraje) {
        const diferenciaKm = Math.abs(vehiculo.kilometraje - kilometraje);
        pesoKilometraje = Math.max(0.1, 1 - (diferenciaKm / 100000)); // Penalizar cada 100k km
      }

      const pesoTotal = pesoTiempo * pesoKilometraje;
      totalPrecio += vehiculo.precio * pesoTotal;
      totalPesos += pesoTotal;
    }

    const precioPromedio = totalPesos > 0 ? totalPrecio / totalPesos : 0;
    const precioEstimado = Math.round(precioPromedio * 0.70); // 30% menos que el precio de mercado

    console.log(`Precio calculado: ${precioEstimado} (mercado: ${precioPromedio})`);

    return new Response(
      JSON.stringify({
        precio_estimado: precioEstimado,
        precio_mercado: Math.round(precioPromedio),
        vehiculos_encontrados: vehiculosSimilares.length,
        metodo: 'promedio_ponderado'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en calcular-precio-estimado-vehiculo:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calcularPrecioBasePorMarca(marca: string, ano: number): number {
  const marcasLujo = ['bmw', 'mercedes', 'audi', 'lexus', 'infiniti', 'acura'];
  const marcasPremium = ['toyota', 'honda', 'mazda', 'subaru', 'volkswagen'];
  const marcasEconomicas = ['nissan', 'hyundai', 'kia', 'chevrolet', 'ford'];

  const marcaLower = marca.toLowerCase();
  const antiguedad = new Date().getFullYear() - ano;
  
  let precioBase = 200000; // Precio base por defecto
  
  if (marcasLujo.some(m => marcaLower.includes(m))) {
    precioBase = 600000;
  } else if (marcasPremium.some(m => marcaLower.includes(m))) {
    precioBase = 350000;
  } else if (marcasEconomicas.some(m => marcaLower.includes(m))) {
    precioBase = 250000;
  }
  
  // Depreciación por año (aproximadamente 10% anual)
  const factorDepreciacion = Math.pow(0.9, antiguedad);
  
  return Math.round(precioBase * factorDepreciacion);
}