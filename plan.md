# Trader Intelligence Plan Entry Point

Start here when resuming product, UX, detection, analytics, coaching, or review
work in this app.

The plan index is the source of truth for which detailed plan controls the next
implementation run:

- `src/docs/trader-intelligence-plan-index.md`

new note may 11

Product/engineering suggestions from the latest human review:

- `src/docs/suggestions-for-codex.md`

Read the suggestions file before the next product/UI implementation pass. It
captures the requested direction for `/coach`, `/analytics`, `/review`,
`/trades/[tradeId]`, `/workspace`, short/sell-starting copy, route hierarchy,
and data-density handling. It does not replace the evidence-gating plans; it
adds product and UX guidance for how the certified evidence should be presented.

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
  execution evidence. Product-safe chart evidence findings now flow through
  saved trade threads, review queue, trade detail, analytics, coach, progress,
  and saved trades. Adverse-add execution-only detections now stay as review
  prompts until chart data proves weak-add risk or constructive-add
  strength, and saved thread read models expose add-quality, post-exit, level,
  and volume evidence counts. Post-exit and volume evidence now split risk,
  strength, and review prompts; profit-protection findings surface as
  after-exit evidence; and route copy-safety blocks confusing terms such as
  "risk-backed," "strength-backed," "post-exit checks," and visible hyphenated
  "chart-context" wording. The next run should not restart the completed
  route-language, evidence-label, ticker-story surfacing, first thread-story
  hardening, first session-story pass, first chart evidence finding bridge,
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
  uses "Require Repair Before Adding Size" as the visible rule label. The first
  saved-trades and trade-detail workflow-polish pass is also complete:
  `/trades` has the saved-trade workflow panel, current-view browse copy, and
  trade-card `Why review this` blocks; `/trades/[tradeId]` has a four-step
  review-flow handoff, clearer workspace framing, cleaned lower-section labels,
  and analytics trade-detail links now land on useful anchors. The deeper
  coach lower-page reduction and trade-detail supporting-details collapse are
  complete too: `/coach` now has a `Before Next Session` plan and evidence
  cards that answer what happened / why it mattered / what to do next, while
  duplicate coach details and optional trade-detail support sections are
  collapsed by default. The screenshot-guided follow-up is also complete:
  `/trades` paginates the saved-trade card wall 18 cards at a time and
  `/analytics` lower ticker-story evidence counts are collapsed behind a
  trader-readable summary. The review/progress mobile-density pass is also
  complete: shared page menus collapse on mobile, `/review` queue tabs are
  compact, `/review` shows the first work batch, and `/progress` detailed chart
  evidence counts are collapsed. Import-flow trust polish is also complete:
  `/import-dry-run`, `/imports`, and `/imports/[batchId]` use shared readable
  import state labels, save/saved-import wording, lighter dashboard panels, and
  copy-safety guards. The workspace/coach visual-system QA slice is also
  complete: `/workspace` now uses the lighter dashboard shell and primary
  workflow handoff panel, workspace import copy uses saved-import language, and
  `/coach`/dashboard old-card styling is covered by the updated dashboard
  surface plus Playwright guard. The workspace route-handoff and coach
  review-first split are complete too: primary workspace App Areas now focus on
  the core loop, secondary review tools are collapsed under `More review
  tools`, the `Review next trade` workflow action links to the actual next
  review anchor when available, and profitable coach evidence uses
  `Review first` instead of `Fix first`. The route screenshot QA and
  trade-label copy slice is complete too: workspace beta/admin notes are
  collapsed, the workspace flow title is trader-readable, and primary UI hides
  import-ID-like trade labels behind `Selected trade` unless the value looks
  like a real ticker. The analytics behavior report grouping slice is now
  complete too: `/analytics` groups certified market-context findings into
  resistance entries, support-based entries, chase/extension review,
  dip-buy/add review, profit protection, level-based exits, and volume/re-entry
  review. The coach behavior-map reuse slice is complete too: `/coach` now
  consumes the same shared certified report as `Behavior Coaching Map` with
  fix-first, repeat-first, and needs-review framing. User QA found that this
  coach presentation is too similar to analytics, so the shared report should
  remain the evidence source while the coach route becomes a true coaching
  sequence. The May 11 product clarity pass is now complete: `/coach` defaults
  to `Behavior Coaching Sequence`, `/analytics` keeps the broad grouped report,
  `/review` queue cards are task-first with evidence counts collapsed,
  `/trades/[tradeId]` leads with `Replay, decide, write, then continue`,
  active waiting-chart labels say `Chart data still missing`, and
  sell-starting items use `Limited sell-side review` copy. The follow-on route
  copy/anchor QA pass is complete too: stale chart-context-waiting language was
  replaced with chart-data wording across shared status helpers and touched
  routes, coach progress handoffs now land on
  `/progress#progress-follow-through`, and Playwright bans the stale phrase. It
  should continue with a new independent slice: focused screenshot fixes only
  if concrete issues appear. The first deterministic positive
  constructive-management storylines are complete:
  `balanced_management_with_constructive_exit` maps to `Managed the full trade
  constructively`, and `add_into_strength_with_constructive_final_exit` maps to
  `Added into strength and exited constructively` through decision review,
  user-facing behavior mapping, saved trade threads, and the analytics behavior
  report. Follow-up constructive-management variants should be added only when
  saved evidence can prove them without broader claims. The
  product/engineering review in
  `src/docs/suggestions-for-codex.md` is the current product direction for
  preserving beginner-first route hierarchy, advanced end-user disclosures, and
  admin/internal boundaries. The May 12 beginner-to-advanced route IA pass is
  now complete: `/imports` and `/imports/[batchId]` keep saved imports,
  repairs, saved trades, decisions, and next actions in the default path while
  batch IDs, mapping confidence, write safety, execution basis, quality
  breakdowns, reconstruction previews, chart-review counts, and duplicate
  internals are tucked behind advanced disclosures. `/analytics` now exposes
  category access for Results, Timing, Behavior, Ticker Stories, Session
  Stories, and Chart Evidence without removing the richer report. Import
  routes also use the completed `Limited sell-side review` language for
  sell-starting imports. The focused follow-up polish pass is complete too:
  `/imports/[batchId]` now uses `Saved Import` / `Import Details` instead of
  `Import Batch`, `/imports` uses `Imports To Finish`, `/import-dry-run`
  tucks P/L/cost and broker mapping/calibration details behind advanced
  disclosures, and core routes use chart data/evidence wording instead of
  visible chart-context phrasing. The final PR screenshot/copy QA pass is also
  complete: all ten requested routes were reviewed, the only concrete issue
  found was `/import-dry-run` still showing mapping confidence and `Copy Audit`
  in primary summary cards, and that default summary now uses `Rows To Fix` and
  `Import Check` while mapping confidence remains in technical import setup
  details. The end-user CSV start page is also complete: `/upload-csv` is the
  normal one-card upload entry, it uses broker auto-detection through the
  existing import API, it now shows a result/duplicate/repair alert instead of
  surprise-redirecting, and `/imports/[batchId]` no longer shows automatically
  skipped informational row notices as default repair work. Saved imports now
  also have a small-batch `Resume chart data review` action inside advanced
  chart/import details, and limited resume runs keep unprocessed chart jobs
  queued instead of marking them skipped. Keep moving through the next safe
  slice unless a true global blocker appears.
