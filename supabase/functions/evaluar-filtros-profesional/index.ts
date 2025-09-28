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

    const { marca, modelo, ano, kilometraje, precio_estimado } = await req.json();

    if (!marca || !modelo || !ano || kilometraje === undefined) {
      return new Response(
        JSON.stringify({ error: 'Marca, modelo, año y kilometraje son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Evaluando filtros para: ${marca} ${modelo} ${ano} - ${kilometraje}km`);
    
    // Si no se proporciona precio estimado, calcularlo
    let precioEstimadoFinal = precio_estimado;
    
    if (!precio_estimado) {
      console.log('Precio no proporcionado, calculando automáticamente...');
      try {
        const { data: precioData, error: precioError } = await supabaseClient.functions.invoke(
          'calcular-precio-estimado-vehiculo',
          {
            body: {
              marca,
              modelo,
              ano,
              kilometraje
            }
          }
        );
        
        if (precioError) {
          console.error('Error calculando precio:', precioError);
        } else {
          precioEstimadoFinal = precioData?.precio_estimado;
          console.log(`Precio estimado automáticamente: ${precioEstimadoFinal}`);
        }
      } catch (error) {
        console.error('Error en estimación de precio:', error);
      }
    }

    // Obtener todos los profesionales activos
    const { data: profesionales, error: profesionalesError } = await supabaseClient
      .from('profesionales')
      .select('id, negocio_nombre')
      .eq('activo', true);

    if (profesionalesError) {
      console.error('Error obteniendo profesionales:', profesionalesError);
      throw profesionalesError;
    }

    const profesionalesCoincidentes: string[] = [];
    const detallesCoincidencias: Array<{
      profesional_id: string;
      negocio_nombre: string;
      cumple_marca_modelo: boolean;
      cumple_precio: boolean;
      cumple_kilometraje: boolean;
      motivo_rechazo?: string;
    }> = [];

    // Evaluar filtros para cada profesional
    for (const profesional of profesionales) {
      try {
        // Llamar a la función de base de datos para evaluar filtros
        const { data: cumpleFiltros, error: filtrosError } = await supabaseClient
          .rpc('evaluar_filtros_vehiculo', {
            p_profesional_id: profesional.id,
            p_marca: marca,
            p_modelo: modelo,
            p_ano: ano,
            p_kilometraje: kilometraje,
            p_precio_estimado: precioEstimadoFinal
          });

        if (filtrosError) {
          console.error(`Error evaluando filtros para ${profesional.id}:`, filtrosError);
          continue;
        }

        if (cumpleFiltros) {
          profesionalesCoincidentes.push(profesional.id);
          
          detallesCoincidencias.push({
            profesional_id: profesional.id,
            negocio_nombre: profesional.negocio_nombre,
            cumple_marca_modelo: true,
            cumple_precio: true,
            cumple_kilometraje: true
          });
        } else {
          // Obtener detalles de por qué no cumple para debugging
          const { data: filtros } = await supabaseClient
            .from('profesional_filtros_ofertas')
            .select('filtros_vehiculo, tipo_filtro')
            .eq('profesional_id', profesional.id)
            .eq('activo', true)
            .single();

          let motivoRechazo = 'No cumple criterios';
          if (filtros && filtros.tipo_filtro === 'personalizado') {
            const filtrosVehiculo = filtros.filtros_vehiculo;
            
            if (filtrosVehiculo.marcas_modelos && filtrosVehiculo.marcas_modelos.length > 0) {
              motivoRechazo = 'Marca/modelo no coincide';
            } else if (filtrosVehiculo.rango_precio?.activo && precioEstimadoFinal) {
              if (precioEstimadoFinal < filtrosVehiculo.rango_precio.min || 
                  precioEstimadoFinal > filtrosVehiculo.rango_precio.max) {
                motivoRechazo = 'Precio fuera de rango';
              }
            } else if (filtrosVehiculo.rango_kilometraje?.activo) {
              if (kilometraje < filtrosVehiculo.rango_kilometraje.min || 
                  kilometraje > filtrosVehiculo.rango_kilometraje.max) {
                motivoRechazo = 'Kilometraje fuera de rango';
              }
            }
          }

          detallesCoincidencias.push({
            profesional_id: profesional.id,
            negocio_nombre: profesional.negocio_nombre,
            cumple_marca_modelo: false,
            cumple_precio: false,
            cumple_kilometraje: false,
            motivo_rechazo: motivoRechazo
          });
        }
      } catch (error) {
        console.error(`Error procesando profesional ${profesional.id}:`, error);
        continue;
      }
    }

    console.log(`Filtros evaluados: ${profesionalesCoincidentes.length}/${profesionales.length} profesionales coinciden`);

    return new Response(
      JSON.stringify({
        profesionales_coincidentes: profesionalesCoincidentes,
        total_profesionales: profesionales.length,
        total_coincidencias: profesionalesCoincidentes.length,
        precio_estimado: precioEstimadoFinal,
        precio_fue_calculado: !precio_estimado && !!precioEstimadoFinal,
        detalles: detallesCoincidencias
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en evaluar-filtros-profesional:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});