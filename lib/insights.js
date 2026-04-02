/**
 * Client-side insight engine for the Family Command Center inbox.
 * Analyzes loaded messages and children config to produce banner headlines,
 * weekly pulse bullets, inline overdue badges, and child streak indicators.
 */

const CATEGORY_LABELS = {
  SCHOOL: 'school',
  MEDICAL: 'medical',
  PAYMENTS: 'payments',
  ACTIVITIES: 'activities',
  PTA: 'PTA',
  APPOINTMENTS: 'appointments',
  NEWSLETTER: 'newsletter',
  PERSONAL: 'personal',
  ADMIN: 'admin',
  OTHER: 'other',
}

// --- Helpers ---

function getToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function parseDate(dateStr) {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return d
}

function getOverdueMessages(messages) {
  const today = getToday()
  return messages.filter(m => {
    const date = m.key_dates?.[0]?.date
    if (!date) return false
    return parseDate(date) < today
  })
}

function groupBySender(messages) {
  const groups = {}
  for (const m of messages) {
    const key = m.from_address || m.from_name || 'unknown'
    if (!groups[key]) groups[key] = { name: m.from_name || m.from_address, messages: [] }
    groups[key].messages.push(m)
  }
  return groups
}

function groupByCategory(messages) {
  const counts = {}
  for (const m of messages) {
    const cat = m.category || 'OTHER'
    counts[cat] = (counts[cat] || 0) + 1
  }
  return counts
}

function detectConflicts(messages) {
  const dateMap = {}
  for (const m of messages) {
    for (const kd of (m.key_dates || [])) {
      if (!kd.date) continue
      const dateKey = kd.date.substring(0, 10)
      if (!dateMap[dateKey]) dateMap[dateKey] = []
      dateMap[dateKey].push({ label: kd.label, message: m })
    }
  }

  const conflicts = []
  for (const [dateKey, items] of Object.entries(dateMap)) {
    if (items.length < 2) continue
    const uniqueLabels = [...new Set(items.map(i => i.label))]
    if (uniqueLabels.length < 2) continue
    const dateObj = parseDate(dateKey)
    if (dateObj < getToday()) continue // only future conflicts matter
    const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
    conflicts.push({
      date: dateKey,
      dayLabel,
      labels: uniqueLabels.slice(0, 3),
    })
  }
  return conflicts
}

function countPerChild(messages, children) {
  const counts = {}
  for (const c of children) counts[c.name] = 0
  for (const m of messages) {
    if (m.child_name && counts[m.child_name] !== undefined) {
      counts[m.child_name]++
    }
  }
  return counts
}

// --- Banner ---

function generateBanner(messages, children, overdueMessages) {
  const urgent = messages.filter(m => m.urgency === 'HIGH')
  const medium = messages.filter(m => m.urgency === 'MEDIUM')

  if (messages.length === 0) {
    return { text: 'All caught up \u2014 no messages this week', tone: 'positive' }
  }

  // Priority waterfall — be specific
  if (overdueMessages.length > 0) {
    const first = overdueMessages[0]
    const label = (first.subject || first.summary || 'Item').substring(0, 50)
    if (overdueMessages.length === 1) {
      return { text: `"${label}" is overdue`, tone: 'warning' }
    }
    return { text: `"${label}" and ${overdueMessages.length - 1} other item${overdueMessages.length > 2 ? 's' : ''} are overdue`, tone: 'warning' }
  }

  if (urgent.length > 0) {
    const first = urgent[0]
    const label = (first.subject || first.summary || 'Item').substring(0, 50)
    if (urgent.length === 1) {
      return { text: `"${label}" needs attention`, tone: 'warning' }
    }
    return { text: `"${label}" + ${urgent.length - 1} more need attention`, tone: 'warning' }
  }

  if (medium.length === 0) {
    return { text: 'All caught up \u2014 nothing urgent this week', tone: 'positive' }
  }

  // Neutral: summarize what's happening
  const childNames = children.filter(c => messages.some(m => m.child_name === c.name)).map(c => c.name)
  const suffix = childNames.length > 0 ? ` for ${childNames.join(' and ')}` : ''
  return {
    text: `${medium.length} item${medium.length !== 1 ? 's' : ''} to review${suffix}`,
    tone: 'neutral',
  }
}

// --- Weekly Pulse ---

