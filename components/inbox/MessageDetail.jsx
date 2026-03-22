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

export default function MessageDetail({ message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', background: '#FAFBFC' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: CATEGORY_COLORS[message.ai_category],
              color: CATEGORY_TEXT_COLORS[message.ai_category],
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {message.ai_category}
          </div>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              background: '#F1F5F9',
              color: URGENCY_COLORS[message.ai_urgency],
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {URGENCY_LABELS[message.ai_urgency]}
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

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {/* AI Summary */}
        {message.ai_summary && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Summary
            </h3>
            <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
              {message.ai_summary}
            </div>
          </div>
        )}

        {/* Action Items */}
        {message.ai_action_items && message.ai_action_items.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Action Items
            </h3>
            <div>
              {message.ai_action_items.map((item, i) => (
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

        {/* Key Dates */}
        {message.ai_key_dates && message.ai_key_dates.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Key Dates
            </h3>
            <div>
              {message.ai_key_dates.map((item, i) => (
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

        {/* Original Body */}
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
    </div>
  )
}
