import { createClient } from '@supabase/supabase-js'
import { categorizeMessage } from '@/lib/ai/categorize'

// Test endpoint that simulates a WhatsApp message without Twilio
// POST /api/test/whatsapp
// Body: { familySpaceId, from, body }
export async function POST(req) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { familySpaceId, from, body } = await req.json()

    if (!familySpaceId || !body) {
      return Response.json({ error: 'Missing familySpaceId or body' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Load children for AI context
    const { data: children } = await supabase
      .from('children')
      .select('name, grade, school, activities')
      .eq('family_space_id', familySpaceId)

    // Find or create TWILIO_WHATSAPP connector
    let { data: connector } = await supabase
      .from('connectors')
      .select('id')
      .eq('family_space_id', familySpaceId)
      .eq('type', 'TWILIO_WHATSAPP')
      .single()

    if (!connector) {
      const { data: newConnector, error: connectorError } = await supabase
        .from('connectors')
        .insert({
          family_space_id: familySpaceId,
          type: 'TWILIO_WHATSAPP',
          display_name: 'Family Bot (WhatsApp)',
          status: 'ACTIVE',
        })
        .select()
        .single()

      if (connectorError) {
        return Response.json({ error: 'Failed to create connector', details: connectorError.message }, { status: 500 })
      }
      connector = newConnector
    }

    const fromPhone = from || '+15550100'
    const externalId = `test-${Date.now()}`

    // AI categorize
    const aiResult = await categorizeMessage({
      subject: null,
      bodyText: body.substring(0, 3000),
      fromAddress: fromPhone,
      fromName: null,
      children: children || [],
    })

    // Insert message (same columns as Gmail sync)
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        family_space_id: familySpaceId,
        connector_id: connector.id,
        external_id: externalId,
        subject: null,
        snippet: body.substring(0, 200),
        body_text: body.substring(0, 10000),
        from_address: fromPhone,
        from_name: null,
        received_at: new Date().toISOString(),
        raw_payload: { test: true, from: fromPhone, body },
        category: aiResult.category,
        urgency: aiResult.urgency,
        summary: aiResult.summary,
        action_items: aiResult.actionItems,
        key_dates: aiResult.keyDates,
        child_name: aiResult.childName,
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: 'Failed to insert message', details: error.message }, { status: 500 })
    }

    // Update connector's last_received_at
    await supabase
      .from('connectors')
      .update({ last_received_at: new Date().toISOString() })
      .eq('id', connector.id)

    return Response.json({
      success: true,
      message,
      ai: aiResult,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
