import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const CATEGORY_OPTIONS = [
  'SCHOOL',
  'MEDICAL',
  'APPOINTMENTS',
  'PAYMENTS',
  'ACTIVITIES',
  'PTA',
  'ADMIN',
  'NEWSLETTER',
  'PERSONAL',
  'OTHER',
]

const URGENCY_OPTIONS = ['HIGH', 'MEDIUM', 'LOW']

export async function categorizeMessage({ subject, bodyText, fromAddress, fromName, children }) {
  try {
    // Truncate body to 3000 chars to stay within token budget
    const truncatedBody = bodyText.substring(0, 3000)

    // Build children context if available
    let childrenContext = ''
    if (children && children.length > 0) {
      const childDescriptions = children.map(c => {
        const parts = [c.name]
        if (c.grade) parts.push(c.grade)
        if (c.school) parts.push(c.school)
        if (c.activities?.length) parts.push(`activities: ${c.activities.join(', ')}`)
        return parts.join(', ')
      }).join('\n  - ')
      childrenContext = `
CHILDREN IN THIS FAMILY:
  - ${childDescriptions}

CHILD MATCHING RULES:
- "childName" must be the name of one of the children listed above, or null if the email applies to the whole family or you cannot determine which child
- Match by: direct name mention, grade level, school name, activity/club name, troop number, class reference, or any contextual clue
- Examples: "5th grade homework" → match the 5th grader. "Troop meeting" → match the child who does boy scouts. "Kindergarten newsletter" → match the kindergartener.
- If the email is about multiple children, pick the primary one. If truly family-wide (PTA meeting, family event), return null.`
    }

    const prompt = `You are an assistant helping busy parents organize family communications. Analyze this message and return ONLY valid JSON.

Subject: ${subject || '(none)'}
From: ${fromName || fromAddress}
Body: ${truncatedBody}
${childrenContext}

Return ONLY this exact JSON shape:
{
  "category": "SCHOOL|MEDICAL|APPOINTMENTS|PAYMENTS|ACTIVITIES|PTA|ADMIN|NEWSLETTER|PERSONAL|OTHER",
  "urgency": "HIGH|MEDIUM|LOW",
  "summary": "1-2 sentence plain English summary",
  "actionItems": ["max 3 concrete things a parent needs to DO"],
  "keyDates": [{ "label": "event name", "date": "YYYY-MM-DD" }]${children?.length ? ',\n  "childName": "child name or null"' : ''}
}

URGENCY RULES (STRICT):
- HIGH = Contains any of: URGENT, TODAY, IMMEDIATELY, due TODAY, due now, ASAP, payment due, medical emergency, school emergency, or any financial/health deadline within 24-48 hours
- MEDIUM = Due within a week. Keywords: this week, next week, appointment on [date], deadline is [future date >2 days]
- LOW = No action required. Keywords: reminder, FYI, note, informational, update, no deadline

EXAMPLES:
- "URGENT: Payment due TODAY" → urgency: HIGH
- "Appointment reminder for April 15" → urgency: MEDIUM
- "School newsletter" → urgency: LOW

Rules:
- Dates must be YYYY-MM-DD only
- Empty arrays if nothing applies
- No markdown, no code blocks, just raw JSON`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    let content = response.content[0].text.trim()
    // Strip markdown code fences if present (e.g. ```json ... ```)
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
    }
    const parsed = JSON.parse(content)

    // Check for explicit HIGH urgency keywords (override AI if detected)
    const combinedText = `${subject || ''} ${bodyText || ''}`.toLowerCase()
    let urgency = parsed.urgency

    const highUrgencyKeywords = ['urgent', 'today', 'immediately', 'asap', 'payment due', 'due today', 'due now', 'emergency', 'critical']
    const hasHighKeyword = highUrgencyKeywords.some(keyword => combinedText.includes(keyword))

    if (hasHighKeyword) {
      urgency = 'HIGH'
    }

    // Validate child name against known children
    let childName = null
    if (children?.length && parsed.childName) {
      const match = children.find(c =>
        c.name.toLowerCase() === String(parsed.childName).toLowerCase()
      )
      if (match) childName = match.name
    }

    // Validate and normalize response
    const result = {
      category: CATEGORY_OPTIONS.includes(parsed.category) ? parsed.category : 'OTHER',
      urgency: URGENCY_OPTIONS.includes(urgency) ? urgency : 'LOW',
      summary: String(parsed.summary || '').substring(0, 500),
      actionItems: (Array.isArray(parsed.actionItems) ? parsed.actionItems : [])
        .map((item) => String(item).substring(0, 200))
        .slice(0, 3),
      keyDates: (Array.isArray(parsed.keyDates) ? parsed.keyDates : [])
        .filter((d) => d.label && d.date)
        .map((d) => ({
          label: String(d.label).substring(0, 100),
          date: String(d.date),
        }))
        .slice(0, 5),
      childName,
    }

    return result
  } catch (error) {
    console.error('Error categorizing message:', error)
    // Fallback to safe defaults
    return {
      category: 'OTHER',
      urgency: 'LOW',
      summary: '',
      actionItems: [],
      keyDates: [],
      childName: null,
    }
  }
}
