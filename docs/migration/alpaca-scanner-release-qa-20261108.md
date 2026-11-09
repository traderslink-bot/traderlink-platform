# Alpaca and scanner release QA

Owner requested verification of the live Alpaca Watchlist connection, then production integration of approved scanner/screener changes. Owner explicitly excluded unfinished chart work. New configurable ticker-card and indicator-layout proposals remain unimplemented and outside this release.

## Refreshed hosted evidence

- Platform production: deployment `b3ba9e33-3bf4-4bd5-8073-c334e319e486`, SUCCESS, main at `cb2de2f80fc799790aaaf77c9ee7c032e6733283` (Alpaca provider-switch integration).
- Watchlist runtime: deployment `b7a6ddff-1902-49e4-b414-b0bc9db918aa`, SUCCESS, staging environment. This staging-named runtime is used by the live Platform; preserve its data and effects.
- Platform provider environment selects Alpaca. Runtime historical, live and same-day environments select Alpaca.
- Authenticated runtime GET `/api/runtime/status`, using the live Platform's configured URL/token in memory: HTTP200; actual historical/live/same-day selection Alpaca; same-day active Alpaca, ready, no fallback. Price-feed status closed and no last live update reported at this closed-session checkpoint. This does not prove next-session streaming acceptance.
- Platform `/api/platform/health`: HTTP200, ready. Runtime `/health` was not a successful endpoint; authenticated runtime status is the qualified runtime check.
- Configured hosted gateway historical read: NWGL, November 6 09:30–10:30 Eastern, HTTP200, 31 actual bars, SIP, split adjustment, complete; timestamps strictly ascending and OHLC ordering valid. Same request without authentication returns401. No credentials printed or saved.

## Consolidated discovery ledger — in progress

| Area | Evidence / current result | Required disposition |
| --- | --- | --- |
| Alpaca adapters/gateway/session data | Six focused files, 13 tests pass | Preserve and include in applicable integration checks |
| Watchlist refresh | 84 offline assertions pass | Synthetic verification only |
| Request coordinator | Offline coalescing/throttle/retry/isolation checks pass | Preserve |
| Full scanner + Alpaca source inventory | Final consolidated retest: **55 files / 381 tests pass** after test-harness corrections and restoring known missing source | Exact integrated candidate still requires its own build/browser verification |
| Scanner client test mocks | Corrected shared-hook mock, actual Open/Add chart semantics, Scanners and High Drops labels, provider control mock | Existing behavior assertions retained; no new product implementation |
| Market Events client harness | Real parent-owned hook now supplies required data; halt/PR article and chart-action assertions pass | Preserve shared-source behavior |
| Audit route completeness | Restored four missing files after asserting live `cb2de2f8` and preservation-ref bytes are identical; audit route tests pass | These are existing live routes, not a new feature or deletion |
| Release scope | Latest preservation ref `93a609c47e02cd3e16848921eeaf2beb3e55963c` includes unfinished chart changes | Coordinator must derive an explicit scanner allowlist excluding chart work; no whole-ref merge |
| Runtime full integration | Hosted status/data checks above pass; canonical runtime tests/build evidence requested from Coordinator | Reconcile existing cutover evidence and any remaining full runtime checks |
| Browser / final integrated build | Not run for this release candidate yet | Run after coherent candidate and corrections, one heavy operation at a time |

## Coordination and retained boundaries

Coordinator thread `01a19f74-8e08-7742-8646-ba1c46ce9e58` was contacted under the owner's release request. Requested current ownership, canonical runtime source, prior cutover evidence and exact integration lane. Reported refreshed hosted state and explicit exclusion of unfinished charts. No new release, hosted configuration change, service restart, database mutation or provider-setting change has been performed by this QA task.

Coordinator refreshed both services and verified ten installed runtime source hashes against `14748d4fd18a55623ad6cbe9c378afeee3ba5139`. Both remain healthy, persisted provider selections remain Alpaca, and the release lane was idle. Coordinator is investigating existing Platform full-CI failure and mapping the exact chart-excluding integration boundary. Do not assume prior deployment equals browser/live-market acceptance.

Offline audit persistence/restart/pagination/expiry verification additionally passes 24 assertions. Exact-file lint passes on the three corrected test files and four restored audit routes. Initial failing broad runs remain discovery evidence, superseded for this inventory by the final 55-file passing run.

Source reconciliation correction: both the mixed working `premarket-pullbacks-card.tsx` **and the latest feature preservation ref** contain a stale Premarket High Pullbacks implementation. The live `cb2de2f8` file contains the correct High Drops implementation, reference-high handling, optional-price formatting and news drawer links. Candidate integration must retain that live source as its base and review only intended control/style deltas. Do not take the stale feature file wholesale. It was left untouched. Coordinator has been notified.

The earlier focused scanner/provider type check passed, but expanding its input inventory to the three UI test files exposed two nullable-price errors through that stale feature card. This expanded check is not passing. Exact integrated-candidate type/build acceptance must verify the retained live High Drops implementation; the passing 381-test run does not resolve this source reconciliation requirement.

## Additional live bridge finding and correction

Authenticated production GET `/api/live-watchlist/moomoo-candles` returned200 ready and31 NWGL candles for the same historical window, proving the real Platform Watchlist bridge works through the selected Alpaca path independently of Moomoo login. Its response incorrectly hardcodes `provider: moomoo_open_api` and its thrown-error code also names Moomoo. Live source inspection confirms this metadata defect.

Prepared narrow provider-aware response/error metadata correction in that existing route. Authentication, request bounds, candle values/timestamps and endpoint path remain intact. Four new route regression tests pass (authentication/range rejection before provider calls; exact Alpaca identity/values/timestamps; retained Moomoo identity when selected; unavailable and thrown failures). Exact route/test lint passes. The Coordinator was asked to verify canonical runtime consumer compatibility before integration. The old opt-in `verify-watchlist-indicator-hosted-history.mjs` script also assumes Moomoo metadata and must not be represented as Alpaca acceptance; it was not run for this QA.

Help review: this correction changes server metadata only; no member-facing controls or guide workflow changed. Existing scanner route/UI Help alignment remains part of Coordinator candidate integration.

Coordinator confirmed a strict raw-loader dependency in exact runtime `14748d4f`, including a direct AI-manager path not bypassed by same-day Alpaca selection. The Platform-only metadata correction is therefore held from integration until the runtime is compatible. Prepared a three-source exact-parent runtime patch plus 56-assertion offline regression proof; no runtime checkout or hosted state changed. [Immutable compatibility handoff, fingerprints and runtime-first sequence](alpaca-watchlist-ai-provenance-handoff.md). Full canonical runtime build/integration acceptance remains with the Coordinator.

Do not re-switch an already selected provider merely because earlier local migration documents predate its deployment. Moomoo login troubleshooting is deferred at the owner's request. Keep Moomoo code and existing user data. No preview refresh until the consolidated correction batch and applicable release-candidate QA are ready.
