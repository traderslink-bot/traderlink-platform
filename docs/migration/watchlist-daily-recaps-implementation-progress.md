# Daily Watchlist Recaps Implementation Progress

**Status:** QA corrections implemented; focused checks passed; integrated release verification pending

**Plan:** [Daily Watchlist Recaps Plan](watchlist-daily-recaps-plan.md)

## Completed discovery

- [x] Recovered the owner-approved product contract and its factual-evidence,
  editing, retention, idempotency, and Discord boundaries.
- [x] Confirmed the existing Platform `/api/live-watchlist/recap` source only
  returns a top-three, greater-than-5% summary and cannot power the approved
  workflow.
- [x] Confirmed the current runtime `DailyWatchlistRecapService` automatically
  posts through a server-only webhook in a 3:55 PM ET window. It remains
  unchanged until the reviewed replacement is active and verified.
- [x] Confirmed Admin Watchlist is Platform-owned around an authenticated
  runtime iframe; Daily Recaps belongs beside Usage in the parent Platform UI.
- [x] Recorded the owner-provided private Discord channel as a server-side test
  destination only. Its identifier is not stored in source, browser state, or
  this document.
- [x] Added the first pure deterministic draft generator. It uses only the
  Watchlist posted price/time and later accepted prices supplied as immutable
  evidence, rejects observations that predate the post, and never implies a
  member trade or exit.
- [x] Focused deterministic-draft check: 3 passed, 0 failed.
- [x] Added the exact editable composition-body contract. It preserves the
  selected ticker order, refuses duplicate/gapped items and Discord mentions,
  and leaves the fixed server-only mention footer to the final runtime step.
- [x] Focused draft/composition checks: 6 passed, 0 failed.
- [x] Added the review-state contract: correction reason/note are retained,
  posting requires an already selected recap plus a returned receipt, and a
  posted review is immutable.
- [x] Focused draft/composition/review checks: 9 passed, 0 failed.

## Current implementation gate

- [x] Prepared and registered `0133_platform_watchlist_daily_recaps` against
  the verified current-main high-water mark of `0121` in the clean release
  workspace. A disposable empty-database initialization applied it after all
  predecessors; no hosted database was changed.
- [x] Added the durable repository service layer for candidate, evidence,
  revision, composition, and post-attempt storage.
- [x] Added a non-blocking publisher-side evidence capture boundary for
  activation, price, AI Read, Potential Path, and removal-freeze facts. It
  preserves existing member-facing Watchlist updates when recap storage is
  unavailable and has no Discord side effect.
- [x] Added the deterministic AI Read pullback-recovery grammar for the
  published shallow/deep dip-buy areas. It requires the AI Read to predate the
  price sequence, uses an actual accepted pullback price rather than an assumed
  fill, and measures the pullback result from that actual price through the
  later recovery high. Alert-price continuation results remain separate.
- [x] Added deterministic analysis-breakout grammar: it names only published
  levels actually cleared and calculates continuation potential gain from the
  Watchlist posted price through the factual high.
- [x] Bound breakout levels to the AI Read's published **Where the trade could
  go next** horizons, rather than generic Potential Path levels.
- [x] Added the unified ticker-draft builder. Every candidate can receive its
  ordinary move recap; pullback, breakout, and reached AI analysis levels add
  natural-sentence context without gating that recap.
- [x] Added the downside classification: when there is no prior upside or
  pullback-recovery result, breaking the published pullback area and then the
  momentum-failure level produces the setup-invalidation story.
- [x] Added deterministic generation and the protected owner API surface.
- [x] Added the owner-approved Daily Recaps Admin section with date selection,
  individual or full generation, full ticker editing, selection, combined-body
  editing and explicit post confirmation.
- [x] Added non-blocking **Flag for audit** notes and explicit resolution. An
  audit flag never changes selection state or prevents editing or posting.
- [x] Added the **Stored recap data** summary and confirmed manual cleanup. It
  removes only eligible unreferenced price evidence older than 30 days and
  keeps posted text, receipts, draft evidence, and every open audit flag.
- [x] Added Help coverage for the owner workflow.
- [x] Added the runtime's authenticated reviewed-post/idempotency boundary in
  the canonical Watchlist runtime. Its focused mocked check passes 7/7; no live
  Discord message was sent and no hosted destination was changed.
- [ ] Retire the old automatic recap service in the coordinated replacement
  release after end-to-end verification.

## Non-negotiable release boundary

## QA correction checkpoint

### Combined initial-move / broken-area regression

- Both single-story and two-story branches now share recovery eligibility:
  a higher subsequent run outside the completed regular recovery falls back
  to the full posted-price high, never the earlier small bounce.
- Added initial-high variants 0.60, 0.65 and 0.70 before the sequence
  0.45 / 0.455 / 0.39 / 0.65. Each retains full-high potential gain and reached
  analysis levels without 1.1% bounce or deep-recovery success wording.
- Existing regular two-move lower/equal/higher fixtures remain required.
  Help/plan behavior is unchanged by this correction. No UI or hosted changes.
- Verification: all 18 focused Node tests passed, including the expanded
  combined-sequence variants; targeted ESLint and diff checks passed.

### Two-move high-order regression

- Fixed: the initial move uses its own pre-pullback high, not the full-period
  high. Both stories survive when the second run is lower, equal or higher.
