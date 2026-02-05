# CLAUDE.md — M3NOOVER Project

## Project Identity

This is **M3NOOVER** (also branded as **M3FIT**) — a marketing website and client portal platform for an independent athletic coach named Chuck based in Temecula, CA. He has 5+ years of experience training high school athletes and is expanding into a professional coaching business.

**This is NOT a generic SaaS product.** This is a personal brand platform for a real coach who trains real kids. Every design decision, every word of copy, every UX flow should reflect that. The platform serves two audiences: **parents** (who pay) and **athletes** (who train). Chuck is the sole operator — he is coach, admin, and business owner.

---

## Brand Foundation

### M3 = Mindset. Movement. Mastery.

These three pillars drive everything. They are not just marketing words — they represent Chuck's actual coaching philosophy:

- **Mindset** — discipline, accountability, confidence, showing up when it's hard
- **Movement** — proper mechanics, fundamentals before flash, age-appropriate programming
- **Mastery** — long-term development, trusting the process, earning results

### Brand Voice

- **Confident but not arrogant.** Chuck earns trust through consistency, not hype.
- **Direct and honest.** No corporate speak. No filler. Say what you mean.
- **Athlete-centric language.** Use words like "train," "develop," "earn," "build," "compete," "grind," "level up." Avoid clinical fitness jargon like "optimize," "maximize," "wellness journey."
- **Protective of kids.** When addressing parents, the tone is reassuring, transparent, and respectful. Chuck treats every athlete like his own.
- **Premium but accessible.** This isn't a luxury gym — it's a serious training program that any family can afford. The brand should feel elite without being exclusionary.

### Copy Guidelines

- Never say "workout." Say "training session" or just "session."
- Never say "clients." Say "athletes" or "families."
- Never say "gym." Say "training facility" or just "the facility."
- Never say "personal trainer." Say "coach."
- Refer to the coach as "Coach Chuck" in athlete/parent-facing copy, "Chuck" in admin/internal contexts.
- The tagline is: **"Building Strong Bodies, Disciplined Minds, and Confident Athletes."**
- When referencing what athletes learn, emphasize character alongside performance: showing up on time, working through discomfort, respecting structure, trusting the process, carrying themselves with confidence.

### Visual Identity

- **Dark, athletic, premium.** Think Nike Training Club, not Planet Fitness.
- **Primary palette:** deep black/charcoal backgrounds, clean white text, one bold accent color (electric blue, bold orange, or similar — choose one and commit).
- **Typography:** bold, uppercase sans-serif for headings. Clean, readable sans-serif for body text. Big type. Strong visual hierarchy.
- **Imagery direction:** action shots, training intensity, sweat and work. When using placeholders, use dark gradients or abstract athletic textures — never stock photos of smiling people in clean gyms.
- **Spacing:** generous whitespace. Let the content breathe. This isn't a cluttered landing page — it's a brand experience.
- **Mobile-first.** Parents will find this site on their phone. Period. Design for mobile, then scale up.

---

## Architecture

### Monorepo Structure

