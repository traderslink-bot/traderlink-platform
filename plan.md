# Trader Intelligence Plan Entry Point

Start here when resuming product, UX, detection, analytics, coaching, or review
work in this app.

The plan index is the source of truth for which detailed plan controls the next
implementation run:

- `src/docs/trader-intelligence-plan-index.md`

Current immediate priority:

- `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`

Evidence-gating reference for any new behavior claim:

- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`

Current next-run execution plan:

- `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`

Supporting evidence model:

- `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`

Current next run expectation:

- Work from the next-run execution plan continuously using the
  work -> verify -> continue loop. The shared behavior contract now carries
  opportunity type and evidence channel, current execution-only risks,
  strengths, and review prompts have mapper coverage, decision-review evidence
  uses plain labels by default, ticker-story context is surfaced in coach,
  analytics, and progress, first support/resistance market-context behavior
  contracts are certified in the mapper, and the broad user-facing
  behavior/trader-analytics/user-facing-review/coaching suite plus focused
  desktop Playwright regressions pass. Same-symbol thread stories now have
  explicit story kinds, repeated losing attempts no longer masquerade as profit
  giveback, and session stories now cover green-to-red sessions, many attempts
  on one ticker, high trade-count sessions, and open/swing exposure from
  execution evidence. Product-safe chart-context findings now flow through
  saved trade threads, review queue, trade detail, analytics, coach, progress,
  and saved trades. Adverse-add execution-only detections now stay as review
  prompts until chart context proves weak-add risk or constructive-add
  strength, and saved thread read models expose add-quality, post-exit, level,
  and volume evidence counts. Post-exit and volume evidence now split risk,
  strength, and review prompts; profit-protection findings surface as
  after-exit evidence; and route copy-safety blocks confusing terms such as
  "risk-backed," "strength-backed," "post-exit checks," and visible hyphenated
  "chart-context" wording. The next run should not restart the completed
  route-language, evidence-label, ticker-story surfacing, first thread-story
  hardening, first session-story pass, first chart-context finding bridge,
  add-quality prompt/certification split, or post-exit/volume evidence
  hardening. The after-exit certification gate is also complete:
  `exit_left_continuation` now requires safe post-exit candles, while missing
  or oversized after-exit evidence stays prompt-only. Support/resistance-aware
  exit behavior and first-entry versus re-entry volume comparison are also now
  implemented and verified. Route handoffs for those certified findings are
  complete too: saved trade threads expose priority chart findings and explicit
  support/resistance exit counters, `/trades/[tradeId]` has a chart handoff
  anchor, `/review` links chart evidence items to that anchor, `/trades` has a
  support/resistance exit filter, and analytics/coach/progress show separate
  support/resistance exit metrics. Profit protection before a measured fade is
  now also certified when capture and after-exit candles agree, with dedicated
  saved-thread counts and route handoffs in analytics, coach, progress, saved
  trades, and trade detail. Strength-to-repeat session stories are now
  implemented for green sessions with certified chart/level/volume/after-exit
  strengths, and `/review` plus `/trades/[tradeId]` now have session-story
  handoffs. Adverse-add coaching copy now explains the dip-buy ambiguity and
  uses "Require Repair Before Adding Size" as the visible rule label. It
  should continue with a new independent slice: analytics/coach presentation
  polish that consumes certified read models, another market-context family
  only if saved evidence can prove it, or visual/mobile polish for the touched
  route family.
  Verify locally, update docs, and keep moving through the next safe slice
  unless a true global blocker appears.
- The next implementation start point remains the next-run plan's
  **Required Long-Run Batch Shape** and **Next Run Phase Plan** sections, not
  only the shorter block summary. The next run should complete multiple
  phases before reporting back. Current best slices are coach/analytics
  presentation polish using certified read models, visual/mobile polish for
  touched routes, route anchor/copy repairs, or a new behavior/evidence family
  only when saved chart, level, candle, volume, or after-exit evidence can
  prove it.

If this file and the plan index ever disagree, trust the plan index and the
latest entry in `src/docs/codex-project-log.md`.

Why this matters:

- The coach, analytics, review queue, progress page, saved trades, and trade
  detail pages all depend on behavior detections being trustworthy.
- Coaching opportunities come from two evidence channels: execution evidence
  from imported buys/sells and market context evidence from levels, candles,
  volume, and the chart around the trade.
- The app must identify strengths to repeat as well as risks to reduce.
- If a detection is not certified, it must not drive a confident user-facing
  conclusion.
- Uncertified or uncertain behavior must be shown only as a review prompt or
  kept internal until the detection has a clear evidence contract and tests.
- User-facing behavior labels must come from the shared fail-closed mapper or
  registry. Unknown/unmapped behavior must never fall back to a raw engine
  label in normal UI.
- Visible titles, summaries, badges, pills, and closed-state labels on advanced
  disclosures count as normal UI for copy-safety purposes.

Resume order:

1. Read `src/docs/codex-project-log.md`.
2. Read `src/docs/trader-intelligence-plan-index.md`.
3. Open the active top-level plan named in the index.
4. Open the active detailed plan named in the index.
5. Open the current next-run execution plan named in the index.
6. Work continuously from that plan using the work -> verify -> continue loop
   until the current batch target is met or a true global blocker appears.
7. Update the project log and relevant plans after meaningful work.