function generatePulseBullets(messages, children, overdueMessages, conflicts) {
  const bullets = []
  const today = getToday()

  // 1. Upcoming deadlines this week — "Permission slip due Friday (Arjun)"
  const upcoming = messages
    .filter(m => {
      const date = m.key_dates?.[0]?.date
      if (!date) return false
      const d = parseDate(date)
      const daysOut = Math.floor((d - today) / (1000 * 60 * 60 * 24))
      return daysOut >= 0 && daysOut <= 7
    })
    .sort((a, b) => parseDate(a.key_dates[0].date) - parseDate(b.key_dates[0].date))

  for (const m of upcoming.slice(0, 2)) {
    const d = parseDate(m.key_dates[0].date)
    const daysOut = Math.floor((d - today) / (1000 * 60 * 60 * 24))
    const dayLabel = daysOut === 0 ? 'today'
      : daysOut === 1 ? 'tomorrow'
      : d.toLocaleDateString('en-US', { weekday: 'long' })
    const label = m.key_dates[0].label || m.subject || 'Event'
    const childTag = m.child_name ? ` (${m.child_name})` : ''
    bullets.push({
      type: daysOut <= 1 ? 'warning' : 'conflict',
      icon: daysOut === 0 ? '\uD83D\uDD34' : '\uD83D\uDCC5',
      text: `${label}${childTag} \u2014 ${dayLabel}`,
    })
  }

  // 2. Top action items from recent messages — "Sign field trip form", "Pay lunch fees"
  const actionMessages = messages
    .filter(m => m.action_items?.length > 0 && m.urgency !== 'LOW')
    .sort((a, b) => {
      const urgOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
      return (urgOrder[a.urgency] || 2) - (urgOrder[b.urgency] || 2)
    })

  for (const m of actionMessages.slice(0, 3 - bullets.length)) {
    const action = m.action_items[0]
    if (!action) continue
    // Skip if we already have a bullet about this message's deadline
    if (bullets.some(b => b.text.includes(m.child_name) && b.text.includes(m.key_dates?.[0]?.label))) continue
    const childTag = m.child_name ? ` (${m.child_name})` : ''
    bullets.push({
      type: m.urgency === 'HIGH' ? 'warning' : 'stat',
      icon: m.urgency === 'HIGH' ? '\u2757' : '\u2192',
      text: `${action.substring(0, 60)}${childTag}`,
    })
  }

  // 3. Schedule conflicts — only if we have room
  if (bullets.length < 3) {
    for (const conflict of conflicts.slice(0, 3 - bullets.length)) {
      bullets.push({
        type: 'conflict',
        icon: '\u26A0\uFE0F',
        text: `${conflict.labels.slice(0, 2).join(' + ')} both on ${conflict.dayLabel}`,
      })
    }
  }

  return bullets.slice(0, 3)
}

// --- Inline Badges ---

function computeOverdueBadges(messages) {
  const today = getToday()
  const badges = {}

  for (const m of messages) {
    const date = m.key_dates?.[0]?.date
    if (!date) continue
    const dueDate = parseDate(date)
    if (dueDate >= today) continue

    const overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
    badges[m.id] = {
      overdueDays,
      overdueText: overdueDays === 0 ? 'Due today' : `${overdueDays} day${overdueDays !== 1 ? 's' : ''} late`,
    }
  }

  return badges
}

// --- Child Streaks ---

function computeChildStreaks(messages, children) {
  const today = getToday()
  const streaks = {}

  for (const child of children) {
    const childMsgs = messages.filter(m => m.child_name === child.name)
    if (childMsgs.length === 0) {
      streaks[child.name] = null
      continue
    }

    const withDates = childMsgs.filter(m => m.key_dates?.length > 0)
    if (withDates.length === 0) {
      streaks[child.name] = null
      continue
    }

    const hasOverdue = withDates.some(m => parseDate(m.key_dates[0].date) < today)
    if (!hasOverdue && withDates.length >= 2) {
      streaks[child.name] = { text: 'On track this week' }
    } else {
      streaks[child.name] = null
    }
  }

  return streaks
}

// --- Main Export ---

export function generateInsights(messages, childrenConfig) {
  const overdueMessages = getOverdueMessages(messages)
  const conflicts = detectConflicts(messages)

  return {
    banner: generateBanner(messages, childrenConfig, overdueMessages),
    weeklyPulse: generatePulseBullets(messages, childrenConfig, overdueMessages, conflicts),
    inlineBadges: computeOverdueBadges(messages),
    childStreaks: computeChildStreaks(messages, childrenConfig),
  }
}
