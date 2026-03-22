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

export async function categorizeMessage({ subject, bodyText, fromAddress, fromName }) {
  try {
    // Truncate body to 3000 chars to stay within token budget
    const truncatedBody = bodyText.substring(0, 3000)

    const prompt = `You are an assistant helping busy parents organize family communications. Analyze this message and return ONLY valid JSON.

Subject: ${subject || '(none)'}
From: ${fromName || fromAddress}
Body: ${truncatedBody}

Return ONLY this exact JSON shape:
{
  "category": "SCHOOL|MEDICAL|APPOINTMENTS|PAYMENTS|ACTIVITIES|PTA|ADMIN|NEWSLETTER|PERSONAL|OTHER",
  "urgency": "HIGH|MEDIUM|LOW",
  "summary": "1-2 sentence plain English summary",
  "actionItems": ["max 3 concrete things a parent needs to DO"],
  "keyDates": [{ "label": "event name", "date": "YYYY-MM-DD" }]
}

Rules:
- HIGH = action needed within 24-48h (money, health, urgent deadline)
- MEDIUM = action needed within a week
- LOW = informational, no immediate action
- Empty arrays if nothing applies
- Dates in YYYY-MM-DD only
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

    const content = response.content[0].text
    const parsed = JSON.parse(content)

    // Validate and normalize response
    const result = {
      category: CATEGORY_OPTIONS.includes(parsed.category) ? parsed.category : 'OTHER',
      urgency: URGENCY_OPTIONS.includes(parsed.urgency) ? parsed.urgency : 'LOW',
      summary: String(parsed.summary || '').substring(0, 500),
      actionItems: (Array.isArray(parsed.actionItems) ? parsed.actionItems : [])
        .map((item) => String(item).substring(0, 200))
        .slice(0, 3),
      keyDates: (Array.isArray(parsed.keyDates) ? parsed.keyDates : [])
        .filter((d) => d.label && d.date)
        .map((d) => ({
          label: String(d.label).substring(0, 100),
          date: String(d.date), // Validate format in DB constraint if needed
        }))
        .slice(0, 5),
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
    }
  }
}
