import { syncGmailEmails } from '@/lib/gmail/imap-client'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  try {
    // Verify cron secret or authenticated user
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow requests from Vercel cron (Authorization header) or manual trigger with secret
    const secretParam = request.nextUrl.searchParams.get('secret')
    const isVercelCron = request.headers.get('x-vercel-cron-secret') === cronSecret
    const isCronSecret =
      authHeader === `Bearer ${cronSecret}` ||
      isVercelCron ||
      secretParam === cronSecret

    // Also allow authenticated Supabase users (for UI sync button)
    let isUserAuth = false
    if (!isCronSecret && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      )
      const { data: { user } } = await userClient.auth.getUser()
      isUserAuth = !!user
    }

    if (!isCronSecret && !isUserAuth) {
      return new Response('Unauthorized', { status: 401 })
    }

    console.log('Gmail sync cron triggered')

    // Get all family spaces (for now sync the first one, or could do all)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: familySpaces } = await supabase
      .from('family_spaces')
      .select('id')
      .limit(1)

    if (!familySpaces || familySpaces.length === 0) {
      return Response.json({ success: true, message: 'No family spaces found' })
    }

    const familySpaceId = familySpaces[0].id
    console.log('Syncing for family_space_id:', familySpaceId)

    // Sync Gmail
    const result = await syncGmailEmails(familySpaceId)

    return Response.json({
      success: true,
      processed: result.processed,
      familySpaceId,
    })
  } catch (err) {
    console.error('Cron error:', err)
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
