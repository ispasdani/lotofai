# LotoAI — Auth & Fulfillment Brainstorm

## Question

Usual stack is Next.js, Convex, Clerk, Stripe. Does it make sense to build a
full authentication system, or can the user just pay and receive one of the
potential best combinations without signing in?

## Recommendation: guest checkout, no mandatory auth

This is an impulse-buy product (pay a small fee, get a number), so forcing
account creation is exactly the kind of friction that kills conversion.

**Flow**: use Stripe Checkout (collects email automatically, no login
required), generate/select the combination server-side after payment
confirms (via webhook), and deliver it via the Checkout success page (looked
up by session ID) plus an email as backup. Store the purchase in Convex keyed
by the Stripe session/payment-intent ID — no Clerk user required. This gives
fulfillment, refund lookup, and analytics without touching auth at all.

**Where Clerk would still earn its place**: only if a repeat-customer
feature set is wanted later — saved purchase history, "get a new number
every draw" subscriptions, a dashboard of past picks. Those need a
persistent identity to attach billing/history to. If that's wanted
eventually, the clean path is to make Clerk *optional* — offer "save your
numbers" as a post-purchase upsell with passwordless/social sign-in, rather
than gating the purchase behind it.

## Follow-up question: preventing repeat buyers from getting the same numbers

Since "the best combination" is meant to rotate weekly, how do we avoid
giving a returning customer (who pays again) the same numbers, without a
full account system?

**Answer: use the email captured by Stripe Checkout as the identifier.** No
separate auth needed — Stripe collects the email as part of payment
regardless of login state.

The design hinges on one decision: is "this week's best combination" a
**single combo shared by everyone**, or **a pool of distinct optimized
combos** handed out one at a time?

### Option A — Single shared combo per week

Everyone who pays this week gets the same 6 numbers. A repeat buyer in the
same week would get an identical result, which is awkward to sell twice. The
email record would mainly be used to detect the repeat and either block the
second purchase, discount it, or upsell into a different product (e.g. next
week's pick early, or a bonus combo).

### Option B — Pool of distinct combos per week (recommended)

Each week, generate a batch of N statistically-optimized combos (passing the
popularity-avoidance / distribution-matching criteria discussed previously).
Each purchase draws one unassigned combo from that week's pool for that
email. Loto 6/49 has ~14M possible combinations, so there's no real
constraint — hundreds of distinct "optimized" picks can be generated per
week without any drop in quality.

### Mechanics (Convex + Stripe, no Clerk)

1. A weekly job generates the pool of optimized combos and stores it in
   Convex, tagged by week.
2. Stripe Checkout collects the buyer's email as part of payment — no
   separate form needed.
3. On the `checkout.session.completed` webhook, a Convex mutation checks
   whether this email already has a combo assigned for the current week:
   - if yes, assigns the next unused one from the pool (transactionally, so
     concurrent purchases can't collide on the same combo)
   - if no, assigns a fresh one
4. Result is shown on the success page and emailed as backup.

### Compliance note

Storing email ties a purchase to a real person, which pulls in GDPR
obligations (Romania is EU) — needs a privacy policy, a lawful basis
(contract fulfillment covers this), and a retention/deletion policy, even
without a full account system. Small addition, not a blocker.

## Open threads / next steps (not started)

- Decide between Option A (single shared weekly combo) and Option B (weekly
  pool of distinct combos)
- Design the weekly-pool generation logic in detail
- Design the Convex schema for tracking combo assignments per email/week
- Draft the minimal privacy policy / data retention approach for storing
  buyer emails
