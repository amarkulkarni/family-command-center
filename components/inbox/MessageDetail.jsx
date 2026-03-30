const CATEGORY_COLORS = {
  SCHOOL: '#DBEAFE',
  MEDICAL: '#FEE2E2',
  PAYMENTS: '#FEF3C7',
  ACTIVITIES: '#DCFCE7',
  PTA: '#F3E8FF',
  APPOINTMENTS: '#CCFBF1',
  OTHER: '#F1F5F9',
  NEWSLETTER: '#F1F5F9',
  PERSONAL: '#F1F5F9',
  ADMIN: '#F1F5F9',
}

const CATEGORY_TEXT_COLORS = {
  SCHOOL: '#1D4ED8',
  MEDICAL: '#DC2626',
  PAYMENTS: '#D97706',
  ACTIVITIES: '#16A34A',
  PTA: '#9333EA',
  APPOINTMENTS: '#0D9488',
  OTHER: '#64748B',
  NEWSLETTER: '#64748B',
  PERSONAL: '#64748B',
  ADMIN: '#64748B',
}

const URGENCY_COLORS = {
  HIGH: '#DC2626',
  MEDIUM: '#D97706',
  LOW: '#6B7280',
}

const URGENCY_LABELS = {
  HIGH: '🔴 Urgent',
  MEDIUM: '🟡 This week',
  LOW: '🔵 Informational',
}

function getChannelType(message, connectors) {
  if (message?.connector_id && connectors?.length) {
    const c = connectors.find(x => x.id === message.connector_id)
    const t = (c?.type || '').toUpperCase()
    if (t === 'TWILIO_WHATSAPP') return 'whatsapp'
    if (t.includes('GMAIL') || t.includes('EMAIL')) return 'email'
  }
  const addr = String(message?.from_address || '')
  const lower = addr.toLowerCase()
  if (lower.startsWith('whatsapp:') || /^\+?[\d\s\-()]{10,}$/.test(addr.replace(/\s/g, ''))) {
    if (addr.includes('@')) return 'email'
    return 'whatsapp'
  }
  if (addr.includes('@')) return 'email'
  return 'email'
}

function waMeDigits(fromAddress) {
  if (!fromAddress) return null
  const raw = String(fromAddress).replace(/^whatsapp:/i, '').trim()
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 10 ? digits : null
}

export default function MessageDetail({ message, connectors = [] }) {
  const channel = getChannelType(message, connectors)
  const fromAddr = message.from_address || ''
  const senderLine =
    channel === 'whatsapp'
      ? [message.from_name, fromAddr].filter(Boolean).join(' · ')
      : fromAddr || message.from_name || ''

  const emailForMailto = fromAddr.includes('@') ? fromAddr : null
  const waDigits = channel === 'whatsapp' ? waMeDigits(fromAddr) : null
  const subjectRe = message.subject ? `Re: ${message.subject}` : 'Re: Message'
  const mailtoHref =
    emailForMailto != null
      ? `mailto:${emailForMailto}?subject=${encodeURIComponent(subjectRe)}`
      : null
  const waPrefill = encodeURIComponent(subjectRe)
  const waHref = waDigits ? `https://wa.me/${waDigits}?text=${waPrefill}` : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', background: '#FAFBFC' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: CATEGORY_COLORS[message.category],
              color: CATEGORY_TEXT_COLORS[message.category],
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {message.category}
          </div>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: '#F1F5F9',
              color: URGENCY_COLORS[message.urgency],
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {URGENCY_LABELS[message.urgency]}
          </div>
        </div>

        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a2e4a', marginBottom: '8px', lineHeight: '1.4' }}>
          {message.subject}
        </h2>

        <div style={{ fontSize: '13px', color: '#7A8A99', marginBottom: '12px' }}>
          <div>{message.from_name || message.from_address}</div>
          <div>{new Date(message.received_at).toLocaleString()}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        <div
          style={{
            fontSize: '13px',
            color: '#334155',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #E2E8F0',
            lineHeight: '1.5',
          }}
        >
          {channel === 'whatsapp' ? (
            <>
              <span style={{ marginRight: '6px' }}>{'\uD83D\uDCAC'}</span>
              Via WhatsApp · {senderLine || 'Unknown sender'}
            </>
          ) : (
            <>
              <span style={{ marginRight: '6px' }}>{'\u2709\uFE0F'}</span>
              Via Email · {senderLine || 'Unknown sender'}
            </>
          )}
        </div>

        {message.summary && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Summary
            </h3>
            <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
              {message.summary}
            </div>
          </div>
        )}

        {message.action_items && message.action_items.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Action Items
            </h3>
            <div>
              {message.action_items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '8px',
                    marginBottom: '8px',
                    borderLeft: '3px solid #16A34A',
                    background: '#DCFCE7',
                    borderRadius: '4px',
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ marginTop: '2px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', color: '#166534' }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {message.key_dates && message.key_dates.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Key Dates
            </h3>
            <div>
              {message.key_dates.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '8px',
                    marginBottom: '8px',
                    borderLeft: '3px solid #0D9488',
                    background: '#CCFBF1',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#134E4A' }}>
                    📅
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', color: '#134E4A', fontWeight: '600' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#0F766E' }}>
                      {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {message.body_text && (
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Original Message
            </h3>
            <div
              style={{
                fontSize: '13px',
                color: '#475569',
                lineHeight: '1.6',
                background: '#F8FAFC',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                maxHeight: '300px',
                overflow: 'auto',
              }}
            >
              {message.body_text}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: '16px 20px',
          borderTop: '1px solid #E2E8F0',
          background: '#FAFBFC',
        }}
      >
        {channel === 'whatsapp' && waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              background: '#EAF3DE',
              color: '#3B6D11',
              boxSizing: 'border-box',
            }}
          >
            Reply on WhatsApp
          </a>
        ) : channel === 'whatsapp' ? (
          <span
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              background: '#F1F5F9',
              color: '#94A3B8',
              boxSizing: 'border-box',
            }}
          >
            Reply on WhatsApp (number unavailable)
          </span>
        ) : mailtoHref ? (
          <a
            href={mailtoHref}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              background: '#E6F1FB',
              color: '#185FA5',
              boxSizing: 'border-box',
            }}
          >
            Reply via email
          </a>
        ) : (
          <span
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              background: '#F1F5F9',
              color: '#94A3B8',
              boxSizing: 'border-box',
            }}
          >
            Reply via email (address unavailable)
          </span>
        )}
      </div>
    </div>
  )
}
