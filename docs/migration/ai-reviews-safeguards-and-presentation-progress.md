# AI Reviews Subscriber Safeguards and Review Presentation Progress

## Status

Plan, implementation and focused non-provider verification completed on
2026-08-09. Migrations `0050_coach_ai_review_subscriber_budget_safeguards` and
`0051_coach_ai_review_cache_write_accounting` are registered, disposable-copy
verified, backed up and locally applied. The local database and manifest are
current at 51/51. The owner approved the UI. The beta QA pricing/cache-write
correction is complete; migrations 0050 and 0051 are frozen.

## Checklist

- [x] Confirm the current global trailing-30-day control blocks all users.
- [x] Confirm Whop already stores subscriber renewal-period boundaries.
- [x] Supersede the USD 1.00 value with an owner-approved USD 2.00 default.
- [x] Separate the global warning from an explicit emergency hard stop.
- [x] Confirm real weekly and monthly saved-review detail routes already exist.
- [x] Define one shared customer review-document presentation.
- [x] Record the 700-character per-trade note decision for Tracker coordination.
- [x] Coordinate and reserve migration 0050.
- [x] Implement and disposable-copy verify the safeguard migration.
- [x] Implement subscriber-cycle enforcement and Admin controls.
- [x] Implement the shared saved-review presentation.
- [x] Add the development-only benchmark preview.
- [x] Run focused ESLint and safeguard contract verification.
- [x] Confirm the final owned-file TypeScript filter is clean.
- [x] Obtain owner visual approval.
- [x] Coordinate migration 0051 for exact cache-write accounting.
- [x] Persist cache-write tokens and immutable price in reservations/receipts.
- [x] Use USD 2.00 for the subscriber paid-cycle default/current value.
- [x] Repair stale timing, scheduler, cached-pricing and safeguard verification paths.
- [x] Run focused low-resource verification for the correction.

## Verification evidence

- The pre-0050 local database main file was copied to the protected private-data
  backup boundary with matching SHA-256 and 32,284,672 matching bytes. Port
  3010 was stopped and the WAL was empty before the backup.
- The disposable verifier preserved the singleton budget row, confirmed the
  USD 1.00 default, read exact Whop paid-period boundaries and passed
  `foreign_key_check`.
- One fixture subscriber exceeded their own AI Review cycle cap. A different
  subscriber remained eligible after the global warning amount was crossed.
  The separate emergency global threshold then blocked the next provider
  reservation with its distinct failure code.
- The legacy rolling-spend verifier was updated to exercise the explicit
  emergency threshold and still proves that outstanding reservations cannot
  age out of global emergency accounting.
- Focused ESLint passed for the migration, repositories, Admin actions/control,
  shared review document, real detail routes, local benchmark preview and both
  safeguard verifiers.
- The first whole-project TypeScript checkpoint contained 179 diagnostics from
  the shared dirty checkout and one owned verifier cast error. That owned error
  was corrected. The final checkpoint still reports 178 unrelated shared-tree
  diagnostics and zero matches in this safeguard/presentation slice.

## UI checkpoint

- Real weekly, two-week and monthly saved-review routes now share the same
  server-rendered review document.
- For the local owner or authenticated production guild owner, `/ai-reviews`
  exposes **Preview power-user reviews**.
  It opens the four accepted heavy weekly outputs and accepted heavy monthly
  output without database writes or OpenAI calls.
- Ordinary production subscribers receive not-found for the benchmark-preview
  route, and a hosted owner route without the local artifact fails closed.
- A 1440px browser checkpoint rendered the accepted 100-trade first weekly
  review in the real dashboard shell with no Next error overlay. The summary,
  improvement/friction split, follow-through and three numbered next actions
  were all readable and visually distinct.
- The first hot reload exposed a Next 16 Server/Client boundary error from
  passing `next/link` as a Material UI component prop. The touched review links
  now use native `href` rendering and the weekly preview returned 200.
- A pre-existing dashboard account-selector hydration style warning appeared in
  the shell. It is outside this AI Review slice. The final monthly/Admin route
  probes were stopped at the coordinating agent's request so shared Help and
  Moomoo work could keep port 3010 stable. No further server or browser action
  was taken.

## QA findings

