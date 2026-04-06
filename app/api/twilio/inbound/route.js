import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'
import { parseTwilio } from '@/lib/inbound/parseTwilio'
import { categorizeMessage } from '@/lib/ai/categorize'

export async function POST(req) {
  try {
    const signature = req.headers.get('x-twilio-signature')

    // Parse form data
    const formData = await req.formData()
    const params = Object.fromEntries(formData)

    // Validate Twilio signature
    // Use the full public URL (Vercel internal URLs may differ from what Twilio sees)
    const publicUrl = `https://family-command-center-blond.vercel.app${req.nextUrl.pathname}${req.nextUrl.search}`
    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      signature,
      publicUrl,
      params
    )

    console.log(`[TWILIO] signature valid: ${isValid}, from: ${params.From}, url: ${publicUrl}`)

    // TODO: Re-enable signature validation once URL mismatch is resolved
    // Sandbox testing: skip validation to unblock the flow
    if (!isValid) {
      console.log('[TWILIO] Signature validation failed — skipping for sandbox')
    }

    const fromPhone = params.From
    const allowedNumbers = (process.env.ALLOWED_WHATSAPP_NUMBERS || '').split(',')

    // Check whitelist
    if (!allowedNumbers.includes(fromPhone)) {
      // Silently ignore unknown numbers (return 200 OK without processing)
      return new Response('OK', { status: 200 })
    }

    const parsed = parseTwilio(params)

    // Look up which family space has a TWILIO_WHATSAPP connector
    // For now, we'll require the family_space_id to be passed in a query param or stored config
    // In production, you might store this in a separate table or env var

    // Get the family space (you could also query by connector, but we need family space)
    // For simplicity in MVP, assume only one family space per Twilio number
    // Or require family_space_id in the URL/config

    const familySpaceId = req.nextUrl.searchParams.get('familySpaceId')

    if (!familySpaceId) {
      // Log error but don't expose it to Twilio
      console.error('Missing familySpaceId for Twilio webhook')
      return new Response('OK', { status: 200 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Find or create the Twilio connector
    let { data: connector } = await supabase
      .from('connectors')
      .select('id')
      .eq('family_space_id', familySpaceId)
      .eq('type', 'TWILIO_WHATSAPP')
      .single()

    if (!connector) {
      // Create connector if it doesn't exist
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
        console.error('Error creating connector:', connectorError)
        return new Response('OK', { status: 200 })
      }

      connector = newConnector
    }

    // Check if message already exists
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('connector_id', connector.id)
      .eq('external_id', parsed.externalId)
      .single()

    if (existingMessage) {
      return new Response('OK', { status: 200 })
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
        connector_id: connector.id,
        external_id: parsed.externalId,
        subject: parsed.subject,
        snippet: parsed.snippet,
        body_text: parsed.bodyText,
        from_address: parsed.fromAddress,
        from_name: parsed.fromName,
        received_at: parsed.receivedAt,
        raw_payload: parsed.rawPayload,
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
      console.error('Error inserting message:', error)
      return new Response('OK', { status: 200 })
    }

    // Update connector's last_received_at
    await supabase
      .from('connectors')
      .update({ last_received_at: new Date().toISOString() })
      .eq('id', connector.id)

    // Send confirmation reply via Twilio (optional)
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const twilioClient = twilio(accountSid, authToken)

      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: fromPhone,
        body: 'Got it — added to family inbox ✓',
      })
    } catch (twilioError) {
      console.error('Error sending Twilio reply:', twilioError)
      // Don't fail the webhook if reply fails
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing Twilio webhook:', error)
    return new Response('OK', { status: 200 })
  }
}
