import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { familySpaceId, type, ownerEmail } = await req.json()

  if (!familySpaceId || !type) {
    return new Response('Missing required fields', { status: 400 })
  }

  // Verify user is member of this family space
  const { data: member } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_space_id', familySpaceId)
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return new Response('Not authorized to manage this family space', { status: 403 })
  }

  // Get display name based on type
  const displayNames = {
    GMAIL_FORWARD: ownerEmail ? `${ownerEmail.split('@')[0]}'s Gmail` : 'Gmail',
    TWILIO_WHATSAPP: 'Family Bot (WhatsApp)',
    WHATSAPP_WEB: 'WhatsApp Web Extension',
  }

  // Create connector
  const { data: connector, error } = await supabase
    .from('connectors')
    .insert({
      family_space_id: familySpaceId,
      type,
      owner_email: ownerEmail,
      display_name: displayNames[type],
      status: 'ACTIVE',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating connector:', error)
    return new Response(error.message, { status: 500 })
  }

  return new Response(JSON.stringify({ connector }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
