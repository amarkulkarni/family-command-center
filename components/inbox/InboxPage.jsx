'use client'

import { useState, useEffect } from 'react'
import Header from '../Header'
import MessageDetail from './MessageDetail'

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

export default function InboxPage({ user, familySpaceId, familySpace, connectors, messages: initialMessages }) {
  const [messages, setMessages] = useState(initialMessages || [])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  // Organize messages by urgency
  const urgent = messages.filter(m => m.urgency === 'HIGH').sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
  const medium = messages.filter(m => m.urgency === 'MEDIUM').sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
  const informational = messages.filter(m => m.urgency === 'LOW').sort((a, b) => new Date(b.received_at) - new Date(a.received_at))

  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const dueToday = messages.filter(m => {
    if (!m.key_dates?.length) return false
    return m.key_dates.some(d => {
      const dDate = new Date(d.date)
      return dDate >= today && dDate < tomorrow
    })
  }).length

  const dueThisWeek = messages.filter(m => {
    if (!m.key_dates?.length) return false
    return m.key_dates.some(d => {
      const dDate = new Date(d.date)
      return dDate >= today && dDate <= weekEnd
    })
  }).length

  const MessageItem = ({ message, isSelected }) => (
    <div
      onClick={() => setSelectedMessage(message)}
      style={{
        padding: '12px 14px',
        borderBottom: '1px solid #F1F5F9',
        cursor: 'pointer',
        background: isSelected ? '#F0F4F8' : 'white',
        transition: 'background 0.2s',
        borderLeft: isSelected ? `3px solid ${URGENCY_COLORS[message.urgency]}` : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
        <div
          style={{
            padding: '2px 6px',
            borderRadius: '3px',
            background: CATEGORY_COLORS[message.category],
            color: CATEGORY_TEXT_COLORS[message.category],
            fontSize: '9px',
            fontWeight: '600',
          }}
        >
          {message.category}
        </div>
        <div
          style={{
            padding: '2px 6px',
            borderRadius: '3px',
            background: URGENCY_COLORS[message.urgency],
            color: 'white',
            fontSize: '8px',
            fontWeight: '700',
          }}
        >
          {message.urgency}
        </div>
      </div>

      <div style={{ marginBottom: '3px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#1a2e4a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {message.subject}
        </div>
      </div>

      {message.action_items?.length > 0 && (
        <div style={{ fontSize: '11px', color: '#475569', marginBottom: '2px' }}>
          {message.action_items.length} action{message.action_items.length > 1 ? 's' : ''}
        </div>
      )}

      {message.key_dates?.length > 0 && (
        <div style={{ fontSize: '10px', color: '#0D9488', fontWeight: '600' }}>
          📅 {new Date(message.key_dates[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column' }}>
      <Header
        user={user}
        title="Home"
        subtitle="Family Command Center"
        showNav={true}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left panel: Message list with stats */}
        <div style={{ flex: '0 0 40%', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', background: 'white', overflow: 'auto' }}>
          {/* Stat tiles */}
          <div style={{ padding: '16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '6px', textAlign: 'center', borderTop: '2px solid #DC2626' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#DC2626' }}>{urgent.length}</div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Urgent</div>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '6px', textAlign: 'center', borderTop: '2px solid #D97706' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#D97706' }}>{dueToday}</div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Due Today</div>
              </div>
              <div style={{ background: 'white', padding: '12px', borderRadius: '6px', textAlign: 'center', borderTop: '2px solid #0D9488' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0D9488' }}>{dueThisWeek}</div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>This Week</div>
              </div>
            </div>
          </div>

          {/* Message groups */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* Urgent section */}
            {urgent.length > 0 && (
              <div>
                <div style={{ padding: '12px 14px', background: '#FEE2E2', fontWeight: '700', color: '#991B1B', fontSize: '11px', textTransform: 'uppercase' }}>
                  🔴 URGENT ({urgent.length})
                </div>
                {urgent.map(msg => (
                  <MessageItem key={msg.id} message={msg} isSelected={selectedMessage?.id === msg.id} />
                ))}
              </div>
            )}

            {/* Medium section */}
            {medium.length > 0 && (
              <div>
                <div style={{ padding: '12px 14px', background: '#FEF3C7', fontWeight: '700', color: '#92400E', fontSize: '11px', textTransform: 'uppercase' }}>
                  🟡 THIS WEEK ({medium.length})
                </div>
                {medium.map(msg => (
                  <MessageItem key={msg.id} message={msg} isSelected={selectedMessage?.id === msg.id} />
                ))}
              </div>
            )}

            {/* Informational section */}
            {informational.length > 0 && (
              <div>
                <div style={{ padding: '12px 14px', background: '#DBEAFE', fontWeight: '700', color: '#1D4ED8', fontSize: '11px', textTransform: 'uppercase' }}>
                  🔵 INFORMATIONAL ({informational.length})
                </div>
                {informational.map(msg => (
                  <MessageItem key={msg.id} message={msg} isSelected={selectedMessage?.id === msg.id} />
                ))}
              </div>
            )}

            {messages.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>✨</div>
                <div>All caught up!</div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Message detail */}
        <div style={{ flex: '0 0 60%', background: 'white', display: 'flex', flexDirection: 'column' }}>
          {selectedMessage ? (
            <MessageDetail message={selectedMessage} />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                fontSize: '14px',
              }}
            >
              {messages.length === 0 ? '📭 No messages' : '← Select a message'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
