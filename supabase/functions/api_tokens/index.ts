import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
Deno.serve(async (req)=>{
  try {
    // Configura la solicitud a la API externa
    const url = 'https://api.maxipublica.com/v3/authorization/token';
    const appKey = Deno.env.get('MP_APPKEY');
    const secretKey = Deno.env.get('MP_SECRETKEY');
    if (!appKey || !secretKey) {
      return new Response(JSON.stringify({
        error: 'MP_APPKEY o MP_SECRETKEY no están definidos en los secretos.'
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    // Realiza la solicitud a la API para obtener el token
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appKey,
        secretKey
      })
    });
    if (!response.ok) {
      throw new Error(`Error al obtener el token: ${response.statusText}`);
    }
    const { sellerId, token, refreshToken, expirationDate } = await response.json();
    // Guarda los datos obtenidos en una tabla de Supabase (por ejemplo, 'api_tokens')
    const { data, error } = await supabase.from('api_tokens').upsert({
      seller_id: sellerId,
      token: token,
      refresh_token: refreshToken,
      expiration_date: expirationDate,
      // Añade una clave única si es necesario para el 'upsert'
      id: 'maxipublica_token'
    }).select();
    if (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        headers: {
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    return new Response(JSON.stringify({
      message: 'Token y datos guardados con éxito.',
      data
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
