import { createClient } from '@/lib/supabase/server'
import { categorizeMessage } from '@/lib/ai/categorize'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    // Validate cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Forbidden', { status: 403 })
    }

    const supabase = createClient()

    // Find unprocessed messages
    const { data: unprocessed, error: fetchError } = await supabase
      .from('messages')
      .select('id, subject, body_text, from_address, from_name')
      .eq('ai_processed', false)
      .limit(100)

    if (fetchError) {
      console.error('Error fetching unprocessed messages:', fetchError)
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
    }

    if (!unprocessed || unprocessed.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 })
    }

    // Process each message
    let processed = 0
    for (const msg of unprocessed) {
      try {
        const aiResult = await categorizeMessage({
          subject: msg.subject,
          bodyText: msg.body_text,
          fromAddress: msg.from_address,
          fromName: msg.from_name,
        })

        const { error: updateError } = await supabase
          .from('messages')
          .update({
            ai_processed: true,
            ai_category: aiResult.category,
            ai_summary: aiResult.summary,
            ai_action_items: aiResult.actionItems,
            ai_key_dates: aiResult.keyDates,
            ai_urgency: aiResult.urgency,
          })
          .eq('id', msg.id)

        if (updateError) {
          console.error(`Error updating message ${msg.id}:`, updateError)
        } else {
          processed++
        }
      } catch (error) {
        console.error(`Error processing message ${msg.id}:`, error)
        // Mark as processed anyway to avoid infinite retries
        await supabase
          .from('messages')
          .update({ ai_processed: true })
          .eq('id', msg.id)
      }
    }

    return new Response(
      JSON.stringify({ processed, total: unprocessed.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in cron sync:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
