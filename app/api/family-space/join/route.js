import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { inviteCode } = await req.json()

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
