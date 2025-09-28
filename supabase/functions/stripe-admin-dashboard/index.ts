import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const logStep = (step, details)=>{
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-ADMIN-DASHBOARD] ${step}${detailsStr}`);
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    logStep("Function started");
    // Verificar autenticación
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No authorization header");
      return new Response(JSON.stringify({
        error: "No authorization header provided"
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep("Auth error", userError);
      return new Response(JSON.stringify({
        error: `Authentication error: ${userError.message}`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    const user = userData.user;
    if (!user?.id) {
      logStep("No user found");
      return new Response(JSON.stringify({
        error: "User not authenticated"
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }
    // Verificar que el usuario es admin
    const { data: roleData, error: roleError } = await supabaseClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (roleError || !roleData) {
      logStep("User is not admin", {
        userId: user.id
      });
      throw new Error("Access denied: Admin role required");
    }
    logStep("Admin user verified", {
      userId: user.id
    });
    // Obtener acción del request
    let body;
    try {
      body = await req.json();
    } catch (error) {
      throw new Error("Invalid JSON in request body");
    }
    const { action } = body;
    logStep("Action requested", {
      action
    });
    // Inicializar Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil"
    });
    switch(action){
      case 'get_payments':
        {
          logStep("Fetching payment intents");
          // Obtener payment intents
          const payments = await stripe.paymentIntents.list({
            limit: 100,
            expand: [
              'data.customer'
            ]
          });
          logStep("Payment intents fetched", {
            count: payments.data.length
          });
          // Obtener información adicional de customers
          const paymentsWithDetails = await Promise.all(payments.data.map(async (payment)=>{
            let customerEmail = null;
            if (payment.customer) {
              try {
                const customer = await stripe.customers.retrieve(payment.customer);
                if (typeof customer !== 'string' && !customer.deleted) {
                  customerEmail = customer.email;
                }
              } catch (error) {
                logStep("Error fetching customer", {
                  customerId: payment.customer,
                  error
                });
              }
            }
            return {
              id: payment.id,
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
              customer_email: customerEmail,
              created: payment.created,
              description: payment.description || 'Credit purchase'
            };
          }));
          return new Response(JSON.stringify({
            payments: paymentsWithDetails,
            total: payments.data.length
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      case 'get_subscriptions':
        {
          logStep("Fetching subscriptions");
          const subscriptions = await stripe.subscriptions.list({
            limit: 100,
            expand: [
              'data.customer'
            ]
          });
          const subscriptionsWithDetails = subscriptions.data.map((subscription)=>({
              id: subscription.id,
              status: subscription.status,
              current_period_start: subscription.current_period_start,
              current_period_end: subscription.current_period_end,
              customer_email: subscription.customer && typeof subscription.customer === 'object' ? subscription.customer.email : null,
              amount: subscription.items.data[0]?.price.unit_amount || 0,
              currency: subscription.items.data[0]?.price.currency || 'usd',
              product_name: subscription.items.data[0]?.price.product || 'Unknown'
            }));
          return new Response(JSON.stringify({
            subscriptions: subscriptionsWithDetails,
            total: subscriptions.data.length
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      case 'get_customers':
        {
          logStep("Fetching customers");
          const customers = await stripe.customers.list({
            limit: 100
          });
          const customersData = customers.data.map((customer)=>({
              id: customer.id,
              email: customer.email,
              name: customer.name,
              created: customer.created,
              balance: customer.balance,
              currency: customer.currency
            }));
          return new Response(JSON.stringify({
            customers: customersData,
            total: customers.data.length
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      case 'get_products':
        {
          logStep("Fetching products");
          const products = await stripe.products.list({
            limit: 100,
            active: true
          });
          const prices = await stripe.prices.list({
            limit: 100,
            active: true
          });
          const productsWithPrices = products.data.map((product)=>{
            const productPrices = prices.data.filter((price)=>price.product === product.id);
            return {
              id: product.id,
              name: product.name,
              description: product.description,
              active: product.active,
              created: product.created,
              prices: productPrices.map((price)=>({
                  id: price.id,
                  unit_amount: price.unit_amount,
                  currency: price.currency,
                  recurring: price.recurring
                }))
            };
          });
          return new Response(JSON.stringify({
            products: productsWithPrices,
            total: products.data.length
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    logStep("ERROR", {
      message: errorMessage,
      stack: errorStack
    });
    return new Response(JSON.stringify({
      error: errorMessage,
      details: 'Failed to fetch Stripe admin data',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
