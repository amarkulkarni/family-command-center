import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function DELETE(request) {
  try {
    // Authenticate user
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
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    )

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

    const familySpaceId = familyMember.family_space_id
    const body = await request.json()
    const { messageId, all, dedup } = body

    // Use service role for actual deletes (bypasses RLS)
    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Option 1: Delete a single message
    if (messageId) {
      const { error } = await serviceClient
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('family_space_id', familySpaceId)

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }
      return Response.json({ deleted: 1 })
    }

    // Option 2: Delete all messages for this family space
    if (all) {
      const { data, error } = await serviceClient
        .from('messages')
        .delete()
        .eq('family_space_id', familySpaceId)
        .select('id')

      if (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }
      return Response.json({ deleted: data?.length || 0 })
    }

    // Option 3: Remove duplicates (keep newest per external_id)
    if (dedup) {
      // Fetch all messages for this family space
      const { data: messages, error: fetchError } = await serviceClient
        .from('messages')
        .select('id, external_id, created_at')
        .eq('family_space_id', familySpaceId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        return Response.json({ error: fetchError.message }, { status: 500 })
      }

      // Group by external_id, keep the newest, delete the rest
      const seen = new Set()
      const toDelete = []

      for (const msg of messages) {
        const key = msg.external_id || msg.id
        if (seen.has(key)) {
          toDelete.push(msg.id)
        } else {
          seen.add(key)
        }
      }

      if (toDelete.length > 0) {
        const { error: deleteError } = await serviceClient
          .from('messages')
          .delete()
          .in('id', toDelete)

        if (deleteError) {
          return Response.json({ error: deleteError.message }, { status: 500 })
        }
      }

      return Response.json({ deleted: toDelete.length, kept: messages.length - toDelete.length })
    }

    return Response.json({ error: 'Provide messageId, all: true, or dedup: true' }, { status: 400 })
  } catch (err) {
    console.error('Error deleting messages:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
