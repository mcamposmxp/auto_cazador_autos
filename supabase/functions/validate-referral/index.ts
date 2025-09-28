import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { referral_code } = await req.json()

    if (!referral_code) {
      return new Response(
        JSON.stringify({ error: 'Referral code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if referral code exists and is active
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('user_id, uses_count, max_uses, active')
      .eq('code', referral_code)
      .eq('active', true)
      .single()

    if (codeError || !codeData) {
      return new Response(
        JSON.stringify({ error: 'Invalid referral code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is trying to refer themselves
    if (codeData.user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot refer yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if code has reached max uses
    if (codeData.uses_count >= codeData.max_uses) {
      return new Response(
        JSON.stringify({ error: 'Referral code has reached maximum uses' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if this user has already been referred by this person
    const { data: existingReferral } = await supabase
      .from('user_referrals')
      .select('id')
      .eq('referrer_id', codeData.user_id)
      .eq('referee_id', user.id)
      .single()

    if (existingReferral) {
      return new Response(
        JSON.stringify({ error: 'You have already been referred by this user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create referral record
    const { error: referralError } = await supabase
      .from('user_referrals')
      .insert({
        referrer_id: codeData.user_id,
        referee_id: user.id,
        referral_code: referral_code,
        status: 'pending'
      })

    if (referralError) {
      console.error('Error creating referral:', referralError)
      return new Response(
        JSON.stringify({ error: 'Failed to create referral' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Referral validated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in validate-referral:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})