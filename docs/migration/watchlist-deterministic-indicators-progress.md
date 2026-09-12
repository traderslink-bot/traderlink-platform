# Watchlist Deterministic Indicators Progress

Controlling plan: [Watchlist Deterministic Indicators Plan](watchlist-deterministic-indicators-plan.md)

## 2026-09-12 — Planning checkpoint

- Detailed plan created at the owner's request from the agreed discussion and prior source inspection.
- Recorded the latest owner decision: members see only Last updated, with no separate stale-data notice; provider details stay in existing admin diagnostics.
- Included the complete indicator/timeframe inventory, two-minute shared polling, Moomoo primary/Yahoo fallback, deterministic explanations, warm-up/session boundaries, zero AI cost and preservation of Potential Path ATR.
- Linked the plan from the Watchlist Runtime Dashboard Admin Plan without replacing its existing work.
- Documentation only. No feature implementation, tests, builds, servers, provider requests, migrations or deployment performed for this checkpoint.

## 2026-09-12 — Owner-requested post-QA plan revision

- Clarified that the existing default one-minute poll requests Yahoo candles, not Moomoo; production throughput is not established by source alone.
- Retained two-minute Moomoo refresh initially and added an explicit no-duplicate-poll/consumer-preservation checkpoint.
- Added sufficient prior-day intraday warm-up without an AI-token constraint, plus verification of actual adapter history capabilities.
- Clarified extended-hours session VWAP, daily reset, exclusion of yesterday's warm-up candles and reference-chart parity with matching settings.
- Added per-timeframe Last updated timestamps, session-aware volume baselines, exact interpretation-rule acceptance requirements, trailing candle corrections and stale activation-response protection.
- Planning corrections recorded. Numerical calibration, provider capability verification and runtime QA remain outstanding; no app changes, tests or deployment performed.

## 2026-09-12 — Primary-provider decision and audit requirements

- Made Moomoo the decided primary provider, with Yahoo fallback; removed any ambiguity that selection itself remains a proposal.
- Added admin request history, explicit rate-limit evidence, fallback attempt/results, coherent snapshot provenance, recovery, actual request counts and data-quality/publication outcomes.
- Added bounded persistent metadata, owner-only sanitized export, bounded numerical replay inputs, retention visibility and audit failure verification.
- Kept member display unchanged and AI usage at zero. Documentation only; implementation and live provider verification remain outstanding.

## Remaining implementation checkpoints

### Refresh service and owner audit route — 2026-09-12

- Added the actual owner-only `/api/admin/watchlist/indicator-audit` GET route and persistent-volume store binding. Authorization runs before storage lookup; retained calculation downloads are no-store attachments and expired input returns an explicit 410 state. The actual handler passed 18 focused injected-auth/storage assertions without touching live data.
- Added bounded correction/replay series state: exact starting checkpoints survive rolling cache limits; older corrections require seed history; stale activation/revision updates cannot publish; invalid updates are atomic. Eighteen offline assertions and a focused strict TypeScript check passed.
- Added `IndicatorRefreshService` joining provider history, calendar normalization, calculations, same-day VWAP, cache, per-refresh audit and immutable evidence. Initial history paging stops after sufficient warm-up/session coverage; subsequent updates reuse history, completed Daily reads are cached, and failures retain previous timestamps. Calendar-day memoization avoids repeatedly constructing time-zone/session boundaries for every bar.
- Added the server-only runtime binding to the existing owner Moomoo connection. It obtains access once for a logical ticker operation, scopes provider admission internally, removes credentials when the operation finishes and uses Yahoo when primary connection access is unavailable. No credential is included in a calculation result or audit entry. The legacy AI fetch function remains unchanged.
- The actual access callback additionally passed 14 focused injected-repository checks: exactly one configured connection, post-refresh quote permission, opaque admission scope and database cleanup on success/failure. These checks do not prove current production connection health.
- Forty-nine offline refresh-integration assertions passed across all nine named ticker fixtures (TRUG, TNON, AENT, FTFT, FEIM, BDRX, SURG, SXTC, PCLA). These are synthetic OHLCV integration fixtures, **not** real multi-ticker/provider acceptance. History/session checks also passed after integration changes.
- Authoritative source reconciliation: local worktree still lacks the newer `origin/main` Daily Recaps panel/owner service. Do not overwrite the released recap-enabled wrapper with this older page or claim menu completion from a stub. Preserve/reconcile the current main integration in the release lane; source/menu reconciliation is still required.
- Next: wire the single runtime scheduler and existing candle consumers; connect the member cache endpoint/card and lazy owner audit view; reconcile the complete admin menu; then Help and end-to-end checkpoint. This service is not yet called by a hosted scheduler and is not live.
- Open QA before acceptance: provider correction/adjustment-basis changes and complete older-history rebuild, concrete no-trade/provider coverage, request sharing with existing runtime consumers, true audit publication/transport counts, instance startup/recovery and all real-ticker fixtures. Preserve the complete plan; passing pure checks does not close these gates.

