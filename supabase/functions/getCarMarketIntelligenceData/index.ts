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
    const { versionId } = await req.json();
    if (!versionId) {
      throw new Error('Version ID is required');
    }
    // Get authorization from Supabase secrets
    const authorization = Deno.env.get('market_intelligence_authorization');
    if (!authorization) {
      throw new Error('Authorization token not found in Supabase secrets');
    }
    const apiUrl = `https://api.maxipublica.com/v3/232AE09500000534D23EE1295785AA9834/example/${versionId}`;
    console.log('Making API call to:', apiUrl);
    console.log('Using authorization token (first 10 chars):', authorization.substring(0, 10));
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
    // Return all the data from the API
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in getCarMarketIntelligenceData function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: 'Failed to fetch market intelligence data'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
