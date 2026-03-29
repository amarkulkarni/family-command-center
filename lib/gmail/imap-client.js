import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { categorizeMessage } from '@/lib/ai/categorize'
import { createClient } from '@supabase/supabase-js'

export async function syncGmailEmails(familySpaceId) {
  // Create IMAP instance fresh each call (serverless-friendly)
  const imap = new Imap({
    user: process.env.GMAIL_EMAIL,
    password: process.env.GMAIL_APP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { servername: 'imap.gmail.com', rejectUnauthorized: false },
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    console.log('Starting Gmail sync...')

    // Step 1: Connect to Gmail
    await new Promise((resolve, reject) => {
      imap.once('ready', resolve)
      imap.once('error', reject)
      imap.connect()
    })

    console.log('Connected to Gmail')

    // Step 2: Open inbox
    await new Promise((resolve, reject) => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) reject(err)
        else resolve(box)
      })
    })

    console.log('Opened inbox')

    // Step 3: Search for unread emails
    const searchResults = await new Promise((resolve, reject) => {
      imap.search(['UNSEEN'], (err, results) => {
        if (err) reject(err)
        else resolve(results || [])
      })
    })

    if (searchResults.length === 0) {
      console.log('No new emails')
      imap.end()
      return { success: true, processed: 0 }
    }

    console.log(`Found ${searchResults.length} unread emails`)

    // Step 4: Fetch and parse emails
    const emails = await new Promise((resolve, reject) => {
      const parsed = []
      const f = imap.fetch(searchResults, { bodies: '' })

      f.on('message', (msg) => {
        msg.on('body', (stream) => {
          const emailPromise = new Promise((res, rej) => {
            simpleParser(stream, (err, mail) => {
              if (err) rej(err)
              else res(mail)
            })
          })
          parsed.push(emailPromise)
        })
      })

      f.once('error', reject)
      f.once('end', () => {
        Promise.all(parsed).then(resolve).catch(reject)
      })
    })

    console.log(`Parsed ${emails.length} emails`)

    // Step 5: Process each email
    let processedCount = 0

    for (const mail of emails) {
      try {
        const subject = mail.subject || '(no subject)'
        const bodyText = mail.text || mail.html || ''
        const fromAddress = mail.from?.value?.[0]?.address || 'unknown@example.com'
        const fromName = mail.from?.value?.[0]?.name || null
        const messageId = mail.messageId || `${fromAddress}@${Date.now()}`
        const receivedAt = mail.date?.toISOString() || new Date().toISOString()

        // Check for duplicates
        const { data: existing } = await supabase
          .from('messages')
          .select('id')
          .eq('external_id', messageId)
          .single()

        if (existing) {
          console.log(`Already processed: ${messageId}`)
          continue
        }

        // Categorize with AI
        const categorized = await categorizeMessage({
          subject,
          bodyText: bodyText.substring(0, 3000),
          fromAddress,
          fromName,
        })

        // Apply HIGH urgency keyword override
        const combinedText = `${subject} ${bodyText}`.toLowerCase()
        const highKeywords = ['urgent', 'today', 'immediately', 'asap', 'payment due', 'due today', 'due now', 'emergency', 'critical']
        if (highKeywords.some(k => combinedText.includes(k))) {
          categorized.urgency = 'HIGH'
        }

        // Insert into database
        const { error: insertError } = await supabase
          .from('messages')
          .insert({
            family_space_id: familySpaceId,
            connector_id: null,
            subject,
            body_text: bodyText.substring(0, 10000),
            from_address: fromAddress,
            from_name: fromName,
            snippet: bodyText.substring(0, 200),
            category: categorized.category,
            urgency: categorized.urgency,
            summary: categorized.summary,
            action_items: categorized.actionItems,
            key_dates: categorized.keyDates,
            external_id: messageId,
            raw_payload: { subject, from: fromAddress, messageId },
            received_at: receivedAt,
          })

        if (insertError) {
          console.error(`Error inserting "${subject}":`, insertError.message)
        } else {
          console.log(`Processed: ${subject}`)
          processedCount++
        }
      } catch (err) {
        console.error('Error processing email:', err.message)
      }
    }

    // Step 6: Mark emails as read
    if (processedCount > 0) {
      await new Promise((resolve, reject) => {
        imap.addFlags(searchResults, ['\\Seen'], (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
      console.log(`Marked ${searchResults.length} emails as read`)
    }

    // Step 7: Disconnect
    imap.end()

    return { success: true, processed: processedCount }
  } catch (err) {
    console.error('Gmail sync error:', err.message)
    try { imap.end() } catch (e) { /* ignore */ }
    throw err
  }
}
