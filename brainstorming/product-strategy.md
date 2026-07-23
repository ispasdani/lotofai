# LotoAI — Product Brainstorm (2026-07-23)

## Context

LotoAI is a web app focused on the Romanian 6/49 lottery. The idea: use AI to
analyze historical draw data and sell users a "best" 6-number combination for
a small fee.

## Dataset

Location: `dataset/`

- `loto_6_49_2025.json` — 101 draws (2025-01-05 to 2025-12-31)
- `loto_6_49_2026.json` — 32 draws (2026-01-04 to 2026-04-26)
- 133 draws total, twice-weekly cadence (Wed/Sun)

Each record contains: draw date, weekday, the 6 drawn numbers, and prize-tier
data (categoria_i–iv: winner counts, payout values, jackpot rollover/"report").

## The core statistical reality (must not be glossed over)

Loto 6/49 draws are independent, uniformly random samples without replacement
from 1–49 (assuming the official draw mechanism is fair, which is a safe
assumption for a regulated national lottery). This means:

- No pattern in past draws carries predictive information about the next
  draw. This holds true regardless of dataset size — it's not a "need more
  data" problem, it's a property of a fair random process.
- Any ML model trained on the 133 available draws to "predict" winning
  numbers will not beat random guessing. Any backtest suggesting otherwise is
  almost certainly overfitting on noise — 133 rows is a very small sample to
  begin with.
- Marketing this as "AI predicts numbers more likely to win" is a false claim
  about a well-understood random process. That carries real legal/compliance
  risk in Romania (ANPC consumer protection, advertising rules around games
  of chance) — not something to be decided without proper legal review, but
  worth flagging before monetizing.

## The one legitimate lever: jackpot-splitting, not win probability

You cannot improve odds of *winning*. You can potentially improve **expected
payout conditional on winning**, because the jackpot is split among all
winners of that draw. Players systematically over-pick certain numbers
(birthdays → 1–31 over-selected, lucky numbers, arithmetic sequences, copying
recent draw results). A combination that is statistically "unpopular" but
still uniformly random doesn't change win probability, but if it wins, it's
less likely to be shared — raising expected value.

This is the one feature that is mathematically defensible and real.

## What's legitimately buildable from this data

- **Frequency analysis** — how often each number has appeared ("hot" numbers)
- **Gap / "overdue" analysis** — draws since a number last appeared
  (statistically meaningless for prediction, but a classic, popular
  lottery-enthusiast feature)
- **Pair/triplet co-occurrence** analysis
- **Sum, parity (odd/even), low/high distribution** of historical draws — can
  be used to generate combos that statistically resemble typical winning
  draws
- **Popularity-avoidance scoring** — estimate which numbers/combos are
  over-picked by the public (birthdays, patterns) to optimize for the
  jackpot-splitting lever above
- **Transparent backtesting/simulator** — showing real ROI (will honestly
  land at break-even-minus-house-edge), useful as a trust-building feature
  rather than a sales pitch

## Data size reality

133 draws is small. Enough for basic frequency/gap descriptive stats, but not
enough to train any meaningful ML model — and there's no real signal to learn
in the first place, regardless of sample size.

## Positioning options discussed

### 1. Honest entertainment/stats framing (leaning favorite)

Sell as statistical insights + jackpot-split optimization, not prediction.

- **Pros**: defensible against consumer-protection scrutiny, doesn't collapse
  under basic scrutiny, sustainable long-term, can actually deliver on the
  jackpot-optimization feature.
- **Cons**: weaker sales pitch than a predictive claim; "helps you avoid
  splitting the jackpot if you win" is a harder sell than "our AI picks your
  winning numbers."
- In practice: real computed stats, explicit copy that this doesn't change
  win odds, backtest data shown openly to build trust.

### 2. "AI-powered predictions" framing

Claim the AI finds numbers more likely to win.

- **Pros**: much stronger, more intuitive sales pitch; matches what most
  existing lottery-prediction apps/channels already do, so there's proven
  market demand for the framing.
- **Cons**: provably false claim about a random process; once money changes
  hands this shifts from "harmless fun" toward paid deception, with
  associated legal (ANPC / gambling-ad rules), chargeback, and reputational
  risk.

### 3. Middle ground (other option worth exploring)

Keep "AI" branding, drop the *predictive* claim. The AI is real — it computes
popularity-avoidance scores and distribution-matching — it's just optimizing
for expected value given jackpot-sharing dynamics, not for win probability.
"AI-optimized picks," not "AI-predicted numbers." Gets most of the marketing
appeal of "AI" without the false claim underneath it.

No final decision made yet — to be continued.

## Open threads / next steps (not started)

- Decide on final positioning (honest / middle-ground / other)
- Design the analysis/stats engine (what metrics feed the combo generator)
- Plan full product architecture (data pipeline, backend, payment flow,
  frontend)
- Pricing/monetization mechanics