1. A per-Trade-Tracker-account USD 1.00 cap would let one subscriber multiply
   their allowance by adding accounts. The safeguard therefore belongs to the
   paid Platform user and covers all of their Trade Tracker accounts.
2. Calendar-month usage would not match the promised monthly subscription.
   Whop renewal boundaries are the primary window; trailing 30 days is only the
   missing-boundary fail-safe.
3. Reusing one global value as both warning and hard stop makes ordinary budget
   monitoring capable of cutting off every customer. The two meanings must be
   separate.
4. Individual per-user override screens are unnecessary for launch and would
   add complexity. Start with one Admin default per subscriber. Add audited
   overrides later only if real support evidence shows they are needed.
   AI Chat is a separate feature and must never consume this USD 2.00 AI Review
   allowance; its different model and usage pattern require separate testing
   and controls.
5. Importing benchmark outputs into the user database would mix synthetic and
   real reviews. A development-only preview through the production presentation
   component provides honest visual approval without mutating customer data.
6. The weekly and monthly pages currently duplicate six equally weighted
   panels. They are readable but visually fragmented. A single review-document
   hierarchy will make the summary and next actions easier to scan.
7. Raising a 100-trade week from 500 to 700 characters per trade note adds at
   most about 20,000 raw characters before tokenization. At corrected Luna rates
   this remains proportionate to the USD 2.00 subscriber limit, while a single
   700-character rule is simpler to explain.

## 2026-08-09 beta QA correction checkpoint

- This subsection records the pre-0051 finding. The completed current state is
  the cache-write correction checkpoint immediately below.
- Before 0051 was applied, the local database was current through migration
  0050 with SQLite
  integrity `ok` and zero foreign-key failures.
- Current official Luna rates are USD 1.00 input, USD 0.10 cache read and USD
  6.00 output per million tokens; cache writes cost USD 1.25 per million.
- The benchmark report used rates one fifth of those values. Repricing the
  stored token counts makes the tested uncached heavy month approximately USD
  1.15 for four weeks and USD 1.40 for five weeks before cache-write uplift.
- The installed AI SDK exposes `cacheWriteTokens`, but the current adapters,
  receipts and cost function omit it. The existing spend controls can therefore
  understate provider cost and require a migration-backed correction.
- The owner selected USD 2.00 per subscriber per Whop paid cycle. AI Chat stays
  outside this allowance.
- One controlled fixture-only Luna issuance still passed through reservation,
  receipt, saved-review reopening and duplicate-call prevention with no live
  database mutation.

## 2026-08-09 cache-write correction completion

- Migration `0051_coach_ai_review_cache_write_accounting` passed a full
  50-migration in-memory disposable proof before registration. All seven new
  columns, price/receipt guards, the Luna USD 1.25 cache-write backfill, the
  USD 2.00 subscriber-cycle transition, preserved table counts and zero
  foreign-key failures were confirmed.
- A pre-0051 backup and independent restore matched the exact 50-row registry,
  all 146 table counts, page geometry, recovery authority and restored-file
  identity. The normal local runner then applied exactly migration 0051.
- Reservations now conservatively price input at the greater of ordinary-input
  and cache-write rates before provider transmission. Receipts require separate
  non-overlapping cache-read and cache-write token counts and preserve all four
  immutable prices.
- The current reusable verifiers pass for exact cached/cache-write pricing,
  per-subscriber paid-cycle isolation and the optional emergency global stop.
  The timing and scheduler-health verifiers also pass against an already-current
  51/51 disposable copy without attempting to recreate applied schema.
  Focused ESLint passed. The low-memory whole-project TypeScript run still has
  unrelated mixed-checkout diagnostics but reported no error in this correction
  slice.
- One owner-authorized synthetic Luna replay made exactly one provider call,
  persisted no review and returned 2,286 input tokens split into 0 cache-read,
  2,283 cache-write and 3 ordinary-input tokens, plus 916 output tokens. The
  corrected four-rate estimate was USD 0.00835275, proving the live
  SDK/provider boundary supplies cache-write usage instead of requiring a
  guessed zero.

## Handoff

The complete beta state, QA-first resume instructions and exact hosted go-live
work are consolidated in [AI Reviews Beta Handoff](ai-reviews-beta-handoff.md).
