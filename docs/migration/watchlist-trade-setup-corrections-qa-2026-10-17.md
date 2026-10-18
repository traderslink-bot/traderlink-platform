# Watchlist Setup Corrections and QA

Date: 2026-10-17

The three findings in the [previous final QA](watchlist-trade-setup-final-qa-2026-10-17.md) are corrected in local source. Focused offline checks pass for the four setups, shared acquisition, member card and admin controls. Nothing was deployed or enabled, and no provider requests or notifications were sent. Hosted capacity and browser visual acceptance remain unverified.

Plan: [Watchlist Trade Setup Detection](watchlist-trade-setup-detection-plan.md). Progress: [implementation and verification](watchlist-trade-setup-detection-progress.md).

## Corrections

### Five minute context

Rules version is now `watchlist-setups-a-v2`. A new EMA test and its later confirmation require the last completed native 5m boundary appropriate to that observation. A still-forming 5m interval is allowed; a missing completed interval cannot silently reuse an older EMA/slope. A pending EMA with missing context becomes unavailable, not falsely confirmed or failed. Independent 1m higher-low detection remains available. Historical events before the outage remain recorded.

Saved calculations are reevaluated after a rules-version change without another provider request. Member reads do not present an older rules version as a current evaluation while this is pending.

The recorded BDAI and WFF stale-frame faults no longer produce confirmations using missing 5m updates. The checks also cover LOOP, preserve events in the normal incomplete 5m interval, and verify that higher-low transitions are unchanged. Restoring complete inputs reproduces the normal nine-ticker replay, whose detector counts remain unchanged.

### Evidence retention and controls

The owner authorized correcting storage exhaustion in this slice. The policy is now 100 MB/5,000 managed files, with 4 MB/16 file slots reserved for controls. On pressure, rotate oldest generated `evidence-<hash>.json` and historical `settings-<hash>.json` files toward an 85% low-water mark. Preserve all `latest-<hash>.json` publication records, current `settings.json`, unrelated files, symlinks and separately named pinned exports. Pinned replay exports must use a name outside the automatic-history patterns.

Current settings save before their optional history copy, so evidence-history failure does not turn a successful control change into a failed response. Revision conflicts no longer mark storage unavailable. I/O failures invalidate cached byte counts for a subsequent recount. Genuine disk failures or a protected-latest population exceeding the budget remain explicit failures; this does not promise unlimited storage.

Virtual-storage tests exercise both an existing 5,000-file directory and 99 MB of generated history. Rotation allows a new evaluation and disabled settings to save, preserves latest/pinned files, supports repeat input revision, and keeps revision conflicts distinct from storage faults. No existing application evidence was removed during testing.

### Existing Indicators and new setup demand

History-recovery delay is separate from actual provider cooldown. The runtime identifies setup-only acquisition when Indicators are hidden and only setup frames are requested. The request adapter/coordinator carry that classification through each page and retry without changing the normalized transport key, cache identity or coalescing behavior.

Missing/corrupt ledger history holds additional setup-only demand for a minute. Existing Indicator demand does not inherit that new cold-start hold or stop because the new ledger cannot be saved. Both still respect known provider cooldowns and in-memory spacing/rolling accounting. Ledger storage failure remains visible; durable enforcement cannot be claimed while persistence is unavailable. The limiter still does not cover every Moomoo caller or process.

Tests cover cold start, setup-only deferral, existing acquisition, storage failure, real cooldown semantics, durable reload, rollback and actual runtime classification. They do not deliberately hit provider limits.

## Verification

| Check | Result |
| --- | --- |
| Recorded four-detector suite | 1,111 assertions; nine tickers; confirmation witnesses for all four families; previous normal results unchanged. |
| Shared feed and refresh runtime | 27 checks; concurrent publisher/setup demand shares 1m/5m loads and authorization, repeat demand does not refetch, additional frames are separate, setup-only/existing classification verified. |
| Existing Indicator regressions | 268 assertions across refresh, calendar/session, correction cache, native history adapter and actual publisher refresh route. |
| Routes and storage | 44 checks against actual handlers/parser/store with offline authorization and virtual storage. Owner/member/Premium access, settings validation/revision, delivery disabled, file/byte rotation and controls verified. |
| Card and admin | 23 checks against actual TSX with deterministic hook/browser/MUI doubles. Four readings, missing/stale states, tooltip handlers, hidden-tab suppression, cleanup, per-publication override and save controls verified. No browser paint/layout or MUI portal acceptance is claimed. |
| Focused TypeScript | Zero diagnostics in setup/feed/store, changed request/history/runtime modules, member/admin components and TS QA harness. The imported graph still has the 24 previously recorded missing migration imports; no whole-app build/typecheck pass is claimed. |

The counted suites total 1,473 assertions, plus the separate recorded fault checks. Tests use retained market observations or explicitly identified synthetic/virtual dependencies. No ticker-specific rule was added.

Card/admin source review used the React checklist for state, effects, cleanup, accessibility handlers and request ownership. No visible layout/control design changed. Existing Help describes shared data, cached audit, independent Indicator visibility and notifications off; those statements remain accurate and required no Help wording change.

## Evidence

- Normal recorded replay: `data/watchlist-setup-validation/1792293333110-85841545/results.json`.
- Fault correction receipt: `data/watchlist-setup-validation/final-qa-1792293342876-4c5149c6/results.json`.
- Earlier pre-fix receipts and the previous QA report remain untouched.
- Reproduction scripts: `src/scripts/verify-watchlist-setups.ts`, `verify-watchlist-setup-feed-runtime.mjs`, `qa-watchlist-setups-final.ts`, `qa-watchlist-setup-routes.mjs`, and `qa-watchlist-setup-ui.mjs`.

The UI harness uses the existing canonical TypeScript dependency, not a local app build/server. TS replay scripts use the canonical `tsx/dist/loader.mjs` with a 256 MB heap. The VM shared-runtime harness needs Node transform-types/VM-module flags; the route harness uses strip-types/VM-module flags.

## Remaining acceptance boundary

No additional blocking finding was identified in this focused correction pass. Existing analysis approval, owner editing, publication/gain prices or times, notes, levels and Discord/email/push delivery code were not modified by these corrections. Setup availability still cannot block their controls. Request deduplication passed within the shared hosted Watchlist paths tested; this is not a claim of deduplication across unrelated services.

Detection remains off and undeployed. No local app build, hosted/browser test, live native-data/capacity test, actual account authentication or notification delivery test occurred. The prior nonblocking audit UI gaps remain: feed/admission details are available in the API but not displayed by this panel, and its ticker list refreshes on reopening. These are not represented as completed UI enhancements. The other three setup families remain deferred.
