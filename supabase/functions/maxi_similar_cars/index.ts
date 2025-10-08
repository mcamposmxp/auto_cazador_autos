import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();
  let versionId = '';

  try {
    const { versionId: reqVersionId, location, transmission, kilometers, origin } = await req.json();
    versionId = reqVersionId;
    const locationId = location || '';
    
    if (!versionId) {
      console.error('[maxi_similar_cars] Missing versionId parameter');
      throw new Error('versionId is required');
    }

    console.log(`[maxi_similar_cars] Processing request for versionId: ${versionId}, location: ${locationId || '(vacío - búsqueda nacional)'}`);
    console.log(`[maxi_similar_cars] Raw params -> transmission: ${transmission ?? '(not provided)'}; kilometers: ${kilometers ?? '(not provided)'}; origin: ${origin ?? '(not provided)'}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate parameters: transmission, kilometers, origin
    const acceptedTransmissions = ['TRANS-AUTOMATICA', 'TRANS-CVTIVT', 'TRANS-MANUAL', 'TRANS-OTRO', 'TRANS-TRONIC'];
    let transmissionValidated: string;

    if (transmission && acceptedTransmissions.includes(transmission)) {
      transmissionValidated = transmission;
    } else {
      try {
        const { data: manualRow, error: manualErr } = await supabase
          .from('transmission_manual')
          .select('version_id')
          .eq('version_id', versionId)
          .maybeSingle();

        if (manualErr) {
          console.warn('[maxi_similar_cars] transmission_manual lookup warning:', manualErr.message || manualErr);
        }
        transmissionValidated = manualRow ? 'TRANS-MANUAL' : 'TRANS-AUTOMATICA';
      } catch (e) {
        console.warn('[maxi_similar_cars] transmission_manual lookup failed, defaulting to TRANS-AUTOMATICA:', e);
        transmissionValidated = 'TRANS-AUTOMATICA';
      }
    }

    let kilometersValidated = '';
    if (kilometers === undefined || kilometers === null || kilometers === '') {
      kilometersValidated = '';
    } else {
      const kmNumber = Number(kilometers);
      if (!Number.isFinite(kmNumber) || kmNumber <= 0) {
        return new Response(
          JSON.stringify({ error: "'kilometers' debe ser un número mayor a cero" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      kilometersValidated = String(kmNumber);
    }

    const acceptedOrigins = ['web', 'api'];
    const originValidated = (origin && acceptedOrigins.includes(origin)) ? origin : 'web';

    console.log(`[maxi_similar_cars] Params validated -> transmission: ${transmissionValidated}; kilometers: ${kilometersValidated || '(empty)'}; origin: ${originValidated}`);

    // Check cache first
    console.log('[maxi_similar_cars] Checking cache...');
    const { data: cachedData, error: cacheError } = await supabase
      .from('vehicle_calculation_cache')
      .select('*')
      .eq('version_id', versionId)
      .maybeSingle();

    // Get token from api_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('token')
      .single();

    if (tokenError || !tokenData?.token) {
      console.error('[maxi_similar_cars] No valid token found:', tokenError);
      
      // Return cached data if available, otherwise error
      if (cachedData) {
        console.log('[maxi_similar_cars] Returning cached data (token unavailable)');
        const responseTime = Date.now() - requestStart;
        return new Response(
          JSON.stringify({
            ...cachedData.estadisticas_completas,
            _metadata: {
              source: 'fallback',
              cached_at: cachedData.last_successful_fetch,
              response_time: responseTime,
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      throw new Error('No valid token found and no cached data available');
    }

    // Build API URL
    const apiUrl = `https://api.maxipublica.com/v3/ads_sites/?categoryId=${versionId}&locationId=${locationId}&transmission=${encodeURIComponent(transmissionValidated)}&kilometers=${encodeURIComponent(kilometersValidated)}&origin=${encodeURIComponent(originValidated)}`;

    console.log('[maxi_similar_cars] Making API call to MaxiPublica...');
    console.log(`[maxi_similar_cars] URL: ${apiUrl}`);
    console.log(`[maxi_similar_cars] Token: ${tokenData.token.substring(0, 10)}...`);

    // Make API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': tokenData.token,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[maxi_similar_cars] API call failed: ${response.status} - ${response.statusText}`, errorText);
        
        // Return cached data if available
        if (cachedData) {
          console.log('[maxi_similar_cars] Returning cached data (API error)');
          const responseTime = Date.now() - requestStart;
          return new Response(
            JSON.stringify({
              ...cachedData.estadisticas_completas,
              _metadata: {
                source: 'fallback',
                cached_at: cachedData.last_successful_fetch,
                response_time: responseTime,
                api_error: {
                  status: response.status,
                  statusText: response.statusText,
                }
              }
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
        
        throw new Error(`API call failed with status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`[maxi_similar_cars] API response received, total cars: ${data.total}`);

      // Extract only the required fields
      const filteredData = {
        total: data.total,
        search: {
          searchLevel: data.search?.searchLevel,
          alert: data.search?.alert,
          averageLines: {
            price: data.search?.averageLines?.price,
            odometer: data.search?.averageLines?.odometer
          },
          myCar: {
            price: data.search?.myCar?.price || 0,
            odometer: data.search?.myCar?.odometer || 0
          }
        },
        similarsCars: data.similarsCars?.map((car: any) => ({
          id: car.id,
          siteId: car.siteId,
          price: car.price,
          odometer: car.odometer,
          brand: car.brand,
          model: car.model,
          year: car.year,
          trim: car.trim,
          condition: car.condition,
          traction: car.traction,
          energy: car.energy,
          transmission: car.transmission,
          bodyType: car.bodyType,
          armored: car.armored,
          currency: car.currency,
          status: car.status,
          permalink: car.permalink,
          thumbnail: car.thumbnail,
          dateCreated: car.dateCreated,
          daysInStock: car.daysInStock,
          sellerType: car.sellerType,
          address_line: car.location?.address_line || "",
          zip_code: car.location?.zip_code || "",
          subneighborhood: car.location?.subneighborhood || null,
          neighborhood: car.location?.neighborhood?.name || null,
          city: car.location?.city?.name || null,
          state: car.location?.state?.name || null,
          country: car.location?.country?.name || null,
          latitude: car.location?.latitude || null,
          longitude: car.location?.longitude || null
        })) || [],
        trend: data.trend ? {
          name: data.trend.name,
          equation: data.trend.equation,
          m: data.trend.m,
          b: data.trend.b,
          values: data.trend.values,
          axis: data.trend.axis,
          trendEquation: data.trend.trendEquation,
          R2: data.trend.R2
        } : null
      };

      // Update cache
      if (filteredData.similarsCars && filteredData.similarsCars.length > 0) {
        const firstCar = filteredData.similarsCars[0];
        const avgPrice = filteredData.search?.averageLines?.price || 0;
        
        console.log('[maxi_similar_cars] Updating cache...');
        await supabase
          .from('vehicle_calculation_cache')
          .upsert({
            version_id: versionId,
            marca: firstCar.brand,
            modelo: firstCar.model,
            ano: firstCar.year,
            version: firstCar.trim,
            precio_promedio: avgPrice,
            precio_minimo: Math.min(...filteredData.similarsCars.map((c: any) => c.price)),
            precio_maximo: Math.max(...filteredData.similarsCars.map((c: any) => c.price)),
            total_anuncios: filteredData.total,
            kilometraje_promedio: filteredData.search?.averageLines?.odometer || 0,
            estadisticas_completas: filteredData,
            last_successful_fetch: new Date().toISOString(),
          }, {
            onConflict: 'version_id'
          });
      }

      const responseTime = Date.now() - requestStart;
      console.log(`[maxi_similar_cars] Request completed successfully in ${responseTime}ms`);

      return new Response(
        JSON.stringify({
          ...filteredData,
          _metadata: {
            source: 'online',
            response_time: responseTime,
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[maxi_similar_cars] Request timeout');
        
        // Return cached data if available
        if (cachedData) {
          console.log('[maxi_similar_cars] Returning cached data (timeout)');
          const responseTime = Date.now() - requestStart;
          return new Response(
            JSON.stringify({
              ...cachedData.estadisticas_completas,
              _metadata: {
                source: 'fallback',
                cached_at: cachedData.last_successful_fetch,
                response_time: responseTime,
                timeout: true,
              }
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
        
        throw new Error('Request timeout and no cached data available');
      }
      
      throw fetchError;
    }

  } catch (error) {
    const responseTime = Date.now() - requestStart;
    console.error('[maxi_similar_cars] Error occurred:', error);
    console.error(`[maxi_similar_cars] Request failed after ${responseTime}ms`);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: 'MAXI_SIMILAR_CARS_ERROR',
        details: 'Failed to fetch similar cars data',
        versionId: versionId || 'unknown',
        timestamp: new Date().toISOString(),
        responseTime,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});