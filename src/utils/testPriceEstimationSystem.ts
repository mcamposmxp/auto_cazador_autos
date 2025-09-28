import { supabase } from "@/integrations/supabase/client";

/**
 * ANÁLISIS DEL SISTEMA DE FILTRADO POR PRECIOS
 * 
 * Implementación actual:
 * 
 * 1. ESTIMACIÓN DE PRECIOS (calcular-precio-estimado-vehiculo):
 *    ✅ Busca vehículos similares en la base de datos
 *    ✅ Calcula precio promedio ponderado por similitud
 *    ✅ Aplica factores de depreciación por edad y kilometraje
 *    ✅ Fallback a estimación base por marca si no hay datos
 * 
 * 2. INTEGRACIÓN CON FILTROS:
 *    ✅ Hook useFiltrosOfertas llama primero a calcular precio
 *    ✅ Luego pasa el precio estimado a evaluar_filtros_vehiculo
 *    ✅ Los filtros de precio usan este precio estimado
 * 
 * 3. FLUJO COMPLETO:
 *    Auto sin precio → Estimar precio → Aplicar filtros → Solo profesionales que coincidan
 * 
 * PROBLEMA IDENTIFICADO:
 * ❌ La función evaluar-filtros-profesional NO calcula precios automáticamente
 * ❌ Solo usa precio_estimado si se proporciona en el parámetro
 * ❌ Debería llamar a calcular-precio-estimado-vehiculo internamente
 */

export async function testPriceEstimationSystem() {
  try {
    console.log("🧮 Testing price estimation system...");
    
    // Test 1: Estimate price for a vehicle
    console.log("1. Testing price estimation...");
    const { data: priceData, error: priceError } = await supabase.functions.invoke(
      'calcular-precio-estimado-vehiculo',
      {
        body: {
          marca: "Toyota",
          modelo: "Corolla",
          ano: 2020,
          kilometraje: 50000
        }
      }
    );
    
    if (priceError) {
      console.error("❌ Price estimation failed:", priceError);
      return { error: priceError };
    }
    
    console.log("✅ Price estimated:", priceData);
    
    // Test 2: Check if filter evaluation uses this price
    console.log("2. Testing filter evaluation with estimated price...");
    const { data: filterData, error: filterError } = await supabase.functions.invoke(
      'evaluar-filtros-profesional',
      {
        body: {
          marca: "Toyota",
          modelo: "Corolla",
          ano: 2020,
          kilometraje: 50000,
          precio_estimado: priceData?.precio_estimado // Manually passing estimated price
        }
      }
    );
    
    if (filterError) {
      console.error("❌ Filter evaluation failed:", filterError);
      return { error: filterError };
    }
    
    console.log("✅ Filter evaluation with price:", filterData);
    
    // Test 3: Check what happens without price
    console.log("3. Testing filter evaluation WITHOUT price...");
    const { data: filterDataNoPrice, error: filterErrorNoPrice } = await supabase.functions.invoke(
      'evaluar-filtros-profesional',
      {
        body: {
          marca: "Toyota",
          modelo: "Corolla",
          ano: 2020,
          kilometraje: 50000
          // NO precio_estimado parameter
        }
      }
    );
    
    if (filterErrorNoPrice) {
      console.error("❌ Filter evaluation without price failed:", filterErrorNoPrice);
    } else {
      console.log("✅ Filter evaluation without price:", filterDataNoPrice);
    }
    
    return {
      priceEstimation: priceData,
      filterWithPrice: filterData,
      filterWithoutPrice: filterDataNoPrice,
      analysis: {
        priceEstimationWorks: !!priceData?.precio_estimado,
        filterAcceptsPrice: !!filterData?.profesionales_coincidentes,
        needsIntegration: !filterDataNoPrice || filterDataNoPrice.error
      }
    };
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    return { error };
  }
}

// To test: testPriceEstimationSystem().then(console.log)