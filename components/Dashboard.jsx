import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Onboarding from './Onboarding'

async function checkFamilySpace() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_space_id')
    .eq('user_id', user.id)
    .single()

  return familyMember?.family_space_id || null
}

export default async function Dashboard({ user }) {
  const familySpaceId = await checkFamilySpace()

  // If user is part of a family space, redirect to inbox
  if (familySpaceId) {
    redirect('/inbox')
  }

  // Otherwise show onboarding
  return (
    <Onboarding
      user={user}
      onComplete={() => {
        // After creating/joining, page will reload and redirect to inbox
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      }}
    />
  )
}
