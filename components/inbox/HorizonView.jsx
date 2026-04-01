'use client'

import { useState } from 'react'

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

const CHILD_PALETTE = [
  { color: '#127A66', accentLight: '#9FE1CB', dotColor: '#16A34A' },
  { color: '#8C5414', accentLight: '#FAC775', dotColor: '#D97706' },
  { color: '#4338CA', accentLight: '#C7D2FE', dotColor: '#6366F1' },
  { color: '#9D174D', accentLight: '#FBCFE8', dotColor: '#EC4899' },
]

function matchChild(message, childrenConfig) {
  if (message.child_name) {
    const match = childrenConfig.find(c => c.name.toLowerCase() === message.child_name.toLowerCase())
    if (match) return match.name
  }
  const text = `${message.subject || ''} ${message.summary || ''} ${(message.action_items || []).join(' ')}`.toLowerCase()
  for (const child of childrenConfig) {
    if (text.includes(child.name.toLowerCase())) return child.name
  }
  return null
}

function getWeekRanges(count) {
  const weeks = []
  const now = new Date()
  const startOfNextWeek = new Date(now)
  startOfNextWeek.setDate(now.getDate() + (7 - now.getDay()))
  startOfNextWeek.setHours(0, 0, 0, 0)

  for (let i = 0; i < count; i++) {
    const weekStart = new Date(startOfNextWeek)
    weekStart.setDate(startOfNextWeek.getDate() + i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    weeks.push({ start: weekStart, end: weekEnd })
  }
  return weeks
}

function formatWeekLabel(start, end) {
  const opts = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString('en-US', opts)}\u2013${end.toLocaleDateString('en-US', { day: 'numeric' })}`
}

function keyDateInWeek(dateStr, weekStart, weekEnd) {
  const dd = new Date(dateStr)
  dd.setHours(0, 0, 0, 0)
  const ws = new Date(weekStart)
  ws.setHours(0, 0, 0, 0)
  const we = new Date(weekEnd)
  we.setHours(23, 59, 59, 999)
  return dd >= ws && dd <= we
}

export default function HorizonView({ messages, onSelectMessage, children: dbChildren }) {
  const CHILDREN = (dbChildren || []).map((c, i) => ({
    name: c.name,
    ...CHILD_PALETTE[i % CHILD_PALETTE.length],
  }))
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const oneWeekOut = new Date(today)
  oneWeekOut.setDate(today.getDate() + 7)

  const futureItems = messages
    .filter(m => {
      if (!m.key_dates?.length) return false
      return m.key_dates.some(d => new Date(d.date) > oneWeekOut)
    })
    .sort((a, b) => {
      const aDate = new Date(a.key_dates[0].date)
      const bDate = new Date(b.key_dates[0].date)
      return aDate - bDate
    })

  const allDatedItems = messages
    .filter(m => m.key_dates?.length > 0)
    .sort((a, b) => new Date(a.key_dates[0].date) - new Date(b.key_dates[0].date))

  const weeks = getWeekRanges(6)

  const getItemsInWeek = (weekStart, weekEnd) => {
    return allDatedItems.filter(m => {
      return m.key_dates.some(d => keyDateInWeek(d.date, weekStart, weekEnd))
    })
  }

  const displayedItems =
    selectedWeekIndex === null
      ? futureItems
      : futureItems.filter(m =>
          m.key_dates.some(d => keyDateInWeek(d.date, weeks[selectedWeekIndex].start, weeks[selectedWeekIndex].end))
        )

  return (
    <div>
      <div style={{
        display: 'flex', gap: '12px', overflowX: 'auto',
        padding: '4px 0 16px', marginBottom: '20px',
      }}>
        {weeks.map((week, i) => {
          const weekItems = getItemsInWeek(week.start, week.end)
          const hasUrgent = weekItems.some(m => m.urgency === 'HIGH')
          const childDots = CHILDREN.map(child => {
            const hasItem = weekItems.some(m => {
              const cn = matchChild(m, CHILDREN)
              return cn === child.name
            })
            return hasItem ? child : null
          }).filter(Boolean)
          const isSelected = selectedWeekIndex === i
          const border = isSelected
            ? '1.5px solid #127A66'
            : '1px solid #E2E8F0'

          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedWeekIndex(prev => (prev === i ? null : i))}
              style={{
                minWidth: '120px', padding: '12px 16px',
                background: 'white', borderRadius: '10px',
                border,
                textAlign: 'center', flexShrink: 0, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a2e4a', marginBottom: '6px' }}>
                {formatWeekLabel(week.start, week.end)}
              </div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                {hasUrgent && (
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#DC2626',
                  }} />
                )}
                {childDots.map(child => (
                  <div key={child.name} style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: child.dotColor,
                  }} />
                ))}
                {weekItems.length === 0 && (
                  <div style={{ fontSize: '10px', color: '#CBD5E1' }}>{'\u2014'}</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {futureItems.length === 0 ? (
        <div style={{
          padding: '48px 20px', textAlign: 'center', color: '#94A3B8',
          background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>{'\uD83D\uDCC5'}</div>
          <div style={{ fontSize: '14px' }}>No upcoming items beyond this week</div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: '#CBD5E1' }}>
            Items with dates more than 7 days out will appear here
          </div>
        </div>
      ) : displayedItems.length === 0 ? (
        <div style={{
          padding: '48px 20px', textAlign: 'center', color: '#94A3B8',
          background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0',
        }}>
          <div style={{ fontSize: '14px' }}>No items in this week (beyond the 7-day horizon)</div>
          <div style={{ fontSize: '12px', marginTop: '8px', color: '#CBD5E1' }}>
            Tap another week or clear selection to see all upcoming items
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {displayedItems.map(msg => {
            const childName = matchChild(msg, CHILDREN)
            const childConfig = CHILDREN.find(c => c.name === childName)
            const dueDate = new Date(msg.key_dates[0].date)
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

            return (
              <div
                key={msg.id}
                onClick={() => onSelectMessage(msg)}
                style={{
                  padding: '16px 20px', background: 'white', borderRadius: '10px',
                  border: '1px solid #E2E8F0', cursor: 'pointer',
                  display: 'flex', gap: '12px', alignItems: 'flex-start',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
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
                    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.subject}
                    </span>
                    {childConfig && (
                      <span style={{
                        fontSize: '10px', fontWeight: '500', color: childConfig.color,
                        background: childConfig.accentLight, padding: '2px 8px', borderRadius: '8px',
                        flexShrink: 0,
                      }}>
                        {childConfig.name}
                      </span>
                    )}
                    <span style={{
                      fontSize: '9px', padding: '1px 6px', borderRadius: '8px',
                      background: '#E6F1FB', color: '#185FA5', flexShrink: 0,
                    }}>
                      {'\u2709\uFE0F'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                    {(msg.summary || '').substring(0, 80)}{(msg.summary || '').length > 80 ? '...' : ''}
                  </div>

                  {msg.action_items?.length > 0 && diffDays > 3 && diffDays <= 14 && (
                    <div style={{
                      marginTop: '6px', fontSize: '11px', color: '#854F0B',
                      background: '#FEF3C7', padding: '4px 10px', borderRadius: '6px',
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      {'\u26A0\uFE0F'} {msg.action_items[0].substring(0, 50)} &mdash; {diffDays} days away
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: '#1a2e4a', fontWeight: '500' }}>
                    {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{
                    fontSize: '10px', marginTop: '2px',
                    color: diffDays <= 10 ? '#D97706' : '#6B7280',
                    fontWeight: diffDays <= 10 ? '600' : '400',
                    fontStyle: 'italic',
                  }}>
                    In {diffDays} days
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
