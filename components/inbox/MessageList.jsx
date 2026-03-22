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

export default function MessageList({
  messages,
  selectedMessageId,
  onSelectMessage,
  loading,
  page,
  totalPages,
  onPageChange,
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Message list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
            Loading...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
            No messages found
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <div
                key={message.id}
                onClick={() => onSelectMessage(message)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  background: selectedMessageId === message.id ? '#F0F4F8' : 'white',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: CATEGORY_COLORS[message.ai_category],
                      color: CATEGORY_TEXT_COLORS[message.ai_category],
                      fontSize: '10px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {message.ai_category}
                  </div>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: URGENCY_COLORS[message.ai_urgency],
                      marginTop: '4px',
                      flexShrink: 0,
                    }}
                  />
                </div>

                <div style={{ marginBottom: '4px' }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#1a2e4a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {message.subject}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7A8A99' }}>
                    {message.from_name || message.from_address}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#94A3B8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {message.ai_summary || message.snippet}
                </div>

                <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '6px' }}>
                  {new Date(message.received_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            background: '#FAFBFC',
          }}
        >
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #E2E8F0',
              background: 'white',
              color: '#64748B',
              fontSize: '12px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1,
            }}
          >
            ← Prev
          </button>
          <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center' }}>
            {page} / {totalPages}
          </div>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #E2E8F0',
              background: 'white',
              color: '#64748B',
              fontSize: '12px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
