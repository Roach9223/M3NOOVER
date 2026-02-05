# M3NOOVER — Claude Code Build Prompts

## 🏗️ Build Order (Do These In Sequence)

**Phase 1:** Project scaffold + website → get m3noover.com live fast
**Phase 2:** App foundation (PWA) + auth + Stripe
**Phase 3:** Scheduling, athlete tracking, notifications

---

## PHASE 1 — Website (m3noover.com)

### Prompt 1A: Project Init

Copy/paste this into Claude Code as your first prompt:

```
Create a monorepo project called "m3noover" with the following structure:

/m3noover
  /web         → Next.js 14 (App Router) — marketing website for m3noover.com
  /app         → Next.js 14 (App Router) PWA — client portal for m3noover.app
  /shared      → shared types, utils, brand constants (colors, fonts, copy)
  /packages
    /ui        → shared UI component library (buttons, cards, etc.)
  package.json → workspace root (use pnpm workspaces)

Tech stack:
- Next.js 14 with App Router and TypeScript
- Tailwind CSS 4 for styling
- Framer Motion for animations
- pnpm workspaces for monorepo management

For the /shared package, create a brand.ts file with these brand constants:
- Brand name: "M3NOOVER" / "M3FIT"
- Tagline: "Building Strong Bodies, Disciplined Minds, and Confident Athletes."
- Pillars: Mindset. Movement. Mastery.
- Primary color palette: dark/athletic theme — blacks, deep charcoal, with an accent color (electric blue or bold orange — your call, but make it feel premium and athletic, not generic)
- Font pairing suggestion: bold sans-serif for headings, clean sans for body

Initialize the project with proper tsconfig, eslint, and .gitignore. Don't build any pages yet — just the scaffold.
```

### Prompt 1B: Website Pages

```
Now build the marketing website in /web for m3noover.com. This is a personal training / athletic coaching site for a coach named Chuck who has trained high school athletes in Temecula, CA for 5+ years. He trains at Self Made Training Facility.

Build these pages:

1. **Homepage (/)** — Hero section with bold headline using the M3 tagline, the three pillars (Mindset, Movement, Mastery) as a feature section, a brief "Why M3" value prop section, and a CTA to download the app / contact. Should feel powerful, athletic, premium. Not corporate.

2. **About (/about)** — Coach Chuck's story. Use this copy as the foundation (rewrite for web):
   - Started training in parks and commercial gyms
   - Earned certifications, coached boot camps, trained youth athletes
   - Ran an entire gym due to short staffing
   - Now coaches independently at Self Made Training Facility
   - Works with youth athletes, student athletes, and adults
   - Philosophy: honesty over hype, effort over excuses, progress over perfection
   - High standards with real empathy — pushes athletes but also protects them

3. **Programs (/programs)** — Sections for:
   - Youth & Student Athlete Development
   - Small Group Training (3-5 athletes)
   - 1-on-1 Personal Training
   - Seasonal Camps & Clinics (pre-season prep)
   Each program card should have a brief description and a CTA to "Get Started" (links to app)

4. **For Parents (/parents)** — Dedicated page addressing parent concerns:
   - Clear scheduling and payment structure
   - Open communication
   - Age-appropriate programming
   - Emphasis on safety and fundamentals
   - "Your child won't just get a workout — they'll get structure, discipline, and mentorship."

5. **Contact (/contact)** — Simple contact form (name, email, phone, message), location info (Temecula, CA — Self Made Training Facility), social media links (placeholders for now)

Global components:
- Navigation bar with logo (text-based "M3" for now), page links, and a "Download App" CTA button
- Footer with links, social placeholders, and "© 2025 M3NOOVER"
- Mobile responsive — everything must look great on phones first

Use placeholder images for now. Add data-testid attributes on key elements. Use the brand constants from /shared.

Make it feel like a premium athlete brand — think Nike Training, not a generic gym website. Dark theme, bold typography, strong visual hierarchy.
```

### Prompt 1C: Polish & Animations

```
Add polish to the /web marketing site:

1. Smooth scroll-triggered animations on sections using Framer Motion (fade up on scroll, stagger children)
2. Hero section: subtle gradient animation or particle effect in the background
3. Hover effects on program cards (slight scale + shadow lift)
4. Mobile hamburger menu with slide-in animation
5. Page transition animations between routes
6. Add a "Testimonials" section to the homepage — use 3-4 placeholder testimonials with names, sport, and quote. Style as cards.
7. Add an Instagram feed placeholder section on homepage (grid of 6 image placeholders) with text "Follow @m3noover"
8. Optimize all images with next/image, add proper meta tags, Open Graph tags for social sharing
9. Add a favicon (generate a simple "M3" text favicon)

Keep performance in mind — lazy load below-fold content, minimize layout shift.
```

---

## PHASE 2 — App / Client Portal (m3noover.app)

### Prompt 2A: PWA Setup + Auth

```
Now build the client portal PWA in /app for m3noover.app.

This is a Progressive Web App that parents download to manage their child's training with Coach Chuck. It should be installable from the browser (add to home screen) on both iOS and Android.

Setup:
1. Configure as a PWA with next-pwa or manual service worker
2. Add web app manifest with M3 branding, icons, splash screens
3. Theme color matching the brand

Authentication:
- Use Supabase Auth (email + password, Google OAuth)
- Two user roles: "parent" and "admin" (Chuck)
- Parent sign-up flow: name, email, phone, athlete name(s), sport(s), age
- Admin dashboard is separate from parent view
- Protect all routes behind auth — redirect to /login if not authenticated

Build these pages:
1. **/login** — clean login page with M3 branding
2. **/register** — parent registration with athlete info
3. **/dashboard** — parent dashboard (placeholder cards for now):
   - Upcoming sessions
   - Recent invoices / payment status
   - Athlete profile summary
4. **/admin** — admin dashboard (Chuck's view, placeholder):
   - Client list
   - Create invoice
   - Schedule overview
   - Revenue summary

Use the shared UI components and brand constants from /shared and /packages/ui.
```