- Regression fixtures cover first highs 0.60, 0.65 and 0.70, each followed by
  0.45-to-0.65 recovery; first gains are 20%, 30%, 40% respectively, and each
  retains the separate 44.4% recovery. Newly reached next-analysis levels remain.
- Help reviewed: the existing two-move explanation remains accurate. No UI,
  migration, runtime, deployment or coordinator change.
- Verification: 18 focused Node tests, targeted ESLint and diff checks passed.

### Fourth QA corrections — two moves and saved-body associations

- Complete: an initial 0.50-to-0.70 move and subsequent regular 0.45-to-0.65
  pullback run are both described (40.0% and 44.4%, separate baselines).
  Deep-recovery success remains excluded; the tiny-bounce/deep-run fixture
  still reports only the posted-price potential gain and reached levels.
- Complete: final-body saves capture immutable candidate/revision associations.
  Full-body editing retains those associations, including after reload; Use
  selected recaps replaces text and associations together. Posting validates
  candidate/date/revision membership and marks only the submitted revisions.
- Checkpoint: 18 focused Node tests passed, including saved PDSB text followed
  by selecting another ticker, owner text edits and wrong-date rejection.
- Targeted ESLint, diff whitespace checks, and isolated recovery/Help TypeScript
  checks passed. No full application build or full application type check ran.
- Help and plan updated. No migration, runtime, hosted or coordinator action.
  Live browser and Discord verification remain at the owner-gated release step.

### Third QA corrections and owner deep-recovery clarification

- Complete: deep plans cannot generate successful recovery stories. The regular
  pullback remains supported, including turns above its area. The reproduced
  0.45 / 0.455 / 0.39 / 0.65 sequence now reports the full 0.65 high and 30.0%
  potential gain from the 0.50 posted price, retaining reached analysis levels.
- Complete: Save final post persists immutable owner composition revisions;
  initial page and date reads restore the saved body. Use selected recaps is an
  explicit confirmed replacement. Neither save nor audit flags send messages.
- Complete: posting confirmation marks only the submitted draft revision;
  concurrent newer edits remain editable/unposted. A stale failure response
  cannot overwrite an already successful attempt.
- Next.js and React guidance informed server-only persistence and functional
  client state updates that preserve typing during saves. Help is aligned.
- Focused checkpoint: 17 Node tests passed using disposable in-memory SQLite
  and mocked delivery. Browser/Discord end-to-end verification remains pending.
- Targeted ESLint and diff whitespace checks passed. Isolated TypeScript checks
  passed for recovery logic, client-state helpers and Help; no full app build or
  full app type check was run under the low-resource boundary.
- No migration change/application, runtime edit, server, push, deployment or
  coordinator handoff in this slice. Owner retains the handoff gate.

### Second QA and owner microcap clarification

- Recovery selection retains completed low-to-high pairs, including an early
  run followed by a lower dip or later arrival at the analysis area.
- Removed the fixed proximity cutoff for above-area recovery. A 0.50 post,
  0.42-0.425 area, 0.45 dip and 0.65 run produces 44.4% from the actual dip,
  explicitly stating that price turned before reaching the area.
- Missing original publication price no longer falls back to a later quote.
  An existing candidate keeps its original baseline when later metadata is absent.
- Date loads reject stale responses and clear old candidates immediately.
  Completing a save removes only the exact submitted edit, preserving newer typing.
- Explicit Discord rejections clear the pending-send marker so the same post can
  retry. Post history exposes retries and owner confirmation of absent or already
  delivered messages after an uncertain response. Completed parts are not resent.
- The React review checklist informed request ordering, functional edit updates,
  and date-specific state handling. Browser verification remains a release check.
- Final focused checkpoint: 12 Platform Node checks and 12 runtime Node checks
  passed. Targeted ESLint passed. Isolated TypeScript checks passed for Help,
  recovery/client-state logic, runtime poster and runtime tests. A full app type
  check/build and live browser/Discord verification were not run in this slice.

- Repeated identical date/body/user posting requests reuse one persisted attempt
  and key. Platform requires a matching successful Discord receipt before marking
  a composition posted.
- Runtime persists each message's pending/completed delivery before continuing.
  A lost response requires delivery reconciliation; retries do not blindly resend.
  Receipt-store corruption fails closed. Long owner paragraphs split within the
  Discord message limit.
- Recap fields use controlled values and explicit Save recap. Manually edited
  final bodies are retained by date across selection changes.
- Generation uses the first valid published AI Read and captured timestamped
  Potential Gain highs in addition to price snapshots. Breakout details remain
  scoped to the analysis publication while potential gain uses the full high.
- A broken pullback zone ends that recovery sequence. A recovery completed
  before the break remains reportable.
- Removed candidates reject subsequent evidence. Help uses the supported
  callout block type.
- Verification: 3 focused Node recap regressions; 9 focused runtime tests;
  targeted ESLint and isolated Help TypeScript check passed. No full build,
  server, hosted migration, deployment, or Discord delivery was performed.
- Browser interaction and integrated private-channel delivery remain unverified;
  the source checkpoint is not a production-readiness claim.

No current change sends a Discord message, changes a webhook or destination,
starts a scheduler, disables the existing scheduler, applies a migration,
pushes, or deploys.
