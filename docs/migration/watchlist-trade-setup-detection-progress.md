# Watchlist Trade Setup Detection Progress

Date: 2026-10-17

Plan: [Watchlist Trade Setup Detection Plan](watchlist-trade-setup-detection-plan.md)

## Current boundary

Latest Setup Results QA: [all three aggregation corrections](watchlist-setup-results-progress.md#correction-and-final-qa) pass: machine-precision price comparison, preserved stage history with confirming-series outcome isolation, and validated atomic ingestion. The existing 1,706 assertions plus 130 new regression assertions pass, with recovery/concurrency probes and zero focused TypeScript diagnostics. No new actionable finding. No deployment, notifications or live provider requests; browser/native live and current-main integration acceptance remain separate.

Setup Results extension: [local implementation and QA](watchlist-setup-results-progress.md) complete for retained-history stage counts, post-confirmation observations, filters, pagination and input/candle audits. 1,706 focused assertions pass, plus recovery/concurrency probes. No additional Moomoo requests, detector changes or notifications. Owner-only, disabled/undeployed with the parent feature; current-main integration, browser visual and native live acceptance remain separate. These are retained-history observations, not lifetime totals or simulated trade profits.

Final recheck: [Revision 9 final QA receipts](watchlist-trade-setup-recovery-fix-2026-10-18.md#final-independent-recheck) pass all four setups, shared feed, card/admin controls, eight recovery-exception cases, spacing/cooldown and deduplication scenarios. All 1,473 standard assertions, focused TypeScript and scoped whitespace checks pass again. No new actionable finding or application source change. Disabled and undeployed; live provider capacity and actual browser visual acceptance remain separate. No notifications or live provider requests were sent.

Latest QA: Revision 9 completes the [recovery cleanup fix](watchlist-trade-setup-recovery-fix-2026-10-18.md). Every attempt releases its own recovery flag on all exits, including eligibility exceptions. Eight exception cases and concurrent ownership pass, with no phantom transport audit or extra retry before dispatch. Spacing/cooldown regressions, tested deduplication and all 1,473 standard assertions pass again; focused TypeScript reports zero diagnostics. Only coordinator source, the offline regression harness and documentation changed in this slice. No live provider call, application settings/data change, notification or deployment occurred. Earlier correction receipts below remain historical.

Latest boundary: Revision 8 fixes the shared request race found by [followup QA](watchlist-trade-setup-followup-qa-2026-10-17.md). [Dispatch correction QA](watchlist-trade-setup-dispatch-correction-qa-2026-10-17.md) records serialized eligibility/admission/actual launch, immediate cooldown observation, actual-start persistence and no duplicate execution after post-launch storage failure. Original races and additional edge cases now pass. All 1,473 standard assertions and earlier correction checks pass; focused changed-source/component TypeScript has zero diagnostics. No additional blocking finding was identified in this pass. No deployment, live provider calls, notifications or application settings/data changes occurred; live capacity and browser visual acceptance remain separate.

Revision 7 corrects all three findings from the [final QA report](watchlist-trade-setup-final-qa-2026-10-17.md). The [correction QA report](watchlist-trade-setup-corrections-qa-2026-10-17.md) records completed-5m freshness, bounded history rotation/control reserves and separate setup-only admission recovery. All four setups and normal nine-ticker results remain intact. Nothing is deployed or activated, and no notification was sent. Live native-data/capacity, browser visual and release acceptance are still separate. The other three families remain planned for later.

Correction QA receipts: 1,111 recorded-engine assertions, 27 shared-runtime checks, 268 existing Indicator regressions, 44 route/storage checks and 23 actual-component checks passed (1,473 counted assertions plus separate recorded fault checks). The stale-frame failures now pass, normal incomplete 5m intervals and independent higher-low events are preserved, file/byte capacity recovers while latest/pinned records remain, and existing Indicators do not inherit setup-only recovery holds. Targeted source TypeScript reported zero diagnostics; the imported graph retains the 24 pre-existing migration-import diagnostics. Fresh artifacts are under `data/watchlist-setup-validation/`; earlier receipts remain unchanged. No actual application storage, settings or existing evidence were changed during tests.

## Complete inventory

- [x] VWAP Reclaim and Hold — local source/shared feed/recorded engineering checks; live acceptance pending
- [x] EMA9 Pullback and Bounce — local source/shared feed/recorded engineering checks; live acceptance pending
- [x] EMA20 Pullback and Bounce — local source/shared feed/recorded engineering checks; live acceptance pending
- [x] Higher Low Reversal — local source/shared feed/recorded engineering checks; live acceptance pending
- [ ] Premarket High Breakout and Retest — planned later
- [ ] Bull Flag or Momentum Consolidation Breakout — planned later
- [ ] Falling Wedge or Descending Pullback Breakout — planned later

## Planning work completed

- [x] Included the original six definitions and the owner's EMA20 addition.
- [x] Inspected existing indicator formulas, refresh service, candle aggregation/session helpers, request coordinator, Moomoo connection boundary, cached runtime contract, refresh route and Help coverage.
- [x] Recorded the local two-minute refresh limitation and the need to measure a shared minute-close feed before promising timely alerts.
- [x] Defined timeframe/anchor distinctions, chronological states, provisional numeric rules, duplicate grouping, missing-data rules and immutable event history.
- [x] Specified all seven detector sequences, independent owner controls, proposed member/admin UI and optional notification workflow.
- [x] Added request/resource budgets, replay/holdout checks, provider failure cases, private/Premium protection and unchanged-behavior acceptance criteria.
- [x] Linked the plan from the parent Watchlist plan and migration records without rewriting their earlier content.
- [x] Performed a documentation-only consistency review; no application tests or build ran.

The review clarified separate 1m/5m ATR dependencies, prior-session impulse continuity, missing-sequence recovery after an outage, and ambiguous external delivery. Relative Markdown links resolve and scoped whitespace checks pass. These checks assess the plan, not detector implementation or trading results.

## Evidence and limits

Inspected source is the existing e70f worktree at HEAD `e718689bfef3bcbd2c966567e913dfd0638437db` with pre-existing dirty/untracked work. No current deployed revision, live connection quality, request capacity, actual pattern-detection accuracy or live UI acceptance is claimed.

Moomoo currently has a server-authorized OAuth/Web API path in the inspected code, matching the owner's confirmed connection type. The new feature must reuse existing compatible accepted candles and in-flight responses rather than assuming OpenD subscriptions or duplicating Indicators acquisition. General current WebAPI documentation states 100 requests/minute from one IP; it does not establish a separate verified quota for this free account. The 750 ms minimum start spacing and 80-per-rolling-minute coordinated budget are conservative planning defaults, not a polling frequency or provider entitlement. Existing candle volume/VWAP reliability and actual aggregate traffic remain future measured acceptance work.

Research links and the distinction between sourced principles and proposed numeric parameters are recorded in the plan. No paid AI request was made.

## Next checkpoint

The requested shared-feed and recorded-data work is complete locally. Review this source/verification slice against current main before an explicitly authorized release, preserving newer publication, pricing and visibility work. Live feed/latency and actual desktop/mobile acceptance remain unverified. Do not enable the feature, deploy or send notifications under this task's authorization. No application server or production build was started.

## First full plan QA

The owner requested a full pre-build QA of all seven setups on 2026-10-17. The [first QA report](watchlist-trade-setup-detection-qa-2026-10-17.md) records the eight findings as they existed before revision. It remains unchanged as historical evidence. Those findings are closed at plan level by Revision 2 and the second QA below; this is not a claim of implemented or tested detectors.

The findings cover the faster shared-feed contract, sparse session coverage, price versus volume confirmation, exact structural formulas, fast-pattern timeframes, moving indicator references, event grouping/lifecycle and per-detector held-out acceptance.

## Revision 2 and second QA

The owner authorized all eight plan fixes and another all-seven QA. The [second QA report](watchlist-trade-setup-detection-qa-round2-2026-10-17.md) records closure, the seven-family matrix, follow-up corrections made during review and the boundary between document review and future market validation.

- [x] Q1: Named hosted, per-frame demand scheduler, bounded backfill/current-window priority and honest shared-connection accounting.
- [x] Q2: Independent session anchors, sparse-range evidence and qualified observed premarket-high handling.
- [x] Q3: Price confirmation independent of explicit expanded/not-expanded/unavailable/uncomparable volume evidence.
- [x] Q4: Causal pivot/impulse selection, deterministic fit/tie rules and equal-length contraction windows.
- [x] Q5: Explicit 1m and 5m flag/wedge formation variants, preserving true timeframe labels.
- [x] Q6: As-known moving-average/VWAP observations separated from frozen structure and volatility scales.
- [x] Q7: Stable mixed-state groups, phase-level delivery identity, complete expiry/rearm/history and pending-failure preservation.
- [x] Q8: Real held-out positive/negative floors for every family/formation variant and defined missed/false/late populations.

The second review also corrected a borrowed EMA condition in the premarket retest, fixed descending-geometry failure handling, retained elapsed coordinates for sparse data, made last-candle receipt grace explicit, and avoided an unnecessary extra higher-low confirmation candle. Only the plan, this tracker and the new second-QA report changed during this task. No application tests or build ran.

## Revision 3 and third QA

The owner requested existing Moomoo reuse without duplicate requests, combined-limit accounting and another QA. The [third QA report](watchlist-trade-setup-detection-qa-round3-2026-10-17.md) records the source/document checks, all-seven review, desk scenarios and remaining implementation boundary. The first and second QA reports are preserved unchanged.

- [x] Confirmed existing 120-second runtime/Platform refresh and the current 5m-only shared-candle contract; the new 1m contract is an implementation task, not an existing capability claim.
- [x] Specified cache-first coverage, compatible in-flight reuse, actual outbound page identity, bounded accepted pages and per-consumer slicing. A fresh current minute can legitimately require a new request even when the date URL is unchanged.
- [x] Reconciled old/new refresh triggers into one acquisition owner. Seven detectors share the accepted window; hidden Indicators and disabled setups keep independent demand controls.
- [x] Separated current OAuth WebAPI documentation from unused OpenD documentation and the owner's unverified recollection of half-second pacing. No account upgrade, SDK migration or deliberate limit probing is assumed.
- [x] Specified combined same-egress accounting, every page/retry/auth attempt, conservative scheduling, preserved cooldown, current-work priority and honest unknown caller coverage.
- [x] Added relay timeout/cancellation, token-refresh sequencing, clock/restart and global-versus-account scope checks without changing detector formulas or owner publication rules.
- [x] Re-reviewed all seven setups and retained their coverage, causal time, independent volume, geometry, grouping and held-out acceptance requirements.

Only the controlling plan, this progress record and the new third-QA report were edited in this revision. Static document/number/link checks are not application tests or evidence of live capacity. No local app, test suite, provider traffic, paid AI request or production action was run.

## Group A implementation started

The owner said to proceed with the first four and retain the other three for later. This begins implementation, not live activation.

Completed in the first interface slice:

- Added `src/lib/live-watchlist/setups/setup-contracts.ts`: exact initial/later family inventory, independent price/availability/volume evidence, immutable timestamped references, mixed-state group/member snapshot and draft settings types. It has no side effects, provider calls, route, storage writes or notification code.
- Prepared `C:/Users/jerac/.codex/visualizations/2026/08/30/01a050dc-6271-7c13-b4b4-5e82f21f8549/watchlist-trade-setups-review.html` as a local, sample-data interface review. Ticker page/Admin views and member-state examples work only within the review; Save settings never writes to the app.
- Proposed one grouped Trade Setups card immediately above existing Indicators, independent constituent states/volume qualifiers, a collapsed sequence, and a separate click-to-open admin section. The per-ticker checkbox belongs in expandable settings, not the crowded main publishing actions. The other three detectors are not offered as finished controls.
- Read existing Indicators markup/styles and Help. Help will need Trade Setups guidance when live behavior is implemented; existing Help is unchanged because the feature is not active.
- Checked preview JavaScript syntax with `node --check`, read back the contract/preview, and checked scoped whitespace. The preview has no external requests. No browser/render acceptance or application test is claimed.

Boundary at that earlier checkpoint: user-interface approval was pending and detection remained unwired. The owner subsequently approved the interface and the source slice below was implemented. Existing first/second/third QA files remain unchanged historical evidence, not implementation acceptance.

## Four-detector source slice — 2026-10-17

Implemented locally, not live:

- `src/lib/live-watchlist/setups/setup-input.ts`, `setup-engine.ts`, `setup-volume.ts` and expanded `setup-contracts.ts`: accepted-frame input, causal pivot/impulse observations, chronological VWAP/EMA9/EMA20/higher-low sequences, separate price/volume/availability states, fixed low/response references, deadlines, terminal/rearm handling and conservative same-cycle grouping. All rules are shared across symbols; no ticker-specific prices or branches.
- `src/modules/watchlist/server/setups/setup-store.ts` and `setup-runtime.ts`: serialized bounded evidence/settings persistence beside Platform data, immutable evaluation records, current snapshots, settings revisions, per-publication overrides and owner-visible current-process failure status. No migration, Journal change or external transport. A 4 MB record / 100 MB directory / 5,000-file limit stops new setup evidence writes and reports storage attention; it does not block existing publishing. Retention/pruning acceptance remains open rather than silently deleting evidence.
- A narrow callback in `indicator-refresh-runtime.ts` consumes the **same** accepted calculation. Detection adds zero Moomoo requests. Its failure cannot reject an analysis or prevent an existing Indicator refresh/publication.
- `app/api/live-watchlist/symbols/[symbol]/setups/route.ts`: authenticated, private/no-store cached reads, with ticker and analysis-price access checks before data projection. It cannot initiate provider acquisition. Private/Premium restrictions remain in force.
- `app/api/admin/watchlist/setups/route.ts`: existing owner authorization, same-origin mutation protection, bounded bodies, optimistic settings revision, active-publication selection and retained-input export. Setup notification delivery remains unavailable in this development slice; this does not restrict existing analysis approval or delivery.
- `app/watchlist/watchlist-setups-card.tsx` and CSS: grouped card above Indicators, individual price/volume states, click/tap help, collapsed sequences/history, stale-data handling and abortable cached reads. Cached HTTP polling is not provider polling.
- `watchlist-setup-admin-panel.tsx` and narrow changes to `watchlist-runtime-admin-client.tsx`: separate lazy-loaded Setup Detection section, four detector/session controls, member visibility, expandable per-ticker settings and audit. No extra crowded ticker-row actions or public navigation.
- `live-watchlist-types.ts`: optional saved publication identity type, not a new identity generator. Help now covers the four initial setups and development controls while preserving unrelated guide edits.

### Source/version boundary

Worktree HEAD remains `e718689bfef3bcbd2c966567e913dfd0638437db`, with substantial pre-existing unrelated changes. This checkout's older Indicators server paths derive activation from symbol/time. They were **not** rewritten or copied over concurrent work. The new adapter deliberately requires the saved publisher UUID and cannot adopt an old activation or change displayed posted time.

A read-only inspection of **cached** `origin/main` at `2c4621771a0d9deeaa607be0aa9654af189fa6cc` found the existing saved-UUID validator, persistence and protected refresh identity path. Its accepted-calculation callback has the same integration point used here. This is cached Git evidence, not a freshly fetched remote tip or proof of the currently running deployment. A release must apply only this slice's hunks to current main and retain the newer identity/visibility checks; publishing whole older worktree files would regress them. Existing source/working data were not replaced.

### Static review corrections

- Invalid/mismatched 5m evidence no longer discards independent usable 1m history. Missing VWAP/EMA dependencies have separate readiness, rather than falsely claiming every enabled detector was evaluated.
- Price gaps cannot provide consecutive closes or carry a below-VWAP phase across unknown observations. Missing volume remains unknown, never zero.
- Parent context loss is recorded even if a later impulse becomes available in the same calculation; terminal attempts require a new observed test to rearm.
- Group formation intervals and initial references are frozen; grouping considers the full trigger spread and cannot rename a current group just because an older sibling ages out.
- Recent-confirmation presentation expires independently of price failure. Original recognition/event knowledge times are retained when the same event is observed in a later accepted calculation.
- UI requests cancel on unmount, access loss clears the cached card, failed reads age the retained result, and no missing-data state blocks owner analysis approval.

### Earlier source-only verification and unfinished acceptance

Static TypeScript checking of the pure engine/dependency graph passed with zero diagnostics. Focused semantic TypeScript checking of the new member/admin components and their imported pure contracts/engine also passed with zero diagnostics, using a 384 MB heap ceiling and existing canonical dependencies without installing or copying packages. Static transpilation/syntax inspection of 13 directly changed TS/TSX files passed with zero errors; no application code was executed. These checks do **not** establish detection accuracy. Scoped tracked-file whitespace checks also passed.

Still required before calling Group A release-ready:

1. Independent setup demand when Indicators is hidden, shared minute-close acquisition/admission, request/cooldown accounting and measured feed latency. This slice intentionally piggybacks the current approximately two-minute accepted refresh; it does not claim the faster foundation already exists.
2. Chronological replay runner and saved real same-day/multi-day examples, corrections, missing-data/expiry/restart/grouping cases, per-family holdouts and marked-chart review. No application tests were run under the owner's current instruction.
3. Real desktop/mobile render/access acceptance and source integration with current main. The saved mockup was approved; rendered production behavior has not been reviewed.
4. Durable failure/retention acceptance, outcome observations and optional notification checkpoint. Notification transport is not implemented or silently activated.

No provider/AI request, live data mutation, service restart, notification, local app server/build, commit, push or deployment occurred. The other three setup families remain in the plan, not counted as completed work.

## Shared feed and recorded validation completion

The owner subsequently authorized finishing shared-feed integration and recorded-candle validation, explicitly without deploying or sending notifications. This authorization allowed the focused offline executions below; it supersedes the earlier no-test boundary for this slice only.

### Implemented integration

- `setup-demand.ts`: one pure union of Indicators/setup frame demand, current saved publication UUID, per-publication override and session selection. Private/unpublished/deactivated/old activations cannot start public feed work. Setup demand remains active when Indicators is hidden; both off means no demand.
- `setup-shared-feed-runtime.ts`: one minute-close-plus-five-seconds setup schedule registered by the existing hosted startup. The publisher route and this timer use the same `refreshPublishedWatchlistMarketData` operation. No catch-up timer queue or second provider client. Removed/disabled demand is rechecked before queued work starts.
- `indicator-refresh-service.ts`: shared in-flight acquisition, additional-frame follow-up without refetching common frames, per-frame completion reuse, fresh retained-input restoration and current-minute checks. A late publisher poll cannot defer the next genuine minute close merely because fewer than 60 elapsed seconds passed. Existing default two-minute Indicators and closed-session recovery behavior remain covered by regression checks.
- `indicator-refresh-runtime.ts` and `indicator-history-provider.ts`: exact saved-identity checks before each actual page/retry; setup-only demand does not create Yahoo requests. Accepted calculation callbacks and changed-settings/restart replay use the retained calculation rather than another market-data request.
- `setup-admission.ts` / `setup-admission-runtime.ts`: serialized, durable reservation of coordinated Watchlist starts, 750 ms spacing, 80-per-rolling-minute cap, cross-connection-scope 429 cooldown, conservative restart/clock/storage failure behavior. Missing/corrupt ledger history defers for one minute; it does not invent an empty usage history. This covers the hosted Indicators/setup path, not uncoordinated Analyzer/OAuth/scanner/other-process usage.
- The older local publisher/member Indicator paths and store received narrow saved-UUID preservation/alignment hunks matching the cached-main identity contract. No publication timestamp, displayed price, gain calculation, analysis prompt or owner approval rule was changed. Do not release entire older store/runtime files over current main; preserve all other current-main features.
- Setup Admin's existing protected response now includes shared-feed/admission status. Help explains independent setup demand. No outbound setup transport was added.

### Recorded checks and final receipts

See [Recorded Validation](watchlist-trade-setup-recorded-validation-2026-10-17.md).

- Final nine-ticker run: **1,111 assertions passed**, with recorded confirmations for all four setups. Inputs total 3,600 1m and 2,502 5m bars. Tickers: BDAI, LOOP, WFF, WETO, DRMA, YYAI, SHFS, RCT and TCRT.
- Exact result: `data/watchlist-setup-validation/1792291277530-c3aa1bfb/results.json`. Earlier successful runs remain separately saved. The result records source and code hashes, provenance limits, prefix checks, event counts and first confirmation witnesses. No account metadata is copied.
- Actual shared-feed/runtime modules executed in a VM with recorded bars and mocked account/HTTP access: **24 checks passed**. Concurrent publisher/hosted requests produced one common 1m/5m acquisition and one credential lookup; hidden Indicators, cache reuse, additional frames, disable, removal and old-identity rejection were checked. The actual ledger adapter also wrote/reloaded a new isolated `data/watchlist-setup-validation/ledger-sandbox-*` fixture, including retained cooldown. No application storage or worker was used. Windows denied rename in generic sandbox temp; the isolated file check passed inside the authorized workspace instead. Production persistence code was not weakened to bypass that restriction.
- Existing focused regressions: **84** Indicators refresh, **22** session/calendar, **25** correction-cache, **112** history-adapter and **25** actual refresh-route assertions passed. These remain offline controls, not live provider acceptance.
- Focused TypeScript inspection found zero diagnostics in setup/feed files and the verification entrypoint. The imported legacy graph has **24 unresolved migration imports** in the pre-existing dirty migration manifest. Those unrelated missing files were not fabricated or changed. This is not a whole-application typecheck/build pass.
- Replay exposed and corrected two general defects: backdated expiry observations and a 1m higher-low context depending on optional 5m history. No ticker-specific threshold or expected price was introduced.

Reproduce the recorded run from this worktree with:

```powershell
node --max-old-space-size=256 --import file:///C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/tsx/dist/loader.mjs src/scripts/verify-watchlist-setups.ts
node --experimental-transform-types --experimental-vm-modules src/scripts/verify-watchlist-setup-feed-runtime.mjs
```

The three complete-session Moomoo recordings use explicitly derived 5m bars; the six shorter packets have mixed/partly unspecified older-bar provenance and cannot establish complete session VWAP. These limits are retained in the report. The successful runs establish chronological engineering behavior, not held-out trading accuracy, native live data timing or profitable entries.

No live provider/AI request, application settings/data write, service restart, notification, app build/server, commit, push or deployment occurred. New machine-result files are separate validation artifacts, not live Watchlist records. Remaining release acceptance covers live/native feed latency/capacity, current-main integration, actual UI/access review, evidence-retention operations and optional notifications. The three later setups remain deferred.
