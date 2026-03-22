import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InboxPage from '@/components/inbox/InboxPage'

export default async function Inbox() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is in a family space
  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_space_id')
    .eq('user_id', user.id)
    .single()

  if (!familyMember) {
    redirect('/')
  }

  const familySpaceId = familyMember.family_space_id

  // Get family space name
  const { data: familySpace } = await supabase
    .from('family_spaces')
    .select('name')
    .eq('id', familySpaceId)
    .single()

  // Get connectors for this family space
  const { data: connectors } = await supabase
    .from('connectors')
    .select('id, type, display_name')
    .eq('family_space_id', familySpaceId)
    .order('created_at')

  return (
    <InboxPage
      user={user}
      familySpaceId={familySpaceId}
      familySpace={familySpace}
      connectors={connectors || []}
    />
  )
}
