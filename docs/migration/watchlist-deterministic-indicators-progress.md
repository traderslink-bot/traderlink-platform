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

### Current-main integration and focused acceptance checkpoint — 2026-09-12

- Added a reproducible temporary-index integration verifier pinned to remote parent `2a40e87b964574f1b525f3f3f1cb8fce7f24468a` and application feature tip `6397ce01aab7c0ddc4065612c7b403b65c2c57ba`. It resolves exactly the two expected conflicts, rejects unexpected conflict/changed-path sets, and leaves the checkout, canonical index and all refs untouched. Result tree: `8e9c35dcd0db4f3e5118b9e6a74d757cf0f186c8`, 47 changed files, zero unmerged entries.
- Verified current-main Daily Recaps page/panel/backend, Analysis editor and Potential Path card are byte-identical in that integrated tree. Detail-page integration is limited to the import, removal of the overlapping volume prop at its one invocation, and Indicators card insertion. No full older detail-page replacement.
- Added immutable-tree input to member/admin DOM verifiers. Integrated-tree checks passed 21 admin plus 16 member-card interaction assertions, including the nine-section menu and mounted form/iframe preservation. These are DOM fixtures, not CSS/browser visual acceptance.
- Final focused checkpoint reran actual-handler tests: owner audit 18, member GET 14, publisher POST 25, Moomoo access 14, canonical runtime bridge 24 assertions. Both card and admin strict focused TypeScript checks passed. No full build, broad suite, local preview, hosted feature mutation or publication.
- Remaining acceptance requires the approved integrated feature to be available in a hosted preview/release lane: actual browser rendering and real scheduler/bridge/audit-file persistence. Existing production does not contain this feature; the isolated market-data diagnostic cannot prove those deployed behaviors. Separate owner authorization is required before publishing/deploying. Handoff remains local and unsent.

### Full native matrix and newest-day correction — 2026-09-12

- Ran the current pure provider/coordinator/refresh/series/session/engine modules in memory in the guarded read-only production diagnostic, with no audit-file persistence. All nine requested symbols were included. The initial run showed 1m multi-day responses truncated to the oldest 1,000 bars while reporting completion; 5m/15m/Daily succeeded for seven symbols, while the final two had provider failures whose codes were not captured in that first run. Do not describe that run as passing or infer a confirmed rate limit.
- Changed Moomoo 1m acquisition to bounded single dates, newest first. Fetch older dates only when requested warm-up/coverage needs them, using the same total attempt/retry budgets. Added current-day-only and early-session/prior-day fixtures. History verifier passes 77 assertions.
- Reran the complete matrix with 1.1 seconds between diagnostic transport calls: TRUG, TNON, AENT, FTFT, FEIM, BDRX, SURG, SXTC and PCLA all passed four-frame readiness and independent full-session VWAP arithmetic. Each used four successful native Moomoo requests (36 total), retaining 960 1m, 768 5m, 576 15m and 174 calendar-covered Daily bars. Intraday dataThrough was Friday 20:00 ET, Daily Friday 16:00 ET. The spacing is diagnostic configuration, not a claim of a measured provider limit or a production scheduler change.
- Corrected closed-market cold warm-up to use the last completed trading session for VWAP, with historical timestamps and no repeated closed-session requests. Three focused assertions added; refresh verifier passes 70 assertions. This last lifecycle correction was verified offline after the native matrix.
- Native multi-symbol acquisition/calculation evidence is now present. Integrated current-main conflict resolution, runtime/UI acceptance, final preservation checks and the complete release handoff remain open. No database writes, AI, ticker publication, Discord, migration, deployment, app restart or local preview server.

### Native hosted capability correction — 2026-09-12

- Established a read-only SSH diagnostic path on the existing production container without installing, deploying, starting a server or writing files. The isolated Node process reuses the compiled publisher route/owner selection, wraps better-sqlite3 with readonly/fileMustExist/query_only, blocks OAuth and every non-history network call, and permits only three serial historical quote calls per invocation. Credentials stay inside the process. The existing app process is unchanged.
- First invocation: same-date intraday start/end returned zero native 5m/15m bars; Daily returned 251 bars with NY-midnight date labels, ending September 11. Second invocation with the next-date end returned TRUG 960 1m, 192 5m and 64 15m bars, despite num=370. All native intraday frames use end labels: first 04:01/04:05/04:15 ET, last 20:00 ET. Responses use open/high/low/close, explicit has_more=false, no positive next cursor.
- Corrected new adapter intraday end-date handling, native 5m/15m end-to-start conversion, and parser row cap (12,000 intraday rows, existing 4 MB decoded response cap; Daily 370). Exact requested time bounds still filter the response. Existing AI/chart bridge behavior is untouched.
- Focused provider verification now passes 70 assertions and strict TypeScript. Six actual provider requests total across these two diagnostic invocations; no AI, ticker publication, Discord, database write, migration, deployment or restart. Native timestamps/date boundary are no longer unknown; end-to-end new-adapter multi-symbol verification and integrated release acceptance remain outstanding.

