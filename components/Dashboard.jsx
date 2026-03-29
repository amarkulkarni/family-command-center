'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Onboarding from './Onboarding'

export default function Dashboard({ user }) {
  const [familySpaceId, setFamilySpaceId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkFamilySpace = async () => {
      if (!user) return
      try {
        const supabase = createClient()
        const { data: familyMember } = await supabase
          .from('family_members')
          .select('family_space_id')
          .eq('user_id', user.id)
          .single()
        setFamilySpaceId(familyMember?.family_space_id || null)
      } catch (err) {
        console.error('Error checking family space:', err)
      } finally {
        setLoading(false)
      }
    }
    checkFamilySpace()
  }, [user])

  if (loading) return <div style={{ padding: '20px' }}>Loading dashboard...</div>

  // If user is part of a family space, redirect to inbox
  if (familySpaceId) {
    if (typeof window !== 'undefined') {
      window.location.href = '/inbox'
    }
    return null
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
