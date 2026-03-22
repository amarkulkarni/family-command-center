import { createClient } from '@/lib/supabase/server'
import { parseEmail } from '@/lib/inbound/parseEmail'
import { categorizeMessage } from '@/lib/ai/categorize'

export async function POST(req) {
  try {
    // Validate webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret')
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return new Response('Forbidden', { status: 403 })
    }

    const payload = await req.json()
    const parsed = parseEmail(payload)

    // Determine which family space and connector this is for
    // The 'to' field in the email tells us which connector it maps to
    const { to } = payload

    // Look up the connector by the 'to' address
    // This assumes the email is forwarded to an address like dad@inbound.yourapp.com
    // For now, we'll need to find it by the domain or have a mapping
    // For simplicity, we'll require the family_space_id and connector_id to be passed
    // Or we can look it up by inspecting the 'to' address in a real setup

    // In a production setup, you'd have:
    // - A mapping of inbound email addresses to connectors
    // - Or the 'to' field would contain metadata (e.g., dad@inbound-{connectorId}.example.com)

    // For now, let's accept family_space_id and connector_id in headers or query params
    const familySpaceId = req.headers.get('x-family-space-id') || req.nextUrl.searchParams.get('familySpaceId')
    const connectorId = req.headers.get('x-connector-id') || req.nextUrl.searchParams.get('connectorId')

    if (!familySpaceId || !connectorId) {
      return new Response(
        'Missing familySpaceId or connectorId. Include as headers (x-family-space-id, x-connector-id) or query params.',
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Verify connector exists and belongs to family space
    const { data: connector } = await supabase
      .from('connectors')
      .select('id')
      .eq('id', connectorId)
      .eq('family_space_id', familySpaceId)
      .single()

    if (!connector) {
      return new Response('Connector not found or does not belong to this family space', { status: 404 })
    }

    // Check if message already exists
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('connector_id', connectorId)
      .eq('external_id', parsed.externalId)
      .single()

    if (existingMessage) {
      return new Response(JSON.stringify({ message: 'Already processed', messageId: existingMessage.id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Categorize message
    const aiResult = await categorizeMessage({
      subject: parsed.subject,
      bodyText: parsed.bodyText,
      fromAddress: parsed.fromAddress,
      fromName: parsed.fromName,
    })

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        family_space_id: familySpaceId,
        connector_id: connectorId,
        external_id: parsed.externalId,
        subject: parsed.subject,
        snippet: parsed.snippet,
        body_text: parsed.bodyText,
        from_address: parsed.fromAddress,
        from_name: parsed.fromName,
        received_at: parsed.receivedAt,
        raw_payload: parsed.rawPayload,
        ai_processed: true,
        ai_category: aiResult.category,
        ai_summary: aiResult.summary,
        ai_action_items: aiResult.actionItems,
        ai_key_dates: aiResult.keyDates,
        ai_urgency: aiResult.urgency,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting message:', error)
      return new Response(error.message, { status: 500 })
    }

    // Update connector's last_received_at
    await supabase
      .from('connectors')
      .update({ last_received_at: new Date().toISOString() })
      .eq('id', connectorId)

    return new Response(JSON.stringify({ messageId: message.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing email webhook:', error)
    return new Response(error.message, { status: 500 })
  }
}
