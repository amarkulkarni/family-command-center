import { createClient } from '@/lib/supabase/server'

export async function GET(req) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get user's family space
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_space_id')
    .eq('user_id', user.id)
    .single()

  if (!familyMember) {
    return new Response(JSON.stringify({ messages: [], total: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const familySpaceId = familyMember.family_space_id

  // Parse query parameters
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category')
  const connectorId = searchParams.get('connectorId')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
  const offset = (page - 1) * limit

  let query = supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('family_space_id', familySpaceId)
    .is('is_archived', false)
    .order('received_at', { ascending: false })

  if (category && category !== 'ALL') {
    query = query.eq('ai_category', category)
  }

  if (connectorId && connectorId !== 'ALL') {
    query = query.eq('connector_id', connectorId)
  }

  query = query.range(offset, offset + limit - 1)

  const { data: messages, count, error } = await query

  if (error) {
    console.error('Error fetching messages:', error)
    return new Response(error.message, { status: 500 })
  }

  return new Response(
    JSON.stringify({
      messages: messages || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
