# Claude Context: Family Command Center
Before any code review or verification step, say "checking rules" out loud in your response.

Before touching any file, write one sentence explaining why this change is consistent with the project architecture.

## Commit Workflow (Autonomous)
When asked to commit and/or push: ALWAYS run design-review, QA, and `gitleaks detect --source . --no-git` inline BEFORE any shell commit command. See `.cursor/rules/commit-workflow.mdc` for the full protocol. Do NOT wait for the user to type /design-review or /qa — run them yourself as Steps 1–3 of the commit workflow.

At the start of every conversation, read the memory index at ~/.claude/projects/-Users-amarkulkarni-claude-projects-family-command-center/memory/MEMORY.md and load any relevant memories before proceeding.

Project-specific guidance for Family Command Center. See `~/.claude/CLAUDE.md` for global preferences and standards.

## Project Summary

**Family Command Center** — Secure, private family communication platform with message aggregation, AI-powered categorization, and task management.

**Status**: MVP complete, production-ready ✅

## Architecture

```
User (OAuth) → Next.js App → Supabase (RLS) → Claude AI
```

**Tech Stack**:
- Frontend: Next.js 14 + React
- Backend: Next.js API routes (serverless)
- Database: Supabase (PostgreSQL with RLS)
- AI: Anthropic Claude API for message processing
- Auth: OAuth 2.0 via Supabase (email/password for local dev)
- Deployment: Vercel

## Authentication Architecture (Critical)

**Token-based auth with Authorization headers + Service Role for server operations**

- **Client**: `lib/supabase/client.js` uses standard `@supabase/supabase-js`
  - Stores session in localStorage (browser default)
  - Extracts access token and sends via `Authorization: Bearer <token>` header

- **Server API Routes**: Two-step verification
  1. Verify token is valid by calling `getUser()` with anon key
  2. Use service role client for actual database operations (bypasses RLS)
  3. Service role is safe because key is server-side only

