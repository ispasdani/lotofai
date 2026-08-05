# LotoAI — Next.js App Structure & Routing (2026-08-05)

## Context

Follow-up to [product-strategy.md](product-strategy.md), [auth-and-fulfillment.md](auth-and-fulfillment.md), and [checkout-flow-and-pricing.md](checkout-flow-and-pricing.md). This document defines the recommended Next.js App Router folder structure and page hierarchy for a guest-checkout, auth-less (no Clerk) application built with Convex and Stripe.

## Architecture Overview

Since mandatory authentication (Clerk) is omitted for v1, the app avoids complex protected route guards or `(dashboard)` route groups. Instead, the page layout is split into:

1. Public marketing / SEO pages (`(marketing)` route group).
2. Post-checkout fulfillment route (`/bilet/[sessionId]`).
3. Stripe Webhook handler (`/api/webhooks/stripe`).

## Recommended Directory Layout

```text
app/
├── (marketing)/                   # Public pages sharing Header, Nav & Footer
│   ├── page.tsx                   # Main Landing Page (Hero, Value Prop, One-click CTA)
│   ├── statistici/                # Free public stats & frequency analysis (SEO Magnet)
│   │   └── page.tsx
│   ├── cum-functioneaza/          # "How it Works" & Jackpot-Split explanation
│   │   └── page.tsx
│   ├── termeni/                   # Terms & Conditions (ANPC / Consumer disclaimers)
│   │   └── page.tsx
│   └── confidentialitate/         # GDPR Privacy Policy (for buyer emails collected by Stripe)
│       └── page.tsx
│
├── bilet/                         # Post-checkout fulfillment route
│   └── [sessionId]/               # /bilet/cs_live_123 (Keyed by Stripe Session ID)
│       └── page.tsx               # Fetches & reveals numbers from Convex
│
├── api/                           # Server-side API endpoints
│   └── webhooks/
│       └── stripe/
│           └── route.ts           # Listens for `checkout.session.completed`
│
├── layout.tsx                     # Root layout (Fonts, ConvexProvider, Meta tags)
├── globals.css                    # Design system / tokens
└── sitemap.ts                     # SEO sitemap
```

## Key Architectural Decisions

### 1. Dedicated Fulfillment Route (`/bilet/[sessionId]`)
- Placing post-checkout fulfillment under `/bilet/[sessionId]` (e.g. `/bilet/cs_live_123`) allows buyers to bookmark their page or return via an email receipt link.
- `bilet/[sessionId]/page.tsx` queries Convex directly using `getByStripeSession({ sessionId })`.
- No login or session cookies required; authorization is implicit based on possessing the unique Stripe Session ID.

### 2. Public Stats & Educational Pages (`/statistici` & `/cum-functioneaza`)
- Serves as an organic SEO magnet for Romanian lottery queries (*"statistici loto 6/49"*, *"numere frecvente loto 6/49"*).
- Establishes transparency and trust by presenting real historical distribution data and explaining the jackpot-splitting expected value model.

### 3. Route Group `(marketing)`
- Grouping public marketing pages under `(marketing)` ensures a shared layout (Navigation header, footer, CTA links) without polluting the URL structure.

### 4. Lean Server-Side Footprint
- Convex manages database state, mutations, and backend logic.
- Next.js API routes are minimized strictly to `/api/webhooks/stripe/route.ts` for handling asynchronous Stripe payment events.
