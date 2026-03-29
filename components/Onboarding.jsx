'use client'

import { useState } from 'react'

export default function Onboarding({ user, onComplete }) {
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No authentication token')
      }

      const res = await fetch('/api/family-space/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) throw new Error(await res.text())
      const { inviteCode } = await res.json()
      setCreatedCode(inviteCode)
      setTimeout(() => onComplete(), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No authentication token')
      }

      const res = await fetch('/api/family-space/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      onComplete()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there'

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0' }}>
      {/* Header */}
      <div style={{
        background: '#1a2e4a',
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '22px' }}>🏠</span>
        <div>
          <div style={{ color: 'white', fontFamily: 'Lora, serif', fontSize: '17px', fontWeight: '700' }}>
            Family Command Center
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
            Welcome, {firstName}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '500px', margin: '60px auto', padding: '0 20px', flex: 1 }}>
        {!mode ? (
          // Choice screen
          <>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
              <h2 style={{ fontSize: '22px', color: '#1a2e4a', marginBottom: '10px' }}>
                Set up your family space
              </h2>
              <p style={{ color: '#7A8A99', fontSize: '15px', lineHeight: '1.6' }}>
                A shared inbox where both parents see the same tasks, emails, and reminders.
              </p>
            </div>

            <button
              onClick={() => setMode('create')}
              style={{
                width: '100%',
                background: '#1a2e4a',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              Create new family space
            </button>
            <button
              onClick={() => setMode('join')}
              style={{
                width: '100%',
                background: 'white',
                color: '#1a2e4a',
                border: '2px solid #1a2e4a',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Join existing family space
            </button>
          </>
        ) : mode === 'create' && createdCode ? (
          // Created successfully
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '22px', color: '#1a2e4a', marginBottom: '16px' }}>
              Family space created!
            </h2>
            <p style={{ color: '#7A8A99', fontSize: '15px', marginBottom: '20px', lineHeight: '1.6' }}>
              Share this code with your spouse to invite them:
            </p>
            <div style={{
              background: '#F1F5F9',
              border: '2px solid #CBD5E1',
              borderRadius: '12px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '20px',
              fontWeight: '700',
              color: '#1a2e4a',
              letterSpacing: '2px',
              marginBottom: '8px',
            }}>
              {createdCode}
            </div>
            <p style={{ color: '#94A3B8', fontSize: '12px' }}>
              Loading your inbox...
            </p>
          </div>
        ) : mode === 'create' ? (
          // Create screen
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: '18px', color: '#1a2e4a', marginBottom: '20px' }}>
              Create family space
            </h3>
            <p style={{ color: '#7A8A99', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
              You'll get a unique code to share with your spouse. They can use it to join and see everything you add.
            </p>
            <button
              onClick={handleCreate}
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#CBD5E1' : '#16A34A',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Creating...' : 'Create family space'}
            </button>
            <button
              onClick={() => setMode(null)}
              disabled={loading}
              style={{
                width: '100%',
                background: 'white',
                color: '#1a2e4a',
                border: '2px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Back
            </button>
            {error && (
              <div style={{
                background: '#FEE2E2',
                color: '#991B1B',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginTop: '12px',
              }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          // Join screen
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontSize: '18px', color: '#1a2e4a', marginBottom: '20px' }}>
              Join family space
            </h3>
            <p style={{ color: '#7A8A99', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
              Ask your spouse for the invite code they received when they created the family space.
            </p>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontFamily: 'monospace',
                letterSpacing: '2px',
                textAlign: 'center',
                border: '2px solid #E2E8F0',
                borderRadius: '8px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleJoin}
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#CBD5E1' : '#1a2e4a',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Joining...' : 'Join family space'}
            </button>
            <button
              onClick={() => setMode(null)}
              disabled={loading}
              style={{
                width: '100%',
                background: 'white',
                color: '#1a2e4a',
                border: '2px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Back
            </button>
            {error && (
              <div style={{
                background: '#FEE2E2',
                color: '#991B1B',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                marginTop: '12px',
              }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
