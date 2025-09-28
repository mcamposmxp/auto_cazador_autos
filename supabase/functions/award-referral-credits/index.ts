import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Find pending referral for this user
    const { data: referral, error: referralError } = await supabase.from('user_referrals').select('id, referrer_id, referral_code').eq('referee_id', user.id).eq('status', 'pending').single();
    if (referralError || !referral) {
      return new Response(JSON.stringify({
        error: 'No pending referral found'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Reset monthly credits if needed
    await supabase.rpc('reset_monthly_referral_credits');
    // Check if referrer has reached monthly limit
    const { data: referrerCredits, error: creditsError } = await supabase.from('user_credits').select('referrals_count_this_month').eq('user_id', referral.referrer_id).single();
    if (creditsError) {
      console.error('Error checking referrer credits:', creditsError);
      return new Response(JSON.stringify({
        error: 'Failed to check referrer credits'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check monthly limit (5 referrals = 25 credits max)
    if (referrerCredits && referrerCredits.referrals_count_this_month >= 5) {
      // Mark referral as completed but no credits awarded due to limit
      await supabase.from('user_referrals').update({
        status: 'completed_no_credits',
        referee_first_action_at: new Date().toISOString()
      }).eq('id', referral.id);
      return new Response(JSON.stringify({
        success: true,
        message: 'Referral completed but referrer has reached monthly limit'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Award 5 credits to referrer
    const { error: updateCreditsError } = await supabase.from('user_credits').update({
      credits_available: supabase.raw('credits_available + 5'),
      credits_earned_referrals: supabase.raw('credits_earned_referrals + 5'),
      referrals_count_this_month: supabase.raw('referrals_count_this_month + 1'),
      updated_at: new Date().toISOString()
    }).eq('user_id', referral.referrer_id);
    if (updateCreditsError) {
      console.error('Error updating referrer credits:', updateCreditsError);
      return new Response(JSON.stringify({
        error: 'Failed to award credits'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Update referral status
    const { error: updateReferralError } = await supabase.from('user_referrals').update({
      status: 'completed',
      credits_awarded: 5,
      referee_first_action_at: new Date().toISOString()
    }).eq('id', referral.id);
    if (updateReferralError) {
      console.error('Error updating referral:', updateReferralError);
    }
    // Update referral code usage count
    const { error: updateCodeError } = await supabase.from('referral_codes').update({
      uses_count: supabase.raw('uses_count + 1')
    }).eq('code', referral.referral_code);
    if (updateCodeError) {
      console.error('Error updating code usage:', updateCodeError);
    }
    // Create notification for referrer
    await supabase.from('notificaciones').insert({
      user_id: referral.referrer_id,
      tipo: 'referido_exitoso',
      titulo: '¡Referido exitoso!',
      mensaje: 'Has ganado 5 créditos por referir a un nuevo usuario que ya realizó su primera acción.',
      leida: false
    });
    return new Response(JSON.stringify({
      success: true,
      message: 'Referral credits awarded successfully',
      credits_awarded: 5
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in award-referral-credits:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
