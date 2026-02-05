# M3NOOVER

**Building Strong Bodies, Disciplined Minds, and Confident Athletes.**

M3NOOVER is a full-stack athletic training management platform built for personal trainers and their clients. It includes a marketing website (`/web`) and a client portal PWA (`/app`).

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Payments:** Stripe (Subscriptions, Invoices, Checkout)
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion
- **Language:** TypeScript

## Project Structure

```
M3NOOVER/
├── app/                    # Client Portal PWA (port 3001)
│   └── src/
│       ├── app/            # Next.js App Router pages
│       ├── components/     # React components
│       ├── lib/            # Utilities (Supabase, Stripe)
│       └── types/          # TypeScript types
├── web/                    # Marketing Website (port 3000)
│   └── src/
│       ├── app/            # Next.js App Router pages
│       └── components/     # React components
├── shared/                 # Shared package (@m3noover/shared)
│   └── src/
│       └── brand.ts        # Brand constants and colors
├── packages/
│   └── ui/                 # UI component library (@m3noover/ui)
└── database/
    └── migration.sql       # Complete SQL migration
```

## Prerequisites

- **Node.js** 18.17 or later
- **pnpm** 8.0 or later
- **Supabase** account (free tier works)
- **Stripe** account (test mode for development)

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/m3noover.git
cd m3noover
pnpm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   ```bash
   # Copy contents of database/migration.sql and run in Supabase SQL Editor
   ```
3. Get your API keys from **Project Settings > API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set Up Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Get your **test** API keys from the Dashboard:
   - `STRIPE_SECRET_KEY` (starts with `sk_test_`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
3. Set up webhooks:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login and forward webhooks
   stripe login
   stripe listen --forward-to localhost:3001/api/stripe/webhooks
   ```
4. Copy the webhook signing secret (`whsec_...`)

### 4. Configure Environment Variables

```bash
# Copy the example file
cp app/.env.example app/.env.local

# Edit with your values
nano app/.env.local
```

Required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_WEB_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Run Development Servers

```bash
# Run both web and app concurrently
pnpm dev

# Or run separately
pnpm --filter @m3noover/web dev   # Marketing site on :3000
pnpm --filter @m3noover/app dev   # Client portal on :3001
```

## Features

### Marketing Website (`/web`)
- Landing page with brand messaging
- About, Programs, Parents, Contact pages
- SEO optimized with structured data
- Responsive design

### Client Portal (`/app`)

#### For Parents
- **Dashboard** - Overview of upcoming sessions
- **Schedule** - Book and manage training sessions
- **My Athletes** - Add and track child athletes
- **Athlete Progress** - View coach notes and stats
- **Billing** - View invoices and payment history
- **Packages** - Subscribe to training packages

#### For Admin (Coach)
- **Schedule Management** - View/edit all bookings
- **Session Notes** - Quick-entry form for post-session feedback
- **Athlete Management** - View all athletes, flag attention needed
- **Invoice Management** - Create and send invoices
- **Subscription Management** - View active subscriptions

## Database Schema

Key tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (extends Supabase Auth) |
| `athletes` | Children linked to parent accounts |
| `session_types` | Training package definitions |
| `bookings` | Scheduled training sessions |
| `session_notes` | Coach feedback per session |
| `availability_templates` | Weekly schedule templates |
| `availability_exceptions` | Days off and special hours |

See [database/migration.sql](database/migration.sql) for the complete schema.

## Deployment

### Vercel Deployment

This project is designed for deployment on Vercel as two separate projects:

1. **Marketing Website**
   - Root directory: `web`
   - Domain: `m3noover.com`

2. **Client Portal**
   - Root directory: `app`
   - Domain: `app.m3noover.com`

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy web
cd web && vercel

# Deploy app
cd app && vercel
```

### Environment Variables for Production

Set these in your Vercel project settings:

**App (Client Portal):**
- All variables from `.env.example`
- Update URLs to production domains

**Web (Marketing):**
- `NEXT_PUBLIC_APP_URL` pointing to client portal

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Tailwind CSS for styling

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @m3noover/app build
```

### Type Checking

```bash
# Check all packages
pnpm typecheck

# Check specific package
pnpm --filter @m3noover/app typecheck
```

## Architecture Decisions

- **Monorepo with pnpm workspaces** - Shared code between web and app
- **Next.js App Router** - Server components, loading states, error boundaries
- **Supabase RLS** - Row-level security for multi-tenant data isolation
- **Stripe Checkout** - Hosted payment pages for PCI compliance
- **PWA support** - Installable app with offline capabilities

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Private - All rights reserved