**Why this approach**:
- Token verification ensures only authenticated users can call APIs
- Service role bypasses RLS for clean, predictable database operations
- Avoids RLS timing issues (e.g., can't read/insert before membership exists)
- Application logic controls access, not database policies

**Environment Variables**:
```
NEXT_PUBLIC_SUPABASE_ANON_KEY      # For client-side auth
SUPABASE_SERVICE_ROLE_KEY          # For server-side operations (secret, never expose)
```

**RLS Policies**: Minimal, mainly for additional safety on direct client queries (though APIs don't use them).

**Local Testing**: Using email/password auth. Production uses Google OAuth.

**Directory Structure**:
```
app/                  # Next.js app directory
├── page.js           # Root page (auth routing)
├── inbox/            # Message inbox interface
├── settings/         # Settings & channel management
└── api/              # API routes (webhooks, background jobs)

components/           # React components
lib/                  # Utilities, AI processing, database helpers
```

## Core Features

- OAuth authentication (no password storage)
- Multi-source message aggregation
- AI-powered categorization & summarization
- Task/action item tracking with deadlines
- Settings page with channel management
- Real-time sync across family members
- Row-level security (RLS) for multi-family isolation

## Environment Variables (Required)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
ANTHROPIC_API_KEY
WEBHOOK_SECRET
CRON_SECRET
```

See `.env.local.example` for template. Never commit `.env.local`.

## Key Design Decisions

| Decision | Why |
|----------|-----|
| **Supabase + RLS** | Multi-tenant isolation without custom middleware |
| **Claude API** | Best-in-class understanding of family communication context |
| **Next.js** | Full-stack reduces infra complexity |
| **OAuth only** | No password management; better security |
| **Serverless (Vercel)** | Simple deployment, auto-scaling |

## Development

```bash
npm install              # Install dependencies
npm run dev              # Local server (http://localhost:3000)
npm run build            # Production build
npm run type-check       # TypeScript validation
npm test                 # Run tests
```

## Common Tasks

**Add message source**:
1. Create API endpoint in `app/api/webhooks/`
2. Add webhook signature validation
3. Implement message ingestion to Supabase
4. Wire into categorization pipeline

**Modify AI processing**:
1. Update prompts in `lib/ai.js` or related
2. Test with sample messages locally
3. Follow PR workflow before deploying

**Add feature**:
1. Start with Settings page if user-configurable
2. Ensure RLS policies support multi-family access
3. Build API routes for backend logic
4. Implement React components (use `'use client'` only if interactive)

## Testing & Validation

- Type check before PR: `npm run type-check`
- Run tests: `npm test`
- All tests must pass before merge
- Test with real Supabase connection (not mocks)

## Security Model

- OAuth-only auth (no passwords)
- RLS policies for data isolation
- HTTPS-only communication
- Webhook signature validation on all webhooks
- All secrets in `.env.local` (git-ignored)
- Regular dependency updates

**Critical**: Never hardcode credentials, API keys, or sensitive data. Always use environment variables.

## Decision Log

### Architecture & Auth (Ongoing)

**Decision**: Use localStorage for client-side session storage with Authorization header-based API authentication
- **Why**: Simplicity. Supabase SDK stores sessions in localStorage by default on the client. API routes use Bearer token from Authorization header.
- **Impact**: Server components cannot access client sessions (can't read localStorage). All pages that need auth must be client components with useEffect.
- **Pages affected**: app/page.js, app/inbox/page.js, app/settings/page.js must ALL be client components
- **Lesson**: When adopting this pattern, ensure ALL pages that depend on auth are client components. Server components that try to verify auth will fail.

**Decision**: No cookies, no server-side session management
- **Why**: Reduces complexity, avoids SSR/hydration issues, keeps auth simple and local
- **Trade-off**: Can't use server-side auth checks; must verify on client side
- **Implementation**: Pages with useEffect checking session, redirecting if not authenticated

**Decision**: API routes verify token via Authorization header, not via cookies
- **Why**: Matches localStorage-based client auth; clear separation of concerns
- **Implementation**: Extract token from `Authorization: Bearer <token>` header, verify with Supabase anon key

### Components & Pages

**Decision**: Header is a client component with client-side sign out
- **Why**: signOut must clear localStorage, which requires client-side code
- **Not**: A server component with server action (can't access localStorage)

**Decision**: Settings page is a client component with useEffect for data loading
- **Why**: Must check client session and redirect if not authenticated
- **Pattern**: Same as inbox/page.js — useEffect → checkAuth → load data → render component

### Features & Data

**Decision**: Messages endpoint (/api/messages) now queries real messages table
- **Implementation**: Verifies user auth, filters by family_space_id, supports category and connector filters, returns paginated results
- **Auth pattern**: Extracts token from Authorization header, verifies with Supabase anon key
- **Pagination**: Returns total count and totalPages for pagination UI

## Current Project State (Handoff Document)

**Last Updated**: 2026-03-28

### What's Working ✅

- **Authentication flow** — Email/password login with localStorage session storage
- **Routing** — app/page.js → LoginPage → Dashboard → Onboarding → Inbox/Settings
- **Onboarding** — Create family space (generates invite code), join with invite code
- **Family spaces** — Tables created, data persists across sessions
- **Inbox page** — Loads family space name and connectors, displays messages from real messages table
- **Messages table** — Created with full schema (category, urgency, summary, actionItems, keyDates)
- **Messages API** — /api/messages queries real messages table, filters by family_space_id, supports category and connector filtering, returns paginated results
- **Settings page** — Shows invite code and channel setup guides
- **Navigation** — Header with sign out, tabs between Inbox and Settings
- **Sign out** — Clears session and redirects to login
- **Auth persistence** — Session persists across page reloads and navigation

### Known Limitations ⚠️

- **Messages in inbox** — Table exists but is empty (no webhooks yet), so inbox displays empty
- **Connectors table** — Created but no active connectors set up
- **Email/WhatsApp webhooks** — Not yet created; setup guides in Settings are informational only
- **Google OAuth** — Using email/password for local dev; production will use Google OAuth
- **RLS policies** — Disabled for MVP; application logic controls access

### Database Schema (Required)

```
family_spaces
  - id (uuid, primary key)
  - name (text)
  - invite_code (text, unique)
  - created_at (timestamp)

family_members
  - id (uuid, primary key)
  - family_space_id (uuid, foreign key)
  - user_id (uuid, foreign key)
  - created_at (timestamp)

connectors (created but unused)
  - id (uuid, primary key)
  - family_space_id (uuid)
  - type (text: GMAIL_FORWARD, TWILIO_WHATSAPP, etc.)
  - display_name (text)
  - status (text)
  - last_received_at (timestamp)
  - owner_email (text)

messages (NOT YET CREATED)
  - Required for inbox to display real messages
  - id, family_space_id, connector_id, sender, subject, body, category, urgency, created_at, received_at
```

### Next Steps (Prioritized)

1. **Test join flow** — Create second test user, join with invite code from first user
   - Verifies onboarding join path works
   - Confirms family_members records link correctly
   - Test that second user sees same inbox

2. **Create webhook endpoints** — Add /api/webhooks/{email,whatsapp}
   - Parse incoming email/WhatsApp messages
   - Validate webhook signatures
   - Call categorizeMessage() to get category, urgency, summary, etc.
   - Insert into messages table
   - Inbox should display messages in real-time

3. **Test end-to-end message flow**
   - Send test email to forwarding address
   - Verify it appears in inbox with correct category
   - Test filtering by category and connector

### Critical Rules for This Project

- **Changes are additive only** — Don't modify existing code unless explicitly approved
- **Test complete flow after each change** — Ensure auth/routing still work
- **All auth-dependent pages must be client components** — Don't use server components with localStorage auth
- **All pages that check auth must follow the useEffect pattern** — See app/inbox/page.js and app/settings/page.js
- **Never break existing functionality** — Auth/routing/inbox/settings are locked

### How to Resume Work

1. Start dev server: `npm run dev`
2. Login with test credentials (test@fcc.com)
3. Run verification checklist before making changes
4. Test complete flow after changes

## Recent Work

- **Fixed Header sign out**: Converted to client component with client-side logout (not server action)
  - Server actions can't access localStorage, so signOut must be client-side
- **Fixed Settings page**: Converted to client component with useEffect (same pattern as inbox)
  - Server components can't verify auth with localStorage sessions
- **Fixed Settings and Inbox 404 errors**: Both were server components trying to use cookie-based auth
- **Auth flow complete and tested**: Login → Onboarding → Inbox → Sign out → Login (working end-to-end)
- **Identified architectural lesson**: All pages accessing auth must be client components; don't use server components for auth checks with localStorage
