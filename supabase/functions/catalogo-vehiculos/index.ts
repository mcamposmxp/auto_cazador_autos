import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Try to parse JSON body, but allow empty body
    let catalogId = undefined;
    try {
      const body = await req.json();
      catalogId = body?.catalogId;
    } catch (_) {
    // No JSON body provided; proceed with initial catalog
    }
    // Get authorization from Supabase secrets
    const authorization = Deno.env.get('autorizationCatalogoMP');
    if (!authorization) {
      throw new Error('Authorization token not found in Supabase secrets');
    }
    // Default to initial catalog call if no catalogId provided
    const apiUrl = catalogId ? `https://api.maxipublica.com/v3/catalog/mx/mxp/${catalogId}?requestSource=quote&hiddenData=otherCategories%2ColdYears&yearRange=true&oldeYears=hidden&origin=web` : `https://api.maxipublica.com/v3/catalog/mx/mxp/v_1?requestSource=quote&hiddenData=otherCategories%2ColdYears&yearRange=true&oldeYears=hidden&origin=web`;
    console.log('Making API call to:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const data = await response.json();
    console.log('API response received:', data);
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in catalogo-vehiculos function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: 'Failed to fetch catalog data'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
