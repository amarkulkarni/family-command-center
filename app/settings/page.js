'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SettingsPage from '@/components/settings/SettingsPage'

export default function Settings() {
  const router = useRouter()
  const [state, setState] = useState({
    user: null,
    familySpaceId: null,
    familySpace: null,
    connectors: [],
    children: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user

        if (!user) {
          router.push('/')
          return
        }

        // Check if user is in a family space
        const { data: familyMember, error: memberError } = await supabase
          .from('family_members')
          .select('family_space_id')
          .eq('user_id', user.id)
          .single()

        if (memberError || !familyMember) {
          router.push('/')
          return
        }

        const familySpaceId = familyMember.family_space_id

        // Get family space details
        const { data: familySpace } = await supabase
          .from('family_spaces')
          .select('name, invite_code')
          .eq('id', familySpaceId)
          .single()

        // Get connectors and children
        const { data: connectors } = await supabase
          .from('connectors')
          .select('id, type, display_name, status, last_received_at, owner_email')
          .eq('family_space_id', familySpaceId)
          .order('created_at')

        const { data: { session: currentSession } } = await supabase.auth.getSession()
        const childrenRes = await fetch('/api/children', {
          headers: { 'Authorization': `Bearer ${currentSession?.access_token}` },
        })
        const childrenData = await childrenRes.json()

        setState({
          user,
          familySpaceId,
          familySpace,
          connectors: connectors || [],
          children: childrenData.children || [],
          loading: false,
          error: null,
        })
      } catch (err) {
        console.error('Error loading settings:', err)
        setState(prev => ({ ...prev, loading: false, error: err.message }))
      }
    }

    loadSettings()
  }, [router])

  if (state.loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading settings...</div>
  }

  if (state.error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {state.error}</div>
  }

  return (
    <SettingsPage
      user={state.user}
      familySpaceId={state.familySpaceId}
      familySpace={state.familySpace}
      connectors={state.connectors}
      children={state.children}
    />
  )
}
