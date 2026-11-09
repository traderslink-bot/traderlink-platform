# Alpaca split comparisons and live scanner chart correction

Owner reported reverse splits producing false Top Gainer percentages, then clarified every side-card chart is unavailable in the second authorized private account on the live site. Watchlist consumer work belongs to its existing task; unfinished chart design remains parked. This is a correctness repair, not a scanner retune or chart redesign.

## Discovery and fixed scope

Current confirmed live Platform base: `08214bf084e53c9d59e2e975892c7f64a9a90b87`. Watchlist runtime is `be659dec9df4f966c9c6221264c8e0752f67f6c3`. Shared gateway still runs pinned source `ab638bf11eda88e3fccef2f3a0f162d89dbe02df`; do not deploy the mixed working gateway or activate its later event prototype.

| Finding | Evidence | Correction / verification |
| --- | --- | --- |
| Scanner previous close is raw | Direct Alpaca read: ADGM raw0.0649/adjusted1.947; ARAY0.11/4.4; SMX1.76/4.928. Same sampled prices produce false2917.72% vs0.59%,3190.91% vs-17.73%,228.41% vs17.29% respectively | Batched provider split-adjusted prior daily close with explicit symbol/date/freshness identity; no raw fallback or local split multiplication |
| All side-card charts blocked for second private account | Published chart proxy uses a separate single-user environment guard while Scanners uses the established two-account navigation guard; owner confirmed affected account. Coordinator verified configuration present, but its installed process probe was transport-blocked | Reuse existing private Scanners access function for chart bars/stream; retain authentication, denied-account, credential and transport boundaries |
| Chart candles exist | Direct authenticated running gateway `/bars` returned200 for ADGM/ARAY/CISS/SMX/WCT/STKH,735–2505 bars in the sampled responses | Do not report provider coverage missing when app access rejects the request |
| Legacy chart history is raw | `/bars` truthfully reports adjustment raw and source requests raw; newer shared `/history` already requests split | Correct the legacy chart history path to split adjustment; retain actual UTC timestamps/current-session streamed prices and volume |
| Split cache/date boundary | Snapshot cache and chart history can outlive an Eastern date transition; raw previous-bar rollover is not an adjusted baseline | Date-scoped adjusted reference cache and chart rebase notification/reload; test rollover and failed refresh without raw fallback |
| Watchlist historical adapter | Watchlist task confirms SIP/split/complete history already used, including SMX prior close4.928 | Leave it unchanged; never multiply already adjusted history or rewrite saved publication/gain-start facts |
| Float/turnover | Float is separately enriched, with a30-hour freshness policy; retrieval time is not a corporate-action effective timestamp | Do not infer split-adjusted float from price ratios or mutate vendor facts; record separately from Alpaca price-history correctness |

## Adjustment contract

Use Alpaca historical1Day bars with `adjustment=split`, including its forward/reverse split treatment. Select the latest actual bar strictly before the current Eastern trading date. Return symbol, price, actual bar timestamp, `adjustment: split`, basis date and fetched-at time. Cache by symbol and basis date with a bounded TTL; paginate batched results completely before accepting them. Missing, invalid, stale, mismatched-date or incomplete references remain unavailable. Latest trades, actual session share counts and dollar volume are not multiplied. Historical adjusted prices/volumes are not adjusted again.

Gain ranking must not admit an unavailable comparison even if the admin gain threshold is unset. Preserve after-hours comparison against the same day's regular close, independently of prior-day adjusted references. Preserve genuine large moves; no guessed split ratios, percentage caps or artificial price/volume.

## Qualification and integration

Complete one coherent fix batch with synthetic forward/reverse/no-split, fractional ratio, missing/stale reference, pagination/failure/retry/rollover, ranking, access, history and cancellation checks. Confirm provider-backed examples read-only. Review actual live code rather than importing parked chart preferences/history UI. Keep one heavy check at a time and preserve the mixed checkout/index.

Coordinator owns exact-parent reconciliation, pinned gateway bundle upgrade and any hosted release. Supply explicit Platform and pinned-gateway deltas, dependencies and qualified deployment order; no autonomous gateway restart. Watchlist task has confirmed no shared-file overlap and requests truthful adjustment basis metadata. Help changes are unnecessary unless user-facing controls or workflow change.

