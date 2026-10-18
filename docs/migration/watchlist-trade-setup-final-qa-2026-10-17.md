# Watchlist Setup Final QA

Date: 2026-10-17

Result: **not ready to release**. The four detectors pass the existing recorded-candle checks, but this independent QA reproduced stale 5m confirmation, storage exhaustion and a feature-off Indicators delay. Application source was not changed during this QA. No deployment, provider request, notification, live data/settings mutation or service restart occurred.

Plan: [Watchlist Trade Setup Detection](watchlist-trade-setup-detection-plan.md). Progress: [implementation and verification](watchlist-trade-setup-detection-progress.md).

## Findings

### P1 Stale five minute inputs can confirm EMA setups

`src/lib/live-watchlist/setups/setup-engine.ts:181–183`, `249–261`, `334–353`, `420–425` select the most recent available 5m observation without checking whether it covers the current observation window. Dependency readiness uses the newest 1m timestamp and whether 5m ATR/slope exist, not the age of that 5m context.

The new offline fault check retains the real recorded minutes and deliberately stops subsequent 5m updates. BDAI produces an EMA confirmation 89 minutes after its final available 5m candle; WFF produces one 11 minutes after. Both EMA dependencies still report Ready. These are fault-injection results, not claims that these faults happened in production.

Correction needed: require the appropriate completed 5m context at each decision time, distinguish a normal still-forming 5m interval from missing updates, and make only dependent detectors unavailable. Preserve already recorded events and independent 1m higher-low evaluation. Test stale frame recovery and session boundaries as well as an ordinary four-minute wait within a valid 5m interval.

### P1 Accumulated evidence eventually stops results and settings saves

`src/modules/watchlist/server/setups/setup-store.ts:16–18`, `68–95`, `102–109`, `120–130` retain a new full immutable record for each changed accepted calculation and another full latest record. Storage has 100 MB and 5,000-file ceilings, with no rotation/pruning or separate space reserved for controls. Once full, new evidence cannot be saved. Settings saves first create another immutable file, so even disabling detection through the normal control can fail.

The actual store was executed against a virtual directory containing 5,000 files. Saving disabled settings failed with `setup_storage_full`; no real files or application settings were changed. Actual full-session recorded records measured 230,941–354,289 bytes. If successive records stayed at those measured sizes, roughly 281–432 immutable records plus one latest record would consume the byte ceiling. This illustrates capacity, not a forecast of production growth; runtime retained windows and event counts can differ.

Correction needed: bounded retention with safe latest-record preservation and predictable recovery, plus control writes that remain possible at the evidence limit. Keep a replayable retained window and distinguish disk/storage failure from an optimistic-revision conflict. Do not remove existing evidence as part of this QA.

### P2 The new admission ledger delays existing Indicators with detection off

`src/modules/watchlist/server/indicators/indicator-refresh-runtime.ts:37` installs the new admission gate for every Moomoo Indicator history request, irrespective of setup demand. `src/lib/live-watchlist/setups/setup-admission.ts:18–45` puts a missing ledger into a 60-second hold. The offline check reproduced initial deferral and successful admission after that window. Normal frame retry cadence can delay recovery further.

Conservative recovery for new setup demand is planned. Applying its missing-ledger hold to existing Indicators when Setup Detection is disabled changes existing behavior. A first deployment with no ledger, or a ledger storage failure, can defer primary Indicator acquisition and cause fallback/retained results instead.

Correction needed: distinguish existing Indicator demand from extra setup demand and preserve foreground/existing-service behavior while the new feature yields. Keep known provider cooldowns enforced; do not bypass an actual 429 or claim that unrelated Moomoo callers share this ledger.

## Checks completed

| Scope | Result |
| --- | --- |
| Four detectors, recorded bars | 1,111 assertions passed across BDAI, LOOP, WFF, WETO, DRMA, YYAI, SHFS, RCT and TCRT. Every family has recorded confirmation witnesses. |
| Shared feed and actual refresh wrapper | 24 checks passed. Concurrent publisher/setup demand shared two 1m/5m loads, one authorization operation and one accepted calculation in the tested fixture. Repeat same-window demand added no loads. |
| Existing refresh, calendar, correction cache, history and refresh route | 268 checks passed: 84 + 22 + 25 + 112 + 25. Offline fixtures only. |
| Admin and member route handlers | 28 checks passed for owner/member access, Premium gating, identity, no-store headers, bounded body, configuration validation, revision conflict and disabled setup notification delivery. Dependencies were in-memory doubles; this does not prove hosted authentication. |
| Storage-limit reproduction | Three additional assertions reproduced the actual store's exhausted-file behavior using virtual storage. |
| Targeted TypeScript | Zero diagnostics in the detector/feed/store/routes/card/admin/new TS QA roots. Imported graph still has 24 previously recorded missing migration imports in `platform-migration-manifest.ts`; no whole-app typecheck/build pass is claimed. |
| Card and admin source review | Reviewed effect cleanup, timeout/abort handling, hidden-tab polling, identity checks, tooltip click/keyboard behavior, member price access, optimistic settings save and independent notification controls. No browser visual/interaction acceptance was performed. |

VWAP uses its named anchor and requires observed coverage; unknown gaps do not become zero volume. EMA9 and EMA20 use 5m averages with later 1m response-high confirmation. Higher-low uses causal 1m pivots and remains independent of a missing 5m frame. Existing checks cover these paths, candle chronology and missing-volume behavior, but do not establish trading effectiveness or exhaustive false-positive/false-negative performance.

Card/admin follow-ups: feed/admission status is available in the admin GET response but not rendered by the current panel; the ticker selector refreshes when the panel reopens, not continuously. These are usability/audit gaps, separate from the three release findings. Existing Help guides were reviewed and already describe the new section, shared feed and notifications-off boundary; no wording was changed during QA.

## Evidence and reproduction

- Full replay: `data/watchlist-setup-validation/1792291744959-fd85144a/results.json`.
- Independent fault receipts: `data/watchlist-setup-validation/final-qa-1792291813137-fe37a3a8/results.json`.
- `src/scripts/qa-watchlist-setups-final.ts`: recorded stale-frame checks, record-size measurement and fresh-ledger hold; network is disabled.
- `src/scripts/qa-watchlist-setup-routes.mjs`: actual route and configuration parser checks with offline dependencies; virtual capacity reproduction using the actual store.

Run the TS replay/fault scripts with the existing canonical `tsx/dist/loader.mjs`, 256 MB Node heap. Run the route harness with `node --experimental-strip-types --experimental-vm-modules`. The shared-feed harness requires `--experimental-transform-types --experimental-vm-modules`. No dependency installation or app server is required.

## Unchanged behavior boundary

No detector/provider fetch is initiated by the member setup GET or the card's polling. No setup notification transport exists in this slice, and the admin rejects enabling its delivery switches. Source review found no new dependency from analysis approval, publication price/time, gains, notes, levels or existing Discord/email/push publishing onto setup readiness.

The focused regression results support request reuse and retained Indicator calculations in their tested cases. They do **not** prove all existing Watchlist features are unaffected: the feature-off Indicator delay above is a concrete exception. Combined account/IP traffic, live native-feed timing, hosted capacity, browser behavior and owner visual acceptance remain unverified. The shared limiter covers hosted Watchlist Indicators/setup history, not Analyzer, scanner, OAuth or every Moomoo caller.

Keep the feature disabled and undeployed until the findings are corrected and regression-checked. Preserve the other three planned setup families as deferred work.