### Current release-parent rehearsal — 2026-09-12

- Verified remote main at `2a40e87b964574f1b525f3f3f1cb8fce7f24468a`; existing Railway production metadata reports that same SHA on main. No deployment/configuration changes.
- Disposable-index three-way patch check identified two conflicts: admin wrapper and ticker detail. Existing Daily Recaps page/backend must remain from main. Recorded exact resolution intent and the complete 45-file implementation allowlist in the [pre-release handoff](watchlist-indicators-release-handoff.md).
- The handoff is explicitly not release-ready and has not been sent. Native higher-timeframe provider verification and integrated acceptance remain open. No working-tree or branch integration, broad tests, local server or hosted mutation was performed.

### One-minute provider convention and pagination correction — 2026-09-12

- Resolved the prior one-minute ambiguity empirically. Existing production bridge passes Moomoo timestamps unchanged. TRUG's Friday regular-session comparison against Yahoo matched 238 of 390 OHLC tuples within 0.00011 when Moomoo labels were shifted back one minute, versus zero matches with no shift or a forward shift. Together with all nine complete 04:01–20:00 ET sequences, this supports Moomoo Web API one-minute end labels. Cross-provider differences in remaining tuples are not treated as price parity.
- New Indicators parser converts Moomoo 1m end labels to internal interval starts before request-bound filtering. Daily labels, Yahoo timestamps and existing AI/chart bridge consumers are unchanged. Native Moomoo 5m/15m conventions remain a separate unverified acceptance item; the one-minute result is not proof of their behavior.
- Fixed pagination to follow a valid documented next_time cursor even without a generic pagination.has_more envelope. Explicit zero terminates; missing cursor and missing envelope remain unconfirmed; contradictory completion/cursor or malformed cursor rejects. Existing ten-attempt budget remains unchanged. Reference: https://open.moomoo.com/api/quote/basic-data/history-kline.
- Reran all nine Friday histories through the actual new one-minute parser: TRUG, TNON, AENT, FTFT, FEIM, BDRX, SURG, SXTC, PCLA each retained 960 1m / 192 derived 5m / 64 derived 15m bars, zero unknown missing minutes, and independently verified full-session HLC3-volume VWAP arithmetic. This is historical bridge/calculation proof, not native higher-frame transport or hosted UI proof.
- Focused history-adapter checks now pass 62 assertions, including cursor-only pagination and 1m/Daily timestamp separation. Strict focused provider TypeScript and whitespace checks pass. No AI, ticker add/approval, Discord publication, deployment, migration or local server.

### Restart recovery and nine-symbol historical checkpoint — 2026-09-12

- Added bounded recovery from the latest matching immutable calculation snapshot. Restore validates activation, formula/calendar version, retained seed and replayed results before exposing cached values. Missing, expired or inconsistent evidence falls back to normal warm-up rather than substituting an unrelated snapshot.
- Added older-seed and common overlapping OHLC-rescaling detection, bounded same-provider history rebuild and Daily basis recheck. Audit records correction counts, gap resets and rebuild reasons. The uniform-rescale fixture is not proof of every possible corporate-action pattern.
- Focused checks passed: 25 series, 67 refresh and 24 audit assertions; strict focused admin TypeScript passed. These use isolated fixtures and temporary audit storage, not the production database.
- Read-only existing production candle bridge returned Friday history for all nine symbols: TRUG, TNON, AENT, FTFT, FEIM, BDRX, SURG, SXTC and PCLA. Independent EMA checks and RSI/ATR readiness passed for normalized 1m and locally derived 5m/15m data. Each produced 959 / 191 / 63 completed bars under the current start-time convention. This does not validate the new native multi-timeframe adapter.
- Important unresolved finding: all nine have one missing normalized session minute, so full-session VWAP remains unavailable, not verified. A separate TRUG boundary probe returned 960 raw timestamps from 2026-09-11 08:01Z through 2026-09-12 00:00Z. This is consistent with end-labelled candles, but the provider documentation inspected only calls the field a K-line timestamp. Do not silently shift timestamps or claim VWAP acceptance until the provider convention is established. The historical verifier reports this coverage result explicitly.
- No ticker additions, AI requests, approvals, Discord posts, hosted settings changes, migrations, deployment, local server or broad suite. Existing production behavior remains unchanged. Next: settle the provider timestamp convention and native-frame evidence, then complete release-parent and hosted acceptance checks.

