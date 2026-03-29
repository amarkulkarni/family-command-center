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

  // Generate invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Create family space
  const { data: space, error: spaceError } = await supabase
    .from('family_spaces')
    .insert({ name: 'Our Family', invite_code: inviteCode })
    .select()
    .single()

  if (spaceError) {
    console.error('Error creating family space:', spaceError)
    return new Response(spaceError.message, { status: 500 })
  }

  // Add user to family space
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_space_id: space.id,
      user_id: user.id,
    })

  if (memberError) {
    console.error('Error adding family member:', memberError)
    return new Response(memberError.message, { status: 500 })
  }

  return new Response(JSON.stringify({ inviteCode, spaceId: space.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
