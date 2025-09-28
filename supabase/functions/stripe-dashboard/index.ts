import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const logStep = (step, details)=>{
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-DASHBOARD] ${step}${detailsStr}`);
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", {
      userId: user.id,
      email: user.email
    });
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil"
    });
    // Find Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    let customerId = null;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found Stripe customer", {
        customerId
      });
    }
    // Get payment intents (transactions)
    let paymentIntents = [];
    if (customerId) {
      const payments = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 20
      });
      paymentIntents = payments.data;
      logStep("Retrieved payment intents", {
        count: paymentIntents.length
      });
    }
    // Get charges for more transaction details
    let charges = [];
    if (customerId) {
      const chargesData = await stripe.charges.list({
        customer: customerId,
        limit: 20
      });
      charges = chargesData.data;
      logStep("Retrieved charges", {
        count: charges.length
      });
    }
    // Get current user credits from Supabase
    const { data: creditsData, error: creditsError } = await supabaseClient.from("user_credits").select("*").eq("user_id", user.id).single();
    if (creditsError && creditsError.code !== 'PGRST116') {
      logStep("Error fetching credits", {
        error: creditsError
      });
    }
    // Get credit transactions history
    const { data: creditTransactions, error: transError } = await supabaseClient.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", {
      ascending: false
    }).limit(50);
    if (transError) {
      logStep("Error fetching credit transactions", {
        error: transError
      });
    }
    const dashboardData = {
      customer: customers.data[0] || null,
      paymentIntents: paymentIntents.map((pi)=>({
          id: pi.id,
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          created: pi.created,
          metadata: pi.metadata,
          description: pi.description
        })),
      charges: charges.map((charge)=>({
          id: charge.id,
          amount: charge.amount,
          currency: charge.currency,
          status: charge.status,
          created: charge.created,
          description: charge.description,
          receipt_url: charge.receipt_url,
          metadata: charge.metadata
        })),
      userCredits: creditsData || null,
      creditTransactions: creditTransactions || []
    };
    logStep("Dashboard data compiled successfully");
    return new Response(JSON.stringify(dashboardData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-dashboard", {
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
