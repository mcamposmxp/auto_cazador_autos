import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  user_id: string;
  interaction_type: 'cliente_profesional' | 'profesional_profesional';
  interaction_id: string;
  evaluation_has_comment: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, interaction_type, interaction_id, evaluation_has_comment } = await req.json() as RequestBody;

    console.log('Award evaluation credits request:', {
      user_id,
      interaction_type,
      interaction_id,
      evaluation_has_comment
    });

    // Validate that evaluation has comment (quality requirement)
    if (!evaluation_has_comment) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'La evaluación debe incluir un comentario para recibir créditos' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Reset monthly credits if needed
    await supabase.rpc('reset_monthly_credits');

    // Check if this interaction already has a reward for this user
    const { data: existingReward } = await supabase
      .from('evaluation_rewards')
      .select('id')
      .eq('user_id', user_id)
      .eq('interaction_type', interaction_type)
      .eq('interaction_id', interaction_id)
      .single();

    if (existingReward) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Ya has recibido créditos por evaluar esta interacción' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check monthly limit (10 credits = 5 evaluations max per month)
    const { data: userCredits } = await supabase
      .from('user_credits')
      .select('evaluation_credits_this_month')
      .eq('user_id', user_id)
      .single();

    const currentEvaluationCredits = userCredits?.evaluation_credits_this_month || 0;
    const MONTHLY_EVALUATION_CREDIT_LIMIT = 10;

    if (currentEvaluationCredits >= MONTHLY_EVALUATION_CREDIT_LIMIT) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Has alcanzado el límite mensual de créditos por evaluaciones (10 créditos)' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const CREDITS_PER_EVALUATION = 2;

    // First get current values
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('credits_available, credits_earned_evaluations, evaluation_credits_this_month')
      .eq('user_id', user_id)
      .single();

    // Award credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits_available: (currentCredits?.credits_available || 0) + CREDITS_PER_EVALUATION,
        credits_earned_evaluations: (currentCredits?.credits_earned_evaluations || 0) + CREDITS_PER_EVALUATION,
        evaluation_credits_this_month: (currentCredits?.evaluation_credits_this_month || 0) + CREDITS_PER_EVALUATION,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Error updating user credits:', updateError);
      throw updateError;
    }

    // Record the reward to prevent duplicates
    const { error: rewardError } = await supabase
      .from('evaluation_rewards')
      .insert({
        user_id,
        interaction_type,
        interaction_id,
        credits_awarded: CREDITS_PER_EVALUATION
      });

    if (rewardError) {
      console.error('Error recording evaluation reward:', rewardError);
      throw rewardError;
    }

    console.log(`Successfully awarded ${CREDITS_PER_EVALUATION} credits to user ${user_id} for ${interaction_type} evaluation`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        credits_awarded: CREDITS_PER_EVALUATION,
        remaining_evaluation_credits: MONTHLY_EVALUATION_CREDIT_LIMIT - (currentEvaluationCredits + CREDITS_PER_EVALUATION)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in award-evaluation-credits:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});