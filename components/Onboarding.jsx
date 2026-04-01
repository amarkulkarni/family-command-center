'use client'

import { useState } from 'react'

export default function Onboarding({ user, onComplete }) {
  const [mode, setMode] = useState(null) // 'create' | 'join' | 'children'
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [children, setChildren] = useState([{ name: '', grade: '', school: '', activities: '' }])
  const [savingChildren, setSavingChildren] = useState(false)

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
      // Go to children step instead of inbox
      setTimeout(() => setMode('children'), 1500)
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
        ) : mode === 'children' ? (
          // Add children step
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>👧👦</div>
            <h2 style={{ fontSize: '22px', color: '#1a2e4a', marginBottom: '8px', textAlign: 'center' }}>
              Tell us about your kids
            </h2>
            <p style={{ color: '#7A8A99', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6', textAlign: 'center' }}>
              This helps us organize emails by child. You can update this later in Settings.
            </p>

            {children.map((child, idx) => (
              <div key={idx} style={{
                background: '#F8FAFC', borderRadius: '12px', padding: '16px',
                marginBottom: '12px', border: '1px solid #E2E8F0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a2e4a' }}>
                    Child {idx + 1}
                  </span>
                  {children.length > 1 && (
                    <button
                      onClick={() => setChildren(c => c.filter((_, i) => i !== idx))}
                      style={{
                        background: 'none', border: 'none', color: '#DC2626',
                        fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={child.name}
                  onChange={(e) => setChildren(c => c.map((ch, i) => i === idx ? { ...ch, name: e.target.value } : ch))}
                  placeholder="Name *"
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: '14px',
                    border: '1px solid #E2E8F0', borderRadius: '8px',
                    marginBottom: '8px', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={child.grade}
                    onChange={(e) => setChildren(c => c.map((ch, i) => i === idx ? { ...ch, grade: e.target.value } : ch))}
                    placeholder="Grade (e.g. 5th grade)"
                    style={{
                      flex: 1, padding: '10px 12px', fontSize: '14px',
                      border: '1px solid #E2E8F0', borderRadius: '8px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    value={child.school}
                    onChange={(e) => setChildren(c => c.map((ch, i) => i === idx ? { ...ch, school: e.target.value } : ch))}
                    placeholder="School"
                    style={{
                      flex: 1, padding: '10px 12px', fontSize: '14px',
                      border: '1px solid #E2E8F0', borderRadius: '8px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={child.activities}
                  onChange={(e) => setChildren(c => c.map((ch, i) => i === idx ? { ...ch, activities: e.target.value } : ch))}
                  placeholder="Activities (e.g. basketball, boy scouts, dance)"
                  style={{
                    width: '100%', padding: '10px 12px', fontSize: '14px',
                    border: '1px solid #E2E8F0', borderRadius: '8px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <button
              onClick={() => setChildren(c => [...c, { name: '', grade: '', school: '', activities: '' }])}
              style={{
                width: '100%', background: 'transparent', color: '#127A66',
                border: '1.5px dashed #127A66', borderRadius: '10px',
                padding: '10px', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', marginBottom: '20px',
              }}
            >
              + Add another child
            </button>

            <button
              onClick={async () => {
                const validChildren = children.filter(c => c.name.trim())
                if (validChildren.length === 0) {
                  setError('Add at least one child name')
                  return
                }
                setSavingChildren(true)
                setError('')
                try {
                  const supabase = (await import('@/lib/supabase/client')).createClient()
                  const { data: { session } } = await supabase.auth.getSession()
                  for (const child of validChildren) {
                    const activitiesArr = child.activities
                      ? child.activities.split(',').map(a => a.trim()).filter(Boolean)
                      : []
                    await fetch('/api/children', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        name: child.name.trim(),
                        grade: child.grade.trim() || null,
                        school: child.school.trim() || null,
                        activities: activitiesArr,
                      }),
                    })
                  }
                  onComplete()
                } catch (err) {
                  setError(err.message)
                } finally {
                  setSavingChildren(false)
                }
              }}
              disabled={savingChildren}
              style={{
                width: '100%', background: savingChildren ? '#CBD5E1' : '#16A34A',
                color: 'white', border: 'none', borderRadius: '12px',
                padding: '14px', fontSize: '15px', fontWeight: '600',
                cursor: savingChildren ? 'not-allowed' : 'pointer',
                marginBottom: '10px',
              }}
            >
              {savingChildren ? 'Saving...' : 'Continue to inbox'}
            </button>
            <button
              onClick={() => onComplete()}
              style={{
                width: '100%', background: 'transparent', color: '#94A3B8',
                border: 'none', fontSize: '13px', cursor: 'pointer',
                padding: '8px',
              }}
            >
              Skip for now
            </button>
            {error && (
              <div style={{
                background: '#FEE2E2', color: '#991B1B', padding: '12px',
                borderRadius: '8px', fontSize: '13px', marginTop: '12px',
              }}>
                {error}
              </div>
            )}
          </div>
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
              Setting up your family...
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
