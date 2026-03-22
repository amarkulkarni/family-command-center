# Family Command Center

A secure, private family communication platform with message organization and task management capabilities.

**Status**: Production-ready ✅

---

## Features

- 🔐 Secure family account with OAuth authentication
- 📧 Multi-source message aggregation and organization
- 🤖 AI-powered message categorization and summarization
- ✅ Action item tracking with deadline management
- 🔄 Real-time synchronization across family members
- 🛡️ Row-level security with granular access controls

---

## Tech Stack

- **Frontend & API**: Next.js 14 with React
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Anthropic Claude for message processing
- **Deployment**: Vercel (Next.js optimized)
- **Auth**: OAuth 2.0 via Supabase

---

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone and install
git clone https://github.com/amarkulkarni/family-command-center.git
cd family-command-center
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

---

## Environment Variables

Required configuration (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
ANTHROPIC_API_KEY
WEBHOOK_SECRET
CRON_SECRET
```

---

## Security Features

- ✅ OAuth-based authentication (no password storage)
- ✅ Row-level security (RLS) for multi-tenant isolation
- ✅ HTTPS-only communication
- ✅ Webhook signature validation
- ✅ Request authentication and validation
- ✅ No sensitive credentials in codebase
- ✅ Regular security updates via dependencies

---

## Architecture Overview

```
User (OAuth) → App → Secure Database (RLS)
                ↓
           AI Processing
                ↓
          Shared Inbox
```

The application uses:
- Server-side rendering for secure authentication
- API routes for serverless request handling
- Background jobs for asynchronous processing
- Database policies for access control

---

## Project Structure

```
app/                  # Next.js app directory
├── page.js           # Root page (auth routing)
├── inbox/            # Inbox interface
├── settings/         # Settings & management
└── api/              # API routes

components/           # React components
lib/                  # Utilities and helpers
```

---

## Deployment

This application is designed for Vercel deployment:

1. Connect GitHub repository to Vercel
2. Configure environment variables in project settings
3. Auto-deploys on git push to main branch

---

## Performance

- Build size: ~140KB (First Load JS)
- Development server: ~3-4s rebuild
- Database queries: optimized with RLS policies
- AI processing: async, non-blocking

---

## Contributing

This is a private project. Contributions are by invitation only.

---

## Security Notice

⚠️ This application handles private family communications.

- Never hardcode secrets or credentials
- Always use environment variables for sensitive data
- Report security issues to authorized team members only
- Keep dependencies updated regularly

---

## Support

For internal documentation and setup instructions, refer to private team resources.

---

## License

Private project - All rights reserved.

---

**Built with ❤️ for family coordination**
