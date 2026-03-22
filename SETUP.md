# Family Inbox — Setup Guide

Complete end-to-end setup for the Family Inbox MVP.

---

## Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Vercel account (for deployment)
- Twilio account (if using WhatsApp bot)
- Gmail account(s) for testing
- Anthropic API key

---

## Phase 1: Database Setup

### 1. Create Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Save your **Project URL** and **Anon Key** (Settings → API)

### 2. Run database schema

1. In Supabase, go to **SQL Editor**
2. Create a new query and paste the entire contents of `database.sql`
3. Run the query
4. Verify tables exist: `family_spaces`, `family_members`, `connectors`, `messages`

---

## Phase 2: Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

```bash
# Copy from template
cp .env.local.example .env.local

# Then edit .env.local and add your values:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBHOOK_SECRET=your-random-secret-here-min-32-chars

ANTHROPIC_API_KEY=sk-ant-...

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX
ALLOWED_WHATSAPP_NUMBERS=+12025551234,+12125556789

CRON_SECRET=your-random-cron-secret
```

### 3. Run dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Phase 3: Test Auth Flow

1. Click "Sign in with Google"
2. Sign in with both parent Google accounts (separate browsers or incognito windows)
3. Create/join a family space with invite code
4. Verify both parents land in the same `/inbox`

---

## Phase 4: Set Up Email Forwarding (Gmail)

### For each parent's Gmail:

1. **Create a filter:**
   - Gmail → Settings → Filters and Blocked Addresses → Create a new filter
   - Set criteria (e.g., `from:(@school.edu OR @hospital.org)`)
   - Click "Create filter"

2. **Configure forwarding:**
   - Action: "Forward to"
   - Forward to: You'll need a forwarding email address. For now, use:
     ```
     dad@inbound.yourdomain.com
     mom@inbound.yourdomain.com
     ```
   - Or use a single shared address and parse the `X-Forwarded-For` header
   - Check "Delete Gmail's copy (archive it)"

3. **Configure Cloudflare Email Workers** (see below)

### Cloudflare Email Routing

This is the critical piece that receives forwarded emails and sends them to your app.

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select your domain
3. **Email Routing** → Enable
4. Create routing rules:
   ```
   dad@yourdomain.com → Webhook: POST https://yourvercelapp.vercel.app/api/email/inbound
                        with headers:
                          X-Webhook-Secret: ${WEBHOOK_SECRET}
                          X-Family-Space-ID: ${familySpaceId}
                          X-Connector-ID: ${connectorId}
   ```

⚠️ **Note**: The headers approach above is simplified. In production, you'd:
- Store family_space_id and connector_id in Cloudflare Workers environment
- Or embed them in the email routing address itself
- Or query them by the `to` address domain/prefix

For MVP, after creating the connector in the app, you'll manually configure the headers in Cloudflare.

---

## Phase 5: Set Up Twilio WhatsApp Bot

### 1. Create Twilio account

- Go to [twilio.com](https://twilio.com)
- Create account
- Get **Account SID** and **Auth Token** from Console

### 2. Set up WhatsApp sandbox

- In Twilio Console → Messaging → Try it out → Send a WhatsApp message
- Enable WhatsApp sandbox
- Note the **WhatsApp number** (e.g., `whatsapp:+1415555010`)

### 3. Configure webhook

- Messaging → WhatsApp → WhatsApp Sandbox
- **When a message comes in**: Set webhook URL to:
  ```
  https://yourvercelapp.vercel.app/api/twilio/inbound?familySpaceId=YOUR_SPACE_ID
  ```
- HTTP method: POST

### 4. Save to `.env.local`

```
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1415555010
ALLOWED_WHATSAPP_NUMBERS=+12025551234,+12125556789
```

### 5. Test

- Send a message to the Twilio WhatsApp number from a whitelisted number
- You should see it appear in the Inbox within seconds
- The bot will reply: "Got it — added to family inbox ✓"

---

## Phase 6: Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 2. Deploy via Vercel

```bash
vercel
```

Or connect your GitHub repo to Vercel and it auto-deploys on push.

### 3. Set environment variables in Vercel

In Vercel Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL=https://yourvercelapp.vercel.app
WEBHOOK_SECRET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
ALLOWED_WHATSAPP_NUMBERS
ANTHROPIC_API_KEY
CRON_SECRET
```

### 4. Update Gmail filters

Change forwarding address from `http://localhost:3000` to your Vercel URL:
```
https://yourvercelapp.vercel.app/api/email/inbound
```

---

## Phase 7: Create Gmail Connectors

1. Visit `/settings` → Connected Channels
2. For each parent's Gmail, click "Set Up Gmail Forwarding"
3. This creates a connector and shows the webhook URL
4. Configure Cloudflare/Gmail to forward to that URL with the connector ID

---

## Phase 8: Enable Cron (Vercel)

The cron job runs every 15 minutes to reprocess any messages that failed AI categorization.

1. In Vercel Project Settings → Cron Jobs
2. Should auto-detect the cron from `vercel.json`
3. Set up is automatic once deployed

---

## Testing Checklist

- [ ] Both parents can sign in with Google
- [ ] Can create/join family space with invite code
- [ ] Inbox is shared between both parents (same family_space_id)
- [ ] Gmail forwarding sends test email → appears in inbox with AI fields
- [ ] Twilio WhatsApp: send message from whitelisted number → appears in inbox
- [ ] Twilio WhatsApp: send message from unknown number → silently ignored
- [ ] Category filters work (click MEDICAL, SCHOOL, etc.)
- [ ] Source filters work (show only Dad's Gmail, etc.)
- [ ] Message detail shows summary, action items, key dates
- [ ] Settings page shows active connectors
- [ ] Invite code is displayed correctly
- [ ] Cron job processes unprocessed messages

---

## Troubleshooting

### Messages not appearing

- Check `/api/messages` returns data
- Verify connector_id in database
- Check Cloudflare/Twilio webhook logs for failures
- Ensure WEBHOOK_SECRET matches

### AI not categorizing

- Check `ANTHROPIC_API_KEY` is set
- Check Anthropic API usage/billing
- Cron job should retry within 15 minutes
- Check `messages.ai_processed` field in Supabase

### Twilio not replying

- Check `TWILIO_AUTH_TOKEN` is correct
- Verify webhook signature validation passes
- Check phone number is in `ALLOWED_WHATSAPP_NUMBERS`

### Email forwarding not working

- Test Gmail filter with a real email
- Check Cloudflare Email Routing logs
- Verify webhook URL is correct
- Check `WEBHOOK_SECRET` header matches

---

## Cost Breakdown (10 msgs/day)

| Service | Cost |
|---|---|
| Vercel | $0 (Hobby) |
| Supabase | $0 (free tier) |
| Cloudflare | $0 |
| Claude Haiku API | ~$0.30/month |
| Twilio WhatsApp | ~$2.50/month |
| **Total** | **~$2.80/month** |

---

## Next Steps (v2)

- [ ] WhatsApp Web Extension (Chrome extension)
- [ ] Real-time Supabase subscriptions (instant updates)
- [ ] Task assignment (mark action items for each parent)
- [ ] Email OAuth (historical email sync)
- [ ] SMS input channel
- [ ] Mobile app (Capacitor wrapper)
- [ ] Calendar integration (extract dates to Google Calendar)
