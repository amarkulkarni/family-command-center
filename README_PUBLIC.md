# Family Command Center

A family communication and coordination platform with secure, private message management.

**Status**: Production ready ✅

## Features

- Shared family inbox with secure authentication
- Message categorization and summarization
- Multi-source message aggregation
- Action item tracking with key date extraction
- Real-time synchronization between family members
- Granular access controls via row-level security

## Tech Stack

- Next.js 14 (frontend + API)
- Supabase (database with row-level security)
- Anthropic Claude AI (message processing)
- Vercel (deployment)

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see `.env.local.example`)
4. Run dev server: `npm run dev`
5. Deploy to Vercel for production

## Environment Configuration

The application requires the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
ANTHROPIC_API_KEY
WEBHOOK_SECRET
CRON_SECRET
```

Additional optional configuration for third-party services may be required.

## Security

- Authentication via OAuth (Google)
- Row-level security (RLS) for multi-tenant isolation
- No credentials stored in the application
- All communication over HTTPS
- Webhook signature validation
- Rate limiting and request validation

## Architecture

The application uses a serverless architecture with:
- Server-side rendering for authentication
- API routes for webhook processing
- Scheduled jobs for background tasks
- Database with row-level security policies

## Support

For setup and deployment instructions, refer to internal documentation.

---

**Disclaimer**: This is a private application. Unauthorized access, use, or deployment is prohibited.
