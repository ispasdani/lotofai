# LotoAI — Checkout Flow & Pricing Brainstorm (2026-07-26)

## Context

Follow-up to [product-strategy.md](product-strategy.md) and
[auth-and-fulfillment.md](auth-and-fulfillment.md). This session confirmed
the end-to-end user flow and closed one of the open decisions from the
auth/fulfillment doc (single combo vs. pool).

## User's proposed flow (confirmed as correct)

Users land on the site, no login required. They pick a paid option, go
through payment, and get redirected to a page showing their combination of
numbers ("lucky numbers"). They can leave and come back to pay again later.
This matches the guest-checkout recommendation already made in
auth-and-fulfillment.md — no changes needed there, just confirming it's the
right shape for an impulse-buy product.

## Pricing model — decided

**Single fixed price, one combo per purchase.** Simplest possible flow: one
price, one CTA, one result. Rejected alternatives, for reference:

- Tiered quantity (pay more for more combos) — more complex UI/logic, not
  needed for a v1.
- One-time vs. subscription (auto-delivery every draw) — would require
  tracking recurring billing/identity over time; deferred, not ruled out for
  later.

## Repeat-purchase mechanics — decided

Adopting **Option B** from auth-and-fulfillment.md: a weekly pool of N
distinct statistically-optimized combos, not one combo shared by everyone.
Each purchase (keyed by the email Stripe collects) draws the next unused
combo from that week's pool. This is what makes "pay again" work as an
actual product loop instead of selling the same numbers twice — with ~14M
possible 6/49 combinations, generating hundreds of distinct optimized picks
per week costs nothing in quality.

## End-to-end architecture

1. **Weekly cron job** (analysis engine) — computes frequency, gap,
   co-occurrence, and popularity-avoidance stats from `dataset/`, generates
   that week's pool of N combos, stores them in Convex tagged by week.
2. **Landing page** — one price, one CTA, no login.
3. **Stripe Checkout** — collects email as part of payment, no separate auth.
4. **Webhook** (`checkout.session.completed`) — Convex mutation assigns the
   next unused combo from the current week's pool to the buyer's email,
   transactionally (so concurrent purchases can't collide on the same
   combo). Stores the purchase record keyed by the Stripe session ID.
5. **Success page** — looked up by Stripe session ID, reveals the 6 numbers
   immediately after payment confirms.
6. **Email** — same combo sent as backup delivery / receipt.
7. User can return and pay again anytime — new purchase, new combo (from
   that week's pool, or next week's once it rolls over), still no account.

## Framing / copy note (carried over from product-strategy.md)

Draws are truly random — no analysis of past draws predicts the next one,
regardless of dataset size. The one mathematically defensible lever is
jackpot-splitting: picking statistically unpopular-but-uniform combos so
that *if* the user wins, they're less likely to split the jackpot with other
winners. Landing/results page copy should stick to something like
"AI-optimized picks" or plain "lucky numbers" rather than "AI predicts your
winning numbers" — the latter is a false claim about a random process and
carries real legal exposure (Romanian consumer-protection / gambling-ad
rules) once money is changing hands.

## Open threads / next steps (not started)

- Decide pool size N (how many distinct combos to pre-generate per week —
  affects how many repeat purchases a heavy user can make before that
  week's pool runs out).
- Decide price point (RON).
- Design the Convex schema: weekly combo pool, purchase records keyed by
  Stripe session ID, combo assignment per email/week.
- Build the stats/combo-generation logic (frequency, popularity-avoidance
  scoring) from `dataset/`.
- Build the Stripe Checkout + webhook + success page flow.
- Draft final landing/results page copy consistent with the framing note
  above.
- Minimal privacy policy / data retention approach for storing buyer emails
  (GDPR, per auth-and-fulfillment.md).
