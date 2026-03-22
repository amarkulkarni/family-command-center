# Deployment Guide

Complete guide for deploying the Family Inbox to production (Vercel + Supabase).

---

## Pre-Deployment Checklist

- [ ] All environment variables set locally (`.env.local`)
- [ ] Build succeeds: `npm run build`
- [ ] Both parents can sign in locally
- [ ] Family space creation/joining works
- [ ] Email webhook tested with curl
- [ ] Twilio webhook tested (or skipped if using WhatsApp later)
- [ ] AI categorization works
- [ ] Inbox filters work
- [ ] Settings page displays correctly
- [ ] Cron endpoint responds to manual request

---

## Step 1: Prepare GitHub Repository

```bash
# Make sure everything is committed
git status
git add .
git commit -m "Ready for production deployment"
git push origin main
```

---

## Step 2: Set Up Vercel Project

### Option A: Connect via GitHub (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub account
3. Click "New Project"
4. Select your `family-command-center` repo
5. Framework Preset: **Next.js**
6. Root Directory: `.` (default)
7. Click "Deploy"

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
cd family-command-center
vercel

# Follow prompts to link to project
```

---

## Step 3: Configure Environment Variables in Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `family-command-center` project
3. Go to **Settings** → **Environment Variables**
4. Add each variable (copy from `.env.local`):

| Variable | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxxxx.supabase.co | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | https://yourapp.vercel.app | Production |
| `WEBHOOK_SECRET` | your-secret-here | Production, Preview, Development |
| `TWILIO_ACCOUNT_SID` | ACxxxxx | Production |
| `TWILIO_AUTH_TOKEN` | your-token | Production |
| `TWILIO_WHATSAPP_NUMBER` | whatsapp:+1... | Production |
| `NEXT_PUBLIC_TWILIO_WHATSAPP_NUMBER` | +1... | Production |
| `ALLOWED_WHATSAPP_NUMBERS` | +12025551234,+12125556789 | Production |
| `ANTHROPIC_API_KEY` | sk-ant-... | Production |
| `CRON_SECRET` | your-cron-secret | Production |

⚠️ **Security**: Use strong random values for `WEBHOOK_SECRET` and `CRON_SECRET` (min 32 chars).

---

## Step 4: Deploy & Test

1. Vercel auto-deploys from your main branch
2. Check deployment status at [vercel.com/dashboard](https://vercel.com/dashboard)
3. Once green, visit your Vercel URL

### Test Production

```bash
# Get your Vercel URL (e.g., https://family-command-center.vercel.app)

# 1. Sign in with Google (both parents)
# 2. Create/join family space
# 3. Should land in /inbox

# 4. Test email webhook
curl -X POST https://your-app.vercel.app/api/email/inbound \
  -H "X-Webhook-Secret: your-actual-secret" \
  -H "X-Family-Space-ID: {your-space-id}" \
  -H "X-Connector-ID: {your-connector-id}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "teacher@example.com",
    "subject": "Test message",
    "message": "This is a test",
    "to": "dad@inbound.example.com"
  }'

# 5. Check inbox — message should appear within seconds
```

---

## Step 5: Configure Gmail Forwarding

For each parent:

### Gmail Filter Setup

1. Gmail Settings → Filters and Blocked Addresses
2. Create a new filter:
   - **From**: `@school.edu` (example: customize per family)
   - **To**: leave blank
   - **Subject**: leave blank
3. Click "Create filter"
4. Check "Forward it to" → enter forwarding address
5. **Forwarding address**: We'll configure this via Cloudflare

### Cloudflare Email Routing

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select your domain
3. **Email Routing** → Create a routing rule
   ```
   Dad's emails:
     Catch-all: dad
     Forward to: Webhook
     URL: https://your-app.vercel.app/api/email/inbound
     Headers:
       X-Webhook-Secret: your-webhook-secret
       X-Family-Space-ID: {your-space-id}
       X-Connector-ID: {dad-connector-id}

   Mom's emails:
     Catch-all: mom
     Forward to: Webhook
     URL: https://your-app.vercel.app/api/email/inbound
     Headers:
       X-Webhook-Secret: your-webhook-secret
       X-Family-Space-ID: {your-space-id}
       X-Connector-ID: {mom-connector-id}
   ```

⚠️ **Note**: Cloudflare Email Workers doesn't support custom headers in webhook routing yet. As a workaround:
- Embed `familySpaceId` and `connectorId` in the URL: `...?familySpaceId=X&connectorId=Y`
- Or query them by the `to` address domain/prefix
- Or use Cloudflare Worker script to add headers (advanced)

For MVP, manually update the webhook URLs once you know your space/connector IDs.

---

## Step 6: Configure Twilio WhatsApp

1. Go to [twilio.com/console](https://twilio.com/console)
2. Messaging → WhatsApp → Sandbox
3. **When a message comes in** → Set webhook URL:
   ```
   https://your-app.vercel.app/api/twilio/inbound?familySpaceId={your-space-id}
   ```
4. HTTP method: POST
5. Click "Save"

### Test WhatsApp

```bash
# Send a message from your whitelisted number to the Twilio number
# You should see:
# 1. Message appears in inbox within seconds
# 2. Twilio sends reply: "Got it — added to family inbox ✓"
```

---

## Step 7: Enable Vercel Cron

The `vercel.json` file defines a cron job that runs every 15 minutes:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

1. In Vercel Project Settings → Cron Jobs
2. Should auto-detect from `vercel.json`
3. No additional setup needed

### Test Cron Manually

```bash
curl -X GET https://your-app.vercel.app/api/cron/sync \
  -H "Authorization: Bearer your-cron-secret"
