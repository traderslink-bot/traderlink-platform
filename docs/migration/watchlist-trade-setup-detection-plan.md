# Watchlist Trade Setup Detection Plan

Date: 2026-10-17

Status: Revision 9, recovery cleanup corrected. The [recovery fix and final QA](watchlist-trade-setup-recovery-fix-2026-10-18.md) pass eight eligibility-exception cases, concurrent recovery ownership, spacing/cooldown checks and all 1,473 standard assertions. Focused TypeScript reports zero diagnostics. No duplicate transport was observed in the tested shared-request cases. Detection remains disabled and undeployed, and sends no setup notifications. Live native-data/capacity, browser visual and release acceptance remain separate. The other three families stay planned for later. Numeric definitions remain shared engineering rules, not measured trading advantages.

Parent: [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md)

Progress: [Trade Setup Detection Progress](watchlist-trade-setup-detection-progress.md)

Owner-approved extension: [Setup Results implementation and outcome contract](watchlist-setup-results-progress.md). Adds retained-history stage counts and audited post-confirmation observations without provider requests or notifications.

Final recheck: [October 18 final QA receipts](watchlist-trade-setup-recovery-fix-2026-10-18.md#final-independent-recheck) pass all four setups, shared feed, card/admin controls, recovery, spacing/cooldown and tested request deduplication. No new actionable finding. No deployment or notifications.

Related: [Deterministic Indicators](watchlist-deterministic-indicators-plan.md), [Analysis Quality](watchlist-analysis-quality-plan.md), [Replacement Plan](traderlink-platform-replacement-plan.md), [Migration Register](migration-register.md).

## Purpose

Detect developing long setups on active day-trading stocks the owner adds to the official Watchlist. Give members time to observe a setup before its trigger, then identify when the defined confirmation occurs. Monitor fresh same-day and continuing multi-day momentum in premarket, regular hours and postmarket, rather than requiring every stock to have run in premarket.

Use deterministic candle, price, volume and indicator calculations. No OpenAI call is required for detection, explanations or updates. This is a separate feature from the saved TradersLink Analysis, its pullback selection, automatic analysis refresh and the Discord scanner enrichment. It does not repair or replace those features implicitly.

Owner publishing and editing remain independent. A detected setup, missing data, failure state or notification problem must never prevent the owner from adding a ticker, approving an analysis, editing a post or notifying members through the existing controls.

## Complete setup inventory

The following seven detectors are the controlling implementation inventory. The approved current implementation slice is Group A's four detectors. Groups B and C are retained for later, not removed or silently counted as complete. Checkpoints sequence this work; they do not reduce the full scope.

| Setup | Primary structure | Timing evidence | Development group |
| --- | --- | --- | --- |
| VWAP Reclaim and Hold | Prior trade below the named session VWAP, recovery, reclaim and hold | Completed 1m candles; 5m context | A |
| EMA9 Pullback and Bounce | Upward momentum pulling back toward rising 5m EMA9 | 1m test and response | A |
| EMA20 Pullback and Bounce | Upward momentum taking a pullback toward rising 5m EMA20 | 1m test and response | A |
| Higher Low Reversal | Low, rebound high, distinct higher low and recovery through the rebound high | 5m context and causal 1m swing sequence | A |
| Premarket High Breakout and Retest | Established premarket high, breakout, later retest and defense | Completed 1m breakout and retest; 5m context | B |
| Bull Flag or Momentum Consolidation Breakout | Sharp upward impulse followed by a controlled consolidation | Separate 1m and 5m formation variants; 1m trigger | B |
| Falling Wedge or Descending Pullback Breakout | Multiple lower highs and lows, with a defined descending upper boundary | Separate 1m and 5m formation variants; 1m trigger | C |

Both EMA detectors are included. EMA20 is not assumed to sit below EMA9 in every market state. A bounce at a rising EMA20 is not interchangeable with reclaiming a falling EMA20 after a selloff.

## Existing source and required additions

The following are local source findings, not verification of the deployed source or current provider connection. The inspected worktree HEAD is `e718689bfef3bcbd2c966567e913dfd0638437db`; its existing dirty and untracked work must be preserved. Do not switch its branch, reset it, or copy an old runtime patch over current source.

| Existing source | Observed capability | Treatment |
| --- | --- | --- |
| `src/lib/live-watchlist/indicators/indicator-engine.ts` | Pure EMA9, EMA20, Wilder ATR14 and candle-based VWAP calculations | Reuse verified formulas and checkpoints; do not change Indicators meanings |
| `src/lib/live-watchlist/indicators/indicator-refresh-service.ts` | Shared refresh, per-timeframe history and calculation evidence; two-minute cache throttle; shared latest 250 native 5m candles | Extend an explicit read-only candle contract to expose necessary 1m and 5m evidence, not credentials or mutable series |
| `src/lib/live-watchlist/indicators/indicator-aggregation.ts` | Session-aligned aggregation that distinguishes unknown minutes from confirmed no-trade minutes | Reuse where coverage is sufficient; otherwise use native 5m bars |
| `src/lib/live-watchlist/indicators/indicator-sessions.ts` | Verified exchange calendar, Eastern sessions, completion and coverage checks | Reuse; retain DST, holiday and shortened-session behavior |
| `src/lib/live-watchlist/indicators/indicator-request-coordinator.ts` | In-flight coalescing, two concurrent transports within this coordinator, retry and rate-limit backoff audit | Reuse Watchlist admission; it is not proof of an app-wide/provider-wide limit |
| `src/modules/watchlist/server/indicators/indicator-refresh-runtime.ts` | Server-only cached results, 5m candle reuse and authenticated Moomoo access | Integrate with a shared server-owned market-data consumer |
| `src/modules/watchlist/server/moomoo-watchlist-candle-bridge.ts` | Existing authorized owner OAuth connection with quote scope | Reuse existing authorization without exposing or replacing connection credentials |
| `app/api/live-watchlist/indicators/refresh/route.ts` | Publisher-triggered refresh and publication identity checks | Preserve its identity and approval contracts; verify deployed identity before integration |
| `src/lib/live-watchlist/indicators/indicator-history-provider.ts` | WebAPI history URLs, page/retry accounting and accepted candle parsing; intraday requests can cover a full date even when the consumer asks for a shorter window | Deduplicate the actual outbound request and retain reusable accepted coverage; do not mistake a short local slice for a small network response |
| `src/modules/help/watchlist-guides.ts` | Existing indicator, analysis, owner-control and freshness explanations | Add setup guidance at the UI acceptance checkpoint |

These files do not constitute seven implemented detectors. Existing Journal trade-pattern libraries analyze executions and outcomes, not this live Watchlist lifecycle. Inspect reusable pure utilities only; do not attach the new feature to legacy V3 or change Journal trade identity.

The owner confirms a free Moomoo account using OpenAPI with OAuth, not OpenD. The inspected transport is the authorized HTTP WebAPI path at `webapi.moomoo.com`. Do not apply OpenD account/asset tiers, SDK history quotas or subscription rules to this connection. Do not install OpenD, change connections, assume a paid data tier or assume streaming access as a prerequisite. Free-account permissions and observed rate behavior are separate from the general published WebAPI rule below.

The inspected existing Watchlist runtime's `platform-watchlist-indicator-loader.ts` calls the authenticated Platform refresh route, and `manual-watchlist-runtime-manager.ts` selects a 120-second polling interval when that loader is present. Platform also enforces its own 120-second whole-refresh cache. This is evidence of existing recurring acquisition, not a measurement of current production traffic. The currently exposed reuse contract is 5m only; extend it for accepted 1m evidence rather than claiming that member snapshots already expose both raw frames.

## Scope and owner control

### Ticker population

- A global Setup Detection switch controls this feature. It stays off until its implementation and activation are approved.
- Once enabled, newly published owner-added day-trade tickers inherit the enabled detectors. The owner can disable detection for an individual ticker without removing it or changing its analysis.
- Eligibility depends on the ticker being published, not an AI analysis existing. Tickers published without analysis can still have deterministic setups.
- General and Overnight Watches tickers can participate when the owner wants to monitor them for a day-trading setup. The category does not prove a momentum pattern exists.
- Swings are outside the day-trading detector defaults. Enabling day-trading monitoring for a swing ticker would be an explicit owner choice, not a claim to provide swing setups.
- Private and review-pending tickers never produce member-facing detections or alerts. Any future owner preview must remain private. Removing or re-adding a ticker creates a new monitoring identity; an old job cannot publish into the replacement activation.
- Moving a published ticker between lists preserves its episode identity. It updates future delivery routing, not its detection time or original publication price.
- Enabling this feature on existing tickers populates their current card without broadcasting old setups as new events.

Use the actual saved publication/activation identity shared by Platform and the current runtime, not a displayed Posted time, gain-card starting-time override, or the admin-added timestamp. Verify that mapping before implementation; do not migrate an old activation into a current one or change any displayed publication time to satisfy setup jobs.

### Independent controls

Setup monitoring and the Indicators card are separate consumers of shared market data. Hiding Indicators must still stop requests made solely for Indicators. If Setup Detection is explicitly enabled, it may use the same feed under its own named consumer; admin must show that this consumer is active. With both consumers disabled, neither may poll for these features.

Do not reuse the AI generation, automatic boundary refresh, analysis approval or Notify Published checkboxes for setup notifications. A setup event is not a new AI analysis and must not send an Analysis updated announcement.

## Data contract

### Required evidence

1. Canonical symbol, current publication identity, market date, exchange calendar and session boundaries.
2. Completed 1m and 5m OHLC candles, with start and end timestamps, volume in shares or an explicit unavailable value, provider and adjustment identity.
3. EMA9 and EMA20 values and slopes on 5m candles, plus separately calculated 1m and 5m ATR14 for the corresponding volatility-scaled comparisons. Never substitute 1m ATR for a 5m pattern tolerance or the reverse.
4. VWAP with an explicit session anchor, calculation method, coverage and data-through time.
5. Current-day session highs and lows, including an independently established premarket high when applicable.
6. The latest trustworthy quote and its own source timestamp, if available. Quote arrival is not a new completed candle.
7. Recent same-day structure and bounded prior-session history for continuing runners and EMA initialization. Identify the latest qualifying impulse even when it began in a prior session; do not require another large surge today. Reassess its relevance after later structural breaks rather than keeping it indefinitely.

Float, news, order-book walls, tape classification and daily support/resistance can add context, but are not required inputs for the initial seven detectors. Do not create additional news, order-book, SEC, AI or whole-market scanning requests for this feature.

### Price and volume validation

Normalize timestamps before detection; the inspected Moomoo parser adjusts interval-end labels to internal interval starts. Do not subtract duration twice. Verify one-minute and five-minute times against real saved responses before live acceptance.

Validate positive finite OHLC values, OHLC ordering, time order, nonnegative volume, duplicate timestamps, session alignment and completed status. Malformed rows affect only dependent calculations. Conflicting duplicates require a contained recovery, not arbitrary selection.

An absent minute is not automatically a zero-volume minute. An explicit provider zero is a valid zero; null volume is unavailable. Do not infer low liquidity or no trading from a download gap. Large price gaps are not automatically splits; require adjustment/corporate-action evidence before changing price scale.

Use coherent price and volume units. Never combine one provider's historical EMA seed with another provider's latest bars without rebuilding the series. Avoid deriving full candle highs/lows from sampled live quotes.

### VWAP basis

Keep the existing Indicators VWAP unchanged: the local source uses completed 1m typical price `(high + low + close) / 3`, weighted by share volume, from the day's premarket open. This is a candle-derived VWAP, not an exact reconstruction of every transaction.

For setup detection, calculate two clearly named scopes from the same accepted minute history:

- **Regular-session VWAP:** 9:30 AM ET through the current regular-session completed candle. Proposed default for regular-session reclaim setups.
- **Day VWAP:** that market date's premarket open through the current supported session. Used for premarket/postmarket detection and retained as context during regular hours.

These are separate anchors, not separate timeframes. Label the scope beside a detected reclaim. Do not silently compare price below one scope with price above the other. Deduplicate overlapping reclaims in one recovery episode. A regular-session VWAP does not exist before the first completed, positive-volume regular candle.

Formula: `VWAP = sum(typicalPrice_i * volume_i) / sum(volume_i)` over the named anchor. Use a verified trade-turnover VWAP only if the actual transport supplies compatible turnover and share units for that same anchor; do not mix methods within a candidate.

Use an anchor-specific coverage record: requested range, pagination terminal evidence, provider/session/adjustment identity, observed bars, explicit no-trade intervals, unknown gaps, excluded rows, and volume reliability. The regular-session coverage check starts at 9:30 AM, not 4 AM. Do not apply the existing whole-day coverage helper unchanged to the new regular-session anchor.

Allow sparse bars as a complete range only when the actual transport's verified range-completion semantics establish that omitted intervals have no trades, or a compatible authoritative provider aggregate establishes the same anchor's price-volume totals. Pagination success or a numerical zero cursor alone is not that proof. Record the evidence rather than manufacturing rows. If the transport cannot establish it, keep a separately labeled **Observed-bars VWAP** as optional admin diagnostics; it is not the member reclaim anchor and cannot silently replace session VWAP.

Unknown gaps or unreliable volume make only the affected VWAP unavailable. Other price-based detectors remain usable. An unavailable Day VWAP cannot suppress a complete Regular-session VWAP, EMA bounce or higher-low detector. Record whether a verified provider aggregate was used; never combine different anchor totals or providers to fill a gap.

### History and indicator readiness

- Request today's available extended-hours history through now, not only data after the ticker was added.
- Use bounded earlier-session 5m history and saved indicator seeds for multi-day momentum. Begin with the existing preferred history budget, then measure actual payloads and necessary coverage before selecting final cache bounds.
- EMA20 can initialize from 20 valid completed 5m closes; EMA9 from nine. Additional observations are needed for a three-bar slope. Preferred longer warm-up improves seed stability but is not a mandatory 200- or 250-bar display gate.
- ATR needs its actual calculation warm-up. If ATR is unavailable, withhold only detectors whose proximity/structure rules need it; keep independent facts and other valid detectors.
- Do not fetch months of 1m history for these setups. Cache initialization and use native 5m history when that avoids unnecessary underlying-minute requests.
- No fabricated flat candles to fill unknown history. For a sparse series, record elapsed time and actual observed bars separately; three bars across an hour are not a three-minute pause.

## Feed cadence and request budget

### Existing data before new acquisition

Reuse the current Moomoo connection, accepted candles, durable calculation evidence and compatible indicator seeds before making any provider request. The seven detectors are calculations over shared evidence, not seven acquisition consumers. No member view, detector, notification or replay may independently fetch Moomoo data.

Keep provider, authorized data scope, symbol, timeframe, adjustment and session basis in the shared evidence key. Publication identity still governs which ticker may display/use it, but moving a ticker or revising its card does not require downloading identical market history again. Cache reuse never grants access to another account or a removed/private publication.

For each requested window: (1) use compatible accepted coverage that meets the consumer's freshness and completion requirements; (2) attach to a compatible in-flight transport covering it; (3) only then queue the missing/new coverage. Coverage means the accepted interval/known-gap record, not merely a first/last timestamp spanning a hole. Keep raw accepted coverage plus per-consumer slices and original availability times. A response arriving later cannot be projected backward into an earlier replay or an unfinished candle. If a narrower call is already in flight, wait for it and request only the still-required logical coverage; date-granular transport may necessarily return a larger page. An incompatible adjustment, session, source or genuine newer minute is not a duplicate.

Normalize transport identity using the actual endpoint/query/body, opaque authorization scope, session/adjustment and pagination cursor. The inspected history endpoint serializes date ranges, so different millisecond consumer windows can produce the same outbound URL. Fetch that page once for simultaneous compatible demand, retain the bounded accepted page, then slice locally. Do not claim the existing exact-key in-flight coordinator also supplies a persistent coverage cache. Never reuse a stale page just because its date URL is unchanged; a new completed minute can require another fetch. Count its actual bytes/rows because date-granular transport may return more than the overlapping two-minute local correction window.

When safe 1m coverage can produce complete 5m candles, calculate them locally. Otherwise reuse an existing native 5m result or request it once when due. Native/aggregated candles must preserve adjustment, session alignment and completion semantics. Do not reuse a 5m or 15m total as minute volume. AI refresh, Analyzer and scanner may read compatible shared evidence through their existing authorized paths; no new AI request, scanner polling or change to their data requirements is introduced.

### One Watchlist acquisition schedule

The existing 120-second whole-refresh throttle and multi-frame operation are not the new minute feed. Do not remove that throttle or call the complete four-frame operation every minute to implement setups.

Do not create continuous second-by-second polling. Existing regular candle updates are the starting source; only missing or genuinely newer required coverage adds a request. One-minute setup demand is a per-ticker due window, not one call per detector or per second. Spread ordinary due work across its interval rather than treating the minimum transport spacing as a target request rate.

Extend the existing Watchlist acquisition into one demand schedule, not an additional parallel polling loop. Host its single feed owner in the approved background-worker startup, registered once in `startTraderLinkHostedBackgroundWorkers()` for enabled market-data consumers. Adapt the existing runtime refresh trigger to submit/join shared demand or read its result instead of independently issuing the same provider work. No browser, admin iframe or separately running PC helper owns this new feed. Use a nonoverlapping tick and transactional job claims. On shutdown stop new claims and cancel bounded in-flight work; on restart restore demand/checkpoints before resuming. Preserve the existing one-process/single-writer boundary. Disabling Setup Detection removes only its demand; existing Indicators continue under their current policy without duplicate old/new schedulers.

| Demand | Due time and work | Reuse boundary |
| --- | --- | --- |
| Setups 1m | One fresh completed-minute window per eligible ticker, initially eligible five seconds after each minute boundary, then staggered through shared admission | All seven consume the same accepted window; reuse a fresh Indicators/other compatible result first; overlap the last two completed minutes locally for corrections |
| Setups 5m | At completed 5m boundaries, derive from adequately covered accepted 1m data; otherwise one native 5m refresh | Do not label an incomplete aggregate a full candle |
| Indicator-only | Preserve its existing two-minute policy and per-frame completion caches | Enabling setups must not double its requests |
| 15m and Daily | Their existing due/completion rules, not every setup tick | Setup monitoring creates no additional demand for these frames |
| Initialization/backfill | Restore a valid checkpoint, fetch a bounded current window, then queue only missing required older context | Never download the whole initial history every minute |

Separate shared candle acquisition from interpretation publication with a per-ticker/frame `nextDue`, accepted input revision, normalized transport key, reusable coverage and demand owners. A faster accepted 1m/5m result can satisfy Indicators when it is due; it must not change its formulas, visibility or data-through meaning. An unchanged accepted revision is not recalculated seven times by separate polling jobs. Coalesce only compatible source/scope/adjustment/frame/session requests; use coverage containment or normalize/merge unsent windows before dispatch. Publish an immutable read-only result to all eligible consumers, not shared mutable arrays.

Use one bounded Watchlist queue with at most two concurrent transports initially and one pending refresh per ticker/frame. This concurrency ceiling is separate from request-start spacing and the combined rolling budget below. A newer refresh replaces obsolete queued work, not an in-flight operation's identity. Current windows outrank backfill; backfill runs at most one page per ticker per scheduler pass and yields to fresh demand. Reserve at most one of the two Watchlist transport slots for historical work. Use the existing bounded HTTP timeout and one logical retry budget; every page/retry must reacquire admission, without per-detector retry loops.

### WebAPI limits and request spacing

The current [WebAPI rate-limit documentation](https://open.moomoo.com/api/overview/rate-limit), checked on 2026-10-17, states at most **100 requests per minute from the same IP**. The [OAuth/API host guide](https://open.moomoo.com/api/overview/getting-started) and [history endpoint](https://open.moomoo.com/api/quote/basic-data/history-kline) match the inspected HTTP transport. Use this as a general documented ceiling, not a confirmed free-account allowance or a guarantee that every endpoint has the same effective limit. The page does not establish a distinct free-account quota. Combined admission covers all requests leaving that IP, not 100 for each ticker, feature, token or account. No old OpenD quota or pagination exemption is adopted.

The applicable WebAPI page does not establish a mandatory 0.5-second delay. Half-second spacing alone allows about 120 starts per minute, so it cannot enforce its published 100/minute ceiling. Use a conservative initial **750 ms minimum between actual request starts and at most 80 starts in any rolling 60 seconds** for the coordinated same-IP traffic. These are application scheduling defaults with headroom, not claimed provider rules or a proven free-account entitlement. Honor a stricter verified endpoint/account limit or provider response when present; never automatically raise the budget to discover a ceiling. Validate through normal authorized observation, not deliberate rate-limit probing or an assumed need to upgrade the owner's account.

Implement a small shared WebAPI transport-admission boundary below feature-specific coordinators. Inventory same-egress callers first: Watchlist Indicators, setup acquisition, AI candle loading, Analyzer/Level Analysis, overnight quote requests, scanner requests relayed through Platform, account/trading reads, OAuth refresh and diagnostics. Each actual HTTP start, including authentication, pagination, retry, failure and subsequently aborted calls, consumes one rolling-budget entry. One coalesced HTTP call consumes one, regardless of how many consumers use it; cache hits, waiting jobs and internal relay hops without outbound WebAPI traffic consume none. Do not place OAuth/trading payloads in the candle cache or coalesce them as market-data reads. Authorize cached reads without requesting a new token merely for each detector. The inspected `MoomooConnectionAccessService` reuses unexpired tokens but does not itself define a cross-call refresh lock; reconcile current wrappers, then reuse or add one narrowly scoped connection-refresh lock for concurrent demand. Finish that separately admitted refresh before admitting the data call, without holding a data transport slot while waiting for authentication.

Use an opaque egress-group identity for rate admission and a separate opaque authorization scope for cache isolation. A shared account does not imply a shared IP; a second account/token on the same server does not create a fresh allowance. The PC scanner may leave through another IP, or may use a hosted relay and therefore consume the hosted allowance: trace the outbound hop instead of assuming either. Never log tokens, raw public/private addresses or account IDs to prove that scope. Uninstrumented same-IP processes are an explicit unknown, not silently treated as zero traffic.

All app-controlled WebAPI callers sharing the egress group must pass the same admission clock and rolling ledger before claiming a combined hard cap. Use minimal transport hooks, not a rewrite of their trading logic or data requirements; preserve their current authorization, retry ownership and error reporting. Before that coverage is complete, give only this new setup demand the measured residual allowance with headroom; defer it when available capacity cannot be established. Existing manual analysis/publication controls are not gated by setup readiness or new feature approval checks. A queued background setup must not reserve capacity ahead of foreground owner requests. Do not claim a Watchlist-only limiter governs separate uncontrolled processes.

Atomically check the rolling ledger, minimum start spacing, provider cooldown and feature concurrency immediately before dispatch, then record the actual start before sending. Use a monotonic in-process spacing clock and conservative restored wall-time bounds; a clock change cannot release a burst or erase recent starts. Count the closed rolling interval conservatively at exact 60-second boundaries. Waiting for admission must not hold a transport slot or start its HTTP timeout. No saved-up burst tokens after idle time. Retain starts and active provider cooldown across process restarts under the existing single-writer boundary; if that ledger is unavailable, hold new setup requests for at least a full 60-second window and any longer known cooldown, and do not claim combined-cap enforcement until state/coverage is restored. An egress change is not a way to evade a provider response. Apply `Retry-After` where supplied and existing bounded exponential backoff where absent; an unknown timed-out outbound request still counts. An HTTP 429 without evidence of a narrower quota cools down the shared egress group, not just the requesting ticker/token. Keep authentication/permission failures distinct from rate limiting. No automatic retry storm or multiplication by detector.

Consumer deadlines and transport ownership are separate. A caller/relay timeout or ticker disable detaches that consumer; it does not cancel a coalesced transport still needed by another authorized consumer or start an independent replacement request. Abort pending work when no demand remains, but retain any already-started request's budget entry. Completion can enter the shared cache while publication/access is rechecked before any consumer presentation or alert. Bound queue age and handle overload explicitly; don't let the existing shorter relay timeout create repeated provider starts while one shared refresh is queued/running.

Prioritize foreground existing work, existing due Indicators and fresh setup windows ahead of this feature's historical backfill, using measured available capacity. New setup work yields first when load rises; don't silently slow existing Indicators to create an apparent capacity success. Stagger tickers rather than launch all requests at the five-second offset. Preserve each evaluated candle's real completion/availability timestamp and record the resulting queue delay. A missed freshness window becomes a recorded suppressed setup alert, not a late current alert, invented candle or restriction on owner publishing.

Cold start: restore compatible saved calculation seeds and candidate/group state; obtain the newest completed window; reconcile any missed interval within a bounded history budget. Show **Warming up** for dependent detectors while older context is fetched, not **No setup detected**. Independently ready detectors can evaluate. Never use an unverified gap-spanning shortcut or send historical catch-up notifications. Initial history, retries and native-frame supplements are counted separately in capacity reports.

Existing quote events may update a page's approach-distance display only. They cannot create a Forming/Confirmed notification, a full candle, a volume observation or a retest. No provider request occurs on a member view or tab switch. With no enabled consumer, release its demand and do not poll for it.

Capacity accounting uses `Q_total = Q_unique_watchlist_HTTP + Q_other_same_egress_WebAPI_HTTP` over the same rolling 60 seconds. The two terms are disjoint sets of actual transport IDs: the other term excludes any call already counted in the Watchlist term, even when it also serves another feature. Count each outbound transport once, including every page/retry/authentication request, and tag its participating consumers separately. Report cached/in-flight reuse, bytes/rows, and actual additional requests versus the existing measured baseline. Do not sum logical consumer counts or call all minute-feed requests incremental: a result may replace a due Indicators request.

For a planning illustration only, `N` one-page 1m refreshes each minute contribute about `N` starts; if native 5m is also necessary once per five minutes it contributes about `N/5` starts per minute on average, before all other traffic, initialization, pages and retries. This is neither the present multi-frame count nor a capacity guarantee. Measure combined load, peak rolling counts and queue latency at 5, 10 and 20 monitored symbols using saved/simulated scheduling first and an authorized observation later. Do not assume the remaining 20/minute headroom is an allowance for uncounted traffic. No live stress test is authorized by this document.

Audit provider freshness, request duration and queue delay. Target processing promptly after accepted candle completion, and record provider delay separately. Do not promise sub-minute notifications from minute-close polling. If real provider capacity cannot support this cadence, report measured latency and obtain approval for a reduced schedule before calling the early alerts ready.

Moomoo is the primary setup feed. Existing Indicators Yahoo fallback behavior stays untouched. Setup confirmation will not switch to Yahoo automatically until price, minute-volume, session, freshness and adjustment parity have been verified for this purpose. A fallback cannot silently turn unavailable volume into zero or create a new reclaim because its indicator seed differs.

## Shared detection rules

### Timeframes and causal swings

Use completed 5m context and 1m responses/triggers for VWAP, EMA9, EMA20, higher lows and premarket-high retests. EMA9/EMA20 in this inventory are **5m averages**, not new 1m EMA families. Flags and wedges also include explicitly labeled **1m formation** variants for fast runners, alongside **5m formation** variants. These are variants of the same seven families, not extra unnamed setups. Daily and 15m remain existing context.

Let `F` be formation frame, `A_F` its ATR14 just before a candidate begins, and `A_1` the corresponding prior 1m ATR. Freeze those volatility scales, not the moving averages, for that candidate version. Geometry uses `E_F`; 1m close triggers/failures use `E_1`. If a required scale is absent or zero, only dependent comparisons are unavailable. Never apply 1m ATR to 5m geometry.

For causal pivots on a frame, a high is a local maximum against an earlier and a later completed bar, with a later close at least `0.5 * prior ATR_F` below it; lows use the inverse. Collapse a run of equal exact extrema to the earliest extremum time, and wait for the later response before declaring it known. A plateau longer than three bars is a range, not repeated pivots. Bars/pivots must be separated by at least one bar of that frame. A larger later extreme before recognition replaces the provisional extreme; it does not create multiple confirmed pivots. Store extremum time, recognition time and full input revision. Required tie-breaks are earliest exact equal extremum, then earliest recognition time; never round prices before comparing.

Momentum context is built independently on 1m and 5m. Search bounded contiguous spans of **one through 12** completed bars, allowing a single expansion candle. Require `close_end - open_start >= 3 * ATR_F_before_start` and a close beyond the maximum high of the five completed bars before the span plus `E_F`. This is an observed range break; call it a pivot break only if that range high is a recognized pivot. Rank candidate spans by most recent first break, then shortest qualifying span, then greatest normalized displacement, then earliest start time. Record all chosen endpoints and the pre-span range low/high.

Keep an episode's original range-break identity when its peak extends. A newly preferred rolling impulse span revises evidence within that episode, not its identity. A genuinely new episode requires a subsequent confirmed pullback low, rebound high and a later close beyond that rebound high; do not assign a new ID on every higher quote. Preserve the earlier episode as parent context. A continuing episode may originate in earlier cached sessions and need not surge again today. Sustained loss of its documented base ends that context; a flat/dead interval cannot supply a fresh setup without a new formation. Bound live searches to retained windows/checkpoints; do not rescan months each tick.

A **meaningful decline** for the higher-low sequence means at least one prior 1m ATR of observed decline from a recognized high to `L1`, followed by a recognized rebound; the later detector rules define `H1/L2`. **Slowing** means smaller latest two nonoverlapping down-close displacements than the preceding two down-close displacements, with each window containing two completed 1m bars; otherwise say the comparison is unavailable. It is supporting context, not an inferred seller count.

A same-bar high and low cannot prove breakout-then-retest ordering. Require separate chronological candles, use finer real candles where available, or retain unresolved order. Replay uses each frame's completion and availability watermark, not a later final 5m close projected backward into its minute bars.

### Starting numeric definitions

These are transparent calibration seeds, not proven nano-cap constants. Freeze one complete rule version before holdout replay; tune by shared market behavior, never ticker name or expected price.

| Quantity | Starting definition | Boundary |
| --- | --- | --- |
| ATR scales | `A_F` and `A_1` defined above | Freeze scales per candidate version; never widen tolerances because of its own failure candle |
| Price tolerances | `E_F = 0.10 * A_F`, `E_1 = 0.10 * A_1`; if a verified minimum price increment exists, use at least that increment | Retain full precision; round presentation only and never insert a universal one-cent floor |
| EMA approach band | Known 5m EMA value `± 0.25 * A_5` | Require a real price pullback, not the average merely moving into stationary price |
| Rising EMA | `(EMA_t - EMA_(t-3)) / ATR5_t > 0.05` from completed 5m bars | The average/slope are time-varying evidence; their historical observations stay immutable |
| Significant impulse | Explicit one-to-12-bar, three-ATR range-break procedure above on the relevant frame | Price gap alone does not prove an intraday traded surge |
| Recent minute-volume baseline | Mean of the previous five complete, equal-duration, same-session bars, excluding the measured bar | At least three trustworthy bars for a provisional comparison; record actual count |
| Expansion | Trigger bar volume / recent baseline at least 1.30 | Positive denominator and usable volume; opening-session baseline starts over |
| Pullback volume contraction | For `n >= 4` eligible same-duration pullback bars, `k = min(3, floor(n/2))`; mean(last `k`) / mean(first `k`) at most 0.80 | Equal nonoverlapping windows; positive denominator; otherwise unavailable, not contraction |
| Price distance | `100 * (price - reference) / reference` | Positive reference, full internal precision, display rounding only |

A volume comparison must match bar duration. Sum impulse volume only when durations are also reported; compare average volume per minute when episodes last different lengths. Do not compare a partial 1m candle with full prior candles.

Falling volume during declining candles describes activity during that decline. It does not measure confirmed seller-initiated shares, prove sellers exhausted, or establish buyers from a green candle alone. Do not fetch tape just to justify stronger wording.

### Price confirmation and volume evidence

**Confirmed means the named price sequence completed.** It does not require the arbitrary 1.30 volume seed. Store independent fields: `priceState`, `volumeState`, `comparisonBasis`, `baselineBars`, `ratio` and input/observation times. All seven price-confirmation definitions below stand independently of volume availability.

Volume labels are **Expanded**, **Not expanded**, **Unavailable**, and, only when the source volume is valid but no positive baseline exists, **No comparable baseline**. Every Confirmed card/notification includes its qualifier, for example **Confirmed · volume unavailable**. Never imply an unqualified volume-backed confirmation or classify missing volume as weak trading. Green marks completion of the price sequence, not a quality score.

For an initial range breakout/reclaim, compare its completed 1m bar with the previous five same-session completed 1m bars, minimum three, excluding the trigger. For a bounce/retest, record both that recent-bar comparison and a separate mean of the last up-to-five completed 1m bars from the actual decline/test segment before the first recovery bar, minimum three. Label the latter **versus pullback average**. Do not silently substitute that quieter baseline for the ordinary recent-volume baseline.

If fewer than three eligible bars exist after a session open, show the absolute observed volume with **No comparable baseline**. Price confirmation remains valid. The candidate's baseline membership is frozen for its event; later bars cannot change an earlier ratio. The 1.30 expansion and 0.80 contraction seeds describe observations, not entry filters, and are calibrated separately by context.

For the same confirmation candle, corrected source volume received within the automatic-alert freshness window may revise its volume evidence with a correction receipt. Later candles get their own volume observations, not retrospective volume credit for the original trigger. Default notifications remain Forming and Confirmed only; a later volume change updates the page without a third notification.

### State and event lifecycle

Each instance has a persisted identity allocated on its first recognized formation, tied to publication, market date, detector, formation frame/basis and parent momentum episode. Later peaks, fit revisions, volume, route changes and group members are attributes/revisions, not new identities. Keep the defining initial observation references so the same instance can be restored after restart.

| State | Meaning | Public behavior |
| --- | --- | --- |
| Watching | Context exists; a specific setup has not begun | No alert; optional distance display |
| Forming | The setup's observed sequence is developing | Main early event; orange status |
| Confirmed | The detector's completed price sequence is satisfied; volume has its own qualifier | One price-confirmation event; green completion label with explicit volume evidence |
| Failed | An observed post-detection failure condition occurred | Mark that instance failed; preserve its earlier events |
| Expired | Its time window/session ended or the defining context was superseded | Remove from current opportunities; retain audit history |
| Data unavailable | A dependency is temporarily insufficient | Preserve last valid timestamp; do not present it as a failed trade |

Some patterns have an intermediate price event before their required hold/retest. Record **Reclaimed VWAP · hold pending** without calling the full reclaim-and-hold Confirmed. Missing volume never keeps a completed price sequence in Forming. If an episode advances from nothing to confirmed in one observed update, record that honestly; do not manufacture an earlier Forming notification.

Provisional quote-based approach information may disappear. Completed historical events never silently repaint. Corrected or backfilled bars create a new input revision and a correction record; they do not rewrite what was knowable earlier or retroactively send alerts.

Brief intrabar undercuts are not automatic setup failures. Sustained loss means two consecutive, coverage-coherent completed 1m closes strictly below the defined boundary minus `E_1`; equality is not loss. For a horizontal reference use its fixed price; for a forming channel/wedge use its prior accepted coefficients projected separately at each close. A provider gap or halt cannot supply those closes. Breakout/recovery triggers require a close strictly above the stated trigger plus `E_1`; approach/touch tests include endpoints. A later recovery can form a new episode without erasing a failure.

### Moving indicator observations

Only volatility scales, identified swing lows, reversal highs and completed-event values are frozen. EMA and VWAP values are not frozen for the whole candidate. For a 1m range/touch test use the latest completed 5m EMA that was available at that minute's **start**; for its closing recovery/trigger comparison use the latest completed value available by that minute's **end**. This prevents using a final 5m close to infer an earlier touch. Store both snapshots and their availability times.

On each new 5m result, reevaluate slope. A flat slope annotates **Trend flattening** and leaves an unconfirmed candidate observable; confirmation as an EMA continuation requires the selected average to be rising at the recovery/trigger. Two consecutive completed 5m observations with falling slope expire an unconfirmed EMA instance as **Context changed**, not price failure. If price already completed the response while the average is not rising, retain **Price response observed · trend condition not met** rather than a false continuation confirmation.

A real EMA test also requires an observed decline from the candidate's prior peak of at least `0.5 * A_5`; proximity created only by average drift is a time consolidation, not a pullback bounce. VWAP comparisons use each candle's contemporaneous, same-anchor value. Sloping pattern lines freeze their fitting coefficients per revision, not their projected price for all future times. Save the evaluated line price at each observation.

### Opportunity age and repeat events

Confirmed is an immutable historical event, not a standing invitation to enter. Put it under **Recently confirmed**, with its trigger, time and volume qualifier. It is never listed as still waiting for a trigger. Move it out of current opportunities after the earlier of two subsequent completed 1m candles, five supported-market minutes, or a close more than one frozen `A_F` beyond its trigger; the history retains it. This is a display age rule, not setup failure or a restriction on trading.

Keep a post-confirmation structural follow-through observation for at most 60 supported-market minutes or the session end, whichever comes first, then archive the episode. A later sustained loss within that window records Failed after confirmation without deleting the success event. Outcome measurements remain separately coverage-qualified.

Timers use supported-session wall time, not a count of returned sparse candles. The deadline limits the **candle completion time**, inclusive, not a requirement that a provider response arrive at that exact instant. Allow at most the normal two-minute event-freshness window for receipt of that last eligible candle; this is bounded arrival grace, not permission for a later candle to complete an expired formation. After the logical deadline remove the pending entry presentation while awaiting that candle. Store both completion and receipt/knowledge times. Evidence received outside the grace can reconstruct history, not resurrect a live alert. Session-end candles may complete a historical event, but no new current opportunity/alert carries into the next session.

Missing updates/halts freeze price judgments but do not pause the logical deadlines or extend arrival grace. Newer price bars cannot replace a missing required earlier test. This prevents both premature expiry before the ordinary five-second fetch offset and indefinite revival after an outage.

At a session boundary expire unconfirmed instances; carry momentum context, not stale alerts, into a fresh session assessment. Remove/disable/access changes cancel delivery first; unreliable price sequences set a separate availability field rather than erasing a prior Confirmed event or creating Failed. With coherent prices process candles chronologically: a failure that occurred before expiry remains a failure, and a later recovery cannot confirm the terminal instance. A known decisive loss of the parent impulse base prevents confirmation on that observation and records context loss. Never infer such ordering solely from the high/low of one candle.

An expired/failed instance cannot rearm on another price cross alone. Require a new causal pullback low and later response/high sequence after its terminal observation; VWAP also requires a new two-close below-anchor phase. A confirmed continuation can create a later new opportunity only after a new peak followed by a distinct decline/test. Different finer/coarser views of the same leg are grouped, not treated as rearming.

### Stable grouping

Evaluate all enabled detectors for an accepted input batch before forming notifications. Keep each constituent's state and timestamps. Never paint a Forming higher-low sibling Confirmed because an EMA20 sibling confirmed. The group header lists the actual states, for example **EMA20 confirmed · higher low forming**.

A group initially belongs to one publication, market date and parent momentum episode. Join a later instance only when its formation interval overlaps the group's frozen initial interval, its observed reaction-low references belong to the same causal 1m pullback cycle, and the full spread of constituent trigger references stays within `0.5 * A_5` frozen at group creation. For a candidate not yet having a reaction low, provisional grouping may use its common causal decline start, but separate it before delivery if the eventual cycle differs. No transitive price-chain grouping: compare the entire group's trigger spread, not only its last member. When multiple groups qualify choose the oldest compatible group, then stable ID.

EMA9/20 bands must overlap to receive the combined EMA label. A 1m flag and its 5m view may share a group but retain their actual frames. Different VWAP anchors remain named even when their same-cycle reclaims are grouped. If evidence or `A_5` is unavailable for proving a shared leg, keep separate instances; this does not withhold an otherwise ready 1m formation. A missing 5m context is labeled as unavailable rather than replaced with a 1m value. Never suppress a distinct opportunity just to reduce counts.

Persist a group's ID and original notification identity. Adding/removing siblings cannot recreate a notification. Default budget is one Forming and one first price-Confirmed notification per proven shared group. Later sibling confirmations update the card/history without another alert. A genuinely new pullback cycle gets its own group. This grouping/notification behavior is verified on mixed-state and multi-frame examples before activation.

## Detector specifications

### VWAP Reclaim and Hold

Context: A qualifying upward impulse exists in the current or continuing momentum episode. Price subsequently trades below the selected VWAP. Do not require the stock to have sold off at the opening bell specifically.

Forming requires two coherent completed closes below that same contemporaneous VWAP basis. Then require either a recognized higher low or two rising recovery closes with a net rise greater than `E_1`, and distance to VWAP from below no greater than `0.25 * A_5`. A falling VWAP crossing stationary price is not a reclaim. Record the lowest observed recovery low and available volume context.

Record an initial reclaim when a completed 1m close rises above its same-time VWAP plus `E_1`. Confirmed requires a **later** completed candle to close above its same-time VWAP, either as a hold or after an observed test/brief undercut. The recovery must include an actual price rise greater than `E_1`. These are completed price conditions; attach the reclaim-bar and hold/retest-bar volume observations independently. A weak/unavailable volume observation does not turn the completed hold back into Forming.

Failed: Sustained loss of the fixed recovery swing low. Two closes back below their contemporaneous VWAP are separately labeled **Reclaim lost**; do not call that the entire momentum thesis failing while its recovery low remains intact.

Deadline seeds: 15 supported-market minutes from Forming to reclaim, then five supported-market minutes from reclaim to hold. A session boundary expires the unfinished instance. Missing data does not extend these deadlines; it withholds a price judgment and prevents obsolete alerts. A new attempt requires a fresh two-close below-anchor phase plus a new observed recovery.

### EMA9 Pullback and Bounce

Context: A recent qualifying upward impulse, rising completed 5m EMA9, and price above EMA9 before the pullback. VWAP position and EMA20 alignment are context, not universal requirements.

Forming: A decline of at least `0.5 * A_5` from the latest recognized peak approaches/intersects the known 5m EMA9 band, with either the defined slowing, a provisional higher low followed by a positive close, or an observed close rising at least `0.5 * A_1` from the latest test low. A quote near EMA9 alone is not enough. Record measured contraction when available.

Confirmed: A real 1m range test intersects the as-known EMA band, or a brief undercut is followed by a recovery close above the as-known EMA. The first completed response candle that closes at least `0.5 * A_1` above the test low and above its available EMA defines a fixed reversal-high trigger. A **later** 1m close must exceed that high plus `E_1`; the selected 5m average must still be rising at recovery/trigger. Volume is independently qualified against the recent and pullback baselines. Do not substitute an unrelated session high for this local trigger.

Failed: Sustained loss of the pullback swing low. EMA flattening/falling is separate context; one cross below the average does not itself invalidate the momentum thesis.

### EMA20 Pullback and Bounce

Use the same chronological test/recovery/trigger sequence as EMA9, anchored to rising completed **5m EMA20**. Require the established upward move and prior price above EMA20, not a falling average being reclaimed from a downtrend.

An EMA9 loss does not automatically defeat this setup. Price may lose the faster average, test EMA20, and build a fresh response. EMA9 position and VWAP are recorded as supporting or conflicting context.

When the stable same-leg grouping rules are met and EMA9/EMA20 test bands overlap, label the group **EMA9 and EMA20 pullback**, with both values and each constituent's state. Band overlap alone does not prove the same price leg. Separate later tests retain separate episodes. Do not force a deeper EMA20 setup where there is only one test.

For both EMA detectors, the deadline is 30 supported-market minutes from Forming, equivalent to six normal 5m intervals even when returned bars are sparse. A session boundary or two falling-slope 5m observations expires an unconfirmed instance. Carry momentum context across sessions, not unfinished alerts. A distinct later price test can begin a new instance under the shared rearm rules.

For any unconfirmed detector, a new test low may revise its response/trigger evidence only while the original context and sequence remain eligible. Persist a superseding version under the same instance/group and cancel the old pending trigger. For horizontal swing-low boundaries, retain the original failure reference through that instance rather than lowering it to absorb a loss. For sloping flag/wedge boundaries, retain the accepted fit coefficients while evaluating new bars; project the line at each actual observation time.

On the first completed close beyond a failure boundary, freeze that boundary/fit and the loss counter until the next coverage-coherent close either confirms the second loss or recovers inside it. A refit/new test may not reset that counter or widen away a breach. Unknown intervening data suspends this judgment until recovered; it does not count as recovery. After confirmation, the event's structural references are immutable; later pullbacks form new episodes rather than trailing rewrites.

### Higher Low Reversal

Within the most recent 60 supported-market minutes, choose the latest causal `L1 -> H1` pair after the defined meaningful decline. Require `H1 - L1 >= A_1` and more than one complete 1m bar between tests. A later distinct decline establishes `L2 > L1 + E_1`; use the first subsequent completed response close at least `0.5 * A_1` above that test low to recognize Forming. If several valid pairs exist choose the latest `H1`, then latest `L1`; do not select older lows just because they create a larger apparent reversal.

Forming: The second decline holds above `L1`, and an observed response begins from `L2`. A future higher low cannot be known just because the current candle has not yet broken `L1`.

Confirmed: A completed 1m close above the fixed intervening high `H1 + E_1` after the actual `L2` test. It may be the first response close that makes `L2` recognizable if the prior `L1/H1` sequence is already known and the low precedes that close; record direct confirmation without inventing an earlier Forming alert. Otherwise wait for the later qualifying close. Show independent volume evidence. A closer response-candle break is not the completed higher-low reversal.

Failed: Sustained loss of `L2`. Breaking `L1` separately documents that the broader reversal structure was lost. A new higher-low attempt must have new swing evidence, not repeat alerts from the same prices.

Deadline seed: 30 supported-market minutes from recognizing `L2`, a session boundary or superseding structure. An updated `L2` must remain above `L1 + E_1`; otherwise this higher-low candidate ends rather than being stretched into a different pattern.

### Premarket High Breakout and Retest

Use the same trading date's premarket high from an authoritative provider field with verified premarket scope/date, or from a price-history range whose completeness is established by the coverage contract. High readiness does not require valid volume. Sparse returned bars are acceptable when the transport establishes that they are the complete traded range; do not require invented rows for quiet minutes.

If completeness is unknown, use the maximum accepted observed premarket price and label the entire instance **Observed premarket high retest**, including its scope and data-through time. This is a qualified variant of this family, not a verified full-session high. Conflicting compatible high sources defer this anchor until reconciled; do not choose whichever makes the setup look better. Freeze the selected anchor at regular open or first monitoring initialization. A later source correction creates an anchor revision and supersedes dependent unfinished candidates without rewriting previous events.

First observe a completed regular-session close above the frozen high plus `E_1`. A first regular candle opening above it is labeled **Opened above premarket high**, rather than an invented intrabar break. Record breakout volume without making expansion a prerequisite. Then wait for a later actual pullback. Forming begins when a declining 1m close/range approaches within `0.25 * A_5` of the high, before the recovery has already occurred.

Confirmed: A later test intersects that anchor band and holds or briefly undercuts it. The first completed response candle closing above the **premarket anchor** and at least `0.5 * A_1` above the test low defines its reversal-high trigger; a subsequent completed 1m close must exceed that high plus `E_1`. This uses the anchor, not an extra EMA condition. Record recent/pullback volume separately. Do not infer an earlier breakout and later retest from the same bar.

Failed: Sustained close below the defended retest swing low; a wick below the premarket high alone is not failure. Record loss of the breakout level separately.

This specific detector applies during regular hours. It is not replaced silently with an after-hours high. A generic prior-session-high retest can be a later separately approved extension; it is not required to count this inventory complete.

Deadline seeds: first retest within 30 supported-market minutes of the observed breakout/open-above event; confirmation within 15 minutes of Forming; always expire at regular close. A later fresh breakout after a new below-anchor phase and new swing sequence can rearm. An initial run that never retests remains an observed breakout, not a fabricated retest setup.

### Bull Flag or Momentum Consolidation Breakout

Include **1m formation** and **5m formation** variants, each with its own observed impulse and 5m context. A pause contains 3–12 completed bars on its formation frame: 3–12 minutes for 1m, 15–60 minutes for 5m when coverage is continuous. Require both the bar bounds and the elapsed-time limit; sparse prints cannot extend a three-minute pattern across an hour.

Use the selected impulse's actual high, start and pre-span range base. Pause depth is `(impulseHigh - minimumPauseLow) / (impulseHigh - impulseStartOpen)`, with a positive denominator, and must be between zero and 0.50. Sustained loss of the documented impulse base ends its context. A break of only the pause floor is this pattern's failure, not automatically failure of the whole runner.

Fit a parallel channel from the completed pause bars: use `x_i = (barEnd_i - firstBarEnd) / frameDuration` so gaps retain actual elapsed time. Ordinary least squares on closes against these elapsed-frame coordinates gives `m`; `upper(x) = m*x + max(high_i - m*x_i)` and `lower(x) = m*x + min(low_i - m*x_i)`. Require positive width no larger than half the impulse displacement and `m/A_F` between -0.25 and +0.05 per formation interval. A **Bull flag** additionally requires two upper and two lower contacts within `E_F`, each same-side pair separated by a full formation interval. Never discard a valid wick to make it fit.

If the specific flag fit fails, the broader **Momentum consolidation** label may use a horizontal range `[minimumPauseLow, maximumPauseHigh]`, width no greater than half the impulse displacement, and normalized close slope magnitude at most 0.25 per formation bar. This is a separate documented geometry branch, not permission to label any decline a flag. All constants remain calibration seeds.

Forming begins when that price pause is recognizable and price remains inside the current channel/range. The initial detection saves its fitting revision, trigger boundary and fixed pause low. Report measured volume contraction independently.

Confirmed: A completed 1m close exceeds the **prior accepted fit's** projected upper boundary at that time plus `E_1`, with an actual upward close change greater than `E_1`. Record volume evidence, not a hard expansion gate. Evaluate the new bar against the old fit before considering it in a candidate update. A new 5m result at the same boundary cannot absorb a 1m breakout into the range. A later retest is further context, not a prerequisite for this breakout setup.

While Forming, failure is two coherent closes below the prior fit's projected lower channel boundary minus `E_1`; the horizontal consolidation branch uses its fixed range low. Freeze a pending breach fit/counter as specified above so a refit cannot absorb the first loss. After confirmation, use the fixed observed pause/test low saved at confirmation for the post-confirmation observation, not a line that keeps descending. If unconfirmed, expire at 12 formation intervals from pause start (12 or 60 supported-market minutes), the session boundary or context loss. Related 1m/5m versions share an alert only when grouping proves the same leg.

### Falling Wedge or Descending Pullback Breakout

Include separately labeled **1m formation** and **5m formation** variants after an observed upward impulse. Search only 8–36 completed bars of that frame: 8–36 minutes for 1m, 40–180 minutes for 5m under continuous coverage. Both elapsed duration and bar count must fit. At least three recognized high pivots and two recognized low pivots, each separated by a full formation bar, are needed for the Falling wedge label.

Evaluate at most the most recent eight eligible pivot-start windows; for each, include every recognized high/low pivot through the previous accepted bar. Use least squares separately on high-pivot and low-pivot prices against elapsed formation-frame units. Shift the upper intercept upward to contain all accepted window highs, and the lower intercept downward to contain all window lows. Do not drop a valid outlying price; failure to meet residual/touch limits means the specific wedge fit fails.

For **Falling wedge**, require `upperSlope < lowerSlope < 0`, positive width at both ends, ending width at most 0.80 of starting width, and every fitting pivot within `0.25 * A_F` of its corresponding boundary. At least three upper/two lower contacts must be within `E_F`. The final upper contact is later than the first, and the candidate must approach that prior accepted upper line from below. Rank valid fits by latest start, then smallest normalized maximum residual, then earliest pivot identity. This bounds both CPU and discretionary fitting choices.

For **Descending pullback**, permit a nonconverging lower boundary only if there are at least two causally recognized lower high pivots and two lower low pivots differing by more than `E_F`, a negative upper fit containing all window highs, and its two upper contacts within `E_F`. Use the same bounded search, duration and prior-impulse requirements. Do not claim a wedge or create additional trendline variants when this fallback is used.

Forming: The completed pattern is recognizable and a recovering 1m close from below comes within `0.25 * A_F` of the projected upper line, with actual price rise greater than `E_1`. Confirmed: A completed 1m close exceeds that prior fitted upper line plus `E_1` with actual upward close change greater than `E_1`. The coefficients must predate the trigger bar. Attach volume evidence independently; a line drifting below stationary price is not price confirmation. A later retest is further context.

While Forming, failure is two coherent closes below the prior accepted lower-envelope projection minus `E_1`; the generic descending branch retains the lower fit from its recognized low pivots even though convergence is not required. Freeze the pending fit/counter on the first breach. Do not fail an intact descending formation merely for making the lower lows its geometry expects. After confirmation, monitor the fixed latest defended low saved at confirmation, not a lower envelope that continues descending. Without confirmation expire at 36 formation intervals (36 or 180 supported-market minutes), a session boundary or context loss. Use common history/rearm rules.

## Missing or conflicting evidence

- Record a valid developing price pattern even if volume is unavailable. Once its price sequence completes show **Confirmed · volume unavailable**, **Confirmed · volume not expanded**, or the measured expansion qualifier. Never fabricate missing volume or keep a completed price event labeled Forming just because volume did not qualify.
- Failed feed/authorization does not mean Failed setup. Keep the prior valid event and its time. Show **Live detection unavailable** when there is no current calculation, without provider names or raw errors.
- After missed updates, recover and replay the missing sequence before evaluating a fresh alert. A post-outage quote cannot prove the intervening test held. If the necessary sequence cannot be recovered, mark that episode unverified rather than continuing its old green state.
- Exclude only the detector that needs a missing anchor or calculation. An unavailable VWAP does not suppress a higher-low setup.
- Halted periods freeze evaluation; resumption requires fresh candles and reassessment of gaps, levels and elapsed time. Do not alert from an old trigger merely because the worker restarted.
- Overnight unsupported hours and closed-market days allow historical display/replay, not live claims. Resume on the exchange calendar, not a hardcoded weekday clock.
- Store conflicting timeframe evidence without turning it into a numerical quality score. A 1m bounce can coexist with a weakening 5m trend; its label must retain that context.

## Member card and admin design proposal

### Member card

Proposed title: **Trade Setups**. Keep it separate from the analysis and Indicators cards. No generic descriptive subtitle.

Placement proposal: directly above Indicators, after the analysis/notes/levels content in the existing detail layout. Do not move existing cards while implementing this card. Obtain owner approval for desktop and mobile placement and the actual preview before accepting UI implementation.

Each current opportunity displays:

- Setup name and Forming/Confirmed price status, with text as well as color, and a separate always-present volume qualifier.
- Structure timeframe and trigger timeframe.
- Relevant area/EMA/VWAP value, actual trigger and observed swing-low reference, without inventing targets.
- One short factual explanation and concise checkable conditions. Example: **Higher low holding · reclaim above $2.46 pending**. All example prices are illustrative.
- Detection/update time in Eastern Time, without seconds; include date when not today. Never advance it on a page reload.
- Expandable event sequence showing the developing event, price confirmation and any later failure/expiry. Confirmed events move to Recently confirmed/history under the defined age rule; they never remain a pending entry setup. Failed/expired instances leave current opportunities.

Group only the same proven price leg under the stable grouping contract. One row may say **EMA20 confirmed · higher low forming**, with each state shown separately. Keep all underlying records and frame/anchor labels. A volume tag is orange when missing/uncomparable and factual when expanded/not expanded; it does not change another detector's price state.

When monitoring is disabled, omit the card. With valid data and no match, use a compact **No setup detected** state rather than seven empty cards. Unavailable data must not be presented as no match. Do not blur empty placeholders or display an implication that no volume traded.

No 0–100 quality score, invented confidence percentage, automated targets, trade execution, position sizing or AI-generated narrative in this first feature. Nearby known resistance and current distance can be shown as factual context where already cached, without rejecting a setup or requiring an extra Levels request.

### Admin controls and audit

Add a separate click-to-open **Setup Detection** section, not another dense group of per-ticker buttons in the main admin list. Global settings: feature enabled, seven detector switches, supported sessions, member-card visibility, and event delivery preferences. Keep technical numeric parameters versioned in code for calibration rather than exposing dozens of sliders initially.

Per ticker: one clear **Detect setups** checkbox in an existing appropriate expandable settings area. Show current state and last successful evaluation in the Setup Detection section. Do not recreate retired live technical/lifecycle features under the old names.

Include a dedicated **Setup Audit** subsection within that section: accepted feed timestamp, queue/transport duration, unique outbound provider requests, logical consumer/reuse counts, combined rolling-budget usage, actual minimum start spacing, bytes/rows, known/unobserved egress coverage, fallback outcomes, rate limits/backoff and next eligible time, eligible tickers, rules version, missing dependencies, candidate conditions, transitions, delivery receipts and export. Provider connection status stays in its existing place. Distinguish provider rate limiting from local scheduling deferral; never label a local 80/minute guard as a Moomoo error.

All indicator, status, trigger and failure labels need click/tap question-circle tooltips with plain trader wording, matching the existing style. Explain a Forming setup versus a completed condition, EMA9 versus EMA20, VWAP anchor and volume baseline. Update Help when implemented; no Help text is changed during this planning task.

## Optional notifications

The attachment calls for Forming and Confirmed alerts. Plan support for both, independently selectable, without activating live delivery during development. Approaching is page information only by default; Failed and Expired update the page/history without extra member notifications by default.

1. First run in a saved, non-posting observation mode. Then use an owner-approved private test destination. Member Discord, push or email setup delivery remains off until that checkpoint is approved.
2. Use a distinct **Watchlist setup alerts** preference for members. Existing listing/analysis preferences and announcements keep their behavior. Email can be available but starts off because minute-sensitive setups may arrive too late for that channel.
3. For Discord, inherit the current destination for the published ticker category and the configured mentions for that destination. Do not hardcode a role, reuse a pasted secret, or send a private/premium ticker to free chat. Free-channel setup distribution requires a separate explicit owner selection.
4. Apply the shared-group budget: one Forming and one first price-Confirmed notification for that proven price leg. Each message names only constituents that actually reached the state and includes its volume qualifier. Later sibling confirmations or volume changes update the page/history, not a third default alert. A different price leg may create a genuinely new group.
5. Logical notification identity is publication + stable group + phase + audience/channel type (and recipient for personal delivery), not mutable group membership or destination. Record the actual destination/settings revision on each delivery attempt. Before transport starts, a list move can retarget the same unsent intent and cancel the old route atomically. If an attempt already started, its destination is fixed until its outcome is reconciled; a successful or unknown old-route send never automatically creates a second new-route send. Member notifications about the move itself remain the owner's separate existing workflow. Access withdrawal, removal and disable cancel pending deliveries.
   A transport timeout can leave actual delivery unknown. Use provider idempotency where supported; otherwise reconcile a receipt or destination readback before automatic resending. Do not claim exactly-once external delivery from a local outbox alone, and do not apply this recovery policy as a new restriction on the owner's existing analysis approval.
6. Before delivery, recheck current publication identity, visibility, owner feature/session choices, member preference and whether the event remains timely. Never backfill obsolete setup alerts after an outage.
7. Proposed freshness cap for outgoing alerts is two minutes after the evaluated candle's completion. Expired items remain in audit but do not burst into channels later. Calibrate this cap against real transport latency; it affects only this feature's automatic alert, never owner publication controls.
8. Use short text and a direct detail-page link. Do not attach analysis images or call this Analysis updated. Initial example: **ABC · EMA20 pullback forming · 5m** followed by its observed area and pending trigger. A confirmation always states its volume qualifier, including **volume unavailable** or **no comparable baseline** when applicable. A 1m pattern is labeled 1m, not simply 5m because that context was used.

Protect member access server-side. Private tickers stay private. Ticker-Premium restrictions apply to lists, detail pages, event endpoints, streams, cached payloads and external notifications. Proposed initial setup-card audience also inherits analysis access so this new surface cannot disclose restricted analysis-derived levels; independently calculated setup access can be separated later if the owner wants. A public notification preview must not leak a hidden ticker or price. Notification failure never rolls back approval or removes a Watchlist ticker.

## Persistence and event audit

Watchlist owns detector settings, candidate/checkpoint state, immutable transitions and rebuildable current-card snapshots. Platform owns user preferences and outbound delivery. Do not store this feature in Journal trades or reuse a round-trip ID.

Proposed records:

- Settings revision with global/per-ticker enable choices, detector switches, session choices and delivery defaults.
- Coherent input revision with symbol/publication identity, calendar, price/volume units, provider/adjustment, per-frame timestamps, coverage and replayable accepted bars/checkpoint references.
- Pattern instance and stable opportunity group, defining swings/anchor, fixed structural trigger/failure references or explicitly projected line coefficients, candidate revision, time-varying EMA/VWAP observations, independent price/volume states, rules version, creation/knowledge time and deadlines.
- Append-only transition with evaluated-through, observed-at and published-at times, exact condition values, unavailable dependencies and input hash.
- One logical notification intent per stable group/phase/audience, with a versioned destination on its delivery attempts, cancellation/retargeting records and final receipt.
- Outcome observation at 5, 15, 30 and 60 minutes and the supported session end, including highest/lowest later observed price, time to confirmation/failure, coverage and censoring reason.

Evidence must reconstruct the decision, not merely retain an input hash after discarding all its inputs. Save bounded candle windows and indicator seeds actually needed by each recorded episode, deduplicated by input revision. Keep full diagnostic errors, credentials and private account IDs out of exports. The owner-authorized storage correction uses 100 MB/5,000 managed files, reserves 4 MB/16 slots for controls, and rotates only older automatically generated evidence/configuration history toward an 85% low-water mark. Preserve each publication's latest full replay record, current settings and separately named pinned exports; pinned exports must not use automatic-history filenames. Current control saves do not depend on an optional history copy. See the correction QA report for tested failure/recovery boundaries. No existing app evidence was deleted during offline verification.

Measure outcomes separately from trading profitability. The detection price is an observation, not a simulated fill. Report MFE/MAE relative to detection and separately confirmation; do not assume spreads, execution order or intrabar stop/target sequence. Compare only episodes with adequate later coverage, and identify unfinished/closed-session observations.

Schema changes will probably be additive settings/instance/event/delivery storage. Exact tables, migration number and allocation are implementation decisions after checking current manifests. No migration is created or applied by this plan. Keep one persistent-volume writer and transactional event/outbox updates; use existing migration/release coordination only when that work is actually scheduled.

## Implementation inventory and checkpoints

Proposed pure engine modules live under `src/lib/live-watchlist/setups/`: types, validated input adapter, causal swings, momentum context, volume evidence, state machine, overlap grouping, and one detector module for each of the seven names. Preserve this complete list in the implementation prompt.

Server integration belongs under `src/modules/watchlist/server/setups/`: repository, demand adapter, cached member projection, owner controls/audit and replay export. A shared Watchlist market-data scheduler/cache belongs under `src/modules/watchlist/server/market-data/`, registered once by the existing hosted worker startup, with the existing refresh trigger adapted to that same acquisition. Combined WebAPI admission belongs at a reusable Platform server transport boundary, not inside a single detector or an account-keyed Watchlist-only coordinator. Inventory minimal caller hooks, including separate process/relay boundaries, before implementation. Extract/reuse acquisition without forcing 15m/Daily fetches for setup demand; do not create parallel indicator/setup polling loops. Reuse Platform delivery contracts; pure detectors never call Discord. Exact filenames/routes must be reconciled against current source before coding.

UI additions use the existing Watchlist card styles, member authorization and owner settings patterns. Candidate files are `app/watchlist/watchlist-setups-card.tsx` and a focused owner Setup Detection panel, plus authorized cached read/event routes. Add schema/migration and Help files only when their checkpoint requires them. No new public navigation item, dashboard shell, independently running local app or whole-market scanner.

### Checkpoint 1 Plan and interface approval

- Review this full revised plan, including independent price/volume states, regular/day VWAP defaults, 1m and 5m formation variants, numeric calibration approach, card placement and notification scope with the owner.
- Confirm source ownership and deployed/runtime revisions without overwriting Codespaces or concurrent local work.
- Approve a static desktop/mobile card and admin section design before wiring live behavior. Use representative populated, empty, unavailable, forming, confirmed and failed states.
- Confirm ticker inheritance, per-ticker override, premium access and whether member alerts are wanted for the first release.

### Checkpoint 2 Feed and pure detection foundation

- Verify actual authorized Moomoo minute and native 5m responses, volume reliability, timestamp completion, session coverage and available lookback.
- Trace actual WebAPI outbound/egress paths and document which callers share the 100/minute published scope. Implement shared admission, conservative 750 ms/80-per-rolling-minute defaults, durable cooldown/start accounting and minimal caller hooks without changing existing feature logic or retry ownership. Unknown external traffic must remain explicit.
- Implement cache-first per-frame demand, compatible in-flight/page reuse, bounded current-window/backfill priorities and read-only snapshots without changing Indicators formulas or analysis generation. Reconcile the old/new refresh trigger into one acquisition owner; verify source-completeness semantics and independent regular/day coverage readiness.
- Implement rule-versioned causal swings, momentum episodes, volume measurements and immutable state transitions.
- Build a chronological replay runner from saved data before any external posting. Record feed capacity and latency, including unavailable volume and no-trade ambiguity.

### Checkpoint 3 Group A detectors

- Implement VWAP Reclaim and Hold, EMA9 Pullback and Bounce, EMA20 Pullback and Bounce, and Higher Low Reversal.
- Review event-marked real charts showing what was visible when Forming and Confirmed were recorded.
- Verify mixed-state EMA9/20/higher-low groups, immutable moving-average observations, two VWAP anchors, missing/weak volume after real price confirmation, continuing multi-day context and failed recovery.

### Checkpoint 4 Group B and C detectors

- Implement Premarket High Breakout and Retest, Bull Flag or Momentum Consolidation Breakout, and Falling Wedge or Descending Pullback Breakout.
- Verify retest order, qualified observed premarket highs, premarket-high deadlines, exact flag/wedge fits, meaningful impulse context, both formation frames and honest generic fallback labels.
- Evaluate all seven together; a new detector must not change another's evidence or create duplicate alerts.

### Checkpoint 5 Integrated card and observation

- Connect owner-approved UI and protected cached reads, not provider calls from browsers.
- Complete tooltips, Help, audit/export, restart recovery and publication identity isolation.
- Observe all enabled Watchlist tickers across multiple sessions without member delivery. Require the per-detector and per-formation-variant held-out examples below; retain missed/false/late events as well as successes.
- Agree any shared calibration change, freeze a new rule version and retest the complete inventory. Do not promote only the attractive cases.

### Checkpoint 6 Optional delivery and release

- Test the approved private destination and opted-in test devices/accounts only after explicit permission. Verify mentions, audience restrictions, routing, expiry, retries and receipts without altering existing listing/analysis delivery.
- Final owner desktop/mobile approval precedes member-facing activation.
- Complete proportionate final verification, source reconciliation and a narrow coordinated release. Record exact source/deployment/health evidence; do not describe a successful code check as successful live detection.
- Keep an independent feature-off rollback: disabling Setup Detection stops its scheduler demand and deliveries while leaving analysis, existing Indicators and publishing intact.

## Verification matrix

No test, build, provider request or replay execution is authorized or performed merely by writing this plan. Follow the owner's low-resource testing cadence: batch related implementation, then focused checks; larger suites at checkpoint/final acceptance only. Do not run Vitest or a local production build without the applicable owner authorization.

### Detector and calculation checks

- All seven: positive examples, similar non-setups, Forming, exact price confirmation, each volume qualifier, failed price confirmation, genuine new episode, equality/deadline boundaries, late-arriving historical evidence, missing dependency, Recently confirmed/history and repeated identical input.
- EMA9 and EMA20: separate/combined tests, mixed-state siblings, rising versus falling EMA, insufficient warm-up, brief undercut, no rebound, flattening trend, a later EMA20 response after EMA9 fails, and a 1m test at a 5m completion boundary using start/end as-known values.
- VWAP: independent regular/day coverage, first minute, zero volume, missing volume, sparse but provider-established traded ranges, truly unknown gaps, an observed-bars diagnostic not promoted to a session anchor, drifting VWAP without price recovery, reclaim without hold and real later retest.
- Higher low: distinct `L1/H1/L2`, lower/equal lows, provisional lows, direct response-close confirmation versus a later trigger, and no future pivot knowledge or invented earlier Forming event.
- Premarket high: authoritative versus observed range labels, conflicting/corrected anchors, complete sparse versus unknown coverage, open-above versus intraday breakout, breakout without retest, real retest, brief undercut, sustained loss, every timeout and no same-candle invented order.
- Flag: single-/multi-bar impulses, exact channel/range branches, sparse elapsed-coordinate fits, 1m/5m durations, missing 5m context for a ready 1m formation, volume qualifiers, excessive retracement, outlier wicks, pre-trigger coefficients and a first boundary-loss close that a refit must not absorb.
- Wedge/pullback: both frames, exact convergence/residual/touch bounds, parallel/widening geometry, insufficient pivots, all-wick containment, line drift, bounded fit ties, trigger-candle exclusion, valid lower lows inside the envelope and preserved first/second breach counts.
- Volume: null versus zero, zero denominator, wrong session/frame, trigger excluded, opening minutes, equal first/last contraction windows for four/five/six bars, distinct recent/pullback baselines, same-candle corrections and no retrospective credit from a later candle.

### Integration and failure checks

- One accepted current window serves all eligible detectors and due Indicators; viewers/tabs add no requests. Verify cache-hit and compatible in-flight reuse, different millisecond windows producing one outbound date URL, authorized superset slicing, immutable consumer views and genuine newer-minute fetches. An incompatible source/adjustment/session/scope is never deduplicated incorrectly.
- Verify one-minute freshness without blindly calling/removing the existing 120-second all-frame throttle; 15m/Daily requests are not accelerated. The old runtime trigger and hosted feed owner cannot each fetch the same due page.
- Indicator-only, setup-only, both enabled and both disabled demand states behave as described.
- Mixed Analyzer/AI/Indicators/setup/quote/scanner-relay/auth traffic shares one same-IP start ledger, not one budget per ticker or token. Verify 750 ms start spacing, the rolling 80-start guard at exact window edges, clock changes, no idle burst, all pages/retries/timeout attempts counted once and zero budget charge for cache/coalesced consumers. No waiting job consumes a transport slot or HTTP-timeout budget; token refresh cannot deadlock behind its own admitted data request.
- Distinct versus shared egress groups and unknown external callers stay explicit; don't infer IP from account identity. Restart, failed ledger restoration, group-wide HTTP 429, provider `Retry-After`, missing/malformed retry guidance, preserved cooldown and mid-queue cancellation cannot reset admission or create a catch-up burst. Detaching one timed-out/disabled consumer leaves shared work alive only for remaining demand and cannot start duplicates. New setup demand yields first when capacity is unproven or occupied by existing work.
- Rate limit, token expiry, provider disconnect, slow response, timeout, partial pagination, future padded slots, malformed candle, conflicting duplicate and same-symbol different adjustment are audited without fabricated data.
- Adding/removing/re-adding/moving tickers, toggling detection mid-request, analysis refresh, manual edits, publication-time corrections and older queued jobs preserve correct publication identity.
- Cold start/restoration, bounded backfill, concurrent existing consumers, stale queued work and shutdown preserve priorities. Restart/group membership changes do not duplicate events; corrected bars preserve original knowledge times.
- Market open, 9:30 transition, postmarket, market close, weekend, holiday, early close, DST and halt/resume do not reset the wrong anchor or masquerade as price failures.
- Premium/private ticker access is enforced on payloads and notifications, not only the card. Cached reads cannot leak raw provider access or other account data.
- Notification preference off, disabled delivery, unsent retargeting, started/unknown old-route attempts, mixed-state groups, new siblings and expired queues do not produce accidental repeats or stale alerts. Test real external ambiguity honestly; do not claim exactly-once transport. Publication/approval succeeds independently.

### Market behavior review

Start with at least 20 different active micro/nano-cap ticker-days spanning different dates, plus at least 10 negative/thin/choppy/failed-run examples. Retain all eligible owner-added tickers from the observation window, not a handpicked subset. In addition, each of the seven families needs at least five real held-out positive opportunities and five confusable negative opportunities across at least three ticker-days. For flag/wedge families require at least three positives and three negatives in **each** 1m/5m formation variant; a generic descending-pullback result does not validate the Falling wedge name. Qualifying events may overlap across families, so this does not mean requesting 70 different stocks. These are minimum evidence floors, not statistical confidence or profitability claims.

Include fresh premarket runners, regular-session launches, postmarket launches, multi-day continuation, early selloff/recovery, a strong EMA9 trend, a later EMA20 defense, momentum without a VWAP touch, false breakout, failed retest, wide-spread sparse trading and halt/gap behavior. Do not use dollar price or float alone to label liquidity.

Use disjoint calibration and holdout ticker-days, selected before inspecting detector results. First mark the opportunity, confusable non-setup, earliest recognizable time, required observations, permissible generic/specific label, and whether data is sufficient; freeze that chart-review record before running the detector. A second pass resolves disagreements against the same as-of chart, not eventual price performance. If ambiguity remains, retain it as disputed with a reason and report that population separately; do not silently exclude it to improve results. Any rule change makes the current holdout a calibration set and requires a new untouched holdout for acceptance.

Define **false label** as a claimed price state/geometry without its required observed sequence; **missed** as an unambiguous pre-labeled qualifying opportunity not recognized by its defined trigger/deadline; **late** as recognition after the first accepted input that contained all required conditions; **duplicate** as repeated group/phase delivery without a genuinely new leg. Track detector processing delay separately from provider receipt delay and actual dispatch time. Report Forming lead time and outcomes by family/frame/session, without conflating them with returns or a quality score.

Freeze these release checks before holdout: zero future-data, wrong-anchor, invented-price, state-transition, access-leak and unintended-repeat defects in deterministic checks; every unambiguous labeled held-out opportunity reconciles to the expected causal state/label; every mismatch is corrected under a shared rule or explicitly remains an unresolved limitation, not counted as a pass. Record p50/p95/worst provider, processing and dispatch delay; a notification must meet the two-minute event-age bound or be recorded as suppressed, not delivered as current. Any minute-close transition that waits for a later available candle without a specified hold is a timing defect. Report all suppressions and missed Forming lead time; do not hide them behind a successful delivery rate.

There is no arbitrary claimed trading win-rate gate. The owner reviews real charts and timing results before activation. A family/variant without its minimum real evidence stays **Unverified**, even if its unit fixtures pass. An agreed partial activation can leave it disabled, but the full seven-setup goal remains incomplete until every required family/variant is verified or the owner explicitly changes the scope.

No ticker-specific prices, symbol branches or fixtures that merely assert a desired price. Test price scaling and different volatility regimes. Daily-chart educational descriptions do not establish that a chosen intraday threshold works on nano caps.

## Acceptance criteria

- Every setup in the seven-item inventory is implemented or explicitly remains unfinished; Group A alone is not the completed feature.
- Every displayed state has replayable causal evidence, its actual frame/anchor and honest as-known timestamps. All seven meet their per-family/variant real evidence floor or remain explicitly unfinished.
- Forming can appear before the defined trigger; confirmation uses completed observations, not future candles or presumed intrabar order.
- EMA proximity, impulse and pattern geometry adapt to volatility under shared, versioned rules.
- Price confirmation is independent of the explicit volume qualifier; weak/missing volume never silently fabricates or erases a completed price event. Sparse versus unknown session coverage is established, not guessed.
- Overlapping patterns produce a readable combined card and no duplicate event burst.
- Existing compatible Moomoo evidence is reused across all seven detectors and due Indicators without duplicate acquisition. Combined same-egress WebAPI starts, spacing, rolling limits, extra traffic versus baseline, provider delay, rate-limit behavior and processing latency are measured for the chosen population/cadence; incomplete caller coverage cannot be reported as a globally enforced cap.
- UI/tooltips and admin controls have owner approval. Help matches behavior and premium/private access is preserved.
- Existing analysis, owner approval, publication price/time, gains, notes, levels, Indicators and listing/analysis notifications pass unchanged-behavior checks.
- Member deliveries remain separately controlled; no historical catch-up bursts or automatic free-channel leaks.
- Final release evidence and feature-off rollback are recorded before claiming production completion.

## Research and interpretation

The attachment supplies the original six setup definitions and two-event intention. The owner then added EMA20. The formulas, timings, geometry seeds and implementation sequence here are engineering proposals for validation, not claims that published sources prove those exact parameters.

- [Fidelity EMA guide](https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/ema/) explains exponential weighting, trend following and possible moving-average support/resistance. It supports the distinction between faster/slower averages, not a claim that every touch is a bounce.
- [SMB trading entries](https://www.smbtraining.com/blog/solutions-for-improving-your-trading-entries) discusses VWAP reclaim and pullback entry context. It does not establish the proposed numeric detector settings.
- [Fidelity stock volume](https://www.fidelity.com/viewpoints/active-investor/stock-volume) describes volume as evidence accompanying price direction and pattern completion. Candle volume is not the same thing as classifying each transaction's initiator.
- [Fidelity chart pattern guide](https://www.fidelity.com/bin-public/060_www_fidelity_com/documents/learning-center/Idenitfying-Chart-Patterns.pdf) describes pattern geometry, multiple wedge contacts and confirmation filters. Its broader examples do not validate one-minute nano-cap timing rules.
- [StockCharts flag and pennant guide](https://chartschool.stockcharts.com/table-of-contents/chart-analysis/chart-patterns/flag-pennant) supports the sharp-move, consolidation and renewed-volume sequence. Its example durations are not adopted as intraday constants.

## Plan review status

Revision 6 records shared-feed integration and recorded verification for Group A, with explicit live/release limits in the [validation report](watchlist-trade-setup-recorded-validation-2026-10-17.md). Revision 5 recorded the initial interface/engine slice; its zero-added-acquisition callback is now served by the shared minute-close demand path rather than an independent provider fetcher. Revision 4 approved Group A, retaining Groups B/C. The first, [second QA](watchlist-trade-setup-detection-qa-round2-2026-10-17.md) and [third QA](watchlist-trade-setup-detection-qa-round3-2026-10-17.md) remain unchanged historical reviews. The [progress record](watchlist-trade-setup-detection-progress.md) controls current source/verification status. No deployment, live activation or notification occurred.
