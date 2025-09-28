import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    console.log('Stripe test function started');
    // Verificar que tenemos la clave de Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    console.log('Stripe key found, initializing Stripe...');
    // Inicializar Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil"
    });
    // Hacer una llamada simple a la API de Stripe
    const balance = await stripe.balance.retrieve();
    console.log('Stripe balance retrieved:', balance);
    // Obtener algunos productos como prueba
    const products = await stripe.products.list({
      limit: 3
    });
    console.log('Stripe products retrieved:', products.data.length);
    return new Response(JSON.stringify({
      success: true,
      balance: {
        available: balance.available,
        pending: balance.pending
      },
      productsCount: products.data.length,
      message: 'Stripe connection successful'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Stripe test failed'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
