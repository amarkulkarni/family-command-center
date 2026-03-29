import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { parseEmail } from '@/lib/inbound/parseEmail'
import { categorizeMessage } from '@/lib/ai/categorize'
import crypto from 'crypto'

export async function POST(request) {
  try {
    // Validate webhook signature
    const signature = request.headers.get('X-Webhook-Signature')
    const secret = process.env.WEBHOOK_SECRET

    if (secret && signature) {
      const body = await request.text()
      const hash = crypto.createHmac('sha256', secret).update(body).digest('hex')
      if (hash !== signature) {
        return new Response('Invalid signature', { status: 401 })
      }
      // Re-parse body since we consumed it
      const payload = JSON.parse(body)
      return handleEmailWebhook(payload)
    }

    // If no signature validation, accept the request (for testing)
    const payload = await request.json()
    return handleEmailWebhook(payload)
  } catch (err) {
    console.error('Error in email webhook:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

async function handleEmailWebhook(payload) {
  try {
    // Parse email
    const parsed = parseEmail(payload)

    // Get family_space_id from payload (for testing) or from "to" address (production)
    let familySpaceId = payload.familySpaceId

    if (!familySpaceId) {
      // In production, look up connector by "to" address
      // For now, require familySpaceId in payload
      return new Response('familySpaceId required in payload', { status: 400 })
    }

    // Categorize message
    const categorized = await categorizeMessage({
      subject: parsed.subject,
      bodyText: parsed.bodyText,
      fromAddress: parsed.fromAddress,
      fromName: parsed.fromName,
    })

    // Force HIGH urgency for messages with critical keywords
    const combinedText = `${parsed.subject} ${parsed.bodyText}`.toLowerCase()
    const highUrgencyKeywords = ['urgent', 'today', 'immediately', 'asap', 'payment due', 'due today', 'due now', 'emergency', 'critical']
    if (highUrgencyKeywords.some(keyword => combinedText.includes(keyword))) {
      categorized.urgency = 'HIGH'
    }

    // Insert into messages table
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        family_space_id: familySpaceId,
        connector_id: payload.connectorId || null,
        subject: parsed.subject,
        body_text: parsed.bodyText,
        from_address: parsed.fromAddress,
        from_name: parsed.fromName,
        snippet: parsed.snippet,
        category: categorized.category,
        urgency: categorized.urgency,
        summary: categorized.summary,
        action_items: categorized.actionItems,
        key_dates: categorized.keyDates,
        external_id: parsed.externalId,
        raw_payload: parsed.rawPayload,
        received_at: parsed.receivedAt,
      })

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500 })
    }

    return Response.json({ success: true, externalId: parsed.externalId })
  } catch (err) {
    console.error('Error handling email webhook:', err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
