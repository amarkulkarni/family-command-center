export function parseTwilio(params) {
  // Expected Twilio WhatsApp webhook params
  // {
  //   From: "whatsapp:+1XXXXXXXXXX",
  //   To: "whatsapp:+1YYYYYYYYY",
  //   Body: "dentist appointment April 15 3pm",
  //   MessageSid: "SMxxxxxxxx",
  //   Timestamp: "1234567890",
  //   ...
  // }

  const {
    From = '',
    Body = '',
    MessageSid = '',
    Timestamp,
  } = params

  // Extract phone number from From (remove whatsapp: prefix)
  const fromPhone = From.replace(/^whatsapp:/, '')

  // Twilio doesn't include a Timestamp param in webhook payloads, so default to now.
  // If Timestamp is present, it's a Unix epoch in seconds — convert to ms.
  const receivedAt = Timestamp
    ? new Date(parseInt(Timestamp) * 1000).toISOString()
    : new Date().toISOString()

  return {
    subject: null, // WhatsApp messages don't have subjects
    bodyText: Body.substring(0, 3000),
    fromAddress: fromPhone,
    fromName: null,
    snippet: Body.substring(0, 200),
    externalId: MessageSid,
    receivedAt,
    rawPayload: params,
  }
}
