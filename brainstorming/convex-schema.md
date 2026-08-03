# LotoAI — Convex Database Schema Specification

## Executive Summary

Based on the strategic decisions documented in [`auth-and-fulfillment.md`](file:///Users/dnis/Officials/lotofai/brainstorming/auth-and-fulfillment.md) and [`checkout-flow-and-pricing.md`](file:///Users/dnis/Officials/lotofai/brainstorming/checkout-flow-and-pricing.md), **Clerk authentication is not required**.

Instead, LotoAI operates on a **guest checkout model**:
1. Stripe Checkout collects the customer's email automatically during payment.
2. The Stripe webhook (`checkout.session.completed`) triggers a Convex mutation.
3. Convex transactionally assigns an unassigned statistically-optimized combination from the current draw pool to the buyer's email.
4. Fulfillment is displayed on the success page (looked up via `stripeSessionId`) and sent via backup email.

This document details the complete Convex database structure supporting the **3 Romanian lottery games**:
- **Loto 6/49**: 6 numbers out of 1..49
- **Loto 5/40**: 5 numbers out of 1..40
- **Joker**: 5 main numbers out of 1..45 + 1 Joker number out of 1..20

---

## Game Specifications & Number Formats

| Game Type Identifier | Game Name | Main Numbers | Main Range | Special / Secondary Number | Special Range |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `"6_49"` | Loto 6/49 | 6 numbers | 1 – 49 | *None* | N/A |
| `"5_40"` | Loto 5/40 | 5 numbers | 1 – 40 | *None* | N/A |
| `"joker"` | Joker | 5 numbers | 1 – 45 | 1 Joker number | 1 – 20 |

---

## Core Database Tables

### 1. `draws`
Stores official historical draw results for each game type. Used by the analytics engine to compute frequency, gap, and co-occurrence statistics, as well as for displaying draw history on the frontend.

- **`gameType`**: `"6_49" | "5_40" | "joker"`
- **`drawDate`**: `string` (ISO date, e.g. `"2026-08-02"`)
- **`mainNumbers`**: `number[]` (sorted array of drawn main numbers)
- **`jokerNumber`**: `number | undefined` (1–20, for Joker only)
- **`jackpotAmount`**: `number | undefined` (in RON)
- **`prizeTiers`**: Array of tier results (winners count, payout per tier)
- **`createdAt`**: `number` (timestamp)

**Indexes:**
- `by_game_and_date` (`["gameType", "drawDate"]`)
- `by_game_and_created` (`["gameType", "createdAt"]`)

---

### 2. `combo_pools`
Tracks weekly pre-generated batches (pools) of statistically-optimized combinations for each game type and target draw.

- **`gameType`**: `"6_49" | "5_40" | "joker"`
- **`drawDate`**: `string` (target draw date, e.g. `"2026-08-06"`)
- **`weekIdentifier`**: `string` (e.g. `"2026-W32"`)
- **`totalCombos`**: `number` (total pre-generated count, e.g. 500)
- **`assignedCount`**: `number` (number of combinations handed out so far)
- **`status`**: `"active" | "exhausted" | "archived"`
- **`createdAt`**: `number` (timestamp)

**Indexes:**
- `by_game_and_draw` (`["gameType", "drawDate"]`)
- `by_game_and_week` (`["gameType", "weekIdentifier"]`)

---

### 3. `pool_combos`
Individual pre-generated, statistically-scored combinations inside a pool.

- **`poolId`**: `Id<"combo_pools">`
- **`gameType`**: `"6_49" | "5_40" | "joker"`
- **`mainNumbers`**: `number[]` (sorted array)
- **`jokerNumber`**: `number | undefined` (1–20 for Joker)
- **`score`**: `number | undefined` (popularity-avoidance / uniformity score)
- **`isAssigned`**: `boolean` (`false` initially; flipped to `true` on purchase)
- **`assignedToEmail`**: `string | undefined` (Stripe email of the buyer)
- **`assignedAt`**: `number | undefined` (timestamp)
- **`purchaseId`**: `Id<"purchases"> | undefined`

**Indexes:**
- `by_pool_and_status` (`["poolId", "isAssigned"]`)
- `by_game_and_email` (`["gameType", "assignedToEmail"]`)

---

### 4. `purchases`
Primary record of guest transactions. Keyed by the Stripe checkout session ID for secure, instant lookup on the post-checkout success page.

- **`stripeSessionId`**: `string` (unique ID from Stripe Checkout, e.g. `cs_test_...`)
- **`stripePaymentIntentId`**: `string | undefined`
- **`customerEmail`**: `string` (captured by Stripe during checkout)
- **`gameType`**: `"6_49" | "5_40" | "joker"`
- **`amountPaid`**: `number` (in RON / cents)
- **`currency`**: `string` (`"ron"`)
- **`status`**: `"paid" | "fulfilled" | "refunded" | "failed"`
- **`assignedComboId`**: `Id<"pool_combos">`
- **`deliveredNumbers`**: Object containing `{ mainNumbers: number[], jokerNumber?: number }`
- **`drawDate`**: `string` (target draw date for these numbers)
- **`emailSent`**: `boolean` (backup email delivery flag)
- **`createdAt`**: `number` (timestamp)

**Indexes:**
- `by_stripe_session` (`["stripeSessionId"]`)
- `by_email` (`["customerEmail"]`)
- `by_email_and_game_and_draw` (`["customerEmail", "gameType", "drawDate"]`)

---

### 5. `analysis_metrics`
Cached frequency, gap, and distribution metrics calculated from past draws. Used by the frontend statistics visualizer and the combo generation algorithm.

- **`gameType`**: `"6_49" | "5_40" | "joker"`
- **`lastUpdated`**: `number` (timestamp)
- **`hotNumbers`**: Array of `{ number: number, count: number }`
- **`gaps`**: Array of `{ number: number, drawsSinceLast: number }`
- **`popularityScores`**: Array of `{ number: number, score: number }`
- **`jokerStats`**: `{ hot: Array<{ number: number, count: number }>, gaps: Array<{ number: number, drawsSinceLast: number }> } | undefined`

**Indexes:**
- `by_game` (`["gameType"]`)

---

## Combo Assignment & Race Condition Workflow

Convex guarantees **ACID transactional mutations**. The combo assignment algorithm runs inside a single Convex mutation during the Stripe webhook execution:

```
[Stripe Webhook: checkout.session.completed]
                     │
                     ▼
        [Convex Mutation: assignCombo]
                     │
    ┌────────────────┴────────────────┐
    │ 1. Check existing purchases     │
    │    by (customerEmail, gameType, │
    │    drawDate) to prevent duplicate│
    │    combos for repeat buyers     │
    └────────────────┬────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │ 2. Query pool_combos index:     │
    │    by_pool_and_status           │
    │    (poolId, isAssigned = false) │
    │    Take first available combo   │
    └────────────────┬────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │ 3. Atomic Update:               │
    │    - Mark combo as isAssigned   │
    │    - Increment pool.assignedCount│
    │    - Create purchase record     │
    └─────────────────────────────────┘
```

---

## Complete `schema.ts` Implementation Code

Below is the ready-to-use TypeScript definition for Convex (`convex/schema.ts`):

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Supported Romanian Lottery Game Types
export const GAME_TYPES = v.union(
  v.literal("6_49"),
  v.literal("5_40"),
  v.literal("joker")
);

export default defineSchema({
  // 1. Official Historical Draw Results
  draws: defineTable({
    gameType: GAME_TYPES,
    drawDate: v.string(), // ISO format YYYY-MM-DD
    drawNumber: v.optional(v.number()),
    mainNumbers: v.array(v.number()),
    jokerNumber: v.optional(v.number()), // 1-20, Joker game only
    jackpotAmount: v.optional(v.number()), // in RON
    prizeTiers: v.optional(
      v.array(
        v.object({
          tier: v.string(),
          winnerCount: v.number(),
          payoutPerWinner: v.number(),
        })
      )
    ),
    createdAt: v.number(),
  })
    .index("by_game_and_date", ["gameType", "drawDate"])
    .index("by_game_and_created", ["gameType", "createdAt"]),

  // 2. Pre-generated Draw Pools
  combo_pools: defineTable({
    gameType: GAME_TYPES,
    drawDate: v.string(), // Target draw date
    weekIdentifier: v.string(), // e.g. "2026-W32"
    totalCombos: v.number(),
    assignedCount: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("exhausted"),
      v.literal("archived")
    ),
    createdAt: v.number(),
  })
    .index("by_game_and_draw", ["gameType", "drawDate"])
    .index("by_game_and_week", ["gameType", "weekIdentifier"]),

  // 3. Optimized Numbers Pool Combinations
  pool_combos: defineTable({
    poolId: v.id("combo_pools"),
    gameType: GAME_TYPES,
    mainNumbers: v.array(v.number()),
    jokerNumber: v.optional(v.number()),
    score: v.optional(v.number()), // Statistical optimization score
    isAssigned: v.boolean(),
    assignedToEmail: v.optional(v.string()),
    assignedAt: v.optional(v.number()),
    purchaseId: v.optional(v.id("purchases")),
  })
    .index("by_pool_and_status", ["poolId", "isAssigned"])
    .index("by_game_and_email", ["gameType", "assignedToEmail"]),

  // 4. Guest Customer Purchases & Fulfillment Records
  purchases: defineTable({
    stripeSessionId: v.string(), // Lookup key for Checkout success page
    stripePaymentIntentId: v.optional(v.string()),
    customerEmail: v.string(), // Captured automatically via Stripe Checkout
    gameType: GAME_TYPES,
    amountPaid: v.number(), // Value in cents / lowest unit
    currency: v.string(), // "ron"
    status: v.union(
      v.literal("paid"),
      v.literal("fulfilled"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    assignedComboId: v.id("pool_combos"),
    deliveredNumbers: v.object({
      mainNumbers: v.array(v.number()),
      jokerNumber: v.optional(v.number()),
    }),
    drawDate: v.string(),
    emailSent: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_stripe_session", ["stripeSessionId"])
    .index("by_email", ["customerEmail"])
    .index("by_email_and_game_and_draw", ["customerEmail", "gameType", "drawDate"]),

  // 5. Pre-calculated Statistical Metrics
  analysis_metrics: defineTable({
    gameType: GAME_TYPES,
    lastUpdated: v.number(),
    hotNumbers: v.array(
      v.object({
        number: v.number(),
        count: v.number(),
      })
    ),
    gaps: v.array(
      v.object({
        number: v.number(),
        drawsSinceLast: v.number(),
      })
    ),
    popularityScores: v.array(
      v.object({
        number: v.number(),
        score: v.number(),
      })
    ),
    jokerStats: v.optional(
      v.object({
        hot: v.array(v.object({ number: v.number(), count: v.number() })),
        gaps: v.array(
          v.object({ number: v.number(), drawsSinceLast: v.number() })
        ),
      })
    ),
  }).index("by_game", ["gameType"]),
});
```
