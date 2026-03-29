import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Create client with user's token
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { inviteCode } = await request.json()

  if (!inviteCode) {
    return new Response('Missing invite code', { status: 400 })
  }

  // Look up space by invite code
  const { data: space, error: spaceError } = await supabase
    .from('family_spaces')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single()

  if (spaceError || !space) {
    return new Response('Invalid invite code', { status: 404 })
  }

  // Add user to family space
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_space_id: space.id,
      user_id: user.id,
    })

  if (memberError) {
    if (memberError.code === '23505') {
      return new Response('Already a member of this family space', { status: 409 })
    }
    console.error('Error adding family member:', memberError)
    return new Response(memberError.message, { status: 500 })
  }

  return new Response(JSON.stringify({ spaceId: space.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
