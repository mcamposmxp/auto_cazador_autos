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

  try {
    const { versionId } = await req.json();
    
    if (!versionId) {
      throw new Error('versionId is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get token from api_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('token')
      .single();

    if (tokenError || !tokenData?.token) {
      throw new Error('No valid token found in api_tokens table');
    }

    // Build API URL
    const apiUrl = `https://api.maxipublica.com/v3/ads_sites/210000?categoryId=${versionId}&locationId=&transmission=TRANS-AUTOMATICA&kilometers=&origin=web`;

    console.log('Making API call to:', apiUrl);
    console.log('Using token (first 10 chars):', tokenData.token.substring(0, 10));

    // Make API call
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': tokenData.token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('API response received, total cars:', data.total);

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

    return new Response(
      JSON.stringify(filteredData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in maxi_similar_cars function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to fetch similar cars data'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});