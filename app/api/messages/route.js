import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request) {
  try {
    // Get user from auth header (same pattern as family-space endpoints)
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return new Response('Unauthorized', { status: 401 })
    }

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

    // Get user's family space
    const { data: familyMember } = await supabase
      .from('family_members')
      .select('family_space_id')
      .eq('user_id', user.id)
      .single()

    if (!familyMember) {
      return new Response('Not in a family space', { status: 403 })
    }

    // Parse query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const category = url.searchParams.get('category')
    const connectorId = url.searchParams.get('connectorId')

    const offset = (page - 1) * limit
    const familySpaceId = familyMember.family_space_id

    // Build base query with filters
    let countQuery = supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('family_space_id', familySpaceId)

    let dataQuery = supabase
      .from('messages')
      .select('*')
      .eq('family_space_id', familySpaceId)

    // Apply category filter
    if (category && category !== 'ALL') {
      countQuery = countQuery.eq('category', category)
      dataQuery = dataQuery.eq('category', category)
    }

    // Apply connector filter
    if (connectorId && connectorId !== 'ALL') {
      countQuery = countQuery.eq('connector_id', connectorId)
      dataQuery = dataQuery.eq('connector_id', connectorId)
    }

    // Get total count with filters applied
    const { count } = await countQuery

    // Fetch messages with pagination
    const { data: messages, error } = await dataQuery
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching messages:', error)
      return new Response(error.message, { status: 500 })
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return Response.json({
      messages: messages || [],
      total,
      totalPages,
    })
  } catch (err) {
    console.error('Error in messages endpoint:', err)
    return new Response(err.message, { status: 500 })
  }
}
