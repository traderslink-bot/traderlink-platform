# Trader Intelligence Normalized Analytics Conclusions Plan

**Date:** 2026-05-12
**Status:** Run 1 and first analytics UI slice implemented; coach/review/progress handoffs pending
**Primary route:** `/analytics`
**Related routes:** `/coach`, `/progress`, `/trades`, `/review`
**Primary modules:**

- `src/lib/trader-analytics/build-trader-analytics-report.ts`
- `src/lib/trader-analytics/types/trader-analytics-report.ts`
- `src/lib/trader-analytics/charts/build-trader-analytics-chart-data.ts`
- `src/lib/trader-analytics/product/trader-improvement.ts`
- `app/analytics/analytics-client.tsx`

## Purpose

This plan exists because raw totals can be true but still misleading when the
app turns them into "best" or "worst" feedback.

Example:

- a trader has 50 regular-hours trades and 10 pre-market trades,
- pre-market is down $1,000,
- most of that loss came from one oversized pre-market trade.

The raw total may correctly say pre-market lost the most dollars. That does not
automatically prove that pre-market is the trader's consistently worst time of
day. It may prove a different, more useful conclusion:

- one pre-market loss dominated the sample,
- pre-market needs review,
- position sizing or risk control failed in that session,
- there is not enough repeat evidence to tell the trader to avoid pre-market.

The product should preserve total P/L as useful evidence while adding normalized
context before making broad coaching claims.

## Current Implementation Finding

The current analytics report already stores some normalized bucket data:

- `tradeCount`
- `grossAverageRealizedPnl`
- `grossWinRate`
- winner, loser, and flat counts

However, the current `bestBucket(...)` and `worstBucket(...)` selection in
`build-trader-analytics-report.ts` ranks entry sessions and entry hours by
`grossTotalRealizedPnl`.

The route then surfaces this as:

- `P/L by Session`
- `Best entry session so far is ...`
- `Weakest entry session so far is ...`

This means the displayed chart can be acceptable as a total-dollar view, but the
plain-language conclusion can become too confident when a bucket is small or
outlier-dominated.

2026-05-12 implementation note:

- Run 1 is implemented for the timing read model. Entry-session, entry-hour,
  and held-session buckets now expose median P/L, absolute P/L movement,
  largest winner, largest loser, largest absolute trade, outlier share,
  sample-size label, and a normalized conclusion kind.
- The first analytics UI slice is implemented. `/analytics` now labels the
  session chart as `Total P/L by Session`, shows average and median in timing
  bucket cards, and includes an outlier check before treating timing data as a
  repeat pattern.
- Existing coach/session-time language no longer says `Best entry session` or
  `Weakest entry session`; it uses highest/lowest total-result language plus
  sample/outlier caveats.
- Remaining work: link driver trades from timing conclusions into analytics,
  coach, and review handoffs; then add progress follow-through once review data
  can show whether the timing issue was actually reviewed.

## Product Principle

Analytics should separate three different questions:

1. **Where did the most dollars come from or go?**
   This is total P/L.

2. **Where was the trader's average outcome worse or better?**
   This needs average P/L, median P/L, win rate, and possibly risk-normalized
   metrics when available.

3. **Where is there enough repeat evidence to make a confident coaching claim?**
   This needs sample size, outlier checks, and consistency checks.

The app should not collapse all three questions into one raw P/L ranking.

## User-Facing Rule

The app may say:

- "Pre-market has the largest total loss in this sample."
- "Most of the pre-market loss came from one trade, so review that trade before
  changing your whole session plan."
- "Pre-market has a weaker average outcome across enough trades."
- "This timing pattern is still a review prompt, not proof."

The app should avoid saying:

- "Pre-market is your worst time to trade."
- "Avoid pre-market."
- "Market open is your best session."

Unless the conclusion is backed by enough sample size, normalized performance,
and outlier checks.

## Metrics To Add Or Promote

For every timing/session bucket where the app may make a conclusion, compute or
surface:

- total P/L,
- trade count,
- average P/L per trade,
- median P/L per trade,
- win rate,
- largest winner,
- largest loser,
- largest absolute trade impact,
- largest trade share of bucket absolute P/L,
- driver trade reference for the largest winner, largest loser, and largest
  absolute trade,
- positive/negative consistency,
- sample-size label,
- outlier-dominated label.

When position-risk data is reliable enough, add a later risk-normalized view:

- P/L per share,
- P/L per dollar of entry cost,
- R-multiple or risk-normalized result if a defensible risk model exists.

Do not invent risk-normalized claims until the source data and contract are
clear.

## Interpretation Model

Each session/hour bucket should be classified before plain-language feedback is
written.

Suggested classification:

- `insufficient_sample`
  - Too few trades for a broad claim.
- `outlier_dominated_total`
  - Total P/L is heavily driven by one unusually large trade.
- `consistent_weakness`
  - Total, average, median, and win-rate evidence point in the same negative
    direction across enough trades.
- `consistent_strength`
  - Total, average, median, and win-rate evidence point in the same positive
    direction across enough trades.
- `mixed`
  - Metrics disagree or the bucket needs review rather than a conclusion.

Possible starting thresholds:

- fewer than 10 trades in the full report: global timing sample warning,
- fewer than 5 trades in a bucket: bucket-level review prompt only,
- fewer than 10 trades in a bucket: do not call the bucket a repeat pattern,
- weak win rate: below 40%,
- strong win rate: above 60%,
- largest absolute trade contributes more than 60% of the bucket's absolute
  movement: outlier-dominated. Calculate this as
  `abs(largestTradePnl) / sum(abs(eachTradePnl))`, not as a share of net P/L,
  because net winners and losers can offset each other,