### Audit persistence checkpoint — 2026-09-12

- Provider/session adapters saved locally at `42ef3bd28`. Session checkpoint additionally passed 22 offline assertions; shared coordinator checks still pass. No push/deployment.
- Added bounded asynchronous file-backed `IndicatorAuditStore`, with separate metadata/calculation caps, paginated owner-history contracts, immutable compressed calculation files, oldest-first completed-record expiry and restart reconciliation to `interrupted_unknown`. No new Platform database migration is needed for this store.
- Added explicit 10,000-file-per-category safety bound to the plan; retained age can be shorter than 14 days under either storage bound. Directory inventory is loaded once, with sequential filesystem IO, and maintained by the single writer instead of rescanning file sizes on every ticker refresh. Audit failures stay isolated from data delivery.
- Offline audit fixture run passed 21 assertions covering persistence, pagination, restart state, immutable calculation lookup, traversal rejection, bounded queue, retention and expiry counters surviving restart. Focused strict TypeScript check passed. Fixtures used a small OS temporary directory only, not app data.
- Added an uncommitted server-only Indicator Moomoo access callback using the existing configured-owner/exactly-one-connection boundary and post-refresh quote-scope verification. The existing AI fetch function and route are unchanged. This callback is not yet called by a worker and its integration remains unfinished.
- Still required: audit API authorization/export integration, provider/history cache and logical-refresh worker, canonical runtime sharing, member card, unified admin menu, Help, complete focused/runtime checks and owner/release acceptance. No claim of live readiness.

### Provider history and session integration checkpoint — 2026-09-12

- Added concrete, injectable Moomoo/Yahoo HTTP history adapters, not active hosted scheduling yet. Each page/retry uses the shared coordinator; all timeframe calls share a ten-attempt and one-transient-retry provider budget per logical refresh.
- Verified the current Moomoo **Web API** documentation: native 1m/5m/15m/Daily use `ktype=1/6/7/2`; history is capped at 370 bars per page and `next_time` is passed as the following page's `end`. This is distinct from OpenD SDK enums and from the existing AI bridge's paging shape. Existing AI code remains unchanged.
- Added strict OHLCV/duplicate validation, bounded response bytes, native timeframe queries, explicit provider adjustment provenance, incomplete pagination outcomes, secret-free HTTP status/Retry-After evidence and abort propagation. Provider variants must never be spliced into one series without a rebuild.
- Added calendar-driven normalization using the existing verified calendar snapshot as input, without importing Coach runtime services. Completed-bar filtering, native timeframe alignment, holiday/early-close/DST boundaries and exact minute-by-minute same-day VWAP coverage are separate from pagination success.
- Ran 50 offline history-adapter assertions and focused strict TypeScript checks successfully. Live authenticated provider behavior, missing/no-trade coverage, all-ticker parity and runtime wiring still require verification. No live network market-data calls, AI calls, migration, server or deployment.
- Current integration work: persist refresh/calculation audit and cached histories; connect the authenticated Platform/provider boundary to the canonical Watchlist runtime; then wire member card and unified admin navigation. UI and complete feature acceptance remain outstanding.