- The next implementation start point remains the next-run plan's
  **Required Long-Run Batch Shape** and **Next Run Phase Plan** sections, not
  only the shorter block summary. The next run should complete multiple
  phases before reporting back. Current best slices are screenshot-guided
  beginner-to-advanced flow fixes only when route QA finds a concrete issue,
  especially on `/workspace`, `/analytics`, `/progress`, or
  saved-trade handoffs, or deterministic follow-up constructive-management
  variants only when saved chart, level, candle, volume, or after-exit evidence
  can prove them. Do not redo the completed import IA disclosure pass,
  import wording/advanced-detail polish, final import summary-card fix,
  minimal upload route and upload-result alert,
  saved-import chart-data resume,
  saved-trades day-session hierarchy and replay marker polish,
  dedicated ticker-story drilldown route,
  ticker-story hold-continuation classification and section,
  saved-trades month calendar view,
  review-queue chart-data waiting labels,
  analytics category-access pass,
  constructive-management storylines, workspace visual migration, coach
  old-card cleanup, May 11 coach sequence, review queue simplification,
  sell-starting limitation copy, route copy/anchor repairs, or trade-detail
  replay loop unless QA finds a concrete regression.

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
3. Read `src/docs/suggestions-for-codex.md` before product/UI route work.
4. Open the active top-level plan named in the index.
5. Open the active detailed plan named in the index.
6. Open the current next-run execution plan named in the index.
7. Work continuously from that plan using the work -> verify -> continue loop
   until the current batch target is met or a true global blocker appears.
8. Update the project log and relevant plans after meaningful work.