- negative total plus negative average plus negative median plus weak win rate
  over a sufficient sample: consistent weakness,
- positive total plus positive average plus positive median plus strong win rate
  over a sufficient sample: consistent strength.

These thresholds should be implemented conservatively and adjusted only after
tests make the behavior clear.

## Route Product Shape

### `/analytics`

Keep `P/L by Session`, but clarify that it is a total-dollar chart.

Recommended wording:

- `Total P/L by Session`
- supporting text: "Shows where dollars were made or lost. Use average, win
  rate, and outlier notes before treating this as a timing pattern."

Add a compact companion summary near the timing section:

- strongest total-dollar session,
- weakest total-dollar session,
- average-per-trade leader/laggard,
- outlier note when one trade dominates a bucket,
- review link to the underlying saved trade.

Do not overload the first screen. This belongs in the Timing section unless the
timing issue becomes the top overall review priority.

### `/coach`

Coach should use normalized conclusions, not raw session totals alone.

If outlier-dominated:

- frame it as "review the largest loss" or "check risk control in this session,"
  not "stop trading this session."

If sample is small:

- frame it as a review prompt.

If consistent weakness is proven:

- frame one concrete review task for next session, such as checking whether
  size, entry timing, or exit control explains the pattern, then choosing one
  personal rule to test in review. Do not turn the statistical observation into
  direct trade advice.

### `/progress`

Progress should show whether the trader reviewed and followed through on the
timing issue. It should not imply that imported trade counts alone prove
improvement.

Possible future metric:

- "Timing review completed"
- "Largest timing loss reviewed"
- "Session-risk focus still open"

### `/review`

If a session bucket is outlier-dominated, the review queue should prioritize the
specific trade that drove the bucket rather than only showing the session label.

Example:

- "This trade explains most of the pre-market loss. Review whether the issue
  was timing, size, or exit control."

## Implementation Runs

### Run 1 - Read Model And Tests

1. Add bucket-level median, largest winner, largest loser, and outlier-share
   fields to the time-of-day read model.
2. Add driver trade references for largest winner, largest loser, and largest
   absolute trade so UI and coach handoffs can link to the trade behind the
   conclusion.
3. Add a small classification helper for timing bucket conclusions.
4. Keep total P/L ranking available, but do not let it be the only basis for
   broad "best/worst" language.
5. Add unit tests for:
   - one huge pre-market loser among otherwise mixed pre-market trades,
   - small pre-market sample versus larger regular-hours sample,
   - genuinely consistent weak session,
   - genuinely consistent strong session,
   - mixed bucket where total, median, or win-rate evidence disagree.
6. Update existing tests that assert old "Best entry session" wording so they
   protect the safer normalized timing language instead of freezing the stale
   copy.

### Run 2 - Analytics UI

1. Rename the chart title from `P/L by Session` to `Total P/L by Session`.
2. Show average P/L and win rate already available in the timing bucket cards.
3. Add median and outlier notes once the read model supports them.
4. Ensure the timing insight language says "largest total loss" or "review
   prompt" when confidence is limited.
5. Add focused Playwright/copy tests so the route does not make unsupported
   "worst time" claims.

### Run 3 - Coach And Review Handoffs

1. Update coach timing language to consume the new classification.
2. If the issue is outlier-dominated, link to the specific trade review.
3. If the issue is consistent across enough trades, keep a single next action.
4. Ensure `/review` can explain why a trade is in the queue when it is the
   largest driver of a timing bucket.

### Run 4 - Progress Follow-Through

1. Add follow-through language only after review data exists.
2. Avoid pretending imported trades alone prove improvement.
3. Show whether the trader has reviewed the timing risk or strength.

## Acceptance Criteria

A new trader should be able to understand:

- total P/L by session is a dollar summary,
- one large loss can dominate a bucket,
- a small sample is a review prompt, not proof,
- consistent repeated weakness is different from one bad trade,
- the app is telling them which trade or habit to review next.

The app should not:

- tell the user a session is "best" or "worst" based only on total P/L,
- hide the total P/L chart,
- weaken evidence gates,
- convert statistical observations into trading advice,
- imply a user should avoid a market session without enough evidence.

Advanced users should still be able to see:

- raw bucket totals,
- trade counts,
- averages,
- medians,
- win rates,
- outlier impact,
- linked trades behind the conclusion.

## Verification

Run focused unit coverage after read-model changes:

```powershell
npx vitest run src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts --reporter=dot --testTimeout=30000
```

Run broader product intelligence coverage if coach/review/progress language
changes:

```powershell
npx vitest run src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts --reporter=dot --testTimeout=30000
```

Run app checks:

```powershell
npx tsc --noEmit --pretty false
npm run build
```

Run focused Playwright if routes change:

```powershell
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|guided review workflow|progress and behavior|banned product claims"
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable|mobile usability"
```

## Stop Conditions

Stop and ask before implementation only if:

- the work needs a new persisted schema or migration,
- risk-normalized metrics require a new risk model,
- the app would need to reinterpret historical saved imports,
- a conclusion cannot be made from saved execution or chart evidence.

Do not stop merely because screenshots need review. Implement, verify, update
docs, and continue to the next safe slice.

## Relationship To Existing Plans

This plan extends:

- `src/docs/trader-intelligence-analytics-continuous-product-plan-2026-05-09.md`
- `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`
- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`

It does not replace the completed beginner-to-advanced route hierarchy, import
IA disclosure pass, analytics category-access pass, coach sequence, review
queue simplification, or constructive-management storylines.

The correct next implementation posture is:

1. keep existing analytics surfaces,
2. add normalized/statistical interpretation,
3. make user-facing conclusions more careful,
4. route the user to the trade or review task that explains the number.
