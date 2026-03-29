'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Header({ user, title, subtitle, showNav = true }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
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
          <NavLink href="/inbox" pathname={pathname} label="🏠 Home" />
          <NavLink href="/settings" pathname={pathname} label="⚙️ Settings" />
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
