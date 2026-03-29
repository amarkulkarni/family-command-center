'use client'

import { useState } from 'react'
import Header from '../Header'

const URGENCY_COLORS = {
  HIGH: '#DC2626',
  MEDIUM: '#D97706',
  LOW: '#6B7280',
}

const URGENCY_LABELS = {
  HIGH: '🔴',
  MEDIUM: '🟡',
  LOW: '🔵',
}

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

export default function TasksPage({ user, familySpaceId, familySpace, connectors, messages }) {
  const [completedIds, setCompletedIds] = useState(new Set())

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'there'

  // Group messages by urgency
  const urgencyGroups = {
    HIGH: [],
    MEDIUM: [],
    LOW: [],
  }

  messages.forEach(msg => {
    const urgency = msg.urgency || 'LOW'
    if (urgencyGroups[urgency]) {
      urgencyGroups[urgency].push(msg)
    }
  })

  // Sort by date within each urgency group
  Object.keys(urgencyGroups).forEach(key => {
    urgencyGroups[key].sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
  })

  // Get uncompleted tasks from HIGH and MEDIUM
  const uncompletedTasks = [
    ...urgencyGroups.HIGH,
    ...urgencyGroups.MEDIUM,
  ].filter(msg => !completedIds.has(msg.id))

  // Get completed tasks
  const completedTasks = messages.filter(msg => completedIds.has(msg.id))

  const toggleComplete = (messageId) => {
    const newCompleted = new Set(completedIds)
    if (newCompleted.has(messageId)) {
      newCompleted.delete(messageId)
    } else {
      newCompleted.add(messageId)
    }
    setCompletedIds(newCompleted)
  }

  const renderTask = (message, isCompleted) => (
    <div
      key={message.id}
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        gap: '12px',
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={isCompleted}
        onChange={() => toggleComplete(message.id)}
        style={{
          marginTop: '4px',
          cursor: 'pointer',
          width: '18px',
          height: '18px',
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
          <div
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: CATEGORY_COLORS[message.category],
              color: CATEGORY_TEXT_COLORS[message.category],
              fontSize: '10px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            {message.category}
          </div>
          <div
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: URGENCY_COLORS[message.urgency],
              color: 'white',
              fontSize: '9px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
            }}
          >
            {message.urgency}
          </div>
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: isCompleted ? '#94A3B8' : '#1a2e4a',
            textDecoration: isCompleted ? 'line-through' : 'none',
            marginBottom: '4px',
          }}
        >
          {message.subject}
        </div>
        {message.summary && (
          <div style={{ fontSize: '12px', color: '#7A8A99', marginBottom: '6px' }}>
            {message.summary}
          </div>
        )}
        {message.action_items && message.action_items.length > 0 && (
          <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
            {message.action_items.map((item, i) => (
              <div key={i}>• {item}</div>
            ))}
          </div>
        )}
        {message.key_dates && message.key_dates.length > 0 && (
          <div style={{ fontSize: '11px', color: '#0D9488', fontWeight: '600' }}>
            📅 {message.key_dates.map(d =>
              new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            ).join(', ')}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', flexDirection: 'column' }}>
      <Header
        user={user}
        title="Tasks"
        subtitle={`${uncompletedTasks.length} active`}
        showNav={true}
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {uncompletedTasks.length === 0 ? (
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '40px',
                textAlign: 'center',
                color: '#94A3B8',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
              <div>All caught up! No active tasks.</div>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a2e4a', marginBottom: '12px' }}>
                ACTIVE TASKS ({uncompletedTasks.length})
              </h2>
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  marginBottom: '24px',
                }}
              >
                {uncompletedTasks.map(task => renderTask(task, false))}
              </div>
            </>
          )}

          {completedTasks.length > 0 && (
            <>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a2e4a', marginBottom: '12px' }}>
                COMPLETED ({completedTasks.length})
              </h2>
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {completedTasks.map(task => renderTask(task, true))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
