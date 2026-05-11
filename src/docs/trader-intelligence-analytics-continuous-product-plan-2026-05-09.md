# Trader Intelligence Analytics Continuous Product Plan

**Date:** 2026-05-09
**Status:** Follow-up feature plan
**Primary route:** `/analytics`

## Purpose

This plan captures analytics-specific work for the post-hardening product
presentation batch. The detection/language plan remains the evidence-gating
reference for any new behavior claim. The coaching plan taught the main product
rule:

> A page should not dump data. It should help the trader understand one question,
> see the evidence, and know what to do next.

For `/analytics`, that means the route should feel like a trader-facing report
and chart workspace, not a long wall of metrics.

Analytics must organize the two evidence channels described in:

- `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`

The report should make it obvious when a chart or metric is based on execution
evidence only and when it includes chart/levels market context.

## Product Goal

`/analytics` should help a trader answer:

1. How did all saved trades perform?
2. Where did I make or lose the most money?
3. Which behavior repeated?
4. Which strength repeated?
5. Which session, hour, symbol, or ticker story needs review?
6. Which trades are behind this number?
7. What should I review next?

Analytics should support coaching, not replace it. It should point the user
toward a review, a trade replay, or a progress focus.

## Current Known Direction

The page already improved from the older black-card dashboard and now uses saved
import data. It still needs a deeper report pass:

- lower-page sections can still feel sloppy or equally weighted,
- charts need clearer grouping and section navigation,
- combined saved-trade analytics should be obvious before individual trade
  details,
- every chart should explain what it means and link to the trades behind it,
- metrics should avoid raw diagnostic language,
- red and green should carry normal trader meaning: loss/risk vs gain/strength.

2026-05-10 implementation note:

- The first report-navigation and screenshot-guided polish pass is complete.
- The certified behavior report grouping is complete and now lives in shared
  `app/behavior-report-panel.tsx`, so `/analytics` and `/coach` render the
  same grouped market-context evidence instead of maintaining separate route
  presentations.
- User QA found that the `/coach` reuse looks too similar to analytics. Keep
  `/analytics` as the broad grouped report surface; coach should transform the
  shared data into a guided coaching sequence in its own plan.
- Do not rebuild the completed top report, analytics menu, outcome/timing/
  behavior chart grouping, ticker/session-story counters, or shared red/green
  chart components. Do not rebuild the seven behavior-report groups unless QA
  finds a concrete grouping, copy, or density regression.
- The next analytics work should focus on deeper trade-explorer/report-plan
  refinement, better drill-down handoffs, or route copy found by QA. Any new
  market-context metric still needs saved evidence and the detection/language
  gate.

## Product Rules

- Saved import data comes first.
- Sample/mock analytics can appear only when no saved data exists and must be
  clearly labeled.
- User-facing behavior names, chart warnings/counts, drill-down labels, and
  metric explanations must use certified detections from the shared
  fail-closed behavior mapper.
- Unknown, unmapped, or uncertified behavior can be shown only as a neutral
  review prompt or excluded from the primary report.
- Visible collapsed advanced-section headings and summaries count as normal UI
  and must use trader-readable language.
- Keep round trips and ticker stories separate:
  - round trips are accounting units,
  - ticker stories explain same-symbol re-entry behavior.
- Do not claim candle, volume, support/resistance, or market-structure
  conclusions unless saved evidence supports them.
- Do not show raw report JSON, fixture labels, debug wording, storage internals,
  pattern IDs, scoring traces, or diagnostic route names in the normal UI.
- Do not add financial advice, trade calls, signals, guaranteed-profit claims,
  or short-seller coaching language.

## Target Page Shape

The first screen should include:

- total gross result,
- win/loss/flat mix,
- best trade and worst trade,
- largest repeated risk,
- strongest repeated behavior,
- next trade or ticker story to review.

The main report should then split into clear sections:

1. Outcome
   - P/L by trade
   - win/loss mix
   - best and worst trades
2. Timing
   - P/L by session
   - P/L by entry hour
   - trades by session/hour
3. Behavior
   - execution habits to review
   - strengths to repeat
   - behavior cost/count
