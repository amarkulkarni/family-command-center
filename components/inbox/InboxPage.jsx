'use client'

import { useState, useEffect } from 'react'
import Header from '../Header'
import MessageDetail from './MessageDetail'
import HorizonView from './HorizonView'
import { generateInsights } from '@/lib/insights'

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

const CATEGORY_ICONS = {
  SCHOOL: '\uD83D\uDCDA',
  MEDICAL: '\uD83C\uDFE5',
  ACTIVITIES: '\uD83D\uDC83',
  PAYMENTS: '\uD83D\uDCB0',
  PTA: '\uD83C\uDFEB',
  APPOINTMENTS: '\uD83D\uDCC5',
  NEWSLETTER: '\uD83D\uDCF0',
  PERSONAL: '\uD83D\uDC64',
  ADMIN: '\uD83D\uDCCB',
  OTHER: '\uD83D\uDCCB',
}

const CATEGORY_ICON_BG = {
  SCHOOL: '#E6F1FB',
  MEDICAL: '#FCEBEB',
  ACTIVITIES: '#EEEDFE',
  PAYMENTS: '#FEF3C7',
  PTA: '#F3E8FF',
  APPOINTMENTS: '#CCFBF1',
  NEWSLETTER: '#F1F5F9',
  PERSONAL: '#F1F5F9',
  ADMIN: '#FAEEDA',
  OTHER: '#FAEEDA',
}

const CATEGORY_LABELS = {
  SCHOOL: 'School',
  MEDICAL: 'Medical',
  ACTIVITIES: 'Activities',
  PAYMENTS: 'Payments',
  PTA: 'PTA',
  APPOINTMENTS: 'Appointments',
  NEWSLETTER: 'Newsletter',
  PERSONAL: 'Personal',
  ADMIN: 'Admin',
  OTHER: 'Other',
}

// Color palette for auto-assigning child column colors
const CHILD_PALETTE = [
  { color: '#127A66', accentLight: '#9FE1CB', emoji: '\u26BE' },
  { color: '#8C5414', accentLight: '#FAC775', emoji: '\uD83D\uDC83' },
  { color: '#4338CA', accentLight: '#C7D2FE', emoji: '\u2B50' },
  { color: '#9D174D', accentLight: '#FBCFE8', emoji: '\uD83C\uDFA8' },
]

function buildChildrenConfig(dbChildren) {
  return dbChildren.map((child, idx) => ({
    name: child.name,
    school: child.school || '',
    grade: child.grade || '',
    activities: child.activities || [],
    emoji: CHILD_PALETTE[idx % CHILD_PALETTE.length].emoji,
    color: CHILD_PALETTE[idx % CHILD_PALETTE.length].color,
    accentLight: CHILD_PALETTE[idx % CHILD_PALETTE.length].accentLight,
  }))
}

function matchChild(message, childrenConfig) {
  // Prefer AI-assigned child_name from the database
  if (message.child_name) {
    const match = childrenConfig.find(c => c.name.toLowerCase() === message.child_name.toLowerCase())
    if (match) return match.name
  }
  // Fallback: text-based matching
  const text = `${message.subject || ''} ${message.summary || ''} ${(message.action_items || []).join(' ')}`.toLowerCase()
  for (const child of childrenConfig) {
    if (text.includes(child.name.toLowerCase())) return child.name
  }
  return null
}

function getDueBadge(message) {
  if (!message.key_dates?.length) return null
  const dueDate = new Date(message.key_dates[0].date)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return { text: 'Due today', color: '#DC2626', urgent: true }
  if (diffDays <= 2) return { text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: '#D97706', urgent: false }
  return { text: `In ${diffDays} days`, color: '#6B7280', urgent: false }
}

