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
    tlsOptions: { servername: 'imap.gmail.com' },
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    console.log('Starting Gmail sync...')

    // Load children for this family space (for AI child matching)
    const { data: children } = await supabase
      .from('children')
      .select('name, grade, school, activities')
      .eq('family_space_id', familySpaceId)

    console.log(`Loaded ${children?.length || 0} children for AI context`)

    // Step 1: Determine sync start date (incremental)
    // Use the most recent message's received_at, or fall back to 7 days ago
    const { data: latestMsg } = await supabase
      .from('messages')
      .select('received_at')
      .eq('family_space_id', familySpaceId)
      .order('received_at', { ascending: false })
      .limit(1)
      .single()

    const since = new Date()
    if (latestMsg?.received_at) {
      // Start from the last synced message date (subtract 1 day buffer for timezone/delivery delays)
      const lastDate = new Date(latestMsg.received_at)
      lastDate.setDate(lastDate.getDate() - 1)
      since.setTime(lastDate.getTime())
      console.log(`Incremental sync from ${since.toISOString()} (last message: ${latestMsg.received_at})`)
    } else {
      since.setDate(since.getDate() - 7)
      console.log('First sync — fetching last 7 days')
    }

    // Step 2: Connect to Gmail
    await new Promise((resolve, reject) => {
      imap.once('ready', resolve)
      imap.once('error', reject)
      imap.connect()
    })

    console.log('Connected to Gmail')

    // Step 3: Open inbox
    await new Promise((resolve, reject) => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) reject(err)
        else resolve(box)
      })
    })

    console.log('Opened inbox')

    const searchResults = await new Promise((resolve, reject) => {
      imap.search([['SINCE', since]], (err, results) => {
        if (err) {
          console.error('IMAP search error:', err)
          reject(err)
        } else {
          resolve(results || [])
        }
      })
    })

    if (searchResults.length === 0) {
      console.log('No new emails found')
      imap.end()
      return { success: true, processed: 0 }
    }

    console.log(`Found ${searchResults.length} emails since ${since.toISOString()}`)

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
    let skippedCount = 0

    // System/noise senders to skip — not family communications
    const BLOCKED_SENDERS = [
      'noreply@google.com',
      'no-reply@accounts.google.com',
      'security-noreply@google.com',
      'googlecommunityteam-noreply@google.com',
      'noreply@medium.com',
      'noreply@github.com',
      'no-reply@marketing.',
      'mailer-daemon@',
      'postmaster@',
    ]

    const BLOCKED_SUBJECTS = [
      'security alert',
      '2-step verification',
      'sign-in attempt',
      'password changed',
      'recovery email',
      'backup phone',
      'critical security alert',
      'new sign-in',
      'verify your email',
      'confirm your email',
    ]

    for (const mail of emails) {
      try {
        const subject = mail.subject || '(no subject)'
        const bodyText = mail.text || mail.html || ''
        const fromAddress = mail.from?.value?.[0]?.address || 'unknown@example.com'
        const fromName = mail.from?.value?.[0]?.name || null
        const messageId = mail.messageId || `${fromAddress}@${Date.now()}`
        const receivedAt = mail.date?.toISOString() || new Date().toISOString()

        // Skip system/noise emails
        const fromLower = fromAddress.toLowerCase()
        const subjectLower = subject.toLowerCase()
        const isBlocked = BLOCKED_SENDERS.some(s => fromLower.includes(s)) ||
          BLOCKED_SUBJECTS.some(s => subjectLower.includes(s))

        if (isBlocked) {
          skippedCount++
          continue
        }

        // Family relevance pre-filter: skip emails that aren't kid/family related
        // Check if email mentions children, schools, or family-related keywords
        const combinedLower = `${subjectLower} ${bodyText.substring(0, 2000).toLowerCase()} ${(fromName || '').toLowerCase()}`
        const childNames = (children || []).map(c => c.name.toLowerCase())
        const childSchools = (children || []).map(c => (c.school || '').toLowerCase()).filter(Boolean)
        const childActivities = (children || []).flatMap(c => (c.activities || []).map(a => a.toLowerCase()))
        const familyKeywords = [
          'school', 'class', 'teacher', 'homework', 'grade', 'report card', 'field trip',
          'doctor', 'dentist', 'pediatric', 'appointment', 'checkup', 'vaccination', 'medical',
          'practice', 'game', 'tournament', 'recital', 'lesson', 'coach', 'team',
          'pta', 'parent', 'family', 'carpool', 'pickup', 'drop off', 'afterschool', 'after school',
          'tuition', 'fee', 'payment due', 'enrollment', 'registration',
          'scout', 'troop', 'camp', 'daycare', 'childcare', 'babysit',
          'lunch', 'cafeteria', 'permission slip', 'volunteer',
          'basketball', 'cricket', 'sky martial arts', 'taekwondo', 'bloom sports',
          'reeder music', 'piano', 'violin', 'stanford children',
        ]
        const allKeywords = [...childNames, ...childSchools, ...childActivities, ...familyKeywords]
        const isFamilyRelevant = allKeywords.some(kw => kw && combinedLower.includes(kw))

        if (!isFamilyRelevant) {
          skippedCount++
          continue
        }

        // Check for duplicates (by external_id OR same subject+sender)
        const { data: existing, error: dupError } = await supabase
          .from('messages')
          .select('id')
          .eq('external_id', messageId)
          .single()

        const { data: sameSubject } = await supabase
          .from('messages')
          .select('id')
          .eq('family_space_id', familySpaceId)
          .eq('from_address', fromAddress)
          .eq('subject', subject)
          .limit(1)
          .single()

        console.log(`[DEDUP] ${subject.substring(0, 50)} | external_id=${messageId.substring(0, 30)} | exists=${!!existing} | sameSubject=${!!sameSubject}`)

        if (existing || sameSubject) {
          continue
        }

        // Categorize with AI (pass children for intelligent routing)
        const categorized = await categorizeMessage({
          subject,
          bodyText: bodyText.substring(0, 3000),
          fromAddress,
          fromName,
          children: children || [],
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
            child_name: categorized.childName,
            external_id: messageId,
            raw_payload: { subject, from: fromAddress, messageId },
            received_at: receivedAt,
          })

        if (insertError) {
          console.error(`Error inserting "${subject}":`, insertError.message)
        } else {
          console.log(`Processed: ${subject} → child: ${categorized.childName || 'Family'}`)
          processedCount++
        }
      } catch (err) {
        console.error('Error processing email:', err.message)
      }
    }

    // Step 6: Disconnect
    imap.end()

    console.log(`Sync complete: ${processedCount} processed, ${skippedCount} system emails skipped`)
    return { success: true, processed: processedCount, skipped: skippedCount }
  } catch (err) {
    console.error('Gmail sync error:', err.message)
    try { imap.end() } catch (e) { /* ignore */ }
    throw err
  }
}
