import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function getAuthenticatedUser(request) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_space_id')
    .eq('user_id', user.id)
    .single()

  if (!familyMember) return null

  return { user, familySpaceId: familyMember.family_space_id }
}

// GET — list children for the user's family space
export async function GET(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) return new Response('Unauthorized', { status: 401 })

    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: children, error } = await serviceClient
      .from('children')
      .select('*')
      .eq('family_space_id', auth.familySpaceId)
      .order('created_at')

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ children: children || [] })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// POST — add a child
export async function POST(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) return new Response('Unauthorized', { status: 401 })

    const body = await request.json()
    const { name, grade, school, activities } = body

    if (!name?.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: child, error } = await serviceClient
      .from('children')
      .insert({
        family_space_id: auth.familySpaceId,
        name: name.trim(),
        grade: grade?.trim() || null,
        school: school?.trim() || null,
        activities: activities || [],
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ child }, { status: 201 })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// PUT — update a child
export async function PUT(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) return new Response('Unauthorized', { status: 401 })

    const body = await request.json()
    const { id, name, grade, school, activities } = body

    if (!id) {
      return Response.json({ error: 'Child id is required' }, { status: 400 })
    }

    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const updates = {}
    if (name !== undefined) updates.name = name.trim()
    if (grade !== undefined) updates.grade = grade?.trim() || null
    if (school !== undefined) updates.school = school?.trim() || null
    if (activities !== undefined) updates.activities = activities

    const { data: child, error } = await serviceClient
      .from('children')
      .update(updates)
      .eq('id', id)
      .eq('family_space_id', auth.familySpaceId)
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ child })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — remove a child
export async function DELETE(request) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth) return new Response('Unauthorized', { status: 401 })

    const body = await request.json()
    const { id } = body

    if (!id) {
      return Response.json({ error: 'Child id is required' }, { status: 400 })
    }

    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error } = await serviceClient
      .from('children')
      .delete()
      .eq('id', id)
      .eq('family_space_id', auth.familySpaceId)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ deleted: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
