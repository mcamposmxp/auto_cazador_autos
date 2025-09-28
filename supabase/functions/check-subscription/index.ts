import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const logStep = (step, details)=>{
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
    auth: {
      persistSession: false
    }
  });
  try {
    logStep("Function started");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");
    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", {
      userId: user.id,
      email: user.email
    });
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil"
    });
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({
        subscribed: false,
        plan_type: 'gratuito'
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", {
      customerId
    });
    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10
    });
    // Check for completed payments (one-time purchases)
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      status: "complete",
      limit: 20
    });
    let planType = 'gratuito';
    let subscriptionEnd = null;
    let hasActiveSub = subscriptions.data.length > 0;
    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const productId = subscription.items.data[0].price.product;
      // Map product IDs to plan types
      const productToPlan = {
        'prod_RKsGaBwGpKoNrb': 'starter_profesional',
        'prod_RKsGb6fOLo7iGf': 'business_profesional',
        'prod_RKsHp4QhSN7fhL': 'enterprise_profesional'
      };
      planType = productToPlan[productId] || 'profesional';
      logStep("Active subscription found", {
        subscriptionId: subscription.id,
        planType,
        endDate: subscriptionEnd
      });
    } else {
      // Check for recent one-time purchases
      const recentSessions = sessions.data.filter((session)=>{
        const sessionDate = new Date(session.created * 1000);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return sessionDate > thirtyDaysAgo && session.payment_status === 'paid';
      });
      if (recentSessions.length > 0) {
        const latestSession = recentSessions[0];
        if (latestSession.metadata?.plan_type) {
          planType = latestSession.metadata.plan_type;
          logStep("Recent one-time purchase found", {
            sessionId: latestSession.id,
            planType
          });
        }
      }
    }
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_type: planType,
      subscription_end: subscriptionEnd
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", {
      message: errorMessage
    });
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