```
/m3noover
├── /web              → Marketing website (m3noover.com)
├── /app              → Client portal PWA (m3noover.app)
├── /shared           → Brand constants, types, utilities
├── /packages
│   └── /ui           → Shared component library
├── pnpm-workspace.yaml
├── package.json
└── CLAUDE.md         ← you are here
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe (Connect, Checkout, Billing) |
| Hosting | Vercel |
| Monorepo | pnpm workspaces |
| PWA | next-pwa or manual service worker |

### Domain Mapping

- `m3noover.com` → `/web` (marketing site, public)
- `m3noover.app` → `/app` (client portal, authenticated)

---

## Business Context

### Who Uses This Platform

**Parents (primary users of /app):**
- They are paying for their child's training
- They want to see what their kid is doing, when sessions are, and how much they owe
- They are NOT tech-savvy by default — the UX must be dead simple
- They care about: safety, transparency, value, communication
- Pain points with current setup: Venmo/CashApp feels informal, no invoices, no receipts, no schedule visibility

**Athletes (ages ~13-18):**
- They interact with Chuck in person, not through the app
- Their profiles exist in the system but they don't log in
- Future consideration: athlete-facing features (workout logs, goals) are a Phase 4+ idea

**Chuck (admin):**
- He is ONE person running the entire business
- Admin UX must be fast, mobile-friendly, and require minimal clicks
- He fills out session notes between training athletes — input forms must be quick
- He is not a developer — error messages should be human-readable
- He needs to: create invoices, view schedule, add session notes, see who's paid, manage athlete roster

### Revenue Model

- **Training packages** (recurring monthly via Stripe subscriptions):
  - M3 Foundation: 2x/week
  - M3 Competitor: 4x/week
  - M3 Elite: Unlimited sessions
- **Drop-in sessions** (one-time payments via Stripe Checkout)
- **Seasonal camps/clinics** (one-time, event-based pricing)
- **Small group sessions** (3-5 athletes, lower per-head rate)

### Competitive Context

Chuck operates in Temecula, CA — a suburb with a strong high school sports culture (Chaparral, Great Oak, Temecula Valley, Rancho Vista). His differentiators:
- Character development, not just physical training
- Parent transparency (they see what's happening)
- Professional structure (invoices, scheduling, communication) vs. the typical "meet me at the park" trainer
- 5+ years of earned reputation

---

## Technical Conventions

### Code Style

- TypeScript strict mode everywhere. No `any` types unless absolutely necessary and documented with a comment explaining why.
- Use named exports, not default exports (except for Next.js pages/layouts which require default).
- Colocate components with their pages when page-specific. Shared components go in `/packages/ui`.
- Use server components by default in Next.js. Add `'use client'` only when needed for interactivity.
- API routes in `/app/api/` — use Route Handlers (App Router pattern).
- Environment variables: prefix public ones with `NEXT_PUBLIC_`. Never expose secret keys to the client.

### File Naming

- Components: `PascalCase.tsx` (e.g., `HeroSection.tsx`, `InvoiceCard.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useAuth.ts`, `formatCurrency.ts`)
- Pages/routes: `kebab-case` directories per Next.js App Router conventions
- Types: `PascalCase` in dedicated `types.ts` files or colocated

### Component Patterns

- Shared UI components accept `className` prop for Tailwind overrides
- Use `cn()` utility (clsx + tailwind-merge) for conditional class merging
- Loading states: skeleton loaders, not spinners (feels more premium)
- Error states: friendly messages with retry actions, never raw error dumps
- Empty states: always designed — never just blank space. Include a CTA or helpful message.
- Add `data-testid` attributes on interactive elements and key content blocks

### Database Schema Principles (Supabase)

- Use Row Level Security (RLS) on every table — parents only see their own data, admin sees everything
- Timestamps: always include `created_at` and `updated_at`
- Soft delete where appropriate (athletes and families should never be hard-deleted)
- Store monetary values as integers (cents) — never floating point
- All dates/times in UTC, convert to Pacific Time in the UI

### Payment Integration (Stripe)

- Use Stripe Connect (Standard) so Chuck has his own Stripe dashboard
- Webhook-driven status updates — never poll for payment status
- Always validate webhook signatures
- Store Stripe customer ID and subscription ID in Supabase, but treat Stripe as the source of truth for payment state
- Test mode keys in development, live keys only in production env vars
- Never log or expose full card details, tokens, or secret keys

### PWA Requirements (/app)

- Must be installable on iOS and Android via "Add to Home Screen"
- Offline fallback page (branded, not browser default)
- App-like navigation (no browser chrome when installed)
- Push notification support via web push (service worker)
- Manifest with proper icons, theme color, background color matching the brand

---

## UX Principles

### For Parents

1. **Clarity over cleverness.** Label everything plainly. "Pay Invoice" not "Settle Balance."
2. **One-tap actions.** Pay an invoice, book a session, view schedule — each should be ≤2 taps from the dashboard.
3. **Trust signals everywhere.** Show receipt confirmations, booking confirmations, read receipts on messages. Parents need to feel like this is a legitimate, professional operation.
4. **No surprises.** Payment amounts, session times, cancellation policies — all visible and upfront before any action.

### For Chuck (Admin)

1. **Speed is king.** He's between sessions with athletes. Every admin action should be completable in under 60 seconds on a phone.
2. **Smart defaults.** Pre-fill session notes with date, athlete name, session type. Auto-suggest amounts based on package rates.
3. **Batch operations.** Send invoices to multiple families at once. Mark multiple sessions as completed.
4. **At-a-glance dashboard.** Revenue this month, upcoming sessions today, overdue invoices, new sign-ups — all visible without scrolling.

### General

- Page load targets: < 2 seconds on 4G
- No layout shift — reserve space for dynamic content
- Accessible: WCAG 2.1 AA minimum. Proper contrast on dark backgrounds, keyboard navigation, screen reader labels.
- Error recovery: never dead-end the user. Always provide a way back or a retry.

---

## Content & SEO (Website)

- Target keywords: "youth athletic training Temecula," "high school athlete training," "sports performance coach Temecula CA," "youth strength and conditioning"
- LocalBusiness structured data (schema.org) on every page
- Google Business Profile integration (link to it)
- Meta descriptions on every page — written for humans, not keyword-stuffed
- Open Graph and Twitter Card meta tags with branded preview images
- Sitemap.xml and robots.txt
- Fast: target Lighthouse scores of 90+ across Performance, Accessibility, Best Practices, SEO

---

## What NOT to Build

- **No chat/messaging system.** Chuck texts parents directly. Don't replicate that.
- **No video hosting.** If content is added later, embed from YouTube/Instagram.
- **No e-commerce store.** No merch, no digital products — just training services.
- **No complex role hierarchy.** Two roles only: parent and admin. No "assistant coach," no "athlete login" — keep it simple.
- **No social features.** No athlete leaderboards, no community forums, no comments. M3 is about in-person relationships, not social media.
- **No AI features.** No AI-generated workout plans, no chatbot. Chuck IS the product — the platform just supports him.

---

## Deployment & Environment

### Environment Variables Required

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App URLs
NEXT_PUBLIC_APP_URL=https://m3noover.app
NEXT_PUBLIC_WEB_URL=https://m3noover.com

# Optional
RESEND_API_KEY=           # for transactional emails
NEXT_PUBLIC_GA_ID=        # Google Analytics
```

### Deployment Targets

- `/web` → Vercel project → m3noover.com
- `/app` → Vercel project → m3noover.app
- Supabase → managed (no self-hosting)
- Stripe → managed (webhook URL must be set per environment)

### Branch Strategy

- `main` — production, auto-deploys to Vercel
- `dev` — development branch, preview deploys
- Feature branches off `dev`

---

## Reminders

- This platform exists to make Chuck look professional and make parents' lives easier. If a feature doesn't serve one of those two goals, don't build it.
- Chuck is a real person with a real reputation. The copy, the design, the UX — it all reflects on him. Treat it like you're building for a friend.
- Parents are trusting Chuck with their children. The platform must feel safe, legitimate, and transparent at every touchpoint.
- When in doubt, simpler is better. Chuck doesn't need features — he needs a tool that works.