Provider source: [Moomoo History K-Line](https://open.moomoo.com/api/quote/basic-data/history-kline), [Moomoo pagination](https://open.moomoo.com/zh-cn/api/quote/pagination). Documentation retrieved 2026-09-12. Unavailable rate-limit documentation is not replaced with guessed vendor error codes: explicit HTTP 429 is recorded as throttling; other failures retain their actual sanitized category.

### Shared-request coordination checkpoint — 2026-09-12

- Calculation foundation saved in narrow local commit `f2cd1ea6e`; no push or deployment. Unrelated pre-existing source/docs edits remain unstaged.
- Added pure injectable `indicator-request-coordinator.ts`: two-request pool, normalized-request coalescing, unique transport attempt IDs, abort/timeouts, one bounded transient retry, provider/connection-scoped cooldown, independent Yahoo scope, one recovery probe, and audit-write exception isolation.
- Added and ran `node src/scripts/verify-watchlist-indicator-requests.mjs`: offline coalescing, shared throttle, independent fallback scope, accepted-empty recovery, bounded retries/concurrency and audit-write failure scenarios passed. Provider adapters and actual transport integration are not yet wired; these results do not prove live Moomoo/Yahoo behavior.
- Focused strict single-file TypeScript check passed for the coordinator. No Vitest, broad tests, server, provider or AI requests.
- Integration discovery: the existing Moomoo route maps provider errors to generic 503 and its underlying provider catches HTTP/transport details. New indicator-specific transport must preserve sanitized rate-limit/outcome evidence without changing the existing AI route's behavior. Do not count a multi-page provider fetch as one actual HTTP call.
- Next: indicator-specific provider adapter/history contract and persistent audit storage, followed by member/admin UI integration. Existing request coordinator is not active in hosted workers yet. Exact session calendar coverage, same-day VWAP completeness and historical native intervals must be verified rather than guessed.

### Single-goal execution — calculation checkpoint, 2026-09-12

- Owner explicitly set one active goal for completing implementation, focused verification and clean release handoff; production remains separately gated.
- Added session-window-based 1m-to-5m/15m aggregation. Unknown missing minutes withhold the affected bucket; confirmed no-trade minutes do not manufacture prices. Partial buckets and conflicting/duplicate input are handled explicitly.
- Ran the bounded offline Node checkpoint `node src/scripts/verify-watchlist-indicator-foundation.mjs`: **53 assertions passed**, including independent batch EMA/RSI/ATR recurrence, readiness boundaries, serializable replay, volume session/Daily behavior, VWAP and aggregation. No Vitest, server, network calls or AI usage. This is synthetic arithmetic/contract proof, not live multi-ticker/provider acceptance.
- Calculation input now explicitly uses UTC epoch milliseconds and provider-confirmed completion boundaries. Provider adapters/calendar reconciliation remain separate unfinished integration work.
- Existing Platform Moomoo provider only accepts 1m windows up to 24 hours; Yahoo adapter supports bounded 1m and daily ranges. Do not assume the existing bridge already provides native 5m/15m/daily Moomoo history.
- Next slice: shared request coordination and provider history acquisition/audit, then UI/menu integration. Existing production behavior remains unchanged.

### Implementation started — isolated calculation foundation, 2026-09-12

- Owner authorized proceeding. Assigned Platform worktree remains at `907971dc6ce49bc41054ef8cee0354ea7c3f8ea6` with pre-existing unrelated edits; none were overwritten.
- Added portable pure `src/lib/live-watchlist/indicators/indicator-engine.ts`: SMA-seeded EMA9/20, Wilder RSI/ATR, individual readiness, trend/RSI/volatility classifications, intraday and Daily volume, one-minute session VWAP, serializable incremental checkpoint and chronological rebuild.
- Added `indicator-engine.test.ts` with focused fixtures for seed boundaries, flat/zero inputs, oversold RSI recovery, early-session volume, Daily/session differences, serialized replay, out-of-order/incomplete input rejection and VWAP weighting. Tests authored but NOT RUN under the current no-test/UI-design boundary.
- Focused single-file strict TypeScript check passed using the existing canonical TypeScript installation; no dependency installation, full typecheck, Vitest, build or local server.
- Existing shared calculation helper seeds EMA/ATR differently; it was deliberately not changed. No existing runtime imports the new module yet, so live behavior remains unchanged.
- Read-only provider inspection found the assigned Platform Moomoo bridge uses a provider accepting one-minute windows no longer than 24 hours. Historical multi-day/native-timeframe integration and actual source reconciliation still need work; no live provider requests were made.
- Help impact confirmed: `src/modules/help/watchlist-guides.ts` needs Indicators/Indicator Audit documentation when the integrated UI exists. No help text yet claims the new card is available.
- Next integration checkpoint: settle the shared runtime-to-Platform calculation boundary against current release source, then provider acquisition/audit persistence and owner-reviewed UI. Do not call this foundation a completed card or release candidate.

### Daily-volume and recovery consistency correction — 2026-09-12

- Scoped same-session volume resets to intraday timeframes. Daily compares completed trading days, excluding the measured day and today's partial data, using cached daily history with explicit short-history/zero/missing-day handling.
- Aligned the resource defaults with provider recovery: confirmed request admission resets shared backoff; usable candle delivery and fallback restoration remain per ticker/timeframe. Symbol-specific no-data does not alone increase shared backoff.
- Added Daily-volume acceptance cases. Documentation only; no app changes, tests, provider requests or deployment performed.

### Historical rebuild and provider recovery QA corrections — 2026-09-12

- Added chronological recalculation when older history or corrected candles arrive, with atomic replacement and revision/activation checks so backfill cannot corrupt incremental state or overwrite newer data.
- Separated provider request-admission recovery from each ticker/timeframe's usable-data recovery. Empty or unsupported-symbol responses cannot alone extend a provider-wide cooldown or cause false candle-delivery success.
- Added bounded probe rotation and focused verification scenarios for concurrent backfill and multi-ticker provider recovery.
- Documentation only. No application changes, provider requests, tests or deployment performed.

### Indicator-specific history and replay correction — 2026-09-12

- Removed the blanket 100-bar display requirement; specified separate initialization and comparison dependencies for EMA, RSI and ATR.
- Kept ample cached/prior-day history (preferred initial 250 bars where available) without treating it as a minimum needed to display usable indicators. VWAP uses today's session, independent of rolling-indicator warm-up.
- Qualified RSI-change descriptions with current oversold/overbought/midpoint context instead of calling every RSI increase stronger momentum.
- Required immutable seed history or starting-state checkpoints for reproducible incremental audit calculations.
- Plan only. Formula parity, seed sensitivity and representative-data validation remain implementation acceptance requirements; no app changes or tests performed.

### Pending revisions saved after return to Default mode — 2026-09-12

- Fixed session VWAP to one completed-one-minute-candle calculation shared across tabs.
- Added versioned initial formula, seed, warm-up, label, threshold and precedence defaults. These require independent numerical checks and representative-data validation; their documentation is not a claim that the analysis is already verified.
- Set explicit refresh timeout, concurrency, retry, queue, pagination and cooldown safeguards; retained two-minute Moomoo refresh.
- Set 14-day/100 MB metadata and separate 100 MB calculation-snapshot retention limits, with visible coverage and bounded pagination.
- Defined unique transport-request attribution across shared consumers and separate Indicators-versus-observed-connection reporting.
- Plan/progress only. No application code, tests, market-data requests, migrations or deployment performed.

### Latest plan QA corrections — 2026-09-12

- Corrected the opening inventory to separate existing connection status from the dedicated Indicator Audit section.
- Defined early-session volume feedback: first-bar facts, then equal-duration bar-to-bar comparisons, followed by the mature baseline when enough bars exist. Explicitly label any one-minute context shown while a higher-timeframe bar is incomplete.
- Added provider/connection-wide throttle coordination, independent Yahoo backoff, one recovery probe and staggered restart across tickers.
- Added interrupted-request lifecycle/restart reconciliation and explicit audit coverage gaps when buffered records cannot be recovered.
- Added immutable calculation snapshot links and explicit expired-input states so historical audits never substitute newer candles.
- Documentation-only revision. Runtime behavior, numerical accuracy and provider performance still require implementation and verification; no app changes, tests or deployment performed.

Owner navigation clarification: detailed auditing belongs in a separate **Indicator Audit** section, hidden until clicked; existing connection status stays in place. One main Watchlist admin section menu must directly expose all existing sections, Daily Recaps and Indicator Audit without going through Usage. Source inspection found separate wrapper/runtime navigation and a newer recap-enabled wrapper in local `origin/main`; reconcile against the released source before coding. Plan updated only; navigation is not yet fixed or live-verified.

- [ ] Review and finalize detailed plan, numerical defaults and exact replacement inventory.
- [ ] Owner UI layout/copy approval before UI implementation.
- [ ] Runtime calculations, bounded shared refresh and versioned payload.
- [ ] Platform Indicators card and existing admin diagnostics integration.
- [ ] Focused numerical, multi-ticker, provider and request-count verification.
- [ ] Watchlist Help updates and regression evidence.
- [ ] Narrow verified implementation commits and authorized coordinator handoff.
- [ ] Authorized hosted verification, owner visual acceptance and release outcome.

Next step: finish the integrated provider/runtime, audit and UI slice. The plan is approved and implementation is underway; the complete feature is not yet ready for release.
