import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsPage from '@/components/settings/SettingsPage'

export default async function Settings() {
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

  // Get family space details
  const { data: familySpace } = await supabase
    .from('family_spaces')
    .select('name, invite_code')
    .eq('id', familySpaceId)
    .single()

  // Get connectors
  const { data: connectors } = await supabase
    .from('connectors')
    .select('id, type, display_name, status, last_received_at, owner_email')
    .eq('family_space_id', familySpaceId)
    .order('created_at')

  return (
    <SettingsPage
      user={user}
      familySpaceId={familySpaceId}
      familySpace={familySpace}
      connectors={connectors || []}
    />
  )
}
