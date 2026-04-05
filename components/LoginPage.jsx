'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('test@fcc.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost'

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
      }
    } catch (err) {
      setError(err?.message || 'Login failed')
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      window.location.href = '/'
    } catch (err) {
      setError(err?.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F7F5F0',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '52px 44px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏠</div>

        <h1 style={{
          fontSize: '26px',
          color: '#1a2e4a',
          marginBottom: '10px',
          letterSpacing: '-0.4px',
        }}>
          Family Command Center
        </h1>

        <p style={{
          fontSize: '15px',
          color: '#7A8A99',
          lineHeight: '1.6',
          marginBottom: '24px',
        }}>
          {isLocal ? 'Test login (local development)' : 'Sign in to manage your family\'s tasks'}
        </p>

        {!isLocal && (
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'white',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => !loading && (e.currentTarget.style.background = '#f8f8f8')}
            onMouseOut={e => !loading && (e.currentTarget.style.background = 'white')}
          >
            <GoogleIcon />
            {loading ? 'Redirecting...' : 'Sign in with Google'}
          </button>
        )}

        {isLocal && (
          <>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />

            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              onKeyPress={e => e.key === 'Enter' && handleLogin()}
            />

            <button
              onClick={handleLogin}
              disabled={loading || !password}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: loading || !password ? '#ccc' : '#1a2e4a',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => !loading && password && (e.currentTarget.style.background = '#0f1f33')}
              onMouseOut={e => !loading && password && (e.currentTarget.style.background = '#1a2e4a')}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </>
        )}

        {error && (
          <p style={{ color: 'red', fontSize: '14px', marginTop: '12px' }}>
            Error: {error}
          </p>
        )}

        <p style={{
          fontSize: '12px',
          color: '#B0BCCC',
          marginTop: '20px',
          lineHeight: '1.5',
        }}>
          Both parents sign in separately with their own<br />
          Google accounts. All tasks are shared between you.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
