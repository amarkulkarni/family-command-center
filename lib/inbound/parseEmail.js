export function parseEmail(payload) {
  // Expected Cloudflare Email Workers payload
  // {
  //   from: "sender@example.com",
  //   to: "dad@inbound.yourapp.com",
  //   subject: "...",
  //   message: "raw RFC 5322 email",
  //   ...
  // }

  const {
    from = '',
    to = '',
    subject = '',
    message = '',
    timestamp = new Date().toISOString(),
  } = payload

  // Extract plain text body (simplified; in production use email-parser library)
  let bodyText = message
  try {
    // If message is raw email, try to extract text body
    const textMatch = message.match(/^([\s\S]*?)\n\n/m)
    if (textMatch) {
      bodyText = message.substring(message.indexOf('\n\n') + 2)
    }
  } catch (e) {
    // Fall back to full message
  }

  // Extract Message-ID for uniqueness
  let messageId = null
  try {
    const idMatch = message.match(/^Message-ID:\s*<(.+?)>/m)
    if (idMatch) {
      messageId = idMatch[1]
    }
  } catch (e) {
    // Use timestamp + from as fallback
    messageId = `${from}@${new Date(timestamp).getTime()}`
  }

  // Extract sender name if present
  const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/)
  const senderName = fromMatch ? fromMatch[1].trim() : null
  const senderEmail = fromMatch ? fromMatch[2] : from

  return {
    subject: subject || '(no subject)',
    bodyText: bodyText.substring(0, 10000), // Limit to 10KB
    fromAddress: senderEmail,
    fromName: senderName,
    snippet: bodyText.substring(0, 200),
    externalId: messageId || `${senderEmail}@${Date.now()}`,
    receivedAt: new Date(timestamp).toISOString(),
    rawPayload: payload,
  }
}