### Captured-data and lifecycle QA — 2026-09-12

- Owner additionally authorized adding Watchlist tickers for testing, noting Saturday market closure. No ticker was added in this checkpoint; no approval, Discord post or paid AI request was triggered.
- Located actual saved request packets inside the three private owner exports (JSON embedded in request text), not merely saved analysis prose. Completed coverage: TRUG 59 one-minute / 104 five-minute / 50 daily bars; SXTC 59 / 89 / 173; PCLA 59 / 89 / 173. Complete three-bar five-minute groups provide 34 / 29 / 29 fifteen-minute fixtures. Daily export date labels were explicitly normalized to the matching trading session; bars outside verified calendar coverage and incomplete bars were not counted.
- Real TRUG evidence exposed 30 five-minute bars with valid OHLC but unavailable volume. Fixed the new Indicators input contract to retain price-based EMA/RSI/ATR while keeping unknown volume nullable; no zero volume or synthetic candle is invented. Volume baseline restarts after an unknown-volume bar; VWAP remains unavailable without all required volume. Parsers, aggregation, engine and admin missing-volume counts are aligned. Existing AI data packets, runtime candle types and Potential Path formulas were not changed.
- Independent captured-data verifier passed 54 EMA/RSI/ATR and incomplete-VWAP assertions on actual TRUG/SXTC/PCLA packets. These packets do NOT contain full-session one-minute history, so they do not prove session VWAP parity. Equivalent captures for TNON/AENT/FTFT/FEIM/BDRX/SURG are absent from this selected local sample; synthetic nine-symbol tests remain separate evidence.
- Added closed-session gating: one history/completion pass for the latest verified session close, then no repeated weekend/unsupported overnight candle requests; unknown calendar coverage is explicit. Added cache-hit/closed/coalesced decision audit outcomes and current published activation population reconciliation, preventing removed tickers from permanently filling the 64-ticker cache.
- Focused results: foundation 64 assertions; history adapter 53; refresh service 60; authenticated POST 25; strict pure refresh-service, member card and admin TypeScript checks passed. No full suite/build/server/provider call/deployment. Remaining restart restoration, older-seed/corporate-action handling and final source/live acceptance are still open.

### Owner audit and unified navigation checkpoint — 2026-09-12

- Shared connection commits: Platform `6f5457f19`; canonical runtime `54be739`. Local records only; neither is released.
- Added lazy owner-only Indicator Audit panel: bounded 50-record pages, deduplicated displayed transport counts, refresh/request/fallback/timeframe details, coverage limits, exact calculation availability and explicit expired-input state with owner-initiated JSON export. No automatic polling or provider calls from the audit panel. Only one record's details render and one input lookup runs at a time. Authorization loss clears displayed history.
- Added one complete wrapper navigation contract for all six existing runtime sections, Usage, the existing Daily Recaps panel when supplied, and Indicator Audit. Origin/source-checked handshake hides the iframe's redundant navigation only after the wrapper takes control; standalone fallback remains. Iframe and owner forms remain mounted during section changes. Existing analysis preview/editor handlers remain intact.
- Important source reconciliation gap: this assigned page does not supply Daily Recaps, while cached `origin/main` already does. The wrapper now accepts and preserves that same `dailyRecapsPanel` prop and verifies all nine buttons when it is provided. The older page was NOT overwritten and no replacement Recaps backend was fabricated. Reconcile onto the actual recap-enabled release parent before acceptance; eight buttons in this older local page are not evidence that the full navigation requirement is finished.
- Updated Watchlist Help with timeframes, seed-dependent dashes, extended-hours VWAP, RSI/EMA/ATR/volume interpretation, timestamps, shared refresh, audit coverage and export. These docs are part of the unreleased slice, not a claim that the hosted feature changed.
- Checks: 21 focused DOM assertions against actual admin components and injection (mock shell/MUI boundary); strict focused TypeScript with actual React/MUI and audit contracts passed. No browser/local server, broad suite, build, AI request, hosted mutation or release.
- Remaining: release-parent source reconciliation including Recaps, real-data/provider/correction acceptance, remaining audit/runtime lifecycle guarantees, and authorized hosted visual/final verification. Full goal remains active.

