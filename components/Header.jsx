import Link from 'next/link'
import { signOut } from '@/app/api/auth/actions'

export default function Header({ user, title, subtitle, showNav = true }) {
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
          <form action={signOut}>
            <button
              type="submit"
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
          </form>
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
          <Link
            href="/inbox"
            style={{
              padding: '14px 16px',
              textDecoration: 'none',
              color: '#7A8A99',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              borderBottom: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1a2e4a'
              e.currentTarget.style.fontWeight = '600'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#7A8A99'
              e.currentTarget.style.fontWeight = '500'
            }}
          >
            📧 Inbox
          </Link>
          <Link
            href="/settings"
            style={{
              padding: '14px 16px',
              textDecoration: 'none',
              color: '#7A8A99',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              borderBottom: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1a2e4a'
              e.currentTarget.style.fontWeight = '600'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#7A8A99'
              e.currentTarget.style.fontWeight = '500'
            }}
          >
            ⚙️ Settings
          </Link>
        </div>
      )}
    </>
  )
}