4. Ticker Stories
   - same-symbol re-entry stories
   - giveback/additional-profit evidence
   - open or swing/overnight exposure
5. Drill-Down
   - trades behind a chart bar or metric
   - links to trade replay and review writing flow
6. Advanced Context
   - chart context waiting/available
   - storage/import/readiness details collapsed or admin-only

Market-context analytics should be separate from execution-only analytics until
the evidence is attached. A chart can say "execution-only" confidently, but it
must not imply support/resistance, candle, volume, or post-exit continuation
without the market context channel.

## Behavior Language And Self-Coaching Direction

Analytics is where the trader should be able to study their own data and see
patterns without needing the coach to narrate every point.

Before adding new analytics behavior charts, work from:

- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`

Use
`src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`
as the language source of truth.

Analytics should not present uncertified detections as firm conclusions.
If a behavior is not certified, show it as a review prompt or keep it out of the
primary report until the detection contract and tests exist.

The default analytics UI should translate behavior detections into plain trader
questions:

- Did winners turn into losers?
- Did open profit get protected or given back?
- Did scale-outs reduce risk or leave too much exposure?
- Did early exits leave major continuation behind?
- Did later re-entries give back earlier profit?
- Did the trader overtrade one symbol?
- Did the trader overtrade the whole session?
- Did entries happen near support, near resistance, or after the move was
  already stretched?
- Did volume fade during later attempts?
- Which behaviors protected profit or contained risk well?
- Which exits were strong because the chart faded afterward?
- Which trades should be repeated because execution and chart context both
  supported the decision?

Avoid internal labels such as "failed premise", "dominant family",
"normalization", "suppressed behavior", "pattern ID", or raw scoring language.
If the user asks how a number was detected, show a collapsed explanation with
the evidence source.

Analytics can be more detailed than coach, but it should still be human:

- chart first,
- plain explanation second,
- trades behind the number third,
- advanced detection detail collapsed.

## Visual Direction

- Use a light app surface with restrained dark accents.
- Use red for losing P/L, risk, giveback, or problem behavior.
- Use green for profitable P/L, strengths, protected profit, or repeatable
  behavior.
- Use amber for caution or incomplete review.
- Use blue/neutral for navigation, context, or unavailable evidence.
- Avoid long equal-weight card grids.
- Use a left-side or section navigation when the page has many report sections.
- Keep charts near the plain-English question they answer.
- Let the user click from a metric/chart to the trades behind it.

## Implementation Runs

### Run A: Report Navigation And Section Hierarchy

- Add or refine section navigation.
- Group charts into outcome, timing, behavior, ticker stories, and drill-down.
- Move advanced/import/status details below the report or behind disclosure.
- Verify the first screen explains the overall saved-trade report.

### Run B: Chart Polish And Drill-Downs

- Tighten P/L by trade.
- Tighten outcome mix.
- Tighten P/L by session and entry hour.
- Add behavior count/cost charts that link to review items or trade detail.
- Add ticker-story chart or table for giveback/re-entry cases.
- Ensure charts do not show misleading percentages when the denominator is too
  small.

### Run C: Trader-Readable Metric Explanations

For each major metric, add concise explanation:

- what it means,
- why it matters,
- which trades support it,
- what to review next.

Avoid labels such as readiness score, fixture, saved_sqlite, diagnostics,
analysis_failed, market_context_unavailable, raw JSON, or debug.

### Run C2: Behavior Deep Dives For Self-Review

- Add a behavior-language mapper shared with `/coach` so analytics does not
  display raw taxonomy or pattern labels.
- Add or plan chart/table sections for:
  - winners that turned into losers,
  - open-profit giveback,
  - missed continuation after exits,
  - scale-out quality,
  - possible revenge re-entries,
  - same-symbol overtrading,
  - day/session overtrading,
  - support/resistance entry quality when levels are available,
  - volume-fade context when candles and volume are available.
- Each deep dive should link to the trades behind the number.
- If candle, volume, or level context is missing, label the section as
  execution-only and avoid chart-context claims.

### Run D: Saved-Data Correctness And Empty States

- Confirm `/analytics` counts all saved trades from the active import.
- Confirm it does not silently fall back to one sample trade.
- Confirm ticker-story and round-trip counts are not mixed in a confusing way.
- Add empty state:
  "Save one broker CSV to unlock analytics from your own trades."

### Run E: Regression Coverage

Add/update tests for:

- saved data is used when saved trades exist,
- first-screen report metrics are visible,
- chart sections render with trader-facing labels,
- no raw/internal terms in primary UI,
- no banned product claims,
- mobile layout has no horizontal overflow.

## Acceptance Criteria

- A new trader can understand whether the saved trade set was net positive or
  negative without scrolling.
- A user can see more than one-trade analytics when saved data contains many
  trades.
- Every major chart answers a plain question and links to the relevant trades
  when possible.
- Behavior names read like trader feedback, not engine labels.
- Lower-page sections feel organized, not dumped.
- Advanced/import diagnostics do not dominate the normal analytics experience.
- Analytics can hand off to `/coach`, `/review`, and `/trades/[tradeId]`.

## Implementation Status As Of 2026-05-10

Completed enough to avoid duplicate work:

- `/analytics` now uses saved import data when saved trades exist.
- The top report, left/section navigation, and primary chart groups are in
  place for outcome, timing, behavior, ticker/session stories, and chart
  context.
- The first lower-page chart workbench polish is complete: chart mode groups
  outcome, timing, and behavior, explains red/green/amber meaning, and points
  users from chart review into trade exploration, `/review`, `/coach`, and
  `/progress`.
- The execution-only adverse-add metric now uses neutral review language
  (`Adds Needing Review`) so analytics does not imply a dip buy was bad without
  chart context.
- Saved trade-thread counters now include support/resistance exit findings,
  first-entry versus re-entry volume comparison, protected-profit-before-fade
  strengths, add-quality counts, post-exit counts, and strength-to-repeat
  session-story counts.
- Analytics can consume the shared product-safe read models instead of
  rebuilding route-local behavior labels.
- P/L by trade, outcome mix, P/L by session, P/L by entry hour, and execution
  habit sections are already covered by focused route regression tests.
- The lower ticker-story section now has a cleaner report hierarchy:
  story counts and plain-language explanation stay visible, chart risks/chart
  strengths/needs-review prompts are the primary summary, and detailed
  evidence-family counters are collapsed behind `Show chart evidence counts`.
- The behavior report grouping slice is complete: `/analytics` now has a
  certified-read-model `Behavior Report` with groups for entries near
  resistance, support-based entries, chase/extension review, dip-buy/add
  review, profit protection, level-based exits, and volume/re-entry review.
  It consumes existing saved market-context findings instead of creating
  route-local detections.

Do not rebuild in the next run:

- the top saved-data report,
- the section/menu split,
- the existing chart-context finding bridge,
- the first chart-workbench outcome/timing/behavior grouping,
- the red/green/amber chart legend,
- the `Adds Needing Review` primary-label cleanup,
- support/resistance exit counters,
- first-entry versus re-entry volume comparison counters,
- protected-profit-before-fade counters,
- strength-session counters,
- generic raw-label cleanup already handled by the shared mapper,
- the ticker-story summary/evidence-count collapse unless browser QA shows a
  concrete regression,
- the analytics behavior report read model and seven group cards unless
  browser QA shows a concrete regression.

Best next analytics work:

- tune behavior-report card density and vertical rhythm with screenshots if a
  large saved import feels too busy,
- improve drill-down links from charts/metrics to `/trades`, `/review`, or
  `/trades/[tradeId]`,
- tighten mobile/desktop visual density after screenshot QA,
- add a new analytics chart only when the evidence family is already certified
  or the chart is clearly labeled as a neutral review prompt.

## Verification

At the end of an analytics implementation run:

```powershell
npx tsc --noEmit --pretty false
npm run build
```

Run focused Playwright for:

- `/analytics` desktop,
- `/analytics` mobile,
- chart visibility,
- saved-data metric count,
- no raw/internal terms,
- links into `/trades/[tradeId]`, `/review`, or `/coach`.

Update `src/docs/codex-project-log.md` with the changed report sections,
verification, and next best continuation.
