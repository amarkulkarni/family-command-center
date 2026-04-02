'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Header({ user, title, subtitle, showNav = true, manageMode, onManageToggle }) {
  const router = useRouter()
  const pathname = usePathname()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/cron/sync-gmail', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      })
      const data = await res.json()
      if (data.success) {
        setSyncResult({ ok: true, count: data.processed })
        if (data.processed > 0) {
          setTimeout(() => router.refresh(), 500)
        }
      } else {
        setSyncResult({ ok: false, msg: data.error || 'Sync failed' })
      }
    } catch (err) {
      setSyncResult({ ok: false, msg: err.message })
    }
    setSyncing(false)
    setTimeout(() => setSyncResult(null), 3000)
  }
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there'
  const avatar = user.user_metadata?.avatar_url
  const email = user.email

  return (
    <>
      <div
        style={{
          background: '#1a2e4a',
          padding: '16px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Link
          href="/inbox"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '22px' }}>🏠</span>
          <div>
            <div style={{ color: 'white', fontFamily: 'Lora, serif', fontSize: '17px', fontWeight: '700' }}>
              {title || 'Family Command Center'}
            </div>
            {subtitle && (
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                {subtitle}
              </div>
            )}
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {avatar && (
            <img
              src={avatar}
              alt={firstName}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }}
            />
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{firstName}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{email}</div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {showNav && (
        <div
          style={{
            display: 'flex',
            gap: '0',
            borderBottom: '1px solid #E2E8F0',
            background: 'white',
            paddingLeft: '28px',
          }}
        >
          <NavLink href="/inbox" pathname={pathname} label="📋 Dashboard" />
          <NavLink href="/settings" pathname={pathname} label="⚙️ Settings" />
          <div style={{ marginLeft: 'auto', paddingRight: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onManageToggle && (
              <button
                onClick={onManageToggle}
                title={manageMode ? 'Done managing' : 'Manage messages'}
                style={{
                  background: manageMode ? '#FEF2F2' : 'none',
                  border: manageMode ? '1px solid #DC2626' : 'none',
                  cursor: 'pointer',
                  fontSize: '18px', padding: '8px', borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {manageMode ? '✏️' : '✏️'}
              </button>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              title="Sync Gmail"
              style={{
                background: 'none', border: 'none', cursor: syncing ? 'not-allowed' : 'pointer',
                fontSize: '18px', padding: '8px', borderRadius: '8px',
                opacity: syncing ? 0.5 : 1,
                animation: syncing ? 'spin 1s linear infinite' : 'none',
                transition: 'opacity 0.2s',
              }}
            >
              🔄
            </button>
            {syncResult && (
              <span style={{
                fontSize: '11px', fontWeight: '600',
                color: syncResult.ok ? '#16A34A' : '#DC2626',
              }}>
                {syncResult.ok ? `${syncResult.count} new` : 'Error'}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function NavLink({ href, pathname, label }) {
  const isActive = pathname === href
  return (
    <Link
      href={href}
      style={{
        padding: '14px 16px',
        textDecoration: 'none',
        color: isActive ? '#1a2e4a' : '#7A8A99',
        fontSize: '14px',
        fontWeight: isActive ? '600' : '500',
        cursor: 'pointer',
        borderBottom: isActive ? '3px solid #1a2e4a' : 'none',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = '#1a2e4a'
          e.currentTarget.style.fontWeight = '600'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = '#7A8A99'
          e.currentTarget.style.fontWeight = '500'
        }
      }}
    >
      {label}
    </Link>
  )
}