```

Should return: `{ "processed": 0, "total": 0 }` (or higher if unprocessed messages exist)

---

## Step 8: Set Up Custom Domain (Optional)

1. In Vercel Project Settings → Domains
2. Add your custom domain (e.g., `family-inbox.example.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (usually instant)

---

## Step 9: Monitor & Scale

### Vercel Dashboard

- **Deployments** → View build logs and test new pushes
- **Analytics** → Monitor response times and request count
- **Usage** → Check API usage (should be tiny)

### Supabase Dashboard

- **SQL Editor** → Run manual queries to inspect data
- **Logs** → Check database activity
- **Settings** → Monitor storage and bandwidth

### Claude API

- [console.anthropic.com](https://console.anthropic.com)
- Monitor token usage and costs
- Subabase query should be efficient (usually <1000 tokens/message)

---

## Troubleshooting Deployment

### Build fails on Vercel

```bash
# Check local build first
npm run build

# Common issues:
# - Missing environment variable (check Vercel env vars)
# - TypeScript errors (verify all imports)
# - Missing dependency (npm install)
```

### Webhook returns 403

```
X-Webhook-Secret mismatch
→ Check WEBHOOK_SECRET in Vercel matches Cloudflare/curl header
```

### Email not forwarding

```
1. Test Cloudflare routing with a manual request
2. Check webhook URL in Cloudflare console
3. Check Gmail filter exists and is enabled
4. Check Gmail forwarding address is correct
```

### Twilio not working

```
1. Check ALLOWED_WHATSAPP_NUMBERS includes your number (with +1 prefix)
2. Check familySpaceId is correct in webhook URL
3. Check TWILIO_AUTH_TOKEN is valid
4. Test signature validation locally first
```

### Cron not running

```
1. Check vercel.json has crons section
2. Check CRON_SECRET is set in Vercel env vars
3. Manual test: curl with Bearer token
4. Check Vercel Function Logs for errors
```

---

## Rolling Back

If deployment breaks production:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel will auto-deploy
# Old deployment should be live within 2 minutes
```

Or in Vercel dashboard:
1. **Deployments** → Find previous good deployment
2. Click the three dots → "Promote to Production"

---

## Scaling (Later)

For >1000 messages/day:

- **Database**: Supabase auto-scales free tier. Upgrade to Pro if needed.
- **API**: Vercel scales automatically. No changes needed.
- **AI**: Anthropic scales. Higher volume = lower per-request cost.
- **Email**: Cloudflare Email Workers scale automatically.
- **Cron**: Vercel handles up to 100 concurrent invocations.

---

## Monitoring Checklist

- [ ] New messages appear in inbox within 5 seconds
- [ ] Inbox loads in <2 seconds
- [ ] Filters work correctly
- [ ] Cron job processes messages successfully
- [ ] Vercel build succeeds on git push
- [ ] Error rates in Vercel dashboard are <1%
- [ ] Claude API usage is within budget
- [ ] No unexpected Twilio charges

---

## Backup & Recovery

### Backup Database

```bash
# Supabase auto-backups daily (free tier)
# Go to Supabase Project Settings → Backups
# Manual backup available anytime
```

### Disaster Recovery

If data is lost:
1. Restore from Supabase backup (Project Settings → Backups → Restore)
2. Re-push to Vercel (auto-deploys)
3. Test inbox loads correctly

---

## Next Steps

- [ ] Monitor production for first week
- [ ] Collect feedback from both parents
- [ ] Plan v2 features (WhatsApp Web, real-time, tasks, etc.)
- [ ] Set up analytics (optional: Vercel Analytics)
- [ ] Create runbook for incident response

---

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Anthropic Docs: https://docs.anthropic.com
- Twilio Docs: https://www.twilio.com/docs