Primary references: [historical bars](https://docs.alpaca.markets/us/reference/stockbarsingle-1), [corporate actions](https://docs.alpaca.markets/us/reference/corporateactions-1). Alpaca warns that corporate-action publication can be delayed; incomplete adjustment evidence must not be replaced with a guessed ratio.

## Owner steering and current local checkpoint — November 9

Owner confirmed the primary private Discord account works while the second fails. Owner then requested the developed shared chart for both existing private accounts and real-time price/volume/candles/scanner updates. This supersedes the earlier parked-chart exclusion for review preparation. **Owner subsequently prohibited every deployment until expressly ready.** Coordinator and Watchlist task were notified; no gateway installation/restart, hosted change or preview update has occurred in this slice.

Local repair now includes a chart-only active-minute trade builder with complete paginated current-minute startup history, buffered-stream deduplication, condition-aware volume/price handling, sub-millisecond ordering and official closed-bar reconciliation. It emits provisional intraday candles and a separate price guide at a250ms publication cadence over the existing SIP socket. The shared renderer updates the active bucket incrementally. Daily-chart intraminute OHLCV reconciliation remains a separate open qualification item; do not claim all timeframes complete from the intraday proof.

The browser scanner transport now subscribes to completed model publications by SSE instead of a second1s/5s poll. Backend event evaluation remains the explicit opt-in1s serialized path; the deployed sampled detector remains5s until a reviewed configuration/artifact is installed. Do not present an SSE transport alone as proof that the sampled evaluator became event-driven. Five-second activity/confirmation windows retain their trading meaning and are not shortened as network delays are removed. Full audit load/capacity remains required before enabling fast evaluation.

Watchlist's shared multi-symbol price transport is specified in [the protocol1 contract](alpaca-live-price-stream-contract-20261109.md). Local `/prices` implementation uses independent consumer leases, actual provider and gateway receipt/emission times, bounded output, status heartbeats, eligible trade prices, stale-bootstrap protection and one shared SIP socket. It is not installed. Watchlist owns its local Runtime adapter and removal of its downstream15s publication throttle. BOATS overnight remains REST, explicitly outside the SIP streaming claim.

Private `/charts` selects the developed component only for the existing private Scanner allowlist; other accounts retain the existing embedded chart. Chart bars/stream and preference APIs enforce the private gate as well. Account emails/IDs are not added to source. Persistent chart preferences remain isolated per authenticated user.

Verification so far: full Alpaca module suite19files/76tests passed before the final preferences/SSE additions; subsequent focused settings/event comparison/flow4files/11tests and HTTP/event flow2files/14tests passed. Exact edited-source lint found one prefer-const issue in SSE cleanup, corrected locally. Direct working-tree typecheck reports the pre-existing High Drops engine/contract mismatch; a live-baseline engine/calculator overlay instead exposes the two already-recorded nullable-price errors in the unchanged High Drops card. Neither is an all-green application build claim. Complete combined regression is in progress; source and installed/browser acceptance remain distinct.

Remaining: consolidate full regression results; qualify exact source using current live High Drops wiring; shared chart/browser reconnect and daily current-candle behavior; actual measured source/receipt/UI timestamps; scanner audit capacity at intended universe size; immutable explicit-allowlist source handoff; coordinated review only. No production-ready or all-real-time claim yet. Help inventory reviewed: correctness/transport introduces no user control change; the private chart's newly exposed settings need guide coverage before release acceptance.


### Combined regression result

Final combined module run passed59files/395tests. The first broader run exposed23 UI harness failures because old polling fixtures had no EventSource; those fixtures now deliver explicit pushed model events and assert one stream/no model-fetch polling. Existing state, table/card, side workspace, Admin and news assertions remain; a new visibility/unmount check verifies subscription cleanup. Updated exact-source lint passes. Required dashboard-template enforcement retains its known3pass/4fail baseline involving the shared layout/navigation/shell, unrelated to this repair. No test failures are omitted from this account.

Changed source has not been deployed. The working tree's old High Drops calculator/card must not replace the approved live version: a typed candidate overlay must include live engine, calculator AND card while applying only the intended comparison-validation changes. Full production build and browser/installed transport acceptance are unrun at this checkpoint. The owner hold is the controlling release boundary.

Candidate source type qualification: zero diagnostics when preserving the exact live08214bf0 High Drops engine/calculator/card and applying the two null-comparison qualification edits. This is a deliberately named candidate overlay, not a claim that the mixed working checkout's older High Drops files were repaired or all project types pass. Existing hosted High Drops behavior is retained.

### Daily and browser qualification completed locally

The daily intraminute item above is now implemented: daily-only chart consumers build the active Eastern day directly from complete paginated trades using separate daily SIP price/high-low/volume eligibility. Extended-hours prices cannot contaminate daily OHLC, and startup overlap is deduplicated. A later completed partial daily bar cannot regress a newer fully rebuilt active day. Daily startup has bounded200pages/2million-trade identity coverage, streaming aggregation and shared per-symbol/day subscribers; unavailable/incomplete reconstruction falls back to official daily messages rather than inventing a complete candle. New-day observations invalidate the old day immediately. Midnight calculation is tested across both DST changes. Intraday consumers retain their small current-minute bootstrap.

The real shared React/Lightweight Charts renderer passed isolated Chromium qualification through `src/scripts/verify-alpaca-chart-live-rendering.cjs`: six timeframes, live OHLCV changes, daily stream selection, indicator persistence after symbol change and full source/chart cleanup. It uses the actual public chart API with synthetic intercepted history/preferences and SSE; no server/preview/production/provider connection was started. First harness attempts encountered a missing default browser revision/full-Chromium library and a fixture route-evaluation deadlock; the installed headless-shell and Node-side fixture construction resolved those harness issues. Final check passed with no page errors. This is actual renderer qualification, not installed production latency proof.

Updated Alpaca module suite19files/82tests passed; final daily/intraday/gateway/proxy focused3files/17tests passed. [Help copy](shared-chart-help-draft.md) is prepared for the private chart availability, without publishing instructions to accounts that still receive the embedded chart. Deployment hold remains intact.

### Final local correction checkpoint

Combined scanner and Alpaca regression59files/400tests PASS after daily construction, rollover, stream routing and browser transport corrections. Edited-source ESLint PASS without warnings. Candidate TypeScript check PASS with zero diagnostics using the exact live High Drops engine/calculator/card and the two comparison-availability edits; unrelated working-tree High Drops files remain preserved.

Synthetic full-capacity run through the actual engine and durable audit store:4000symbols,20cycles,80000observations, median150ms/p95=168ms/max175ms for evaluation plus full compression/fsync/SQLite write; audit-write p95=104ms, heap113MiB at measurement. Largest raw cycle6,661,702bytes, stored evidence11,036,499bytes for20cycles, control database6,648,464bytes. Temporary synthetic data was closed and removed by the producer. This qualifies sequential local throughput; provider transport/concurrent-user behavior and hosted storage lifetime are separate. At the worst-case measured4000-symbol1s cadence, evidence alone projects about31.8GB per16-hour day, so do not infer long-term retention from a throughput pass. Current configured small-cap universe remains an independent owner setting; no market-cap ceiling, retention or audit evidence was changed to obtain a pass.

Remote main refreshed read-only and remains08214bf084e53c9d59e2e975892c7f64a9a90b87. Runtime paired consumer is7e34c65d333713836fb71726a0c602c8fc369012, docs-only follow-upb3f63e0b8ff16129af4f2189c9e2a5ab1b14f453. Watchlist confirmed real matching LivePriceHub→isolated HTTP→actual Runtime consumer delivery228ms,95focused Runtime tests and full Runtime TypeScript pass. No real provider request or installed endpoint was used in that integration proof. The owner's deployment/restart hold still controls every service.

Review packet: [exact42-path Platform allowlist, eleven-input gateway build and recovery sequence](alpaca-realtime-review-handoff-20261109.md). Verified source is775374d886bb8286ffb585bb9ba0dae7abfb7409; artifacts were built from Git objects, never from unknown mixed files. No installed effect.
