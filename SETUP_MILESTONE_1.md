# Milestone 1 Setup Guide
## Goal: Both parents can log in. App is live on the internet.
## Time: ~45–60 minutes

---

## Step 1 — Create a Supabase project (10 min)

1. Go to https://supabase.com → Sign up (free)
2. Click "New project"
   - Name: `family-command-center`
   - Database password: generate a strong one, save it somewhere
   - Region: pick closest to you (US West if you're in California)
3. Wait ~2 minutes for project to spin up
4. Go to **Project Settings → API**
5. Copy and save these two values:
   - **Project URL** (looks like: https://abcdefgh.supabase.co)
   - **anon public key** (long JWT string)

---

## Step 2 — Enable Google OAuth in Supabase (10 min)

1. In Supabase dashboard → **Authentication → Providers → Google**
2. Toggle **Enable** on
3. You need a Google OAuth Client ID and Secret. To get them:
   a. Go to https://console.cloud.google.com
   b. Create a new project (or use existing) → name it `family-command-center`
   c. Go to **APIs & Services → OAuth consent screen**
      - User type: External
      - App name: Family Command Center
      - Support email: your email
      - Save and continue (skip optional fields)
   d. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
      - Application type: Web application
      - Name: Family Command Center
      - Authorized redirect URIs — add this EXACTLY:
        `https://your-project-id.supabase.co/auth/v1/callback`
        (replace your-project-id with your actual Supabase project ID)
      - Click Create → copy the **Client ID** and **Client Secret**
4. Back in Supabase → paste the Client ID and Client Secret → Save

---

## Step 3 — Deploy to Vercel (10 min)

1. Go to https://vercel.com → Sign up with GitHub (free)
2. Push this code to a GitHub repo:
   ```bash
   cd family-command-center
   git init
   git add .
   git commit -m "milestone 1: scaffold + auth"
   gh repo create family-command-center --private --push --source=.
   ```
   (If you don't have `gh` CLI: go to github.com → New repo → follow instructions)

3. In Vercel → **Add New Project** → Import your GitHub repo
4. Before deploying, click **Environment Variables** and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL       = https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY  = your-anon-key
   NEXT_PUBLIC_APP_URL            = https://your-app.vercel.app
   ```
5. Click **Deploy** → wait ~2 min → you'll get a URL like `https://family-command-center-abc.vercel.app`

---

## Step 4 — Add your Vercel URL to Supabase (5 min)

1. In Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g. https://family-command-center-abc.vercel.app)
3. Under **Redirect URLs** add:
   `https://family-command-center-abc.vercel.app/auth/callback`
4. Save

5. Also go back to Google Cloud Console → your OAuth credentials → add the Vercel URL to **Authorized JavaScript origins**:
   `https://family-command-center-abc.vercel.app`

---

## Step 5 — Local dev setup (optional but recommended)

```bash
cd family-command-center
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase URL and anon key
npm install
npm run dev
# Opens at http://localhost:3000
```

For local dev, also add `http://localhost:3000/auth/callback` to:
- Supabase → Authentication → Redirect URLs
- Google Cloud Console → OAuth → Authorized redirect URIs

---

## ✅ Test Criteria — Milestone 1 is done when:

1. **You** open the Vercel URL → click "Sign in with Google" → land on dashboard with your name
2. **Sign out** works → returns to login screen
3. **Your wife** opens the same URL on her phone → signs in with her Google → sees her own name
4. Both of you are logged in at the same time with no conflicts

---

## Troubleshooting

**"Error 400: redirect_uri_mismatch"**
→ The redirect URI in Google Cloud Console doesn't exactly match. Check for trailing slashes or http vs https.

**"Invalid login credentials"**
→ Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct in Vercel env vars. Redeploy after adding them.

**Stuck on loading after Google sign-in**
→ Check that your Supabase Redirect URL includes `/auth/callback` and the Site URL matches your Vercel domain exactly.

---

## Once Milestone 1 is working, say "build Milestone 2"
