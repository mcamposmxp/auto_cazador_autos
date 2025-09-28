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
    // Check if user already has a referral code
    const { data: existingCode } = await supabase.from('referral_codes').select('code').eq('user_id', user.id).eq('active', true).single();
    if (existingCode) {
      return new Response(JSON.stringify({
        success: true,
        code: existingCode.code
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Generate unique referral code
    const generateCode = ()=>{
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for(let i = 0; i < 8; i++){
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    let code = generateCode();
    let isUnique = false;
    let attempts = 0;
    // Ensure code is unique
    while(!isUnique && attempts < 10){
      const { data: existing } = await supabase.from('referral_codes').select('id').eq('code', code).single();
      if (!existing) {
        isUnique = true;
      } else {
        code = generateCode();
        attempts++;
      }
    }
    if (!isUnique) {
      return new Response(JSON.stringify({
        error: 'Could not generate unique code'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create referral code
    const { error: insertError } = await supabase.from('referral_codes').insert({
      user_id: user.id,
      code: code,
      uses_count: 0,
      max_uses: 5,
      active: true
    });
    if (insertError) {
      console.error('Error creating referral code:', insertError);
      return new Response(JSON.stringify({
        error: 'Failed to create referral code'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      code
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in generate-referral-code:', error);
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