### Shared runtime bridge checkpoint — 2026-09-12

- Owner explicitly authorized the narrow canonical runtime connection after the environment initially rejected the outside-workspace edit. Supporting runtime is `levels-system-post-mtf-handoff-stability`, not the deprecated `levels-system` folder. No local 3010 server was running or started; no hosted changes were made.
- Added publisher-authenticated Platform refresh POST with bounded request body, timing-safe credential comparison, exact published activation check and background refresh through Next `after`. Member GET remains cached/read-only. Review-pending, deactivated and superseded activations do not initiate this provider path.
- Added an immutable published five-minute window for the existing runtime consumer; it cannot inspect partially refreshed slots. Audit store now shares one process singleton across route bundles, matching the calculation cache.
- In the canonical runtime, added only the authenticated shared-candle loader, factory option and changes to the existing poll. Two-minute polling replaces the old one-minute cadence when connected, with sequential ticker calls and 500 ms spacing. Moomoo/Yahoo provenance is preserved. Shared warming/provider failure never triggers a duplicate legacy fetch; bridge unavailability retains the original Yahoo path. No AI trigger, approval, Discord setting or Potential Path formula was edited.
- Focused checks: actual Platform POST 25 assertions; refresh service 55 assertions across nine synthetic named fixtures; actual runtime loader/changed methods 24 assertions; strict standalone runtime loader TypeScript passed. These are offline checks, not live Moomoo or production proof.
- Deployment compatibility: Platform endpoint must be available before expecting the new runtime path; older Platform remains compatible through the existing candle fallback. Neither repository has been pushed, deployed, restarted or migrated. Dedicated audit UI/navigation, Help, real-data/final acceptance and current-release-parent reconciliation remain unfinished.

### Member card and cached endpoint — 2026-09-12

- Refresh/audit-access integration checkpoint saved locally at `d1ac923be`; no push/deployment.
- Added the ticker-detail Indicators card with always-visible 1m/5m/15m summaries, 1m/5m/15m/Daily detail tabs, default 5m, versioned local preference and keyboard tab navigation. Trend, Momentum, RSI, VWAP, Moving averages, Volume and ATR have deterministic values/explanations. Unknown values remain independent dashes.
- Card uses existing Watchlist card styling and a scoped responsive CSS module. It reuses the existing live price for the VWAP comparison. Only candle data-through Last updated timestamps appear for members, including separate VWAP timing; provider details stay out of the member payload and UI.
- Added a read-only cached-data endpoint under the ticker route. Existing Watchlist authorization and published activation identity are checked before reading the cache. It never starts the worker or calls a provider; positive nested-field projection excludes audit IDs, provider/scope/raw error data. The server runtime singleton now shares the same process cache across route bundles.
- Added the card to the actual ticker detail component and removed only that component's old Live 5-minute confirmation prop so live volume moves into Indicators. The old calculations, static AI analysis, listing-page behavior, owner previews and Discord producers remain untouched. Pre-existing notice/layout edits in the same file are preserved and must not be staged with this slice.
- Sixteen focused DOM assertions passed against the actual React card, with no server/provider calls: inventory, saved selection, keyboard focus, oversold context, quote comparison, privacy, retained failure state, access-loss clearing and polling cleanup. Fourteen actual member-route assertions passed for authorization, concealment, exact activation and nested output privacy. Presentation/member contracts pass focused strict TypeScript checks.
- React/Next guidance used for type-only client contracts, optional versioned localStorage, guarded effect cleanup and server-only provider access. These checks are not a rendered browser/CSS visual acceptance claim.
- Still required before acceptance: scheduler and existing-runtime request sharing, dedicated audit UI and complete menu reconciliation (including newer Daily Recaps), Help, real-provider/ticker coverage and full integrated low-resource checkpoint. The card currently has no scheduled hosted data source until that integration is completed; do not call it live/ready.

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
- [x] Local runtime calculations, bounded shared refresh and versioned payload; hosted integration acceptance remains below.
- [x] Local Platform Indicators card and owner audit/navigation implementation, reconciled in the verified current-main tree.
- [x] Focused numerical, nine-ticker native provider and request-count checks; actual deployed scheduling remains below.
- [x] Watchlist Help updates and focused preservation evidence.
- [ ] Narrow verified implementation commits and authorized coordinator handoff.
- [ ] Authorized hosted verification, owner visual acceptance and release outcome.

Next step: finish the integrated provider/runtime, audit and UI slice. The plan is approved and implementation is underway; the complete feature is not yet ready for release.