### Prompt 2B: Stripe Payments & Invoicing

```
Integrate Stripe into the /app PWA for invoicing and payments.

Requirements:
1. **Admin (Chuck) can create invoices:**
   - Select client (parent)
   - Add line items (session type, quantity, rate)
   - Set due date
   - Send invoice (triggers email notification via Supabase or Resend)
   - Support for recurring invoices (monthly training packages)

2. **Parent payment flow:**
   - Parent sees invoices on their dashboard with status (pending, paid, overdue)
   - Click "Pay Now" → Stripe Checkout or embedded payment form
   - Support card payments
   - Payment confirmation + receipt

3. **Stripe setup:**
   - Use Stripe Connect in Standard mode (Chuck gets his own Stripe dashboard)
   - API routes in /app/api/ for creating checkout sessions, webhook handling
   - Webhook endpoint to update invoice status on successful payment
   - Store invoice data in Supabase

4. **Package/subscription support:**
   - Predefined packages: 
     - M3 Foundation: 2x/week — $XXX/month
     - M3 Competitor: 4x/week — $XXX/month  
     - M3 Elite: Unlimited — $XXX/month
     - Drop-in Single Session: $XX
   - Parents can subscribe to a package (Stripe recurring billing)
   - Admin can see active subscriptions

Build the Stripe integration with test mode keys. Create a .env.example with all required env vars documented.
```

### Prompt 2C: Scheduling System

```
Add a scheduling system to the /app PWA.

Requirements:
1. **Admin (Chuck) sets availability:**
   - Weekly recurring time slots (e.g., Mon/Wed/Fri 3-7pm)
   - Block off dates (holidays, personal time)
   - Set session duration options (30min, 45min, 60min)
   - Set max athletes per time slot (for group sessions)

2. **Parent booking flow:**
   - Calendar view showing available slots
   - Book a session → select date, time, session type
   - Confirmation with details
   - Cancel/reschedule (with configurable cancellation policy, e.g., 24hr notice)

3. **Notifications:**
   - Email confirmation on booking
   - Reminder 24 hours before session (email)
   - Push notification support (web push via service worker)
   - Cancellation notifications

4. **Admin schedule view:**
   - Daily/weekly calendar view of all booked sessions
   - See which athletes are booked
   - Quick actions: cancel, reschedule, mark as completed

Store scheduling data in Supabase. Use a calendar component library (react-big-calendar or similar). Time zone: Pacific Time (Temecula, CA).
```

---

## PHASE 3 — Athlete Tracking & Extras

### Prompt 3A: Athlete Profiles & Progress

```
Add athlete tracking to the /app PWA.

1. **Athlete profiles (parent view):**
   - Name, age, sport(s), school
   - Training history (sessions attended, dates)
   - Session notes from coach (read-only for parents)
   - Attendance streak / consistency tracker

2. **Admin athlete management:**
   - After each session, Chuck can add notes:
     - What they worked on
     - Progress observations
     - Areas to focus on
   - Quick rating system (effort: 1-5 stars)
   - Flag athletes who need attention

3. **Parent transparency dashboard:**
   - "What my athlete is working on" summary
   - Session attendance calendar (visual heatmap style)
   - Coach's notes feed (most recent first)

This is a KEY differentiator for M3 — parents see exactly what they're paying for. Make it clean and easy for Chuck to fill out quickly between sessions (mobile-optimized input).
```

### Prompt 3B: Final Polish

```
Final polish pass on the entire project:

1. **Error handling:** proper error boundaries, loading states, toast notifications
2. **SEO for /web:** sitemap.xml, robots.txt, structured data (LocalBusiness schema for Temecula)
3. **Performance:** Lighthouse audit, fix any issues, target 90+ on all metrics
4. **Accessibility:** ARIA labels, keyboard navigation, color contrast
5. **README.md:** setup instructions, env vars needed, deployment guide
6. **Deployment config:**
   - /web → Vercel (m3noover.com)
   - /app → Vercel (m3noover.app)
   - Environment variable documentation
7. **Testing:** add basic tests for critical flows (auth, payment, booking)
```

---

## 💡 Tips for Using These Prompts

1. **Run each prompt one at a time.** Let Claude Code finish and verify before moving on.
2. **Test between phases.** Run `pnpm dev` and check the site after each prompt.
3. **You'll need accounts for:**
   - Supabase (free tier works) → database + auth
   - Stripe (test mode) → payments
   - Vercel (free tier) → hosting
   - A domain registrar → point m3noover.com and m3noover.app
4. **Customize as you go.** These prompts are starting points — tell Claude Code to adjust colors, copy, layout as you see fit.
5. **For images:** Once you have real photos of Chuck training athletes, replace the placeholders. High-quality action shots make a HUGE difference.

---

## 📋 Env Variables You'll Need

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe  
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://m3noover.app
NEXT_PUBLIC_WEB_URL=https://m3noover.com
```

---

## 🚀 Deployment Checklist

- [ ] Supabase project created, tables migrated
- [ ] Stripe account created, test keys added
- [ ] Vercel projects created for /web and /app
- [ ] Custom domains configured (m3noover.com → /web, m3noover.app → /app)
- [ ] Environment variables set in Vercel
- [ ] Stripe webhooks pointed to production URL
- [ ] SSL certificates active on both domains
- [ ] PWA manifest and icons verified
- [ ] Test full flow: register → book → pay → confirm
