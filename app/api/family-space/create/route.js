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

  // Generate cryptographically secure invite code
  const crypto = require('crypto')
  const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase()

  // Create family space
  const { data: space, error: spaceError } = await supabase
    .from('family_spaces')
    .insert({ name: 'Our Family', invite_code: inviteCode })
    .select()
    .single()

  if (spaceError) {
    console.error('Error creating family space:', spaceError)
    return new Response('Failed to create family space', { status: 500 })
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
    return new Response('Failed to add family member', { status: 500 })
  }

  return new Response(JSON.stringify({ inviteCode, spaceId: space.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
