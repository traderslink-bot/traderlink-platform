# Live Market Scanner Audit System Progress

## Status — Slices 0–2 source complete; source QA clean, runtime gates remain

Owner authorized the first three audit stages on 2026-11-02. The implementation
is source-complete in the assigned Scanner lane against exact production scanner
preimages at `5487cd19af5cfb604b04950b66655ea468a6aba2`. It has not been pushed,
deployed, activated against production data, or exposed to members.

## Slice 0 — contracts and sizing

- Versioned audit cycle, batch receipt, decision, score, health and ticker
  timeline contracts are implemented.
- Every cycle binds the exact scanner configuration and SHA-256 configuration
  digest, universe source date, session and evidence schema version.
- The evidence contract preserves provider and receipt times, normalized market
  facts, float facts, calculated activity, all failed gates, score components,
  pre-display ranks and displayed status.
- A production-sized 1,251-symbol synthetic cycle is included in focused
  verification. Runtime health derives actual compressed bytes per observation
  and a 20-trading-day capacity projection from captured evidence rather than a
  hard-coded estimate.

## Slice 1 — durable capture and health

- Added a dedicated scanner-audit SQLite control database under the existing
  scanner data root. No shared Platform migration or manifest edit is required.
- Full cycle evidence is stored as concatenated gzip members partitioned by
  trading date, session and UTC hour. Every member has a SQLite offset, length
  and SHA-256 receipt after file flush and fsync.
- The bounded asynchronous recorder keeps compression and durable writes off the
  awaited five-second scanner path. Queue overflow and writer failure are
  explicit health states rather than silent completeness claims.
- Cycle summaries include provider batch coverage, missing symbols, issue count,
  evidence bytes and write duration.
- Owner-only Audit Health API/UI shows completeness, last cycle, counts, queue,
  dropped cycles, write time, evidence volume and measured capacity projection.

## Slice 2 — explainable decisions and ticker timelines

- The live engine now returns an audit-only decision trace without changing
  member-facing lists or score/ranking behavior.
- Stable reason codes cover every configured filter, warming price windows,
  unavailable float, rejected activity and ineligible snapshots.
- Momentum score records its price, volume acceleration, RVOL, recent dollar
  volume and spread components separately from the total.
- Durable lifecycle events cover first observation, Gainers/Momentum entry and
  exit, material Momentum rank changes and new best Momentum scores.
- Owner-only ticker timeline API/UI streams recorded segments and shows price,
  rolling changes, score, both ranks and the current blocking reason.
- Timeline responses are bounded to 250 cycles and support loading earlier
  observations without returning an unbounded trading-day payload.
- Screeners Admin links directly to Scanner Audit. Member scanner pages remain
  unchanged.

- Daily Review aggregates cycle coverage, qualified/displayed counts and the
  most common rejection reasons by session from compact SQLite summaries.
- Rejection Explorer reads only the latest selected-session evidence member,
  filters by scanner/session/reason/ticker and pages stable symbol-ordered
  results without serving raw files.
- Stored decision score and filter results are independently recalculated in
  focused verification.

## Verification

- Targeted ESLint: passed for all audit files and modified scanner/admin files.
- Focused Vitest: 33 passed across audit, owner-route, admin-client and live-feed suites with one worker
  and no file parallelism after the 2026-11-02 correction batch. A wider checkpoint produced
  94 passes across all eight live-scanner files; no scanner assertion failed.
- Full repository TypeScript passes with a 4 GB heap. The Audit UI uses
  `slotProps.htmlInput`, and the previously recorded universe-alert fixture
  typing is corrected.
- The exact candidate production build passes after restoring the
  lockfile-declared `argon2` and `openid-client` packages to the VPS dependency
  tree. Academy registry validation, webpack compilation, TypeScript, all 284
  static pages and route generation completed successfully.
- QA correction coverage now verifies duplicate-cycle idempotency, durable
  queue gaps, corrupt members, restart detection of unindexed evidence tails,
  nonqualifying-to-qualifying re-entry events, active-session staleness and a
  1,251-symbol cycle. The queue no longer synchronously clones a full cycle or
  writes SQLite on the scanner call path.

## Remaining gates

- Preserve the passing exact-candidate build result through the Coordinator's
  narrow current-main integration procedure.
- Isolated development-owner browser verification is complete: 12/12 passed,
  including health/daily/timeline/rejections, full pagination, empty/error/partial
  states, stale responses, focus/scroll and desktop/mobile layout. Final visual
  fixes make Session readable, keep mobile rows compact and show unambiguous
  byte units. Final 96-test scanner suite and targeted ESLint pass. See
  [browser QA record](live-market-scanner-audit-browser-qa-20261102.md).
- Browser-level non-owner/expired-session acceptance remains distinct from the
  passing fail-closed route tests; the local runner injects a development owner.
  A later clean-source production build must include the final UI-only changes.
  The previously recorded production build belongs to the pre-visual-fix source.
- Production activation and live evidence collection remain a separate owner
  release gate.

## Private production activation — owner authorized Nov 2

The owner replaced the earlier no-deployment restriction with explicit private
activation authority for the two approved accounts only. Follow the separate
[activation record](live-market-screeners-private-activation-20261102.md) for
actual production evidence, delivery-off protection, provider qualification and
remaining access/live-result checks. Synthetic audit QA is not live acceptance.

## 2026-11-06 — Selected density release integration

- Integrated only the controls and density slices from 0f16023b and 18d5e2f onto current production 1b1a64cd; historical layout and secondary-card baseline commits are excluded.
- Reserved compact chart/news/expand positions, rolled-newspaper icon with unchanged accessible article label/action, narrower columns with unchanged text sizes, Vol headings and consistent Vol/Float/dollar-volume ordering.
- Adapted High Drops widths to the current production High/Drop/session-marker implementation rather than restoring the historical Premarket High Pullbacks composition.
- Current production add0a802/1b1a64cd intentionally selects the latest article per ticker. Preserved that newer selection policy instead of reintroducing the older multiple-link behavior mentioned in the handoff. PR and SEC latest articles retain the same drawer action.
- Preserved current halt expiry/filtering, purple signals, manual tickers, decimal prices, settings and polling. Integrated verification and actual deployment evidence are recorded separately by Coordinator; no owner visual acceptance is implied.

## Scanner Admin recording controls

Audit recording defaults to off, including for installations without a saved preference. Scanner Admin can persist the recording setting or delete stored audit evidence and its indexes.

## Listing eligibility, trade freshness, and recovery

Scanner input now excludes symbols Alpaca identifies as inactive or on exchanges outside the scanner universe. A temporary trading halt does not change listing eligibility. Scanner rankings check both trade and receipt timestamps. Established Gainers can still display their last available values behind current observations. The audit records stale inputs explicitly and records a Momentum exit if its input disappears. SIP reconnect discards obsolete warm-up requests and restarts the session backfill promptly. Audit restart checks include unindexed first segments and preserve truncated files while directing new evidence to a recovery segment.
