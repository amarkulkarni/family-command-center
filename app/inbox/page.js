'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import InboxPage from '@/components/inbox/InboxPage'

export default function Inbox() {
  const router = useRouter()
  const [state, setState] = useState({
    user: null,
    familySpaceId: null,
    familySpace: null,
    connectors: [],
    messages: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const loadInbox = async () => {
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

        // Fetch messages via API
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        const res = await fetch('/api/messages?limit=100', {
          headers: {
            'Authorization': `Bearer ${currentSession?.access_token}`,
          },
        })
        const messagesData = await res.json()

        setState({
          user,
          familySpaceId,
          familySpace,
          connectors: connectors || [],
          messages: messagesData.messages || [],
          loading: false,
          error: null,
        })
      } catch (err) {
        console.error('Error loading inbox:', err)
        setState(prev => ({ ...prev, loading: false, error: err.message }))
      }
    }

    loadInbox()
  }, [router])

  if (state.loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading inbox...</div>
  }

  if (state.error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {state.error}</div>
  }

  return (
    <InboxPage
      user={state.user}
      familySpaceId={state.familySpaceId}
      familySpace={state.familySpace}
      connectors={state.connectors}
      messages={state.messages}
    />
  )
}
