'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()

      // Supabase client-side SDK automatically picks up the auth code
      // from the URL hash/params and exchanges it for a session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/error')
        return
      }

      if (session) {
        router.push('/')
      } else {
        // If no session yet, wait for the auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe()
            router.push('/')
          }
        })

        // Timeout fallback
        setTimeout(() => {
          subscription.unsubscribe()
          router.push('/auth/error')
        }, 10000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
      Signing you in...
    </div>
  )
}
