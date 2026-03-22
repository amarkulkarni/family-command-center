# Family Command Center — Family Inbox MVP

A private, shared inbox for two parents. Aggregates emails from both Gmail accounts + WhatsApp messages into one unified view with AI categorization, action item extraction, and key date tracking.

**Status**: MVP complete and ready for deployment. ✅

---

## What It Does

```
📧 Dad's Gmail    ╮
📧 Mom's Gmail    ├→  [App]  →  🏠 Shared Inbox  ←  📱 Twilio WhatsApp
💬 WhatsApp Bot   ╯
```

Each input is automatically:
- **Categorized** (SCHOOL, MEDICAL, PAYMENTS, etc.)
- **Summarized** by Claude Haiku
- **Parsed** for action items and key dates
- **Flagged** for urgency (HIGH/MEDIUM/LOW)

Both parents see everything in one place.

---

## Key Features

✅ **Shared Inbox** — One view for both parents, authenticated via Google
✅ **Email Forwarding** — Capture emails via Gmail filters + Cloudflare
✅ **WhatsApp Bot** — Text reminders to a Twilio number, instant inbox update
✅ **AI Parsing** — Claude extracts summary, action items, key dates
✅ **Smart Filters** — Filter by category (School, Medical, etc.) or source (Dad's Gmail, etc.)
✅ **Privacy-First** — No email credentials stored. No OAuth tokens. Email forwarding only.
✅ **Low Cost** — ~$3/month at 10 msgs/day

---

## Tech Stack

- **Frontend**: Next.js 14 + React (SSR + client components)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Google OAuth (SSR session)
- **AI**: Anthropic Claude Haiku (categorization)
- **Email**: Cloudflare Email Workers (parsing) + Gmail filters
- **WhatsApp**: Twilio WhatsApp API
- **Deployment**: Vercel (Next.js + Cron jobs)

---

## Architecture

### Database

```sql
family_spaces (id, name, invite_code)
  ↓
family_members (family_space_id, user_id)
connectors (family_space_id, type, display_name, status)
messages (family_space_id, connector_id, subject, body, ai_*)
```

**RLS**: Users can only see messages from family spaces they're members of.

### Message Flow

```
1. Email forwarded via Gmail filter → Cloudflare → POST /api/email/inbound
2. Webhook validates WEBHOOK_SECRET header
3. Message inserted to DB
4. Claude Haiku API called for categorization (inline)
5. Results stored: ai_category, ai_summary, ai_action_items, ai_key_dates, ai_urgency
6. Both parents see it in /inbox within seconds

OR

1. WhatsApp message → Twilio webhook → POST /api/twilio/inbound
2. Validates Twilio signature + phone whitelist
3. Creates connector if needed
4. Message inserted to DB with AI results (inline)
5. Twilio sends reply: "Got it — added to family inbox ✓"
```

### Cron Job

- `/api/cron/sync` runs every 15 minutes (Vercel Cron)
- Reprocesses messages with `ai_processed = false`
- Safety net for any AI failures

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/amarkulkarni/family-command-center.git
cd family-command-center
npm install
```

### 2. Set up Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Copy `database.sql` and run in SQL editor
3. Get `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Settings → API

### 3. Create `.env.local`

```bash
cp .env.local.example .env.local
# Edit with your credentials (see SETUP.md)
```

### 4. Run locally

```bash
npm run dev
# Visit http://localhost:3000
```

### 5. Test auth

- Sign in with Google (both parents in separate incognito windows)
- Create/join family space
- Both should land in shared `/inbox`

### 6. Deploy

```bash
git push && vercel
```

See [SETUP.md](./SETUP.md) for complete setup instructions.

---

## Project Structure

```
family-command-center/
├── app/
│   ├── page.js                 # Root (auth check → inbox/onboarding)
│   ├── inbox/page.js          # Unified inbox
│   ├── settings/page.js       # Channel management + invite code
│   ├── auth/callback/route.js # OAuth callback
│   ├── api/
│   │   ├── auth/actions.js    # signOut server action
│   │   ├── email/inbound/     # Cloudflare email webhook
│   │   ├── twilio/inbound/    # Twilio WhatsApp webhook
│   │   ├── messages/          # GET messages (paginated)
│   │   ├── connectors/create/ # POST new connector
│   │   ├── family-space/      # POST create/join space
│   │   └── cron/sync/         # Vercel cron job
│   ├── layout.js              # Root layout
│   └── globals.css
├── components/
│   ├── Header.jsx             # Nav header
│   ├── Dashboard.jsx          # Post-login root (redirects to inbox)
│   ├── LoginPage.jsx          # Sign in with Google
│   ├── Onboarding.jsx         # Create/join family space
│   ├── inbox/
│   │   ├── InboxPage.jsx      # Main inbox (message list + detail)
│   │   ├── FilterBar.jsx      # Category + connector filters
│   │   ├── MessageList.jsx    # Paginated message list
│   │   └── MessageDetail.jsx  # Message detail view (summary, action items, dates)
│   └── settings/
│       ├── SettingsPage.jsx   # Settings tabs
│       └── Channels.jsx       # Channel setup UI
├── lib/
│   ├── supabase/
│   │   ├── client.js          # Browser client
│   │   ├── server.js          # Server client
│   │   └── getFamilySpace.js  # Get user's family space
│   ├── ai/
│   │   └── categorize.js      # Claude Haiku categorization
│   └── inbound/
│       ├── parseEmail.js      # Parse Cloudflare email payload
│       └── parseTwilio.js     # Parse Twilio WhatsApp payload
├── database.sql               # Schema + RLS policies
├── SETUP.md                   # Step-by-step setup guide
├── DEPLOYMENT_GUIDE.md        # Production deployment checklist
└── package.json
```

---

## Security

### Email Forwarding
- No OAuth tokens stored
- Gmail remains untouched — only forwarding, no read/send/delete access
- Cloudflare Email Workers process at edge, no email storage

### Twilio WhatsApp
- Phone number whitelist (only known numbers processed)
- Twilio signature validation on every request
- Unknown numbers silently ignored

### Claude API
- Email subject, sender, body (max 3000 chars) sent to Anthropic
- Anthropic does not train on API inputs by default
- Same as any AI email tool (Superhuman, Shortwave, etc.)

### Supabase
- Row Level Security (RLS) enforced
- Users can only read/write to their family space
- SOC 2 Type 2 compliant

### HTTPS
- All webhooks served over HTTPS (Vercel)
- Webhook secret validation

---

## Cost

| Service | Monthly | Notes |
|---|---|---|
| Vercel | $0 | Hobby (next.js, cron free) |
| Supabase | $0 | Free tier sufficient for MVP |
| Cloudflare | $0 | Email Routing free |
| Claude Haiku | $0.30 | ~700 tokens/msg × 300 msgs |
| Twilio | $2.50 | WhatsApp number + messages |
| **Total** | **$2.80** | At 10 msgs/day |

Skip Twilio → **$0.30/month**.

---

## API Endpoints

### Messages

```
GET /api/messages?category=SCHOOL&connectorId=xxx&page=1&limit=20
  Response: { messages: [...], total: 100, page: 1, totalPages: 5 }
```

### Email Webhook

```
POST /api/email/inbound
  Headers:
    X-Webhook-Secret: ${WEBHOOK_SECRET}
    X-Family-Space-ID: ${familySpaceId}
    X-Connector-ID: ${connectorId}
  Body: Cloudflare email JSON payload
```

### Twilio Webhook

```
POST /api/twilio/inbound?familySpaceId=${familySpaceId}
  Headers:
    X-Twilio-Signature: [Twilio signature]
  Body: Form-encoded WhatsApp message
```

### Create Family Space

```
POST /api/family-space/create
  Response: { inviteCode, spaceId }
```

### Join Family Space

```
POST /api/family-space/join
  Body: { inviteCode: "XXXXXX" }
  Response: { spaceId }
```

### Create Connector

```
POST /api/connectors/create
  Body: { familySpaceId, type, ownerEmail }
  Response: { connector }
```

### Cron Sync

```
GET /api/cron/sync
  Headers:
    Authorization: Bearer ${CRON_SECRET}
  Response: { processed: 5, total: 5 }
```

---

## Environment Variables

```
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# App URL
NEXT_PUBLIC_APP_URL=https://yourapp.vercel.app

# Webhooks (required)
WEBHOOK_SECRET=random-string-min-32-chars
CRON_SECRET=random-string

# Anthropic (required)
ANTHROPIC_API_KEY=sk-ant-...

# Twilio (optional, for WhatsApp)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+1415...
NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER=+1415...
ALLOWED_WHATSAPP_NUMBERS=+12025551234,+12125556789
```

---

## Testing Locally

1. **Family Space Creation**
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2 (incognito window)
   # Visit http://localhost:3000
   # Sign in with Google (test account 1)
   # Create family space → copy invite code

   # Terminal 3 (different incognito window)
   # Visit http://localhost:3000
   # Sign in with Google (test account 2)
   # Join with invite code from Terminal 2

   # Both should now see /inbox together
   ```

2. **Email Webhook**
   ```bash
   curl -X POST http://localhost:3000/api/email/inbound \
     -H "X-Webhook-Secret: your-secret" \
     -H "X-Family-Space-ID: {spaceId}" \
     -H "X-Connector-ID: {connectorId}" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "teacher@school.edu",
       "subject": "Permission slip due Friday",
       "message": "...",
       "to": "dad@inbound.example.com"
     }'
   ```

3. **Twilio Webhook**
   ```bash
   # Use Twilio CLI or curl with proper signature
   # See Twilio docs for signature generation
   ```

---

## v2 Roadmap

- [ ] **WhatsApp Web Extension** — Capture messages directly from WhatsApp Web
- [ ] **Real-time Sync** — Supabase Realtime subscriptions for instant updates
- [ ] **Task Assignments** — Mark action items for specific parent
- [ ] **Gmail OAuth** — Historical email sync (instead of just forwarding)
- [ ] **SMS Channel** — SMS input via Twilio
- [ ] **Mobile App** — Capacitor wrapper for iOS/Android
- [ ] **Calendar Integration** — Auto-add dates to Google Calendar
- [ ] **Search** — Full-text search across messages
- [ ] **Reminders** — Push notifications for HIGH urgency items
- [ ] **Feedback Loop** — Like/dislike AI summaries to improve categorization

---

## Troubleshooting

### Messages not appearing in inbox

1. Check browser DevTools Network tab — `/api/messages` returns data?
2. Check Supabase → messages table — rows exist with correct `family_space_id`?
3. Check connector status — is it in the right family space?
4. Check webhook logs — is the request reaching the app?
5. Check `WEBHOOK_SECRET` header — does it match?

### AI not categorizing messages

1. Check `ANTHROPIC_API_KEY` is valid
2. Check Anthropic API quota/billing
3. Cron job will retry in 15 minutes
4. Check `messages.ai_processed` field — is it `false`?
5. Check app logs for errors

### Twilio not working

1. Check phone number is in `ALLOWED_WHATSAPP_NUMBERS`
2. Check webhook URL is correct in Twilio console
3. Check `TWILIO_AUTH_TOKEN` is valid
4. Test signature validation with curl
5. Check Twilio logs for failures

### Email not forwarding

1. Check Gmail filter exists and is enabled
2. Check forwarding address is correct
3. Test with manual email to forwarding address
4. Check Cloudflare Email Routing is enabled
5. Check webhook URL in Cloudflare matches app

---

## License

This project is private. Modify and deploy as needed.

---

## Support

See [SETUP.md](./SETUP.md) for detailed setup instructions.
See [Anthropic Claude docs](https://docs.anthropic.com) for API details.
See [Supabase docs](https://supabase.com/docs) for database help.