export default function InboxPage({ user, familySpaceId, familySpace, connectors, messages: initialMessages, children: dbChildren }) {
  const CHILDREN = buildChildrenConfig(dbChildren || [])
  const [messages, setMessages] = useState(initialMessages || [])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('thisWeek')
  const [filters, setFilters] = useState({})
  const [manageMode, setManageMode] = useState(false)
  const [deleting, setDeleting] = useState({})

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  const getAuthToken = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const deleteMessage = async (msgId) => {
    setDeleting(d => ({ ...d, [msgId]: true }))
    try {
      const token = await getAuthToken()
      const res = await fetch('/api/messages/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId }),
      })
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== msgId))
        if (selectedMessage?.id === msgId) setSelectedMessage(null)
      }
    } catch (err) {
      console.error('Delete failed:', err)
    }
    setDeleting(d => ({ ...d, [msgId]: false }))
  }

  const deleteAllMessages = async () => {
    if (!confirm('Delete ALL messages? This cannot be undone.')) return
    setDeleting(d => ({ ...d, _all: true }))
    try {
      const token = await getAuthToken()
      const res = await fetch('/api/messages/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (res.ok) {
        const result = await res.json()
        setMessages([])
        setSelectedMessage(null)
        setManageMode(false)
      }
    } catch (err) {
      console.error('Delete all failed:', err)
    }
    setDeleting(d => ({ ...d, _all: false }))
  }

  const removeDuplicates = async () => {
    setDeleting(d => ({ ...d, _dedup: true }))
    try {
      const token = await getAuthToken()
      const res = await fetch('/api/messages/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ dedup: true }),
      })
      if (res.ok) {
        const result = await res.json()
        // Reload messages
        const listRes = await fetch('/api/messages?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        const data = await listRes.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Dedup failed:', err)
    }
    setDeleting(d => ({ ...d, _dedup: false }))
  }

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

  // Group messages by child
  const messagesByChild = {}
  const familyMessages = []
  CHILDREN.forEach(c => { messagesByChild[c.name] = [] })

  messages.forEach(msg => {
    const childName = matchChild(msg, CHILDREN)
    if (childName && messagesByChild[childName]) {
      messagesByChild[childName].push(msg)
    } else {
      familyMessages.push(msg)
    }
  })

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  // AI summary
  const totalActionItems = urgent.length + medium.length
  const mostUrgentWithDate = [...urgent, ...medium]
    .filter(m => m.key_dates?.length > 0)
    .sort((a, b) => new Date(a.key_dates[0].date) - new Date(b.key_dates[0].date))[0]

  const summaryText = totalActionItems > 0
    ? `${totalActionItems} item${totalActionItems !== 1 ? 's' : ''} this week${CHILDREN.length > 0 ? ` across ${CHILDREN.map(c => c.name).join(' and ')}` : ''}. ${urgent.length > 0 ? `${urgent.length} need${urgent.length === 1 ? 's' : ''} immediate attention.` : 'Nothing urgent right now.'}`
    : 'All caught up \u2014 no action items this week.'

  // Attention items: HIGH urgency + MEDIUM with dates, sorted by earliest date
  const attentionItems = [...urgent, ...medium.filter(m => m.key_dates?.length > 0)]
    .sort((a, b) => {
      const aDate = a.key_dates?.[0]?.date ? new Date(a.key_dates[0].date) : new Date('2099-01-01')
      const bDate = b.key_dates?.[0]?.date ? new Date(b.key_dates[0].date) : new Date('2099-01-01')
      return aDate - bDate
    })
    .slice(0, 6)

  // Generate tiered insights
  const insights = generateInsights(messages, CHILDREN)

  // Per-child filter helpers
  const getFilteredMessages = (childName) => {
    const msgs = messagesByChild[childName] || []
    const activeFilter = filters[childName] || 'ALL'
    if (activeFilter === 'ALL') return msgs.sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
    return msgs.filter(m => m.category === activeFilter).sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
  }

  const getChildCategories = (childName) => {
    const msgs = messagesByChild[childName] || []
    return [...new Set(msgs.map(m => m.category))]
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0' }}>
      <Header
        user={user}
        title="Home"
        subtitle="Family Command Center"
        showNav={true}
        manageMode={manageMode}
        onManageToggle={() => setManageMode(m => !m)}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Greeting bar */}
        <div style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#1a2e4a' }}>
              {greeting}, {userName}
            </span>
            <span style={{ fontSize: '22px', color: '#94A3B8', marginLeft: '12px' }}>
              &mdash; {dateStr}
            </span>
          </div>
          {urgent.length > 0 && (
            <div style={{
              padding: '6px 16px', borderRadius: '20px', border: '1px solid #E2E8F0',
              fontSize: '13px', color: '#64748B', background: 'white',
            }}>
              {urgent.length} need action today
            </div>
          )}
        </div>

        {/* Manage toolbar (visible when manage mode active) */}
        {manageMode && (
        <div style={{ padding: '0 28px', marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={removeDuplicates}
            disabled={deleting._dedup}
            style={{
              padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
              border: '1px solid #D97706', background: '#FFFBEB', color: '#D97706',
              cursor: deleting._dedup ? 'not-allowed' : 'pointer',
              opacity: deleting._dedup ? 0.6 : 1,
            }}
          >
            {deleting._dedup ? 'Removing...' : 'Remove Duplicates'}
          </button>
          <button
            onClick={deleteAllMessages}
            disabled={deleting._all}
            style={{
              padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
              border: '1px solid #DC2626', background: '#FEF2F2', color: '#DC2626',
              cursor: deleting._all ? 'not-allowed' : 'pointer',
              opacity: deleting._all ? 0.6 : 1,
            }}
          >
            {deleting._all ? 'Deleting...' : 'Delete All'}
          </button>
          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
        </div>
        )}

        {/* AI Summary Banner */}
        <div style={{ margin: '20px 28px 0', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{
            background: '#127A66',
            padding: '18px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
              }}>
                {'\uD83E\uDD16'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#9FE1CB', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  AI INSIGHT
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.5', marginBottom: insights.weeklyPulse.length > 0 ? '10px' : '0' }}>
                  {insights.banner.text}
                </div>
                {insights.weeklyPulse.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
                    {insights.weeklyPulse.map((bullet, idx) => (
                      <span key={idx} style={{
                        fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: '500',
                      }}>
                        {bullet.icon} {bullet.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {mostUrgentWithDate && insights.banner.tone !== 'warning' && (
              <div
                onClick={() => setSelectedMessage(mostUrgentWithDate)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(220, 38, 38, 0.15)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: '6px', padding: '8px 14px',
                  cursor: 'pointer', marginLeft: '44px', alignSelf: 'flex-start',
                }}
              >
                <span style={{ fontSize: '12px' }}>{'\u26A0\uFE0F'}</span>
                <span style={{ fontSize: '12px', color: '#FCA5A5', fontWeight: '500' }}>
                  {mostUrgentWithDate.subject} &mdash; due {new Date(mostUrgentWithDate.key_dates[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {'\u2192'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* NEEDS YOUR ATTENTION */}
        {attentionItems.length > 0 && (
          <div style={{ padding: '24px 28px 0' }}>
            <div style={{
              fontSize: '11px', fontWeight: '700', color: '#64748B',
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '14px',
            }}>
              NEEDS YOUR ATTENTION
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
              {attentionItems.map(msg => {
                const childName = matchChild(msg, CHILDREN)
                const childConfig = CHILDREN.find(c => c.name === childName)
                const dueBadge = getDueBadge(msg)
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    style={{
                      minWidth: '260px', maxWidth: '300px', padding: '16px',
                      background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                      borderLeft: `3px solid ${msg.urgency === 'HIGH' ? '#DC2626' : '#D97706'}`,
                      flexShrink: 0, position: 'relative',
                    }}
                  >
                    {/* Top row: due badge + child tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      {dueBadge ? (
                        <span style={{
                          fontSize: '11px', fontWeight: '600', color: dueBadge.color,
                          background: dueBadge.color + '18', padding: '3px 10px', borderRadius: '10px',
                        }}>
                          {dueBadge.urgent ? '\uD83D\uDD34' : '\uD83D\uDFE1'} {dueBadge.text}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '11px', fontWeight: '600', color: '#D97706',
                          background: '#FEF3C7', padding: '3px 10px', borderRadius: '10px',
                        }}>
                          {'\uD83D\uDFE1'} Needs response
                        </span>
                      )}
                      {childConfig && (
                        <span style={{
                          fontSize: '11px', fontWeight: '500', color: childConfig.color,
                          background: childConfig.accentLight, padding: '3px 10px', borderRadius: '10px',
                        }}>
                          {childConfig.name}
                        </span>
                      )}
                    </div>

                    {/* Title + summary */}
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a2e4a', marginBottom: '4px', lineHeight: '1.3' }}>
                      {msg.subject}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px', lineHeight: '1.4' }}>
                      {(msg.summary || '').substring(0, 80)}{(msg.summary || '').length > 80 ? '...' : ''}
                    </div>

                    {/* Bottom: action buttons + channel badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '12px', color: '#127A66', fontWeight: '500',
                          padding: '4px 12px', borderRadius: '6px', border: '1px solid #E2E8F0',
                          cursor: 'pointer',
                        }}
                      >
                        View
                      </span>
                      <span style={{
                        fontSize: '10px', padding: '3px 10px', borderRadius: '10px',
                        background: '#E6F1FB', color: '#185FA5',
                      }}>
                        {'\u2709\uFE0F'} Email
                      </span>
                    </div>

                    {/* Due line */}
                    {dueBadge && (
                      <div style={{ fontSize: '11px', color: dueBadge.color, fontWeight: '500', marginTop: '8px' }}>
                        {'\u2192'} {dueBadge.text}
                      </div>
                    )}
                    {manageMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id) }}
                        disabled={deleting[msg.id]}
                        style={{
                          position: 'absolute', top: '8px', right: '8px',
                          width: '24px', height: '24px', borderRadius: '50%',
                          border: 'none', background: '#DC2626', color: 'white',
                          fontSize: '13px', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                          opacity: deleting[msg.id] ? 0.5 : 1,
                        }}
                      >
                        {'\u2715'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab switcher: This week / Coming up */}
        <div style={{ padding: '24px 28px 0', display: 'flex', gap: '28px' }}>
          <button
            onClick={() => setActiveTab('thisWeek')}
            style={{
              padding: '10px 0', fontSize: '15px', fontWeight: '600',
              border: 'none', background: 'none', cursor: 'pointer',
              color: activeTab === 'thisWeek' ? '#1a2e4a' : '#94A3B8',
              borderBottom: activeTab === 'thisWeek' ? '2px solid #1a2e4a' : '2px solid transparent',
            }}
          >
            This week
          </button>
          <button
            onClick={() => setActiveTab('comingUp')}
            style={{
              padding: '10px 0', fontSize: '15px', fontWeight: '600',
              border: 'none', background: 'none', cursor: 'pointer',
              color: activeTab === 'comingUp' ? '#1a2e4a' : '#94A3B8',
              borderBottom: activeTab === 'comingUp' ? '2px solid #1a2e4a' : '2px solid transparent',
            }}
          >
            Coming up
          </button>
        </div>
        <div style={{ margin: '0 28px', borderBottom: '1px solid #E2E8F0' }} />

        {activeTab === 'comingUp' && (
          <div style={{ padding: '24px 28px 32px' }}>
            <HorizonView messages={messages} onSelectMessage={setSelectedMessage} children={dbChildren} />
          </div>
        )}

        {activeTab === 'thisWeek' && (
        <>
        {/* Side-by-side child columns */}
        {CHILDREN.length === 0 && messages.length > 0 && (
          <div style={{ padding: '24px 28px' }}>
            <div style={{
              background: 'white', borderRadius: '12px', padding: '24px',
              border: '1px solid #E2E8F0', textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>👧👦</div>
              <div style={{ fontSize: '14px', color: '#1a2e4a', fontWeight: '600', marginBottom: '4px' }}>
                Add your children to organize messages
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
                Go to Settings to add your kids — emails will be grouped by child automatically.
              </div>
              <a href="/settings" style={{
                padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                background: '#127A66', color: 'white', textDecoration: 'none',
                display: 'inline-block',
              }}>
                Add children in Settings
              </a>
            </div>
          </div>
        )}
        <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(CHILDREN.length, 3) || 1}, 1fr)`, gap: '24px' }}>
          {CHILDREN.map(child => {
            const filteredMsgs = getFilteredMessages(child.name)
            const categories = getChildCategories(child.name)
            const activeFilter = filters[child.name] || 'ALL'
            const childUrgent = (messagesByChild[child.name] || []).filter(m => m.urgency === 'HIGH')

            return (
              <div key={child.name} style={{
                background: 'white', borderRadius: '16px', overflow: 'hidden',
                border: '1px solid #E2E8F0',
              }}>
                {/* Dark header */}
                <div style={{
                  background: child.color, padding: '20px 24px',
                  display: 'flex', gap: '14px', alignItems: 'center',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0,
                  }}>
                    {child.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>{child.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                      {child.grade} {'\u00B7'} {child.school}
                    </div>
                  </div>
                </div>

                {/* Stats bar */}
                <div style={{
                  padding: '10px 24px 14px', background: child.color,
                  display: 'flex', gap: '20px',
                }}>
                  <span style={{ fontSize: '12px', color: child.accentLight, fontWeight: '600' }}>
                    {(messagesByChild[child.name] || []).length} items this week
                  </span>
                  {insights.childStreaks[child.name] && (
                    <span style={{ fontSize: '11px', color: child.accentLight, fontWeight: '600' }}>
                      {insights.childStreaks[child.name].text} {'\u2713'}
                    </span>
                  )}
                  {childUrgent.length > 0 && (
                    <span style={{ fontSize: '12px', color: child.accentLight, fontWeight: '600' }}>
                      {childUrgent.length} action needed
                    </span>
                  )}
                </div>

                {/* Filter pills */}
                <div style={{ padding: '16px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setFilters(f => ({ ...f, [child.name]: 'ALL' }))}
                    style={{
                      padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer',
                      border: `1.5px solid ${activeFilter === 'ALL' ? child.color : child.accentLight}`,
                      background: activeFilter === 'ALL' ? child.color : 'transparent',
                      color: activeFilter === 'ALL' ? child.accentLight : child.color,
                    }}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilters(f => ({ ...f, [child.name]: cat }))}
                      style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        border: `1.5px solid ${activeFilter === cat ? child.color : child.accentLight}`,
                        background: activeFilter === cat ? child.color : 'transparent',
                        color: activeFilter === cat ? child.accentLight : child.color,
                      }}
                    >
                      {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat] || cat}
                    </button>
                  ))}
                </div>

                {/* Message items */}
                <div>
                  {filteredMsgs.length > 0 ? filteredMsgs.map(msg => {
                    const dueBadge = getDueBadge(msg)
                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        style={{
                          padding: '14px 20px', borderTop: '1px solid #F1F5F9',
                          cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        {/* Category icon tile */}
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '8px',
                          background: CATEGORY_ICON_BG[msg.category] || '#F1F5F9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '16px', flexShrink: 0, marginTop: '2px',
                        }}>
                          {CATEGORY_ICONS[msg.category] || '\uD83D\uDCCB'}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px', fontWeight: '600', color: '#1a2e4a', marginBottom: '3px',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {msg.subject}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                              {(msg.summary || '').substring(0, 60)}{(msg.summary || '').length > 60 ? '...' : ''}
                            </span>
                            <span style={{
                              fontSize: '9px', padding: '1px 6px', borderRadius: '8px',
                              background: '#E6F1FB', color: '#185FA5', flexShrink: 0,
                            }}>
                              {'\u2709\uFE0F'}
                            </span>
                          </div>
                        </div>

                        {/* Right side: date + due badge + delete */}
                        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div>
                            {msg.key_dates?.[0] && (
                              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>
                                {new Date(msg.key_dates[0].date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                            )}
                            {dueBadge && (
                              <div style={{
                                fontSize: '10px', color: dueBadge.color, fontWeight: '600',
                                fontStyle: dueBadge.urgent ? 'normal' : 'italic',
                              }}>
                                {dueBadge.text}
                              </div>
                            )}
                            {!dueBadge && insights.inlineBadges[msg.id] && (
                              <div style={{
                                fontSize: '10px', fontWeight: '700', color: '#DC2626',
                                background: 'rgba(220,38,38,0.1)', padding: '2px 8px',
                                borderRadius: '8px',
                              }}>
                                {insights.inlineBadges[msg.id].overdueText}
                              </div>
                            )}
                          </div>
                          {manageMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id) }}
                              disabled={deleting[msg.id]}
                              style={{
                                width: '22px', height: '22px', borderRadius: '50%',
                                border: 'none', background: '#DC2626', color: 'white',
                                fontSize: '11px', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                                opacity: deleting[msg.id] ? 0.5 : 1, flexShrink: 0,
                              }}
                            >
                              {'\u2715'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  }) : (
                    <div style={{ padding: '28px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                      No items for {child.name}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Family / unmatched messages */}
        {familyMessages.length > 0 && (
          <div style={{ padding: '0 28px 24px' }}>
            <div style={{
              background: 'white', borderRadius: '16px', overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{
                background: '#475569', padding: '20px 24px',
                display: 'flex', gap: '14px', alignItems: 'center',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', flexShrink: 0,
                }}>
                  {'\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66'}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>Family</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    General & unassigned {'\u00B7'} {familyMessages.length} item{familyMessages.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {familyMessages.map(msg => {
                const dueBadge = getDueBadge(msg)
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    style={{
                      padding: '14px 20px', borderTop: '1px solid #F1F5F9',
                      cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      background: CATEGORY_ICON_BG[msg.category] || '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', flexShrink: 0, marginTop: '2px',
                    }}>
                      {CATEGORY_ICONS[msg.category] || '\uD83D\uDCCB'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: '600', color: '#1a2e4a', marginBottom: '3px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {msg.subject}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {(msg.summary || '').substring(0, 80)}{(msg.summary || '').length > 80 ? '...' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div>
                        {msg.key_dates?.[0] && (
                          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>
                            {new Date(msg.key_dates[0].date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        )}
                        {dueBadge && (
                          <div style={{ fontSize: '10px', color: dueBadge.color, fontWeight: '600' }}>
                            {dueBadge.text}
                          </div>
                        )}
                        {!dueBadge && insights.inlineBadges[msg.id] && (
                          <div style={{
                            fontSize: '10px', fontWeight: '700', color: '#DC2626',
                            background: 'rgba(220,38,38,0.1)', padding: '2px 8px',
                            borderRadius: '8px',
                          }}>
                            {insights.inlineBadges[msg.id].overdueText}
                          </div>
                        )}
                      </div>
                      {manageMode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id) }}
                          disabled={deleting[msg.id]}
                          style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            border: 'none', background: '#DC2626', color: 'white',
                            fontSize: '11px', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                            opacity: deleting[msg.id] ? 0.5 : 1, flexShrink: 0,
                          }}
                        >
                          {'\u2715'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </>
        )}

        {/* Empty state (This week only; Coming up uses HorizonView empty state) */}
        {messages.length === 0 && activeTab === 'thisWeek' && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{'\u2728'}</div>
            <div style={{ fontSize: '16px' }}>All caught up!</div>
          </div>
        )}
      </div>

      {/* Message detail modal overlay */}
      {selectedMessage && (
        <div
          onClick={() => setSelectedMessage(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '16px',
              width: '90%', maxWidth: '620px', maxHeight: '80vh',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#FAFBFC', flexShrink: 0,
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a2e4a' }}>
                Message Detail
              </span>
              <button
                onClick={() => setSelectedMessage(null)}
                style={{
                  border: 'none', background: 'none', fontSize: '20px',
                  cursor: 'pointer', color: '#64748B', padding: '4px 8px',
                  borderRadius: '6px', lineHeight: 1,
                }}
              >
                {'\u2715'}
              </button>
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
              <MessageDetail message={selectedMessage} connectors={connectors} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
