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
    const authorization = Deno.env.get('autorizationCatalogoMP');
    if (!authorization) {
      throw new Error('Authorization token not found in Supabase secrets');
    }
    const apiUrl = `https://api.maxipublica.com/v3/232AE09500000534D23EE1295785AA9834/example/${versionId}`;
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
    // Extract the suggested price
    const suggestedPrice = data?.suggestedPrice?.suggestedPricePublish || 0;
    return new Response(JSON.stringify({
      suggestedPrice,
      fullResponse: data
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error in obtener-precio-mercado function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: 'Failed to fetch market price data'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
