# Claude Context: Family Command Center

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
- Auth: OAuth 2.0 via Supabase
- Deployment: Vercel

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

## Recent Work

- Security hardening: sanitized public docs, removed infrastructure details
- Added ASCII mockup screenshots
- Fixed build, added jsconfig
- Completed Settings page with channel management
