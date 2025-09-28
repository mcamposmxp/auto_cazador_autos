import { createClient } from 'npm:@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CrearCredencialesPayload {
  profesionalId: string
  email: string
  nombre?: string
  apellido?: string
  telefono?: string
  negocio_nombre?: string
}

function generatePassword() {
  const part1 = Math.random().toString(36).slice(-8)
  const part2 = Math.random().toString(36).slice(-8).toUpperCase()
  return `${part1}${part2}!123`
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''

    const payload = (await req.json()) as CrearCredencialesPayload
    const { profesionalId, email, nombre, apellido, telefono, negocio_nombre } = payload

    if (!profesionalId || !email) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') as string

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY)
    const supabaseUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    // Verificar rol admin del solicitante
    const { data: adminCheck, error: adminErr } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('role', 'admin')
      .maybeSingle()

    if (adminErr) {
      console.error('Error verificando rol admin:', adminErr)
      return new Response(JSON.stringify({ error: 'Error de autorización' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Soporte para reiniciar contraseña de un profesional existente
    if ((payload as any)?.action === 'reset') {
      // Buscar el profesional y su user_id
      const { data: prof, error: profErr } = await supabaseAdmin
        .from('profesionales')
        .select('user_id, correo')
        .eq('id', profesionalId)
        .maybeSingle()

      if (profErr) {
        console.error('Error obteniendo profesional para reset:', profErr)
        return new Response(JSON.stringify({ error: 'No se pudo obtener el profesional' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      if (!prof?.user_id) {
        return new Response(JSON.stringify({ error: 'El profesional no tiene usuario vinculado' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      const newPassword = generatePassword()
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(prof.user_id, {
        password: newPassword,
      })

      if (updErr) {
        console.error('Error actualizando contraseña:', updErr)
        return new Response(JSON.stringify({ error: 'No se pudo actualizar la contraseña' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      return new Response(
        JSON.stringify({ success: true, userId: prof.user_id, password: newPassword }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const password = generatePassword()
    let createdUserId: string | null = null
    let createdNewUser = false

    // Crear usuario con Service Role para no afectar la sesión actual
    const { data: createRes, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        tipo_usuario: 'profesional',
        nombre: nombre || negocio_nombre || '',
        apellido: apellido || '',
        telefono_movil: telefono || '',
      },
    })

    if (createErr) {
      // Si ya existe, intentar localizar su user_id por profiles
      if (String(createErr.message || '').toLowerCase().includes('already') || createErr.status === 422) {
        const { data: existingProfile, error: profErr } = await supabaseAdmin
          .from('profiles')
          .select('user_id')
          .eq('correo_electronico', email)
          .maybeSingle()

        if (profErr || !existingProfile?.user_id) {
          console.error('Usuario ya existía pero no se pudo recuperar user_id', profErr)
          return new Response(
            JSON.stringify({ error: 'El usuario ya existe y no se pudo vincular automáticamente.' }),
            { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }
        createdUserId = existingProfile.user_id
      } else {
        console.error('Error creando usuario:', createErr)
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
    } else {
      createdUserId = createRes.user?.id ?? null
      createdNewUser = true
    }

    if (!createdUserId) {
      return new Response(JSON.stringify({ error: 'No se obtuvo user_id' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Vincular al profesional
    const { error: linkErr } = await supabaseAdmin
      .from('profesionales')
      .update({ user_id: createdUserId })
      .eq('id', profesionalId)

    if (linkErr) {
      console.error('Error vinculando profesional:', linkErr)
      return new Response(JSON.stringify({ error: 'No se pudo vincular el profesional' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(
      JSON.stringify({ success: true, userId: createdUserId, password: createdNewUser ? password : null }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error: any) {
    console.error('crear-credenciales error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Error inesperado' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
