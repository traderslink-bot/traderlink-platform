# Watchlist Deterministic Indicators Plan

Date: 2026-09-12

Status: Owner authorized implementation on 2026-09-12. Calculation, shared runtime bridge, member card and owner audit slices have local implementation checkpoints. Restart recovery and historical-data QA are underway. Native-provider timestamp/session acceptance, current-release-parent navigation reconciliation and hosted acceptance remain incomplete. Deployment requires separate authorization. See the linked progress record for exact evidence and limitations.

Revision: Owner-approved planning clarification after QA, 2026-09-12. Keep two-minute Moomoo refresh initially; the existing one-minute poll is Yahoo-oriented, not proof of Moomoo capacity. Fetch sufficient history without an AI-token constraint. The technical gates below must be resolved before implementation acceptance.

Provider decision: **Moomoo is the selected primary provider**, with Yahoo fallback. This is not an open provider-selection proposal. Implement that direction and assess measured operation; capability checks determine truthful coverage and failure handling, not whether to choose Moomoo. This decision is not a claim that the new Indicators refresh is already deployed.

Parent: [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md)

Progress: [Indicators Progress](watchlist-deterministic-indicators-progress.md)

## 1. Outcome and complete scope

Replace the old ticker-detail Technical Context presentation with a fresh **Indicators** card. Give members useful, continuously updated, deterministic interpretations of market data for active micro/nano-cap day-trading stocks. Values alone are insufficient: explain what each indicator suggests and the evidence behind that description.

The complete initial feature inventory is:

- Always-visible compact 1m, 5m and 15m summaries.
- Detailed 1m / 5m / 15m / Daily tabs; default 5m and remember the viewer's selection.
- Trend, momentum, RSI including overbought/oversold context, VWAP, EMA9/EMA20, volume and ATR.
- Short evidence-based explanations, including conflicting signals between timeframes.
- One shared two-minute candle-refresh schedule per active ticker, not per viewer.
- Moomoo as primary candle provider; Yahoo fallback for this new Indicators path.
- Reuse existing live prices without generating extra candle or OpenAI requests for every quote.
- Provider connection/status stays in its existing admin card. Request history, fallback outcomes, statistics and exports belong in the separate, click-to-open **Indicator Audit** section. Neither surface exposes provider details to members.
- Member freshness display limited to **Last updated [time]**.
- Corresponding Help coverage, deterministic calculation tests, request-count verification and protected existing behavior.

No OpenAI requests are used to calculate, interpret or update this card. MACD, price-movement-triggered polling and additional user-configurable indicators are not required for this first slice.

## 2. Existing source findings and boundaries

These are findings from the source inspection preceding this plan, not a new live production verification. Reconfirm the deployed revisions before implementation. The inspected runtime integration baseline was `4ddeec837b131c6d54ad507fa514b8f416f9a06e`.

| Existing surface | Finding | Planned treatment |
| --- | --- | --- |
| Runtime `src/lib/technical-context/technical-context.ts` and types | Five-minute context with VWAP, EMA9 and EMA20; hardcoded source timeframe. Existing date/window selection is not an adequate new multi-timeframe session contract. | Reuse only verified calculations; replace the presentation/interpretation contract. |
| Runtime `src/lib/live-watchlist/live-watchlist-publisher.ts` | Publishes Technical Context. Some descriptions call mixed EMA positioning improving/cooling without measuring change. | Require actual change evidence for directional-change wording. Inventory all consumers before retiring old output. |
| Runtime `src/lib/monitoring/volume-activity.ts` | Existing volume buckets, relative-volume labels and reliability states. | Audit completed/forming bucket handling and baseline construction before reuse. |
| Runtime `src/lib/monitoring/live-derived-technical-candles.ts` | Can derive five-minute bars from sampled quotes and cumulative volume. | Do not treat sampled highs/lows as complete provider candles. |
| Platform `app/watchlist/live-watchlist-client.tsx` | Existing Technical Context and conditional Live 5-minute confirmation presentation. | Consolidate overlapping member indicator/volume commentary into the new card; preserve unrelated AI and publication controls. |
| Runtime `src/lib/monitoring/manual-watchlist-runtime-manager.ts` | Existing technical candle polling is Yahoo-oriented; publication and quote updates have separate cadences. | Do not confuse UI publication frequency with provider requests. Introduce the shared Indicators schedule deliberately. |
| Runtime `src/lib/market-data/platform-moomoo-ai-read-candle-loader.ts`; Platform `src/modules/watchlist/server/moomoo-watchlist-candle-bridge.ts` | Existing authenticated server-side Moomoo route/connection boundary. | Reuse secure connection handling; verify history capabilities and bounded request behavior. |

The existing AI analysis loader does not necessarily request fresh Yahoo data after a configured Moomoo request fails. The new card's explicit Moomoo-to-Yahoo fallback is new Indicators behavior, not a claim that AI fallback already works identically. Changing AI analysis fallback is outside this slice.

The inspected existing candle poll defaults to every 60 seconds, with a configurable interval. It requests Yahoo five-minute candles and falls back to Yahoo one-minute candles when usable recent five-minute coverage is absent. Poll frequency is not candle duration. It is conditional on runtime settings/service availability; this source finding does not prove actual production request counts, absence of errors, or one-minute Moomoo throughput.

### Potential Path ATR remains unchanged

The runtime's `src/lib/technical-context/average-true-range.ts` currently calculates a simple mean of 14 true ranges from completed five-minute bars with reliability checks. Potential Path uses reliable ATR for level spacing/noise filtering and related classifications; ATR does not invent support/resistance prices.

Do not change that calculation or its Potential Path consumers as part of this work. The new Indicators ATR may use its own explicitly versioned Wilder calculation. Two different methods must not be accidentally interchanged through a shared helper refactor.

## 3. Member layout and exact copy direction

Card title: **Indicators**. No explanatory subtitle under the title.

Show three compact summaries together, even when another detailed tab is selected. Each contains its timeframe and a short factual state, for example:

- **1m — Momentum fading**
- **5m — Uptrend holding**
- **15m — Trend improving**

These are illustrative states, not unconditional output. Each must be supported by the rules and data below; unavailable coverage must not be labeled neutral.

Under the summaries, show **1m | 5m | 15m | Daily** tabs. Detailed rows use **Trend**, **Momentum**, **RSI**, **VWAP**, **Moving averages**, **Volume** and **ATR** labels, with the value/state and one short explanation. Preserve sub-dollar price precision appropriate to Watchlist prices.

Examples of intended sentence style, using synthetic values:

- Trend: “EMA9 remains above EMA20 and both are rising, supporting the five-minute uptrend.”
- Momentum: “RSI has fallen over the last three completed candles while price remains above EMA20; short-term momentum is easing.”
- RSI: “RSI 76: overbought and still rising. Strong runners can remain overbought.”
- VWAP: “Price is above today's session VWAP, showing strength relative to the session's volume-weighted price.”
- Volume: “The last completed candle traded 1.6× the recent baseline as price advanced, supporting the move.”
- ATR: “ATR $0.03 (5.0%): candle ranges are expanding compared with the earlier baseline.”
- Conflict: “One-minute momentum is fading while the five-minute trend remains upward.”

No claim that overbought means sell, oversold means buy, VWAP guarantees a bounce, or a moving-average cross invalidates the AI setup. No guarantee or probability percentage without an independently justified calculation.

Desktop: summaries in one compact row, tabs and aligned details below. Mobile: readable wrapping/stacking without horizontal overflow or hidden summaries. Keyboard-accessible tabs, meaningful focus states and text labels must accompany color.

Remember the chosen tab locally as a display preference only; do not create a database migration just for this preference. Tab changes select a cached result, never request provider data directly.

### Freshness: latest owner decision controls

Show only **Last updated 9:42 AM ET**, with the date when not today. The time describes the selected detail's latest successfully calculated candle snapshot, not the page refresh time or HTTP response time.

- No member provider names, connection badges, stale badge, “update delayed” text or provider-error banner.
- Retain the last valid values and their unchanged timestamp when a refresh fails.
- A quote-only update must not advance the candle snapshot timestamp.
- Live price-relative comparisons must be labeled as current-price comparisons, not presented as newly recalculated candle indicators.
- If no valid value exists, display an em dash for that field and omit its interpretation. Do not fabricate neutral values or hide unrelated valid indicators.
- Track per-timeframe timestamps internally. Do not advance a card-wide timestamp that falsely implies an older timeframe was refreshed.

Each always-visible timeframe summary gets its own compact **Last updated [time]**. The selected detail has its own timestamp; Daily uses the completed trading date as well. The timestamp is the data-through boundary of the completed candles used, not the latest recalculation of unchanged input. Session VWAP is separately session-scoped with its own Last updated time when needed. This resolves mixed-age display without introducing stale notices. Current-price comparisons must be suppressed when the quote and candle snapshot cannot be meaningfully aligned; retain the last valid candle-based interpretation instead.

## 4. Calculation and interpretation contract

The following are proposed implementation defaults, to be finalized through deterministic fixtures and recorded with a rule version before release. They are not assertions that the existing implementation already follows them.

| Item | Calculation / evidence | Interpretation boundary |
| --- | --- | --- |
| EMA9 / EMA20 | Closing-price EMA for the selected timeframe, explicit seed and warm-up policy; slope over three completed bars. | Above/below is positioning. Rising/falling requires slope. Mixed alignment remains mixed unless change evidence supports improving/fading. |
| Trend | EMA alignment, slopes and completed-bar price positioning; use an explicit flat/noise tolerance calibrated against local ATR. | Describes the selected timeframe, not the survival/failure of the full day-trading thesis. |
| RSI14 | Wilder-smoothed gains/losses, explicit initialization and zero-gain/zero-loss cases. | Above 70 overbought, below 30 oversold; describe rising/falling separately. Neither is an automatic reversal. |
| Momentum | RSI change over three completed bars with price/EMA evidence where available. | Report easing/recovery only when change is measurable. Conflicting price and RSI evidence remains visible, not forcibly bullish/bearish. |
| Session VWAP | One shared calculation from completed **1-minute candles** for the defined extended-hours session: sum of `((H+L+C)/3) × volume` divided by total volume. | It is candle-derived VWAP, not falsely claimed to be an exact tick-trade VWAP. All tabs use the same result; never recompute VWAP from 5m/15m/daily candles when switching tabs. |
| Volume | Last completed bar relative to a recent same-duration, same-session baseline, excluding the current bar; compare direction/change separately. | Increased volume as price falls is not bullish confirmation or a measured order-flow imbalance. No partial bar versus full-bar baseline comparison. |
| ATR14 | Wilder-smoothed true range with explicit seed; dollar ATR plus `100 × ATR / last completed close`. | Volatility, not direction; expanding/contracting requires comparison against an earlier completed-bar baseline. Does not modify Potential Path ATR. |

Initial volume baseline candidate: preceding 20 valid same-duration bars, minimum 10. Final rules must specify zero-volume inclusion, session transitions and outlier handling; do not blindly retain the old positive-volume-only baseline. Do not call this historical time-of-day relative volume unless that separate dataset actually exists.

Intraday volume comparisons must not silently mix premarket, regular-hours and postmarket baselines. At a session transition, start the new same-session baseline; until it is sufficiently populated, show valid absolute completed-bar volume without an expanding/thin ratio interpretation. These session-reset rules apply to 1m/5m/15m, not Daily. Historical matched-session or time-of-day baselines may be used only after their coverage and exact calculation are specified. A higher-volume down candle supports wording such as “volume increased as price fell”; OHLCV alone must not be presented as a measured buy/sell order-flow imbalance.

Early-session volume must remain useful without waiting for ten five-minute or fifteen-minute baseline candles. Use this explicit progression:

- First completed bar: show its volume and price direction. If the current timeframe has no completed bar yet, show the latest completed one-minute session volume context separately, explicitly labeled **1m volume**; never present it as a completed 5m/15m reading.
- From the second completed same-session bar: compare its volume with the immediately previous equal-duration bar, using literal wording such as “Volume increased 24% from the previous completed 5m candle as price rose.” This is a bar-to-bar comparison, not a mature baseline or time-of-day relative-volume claim. If previous volume is zero, report absolute volumes without a percentage.
- Once ten preceding valid same-session bars exist: enable the recent-baseline ratio, using up to twenty preceding bars. Keep baseline comparison and bar-to-bar change distinctly labeled; they can disagree.
- The first completed regular-hours bar is not compared against the last premarket bar. The same boundary rule applies to postmarket. Known zero-trade bars and unknown gaps follow the explicit data-coverage contract, not silent exclusion.
- Matched historical-session comparisons remain optional future enrichment, not a prerequisite or an extra history-fetch loop for the first release.

Verify the first, second, tenth and eleventh completed bars on each timeframe and at each session boundary. Do not conceal the entire Volume row merely because the mature baseline is not ready.

RSI changes, EMA slope flat tolerance and ATR expansion thresholds must be explicit, versioned constants with boundary tests, not free-form judgment or constants tuned solely to one ticker. Threshold calibration must cover active runners and chop. When evidence is too mixed, use a concise mixed description.

Required calculation checkpoint: record the exact EMA/RSI/ATR seeds, minimum warm-up, comparison periods, flat/noise tolerances, threshold equality behavior, missing-input precedence and conflicting-signal rules in a versioned decision table. Verify the table with fixed examples before connecting it to visible labels. These values remain a technical deliverable, not an invitation to improvise descriptions during rendering or a claim that plan QA has validated them already.

### Initial rule version — deterministic defaults for verification

Use the following explicit starting specification, versioned `indicators-v1`. These are engineering defaults to verify, not a claim of empirically validated trading accuracy. If representative-data QA requires a change, revise this table and its fixtures before acceptance rather than silently changing the renderer.

- EMA(N): initialize with the arithmetic mean of the first N completed closes; subsequent values use alpha `2/(N+1)`. RSI14: initialize average gains/losses from the first 14 close-to-close changes, then Wilder update `(13 × previous average + current change)/14`. Both zero gives RSI 50; loss zero only gives 100; gain zero only gives 0. ATR14: initialize from 14 true ranges, each with a previous close, then the same Wilder update.
- Remove the blanket 100-bar gate. Readiness is per calculation and dependency: with the selected SMA seeding, EMA9 first exists at 9 completed closes and EMA20 at 20; three-bar slopes first exist at 12/23 closes respectively. RSI14 and ATR14 require 15 completed candles to supply 14 changes/true ranges; three-bar RSI change first exists at 18 candles. ATR's comparison with 20 preceding ATR values first exists at 35 candles. Composite trend requires both EMA slopes and valid positive ATR, not an unrelated universal history count. These are mathematical initialization minima, not promises of convergence to another chart's longer-history result.
- On initial loading, request up to 250 completed bars per required timeframe when available, reusing cached/native-timeframe history and prior trading days. This is a warm-up/history-fetch preference, not a minimum display requirement. For short-history/newly listed stocks, calculate each available indicator from its documented seed rather than hiding everything until 100 days/bars exist. Do not count provider-truncated history as full available history; record actual coverage in admin and continue bounded backfill when feasible.
- Preserve incremental state after initialization; do not repeatedly reseed from a moving 250-bar window. Independent QA uses matching history, session, adjustment, seed and formulas. Also compare latest values from 100-bar and 250-bar starts where both exist, recording seed sensitivity separately from arithmetic correctness. Do not claim a universal accuracy guarantee from any fixed bar count; more history reduces initialization influence but does not repair incorrect candles or session settings. Missing dependencies suppress only the affected interpretation, while independent valid values remain visible.
- If backfill extends the seed history or corrects an earlier input, rebuild the affected timeframe chronologically from the expanded, normalized history (or a valid checkpoint strictly before a corrected input). Never feed older candles into the live incremental state as if they arrived after the latest candle. Capture the ticker activation, input revision, provider/session/adjustment identity and data-through boundary for the rebuild. Calculate a replacement state and snapshot separately while retaining the last valid published result. Before atomically replacing the affected timeframe's state and snapshot, incorporate newer accepted candles and confirm that the input revision/activation still matches; discard or retry superseded work rather than overwriting newer data. Preserve unrelated timeframe results. Emit a new immutable calculation snapshot/checkpoint and an audit reason of history backfill or candle correction, even when the data-through timestamp has not advanced. Verify backfill with live candles arriving during calculation, overlapping pages, corrected inputs, removal/re-addition and provider switching against a full chronological reference calculation.
- EMA slope: `(EMA[t] - EMA[t-3]) / ATR14[t]`. Greater than 0.05 is rising; less than -0.05 is falling; the inclusive interval between is flat. When ATR is zero or unavailable, withhold slope-based interpretation. EMA alignment uses `(EMA9 - EMA20) / ATR14`; greater than 0.05 is upward alignment, less than -0.05 downward, otherwise closely aligned.
- Trend: upward alignment plus both EMAs rising and completed close at/above EMA20 gives **Uptrend**; downward alignment plus both falling and close at/below EMA20 gives **Downtrend**. Both slopes flat and closely aligned gives **Sideways**. Other complete combinations give **Mixed** and state the differing evidence. Do not turn an EMA cross into thesis invalidation.
- Momentum: `RSI[t] - RSI[t-3]` at least +3 points gives **RSI rising**, at most -3 **RSI falling**, otherwise **RSI little changed**. Always qualify the state using current RSI: below 30 **still oversold**, above 70 **still overbought**, 30 to below 50 **below midpoint**, above 50 through 70 **above midpoint**, and exactly 50 **at midpoint**. For example RSI 15 to 19 is **RSI rising; still oversold**, not unqualified strengthening/bullish momentum. A move from `RSI[t-3] < 30` to `RSI[t] >= 30` with at least +3 points permits **RSI recovered above oversold**, followed by its current condition. Use exact change/timeframe in detail; describe price/EMA disagreement separately. Do not infer a price-structure recovery from RSI alone. RSI strictly above 70 is overbought, strictly below 30 oversold; equality belongs to the middle band.
- ATR comparison: current ATR divided by the mean of the preceding 20 valid ATR values. At least 1.10 gives **Volatility expanding**, at most 0.90 **Volatility contracting**, otherwise **Volatility steady**. If the baseline is zero/unavailable, show the valid dollar/percentage ATR without change classification.
- Mature intraday volume ratio: current completed-bar volume divided by the mean of up to 20 preceding valid equal-duration, same-session bars, minimum 10. Include confirmed zero-volume bars; unknown missing bars do not count as confirmed zeros or a complete comparison window. At least 1.40 gives **Above recent baseline**, at most 0.75 **Below recent baseline**, otherwise **Near recent baseline**. A zero baseline gets absolute volume only. Increasing/falling volume wording additionally requires the separate bar-to-bar comparison; a high ratio alone does not prove volume is increasing.
- Daily volume: use the last completed daily candle, never today's partial daily volume. Compare it with the immediately previous completed trading day when both exist, and with the mean volume of up to 20 preceding completed trading days once at least 10 exist; exclude the measured day from its baseline. Use the same 1.40/0.75 ratio boundaries, labeled **Above/Near/Below recent daily baseline**. Do not reset the Daily baseline at a new intraday session. Before 10 prior days exist, show valid absolute volume and day-to-day change only; a zero denominator suppresses the percentage/ratio, not the volume value. Weekends/holidays are not zero-volume days, and missing expected daily candles are coverage gaps. Require consistent provider daily-session and adjustment conventions. Label the measured trading date, and identify any shortened session in the explanation rather than treating its shorter total as evidence of fading activity. Reuse the cached daily history; add no intraday provider loop. Verify short histories, the 10-prior-day boundary, holidays/early closes, zero denominators, missing days and the appearance of a newly completed daily candle.
- Summary priority: show a valid rising/falling/recovered RSI state with its current-condition qualifier, otherwise valid trend, otherwise valid RSI-little-changed state with its qualifier, otherwise an em dash. Detailed rows preserve all valid evidence and conflicts. Do not use “Trend improving” or “Uptrend holding” as additional unimplemented states; the earlier layout examples illustrate style, while this table controls actual labels.

Acceptance requires boundary fixtures for every equality, missing/zero dependency and conflict, followed by representative multi-ticker candle review. Merely inserting constants does not complete numerical or interpretation QA.

Price distance percentages should use `100 × (price - level) / level`, with positive-level validation. Record this convention rather than accidentally inheriting the old current-price denominator. Preserve full calculation precision and round for presentation only.

## 5. Candle, session and history requirements

- Use canonical symbol, exchange timezone America/New_York, session/date, candle duration and split-adjustment convention in each cache identity.
- Validate timestamps, ordering, duplicates, positive prices, OHLC consistency and nonnegative volume. Reject malformed bars locally without inventing replacement prices.
- Intraday detail uses completed candles for indicator calculations. Live quotes can update explicitly price-relative fields separately.
- Fetch bounded initial history for warm-up using the per-indicator readiness and preferred 250-bar backfill rules above, not a 100-bar display gate. Each period refers to the selected timeframe: 20 five-minute candles are not 20 one-minute candles. VWAP is independent of this backfill count: it uses all valid completed one-minute candles from today's defined session start, can begin after the first positive-volume completed candle, and requires complete available session coverage through its stated timestamp. Yesterday's candles never enter today's session VWAP.
- Fetch previous trading days' intraday candles when needed for EMA/RSI/ATR warm-up, including previous-day one-minute data when supported. Use native higher-timeframe history where suitable instead of unnecessarily fetching every underlying minute. History sufficiency is determined by calculation accuracy, not OpenAI packet size: this data is never sent to AI. Cache the initial history rather than downloading it every cycle.
- Aggregate 5m and 15m from trustworthy 1m candles only when their coverage and timestamp alignment are adequate. Verify exchange/session bucket boundaries, including early closes and daylight-saving changes.
- If history limits make aggregation insufficient, use verified native higher-timeframe candles or additional bounded history. Do not relabel five-minute data as fifteen-minute/daily data.
- Explicitly distinguish legitimate no-trade intervals from missing provider data. Do not silently insert synthetic flat bars or bridge unknown gaps to claim complete coverage.
- Daily uses completed daily history, cached independently. Today's developing daily candle must not be substituted for a completed daily bar.
- Proposed intraday EMA/RSI/ATR coverage includes supported premarket, regular and postmarket candles in chronological sequence with explicit overnight gaps; confirm parity against the selected chart convention. Never imply unsupported overnight coverage exists.
- Proposed session VWAP begins at the supported US premarket session start (normally 4:00 AM ET) and continues through supported postmarket for that trading date. Label the session basis in the row/help. Do not reset merely when switching tabs. Daily detail keeps any displayed current-session VWAP explicitly separate from daily historical indicators.
- Session VWAP uses today's selected session only; yesterday's warm-up candles are excluded. Extended-hours and regular-hours chart conventions differ, so do not claim 4:00 AM is a universal professional standard. The proposed Watchlist default remains extended-hours-inclusive for its premarket runners, explicitly labeled **VWAP (including extended hours)**. Validate it against an independent chart/reference with identical session, source and adjustment settings. Do not silently switch to a 9:30 AM anchor at the opening bell or on provider fallback. If full extended-hours coverage is unavailable, withhold this value rather than mislabel regular-hours VWAP. A separate regular-hours VWAP is not silently added to this slice.
- A late-added ticker needs session history to calculate session VWAP; do not start accumulation at Watchlist addition time and call it the full-session VWAP.
- If session history is incomplete, withhold the affected VWAP interpretation while keeping unrelated valid rows.
- Handle holidays, early closes, halts, newly listed symbols, reverse splits and changing price scales. No mixing differently adjusted series within an indicator window.
- Missing volume is nullable, never zero-filled: valid OHLC can still support EMA/RSI/ATR. Volume comparisons restart their known-volume baseline after a missing-volume bar; session VWAP remains unavailable if a required minute's volume is unknown. Record missing-volume counts separately from missing candles. This contract was confirmed against saved owner packets during implementation.

## 6. Provider, refresh and long-term resource policy

1. When a ticker becomes eligible for monitoring, obtain the initial bounded history and calculate a shared snapshot.
2. Schedule one logical candle refresh every **120 seconds per active ticker**. Stagger tickers across that window.
3. Use Moomoo as the primary through the existing authenticated server-side connection/bridge. If unavailable, unsuccessful or missing usable required coverage, attempt the bounded Yahoo fallback.
4. Use one coherent provider series per calculation window. A provider switch rebuilds the necessary window; never splice overlapping Moomoo and Yahoo candles without explicit normalization and reconciliation.
5. Incrementally update cached candles where supported; a provider that requires a window fetch still gets a bounded request, not unbounded historical reloads.
   Include a small trailing overlap to capture revised candles. Define the overlap after inspecting provider correction behavior; upsert by canonical candle identity and recompute affected results, including the session VWAP accumulator. Do not append duplicates or ignore corrections solely because the timestamp already exists.
6. Recalculate and publish a versioned shared snapshot. All viewers read that snapshot.
7. Existing EODHD quote updates may update price-relative comparisons approximately every 15–30 seconds through the existing feed. They do not trigger new candle requests or AI calls.
8. Cache daily history separately and refresh when a newly completed trading day becomes available, with bounded retry for delayed provider publication rather than fetching months of daily history every two minutes.

Ten active tickers means about five logical refresh operations per minute on average, not five per viewer. A logical operation can require multiple HTTP requests during initialization, pagination, fallback or retry; measure actual calls rather than reporting the logical count as a vendor request count.

Use per-symbol in-flight deduplication and the existing shared request coordinator where suitable. Coalesce duplicate demand from consumers. Never allow a slow refresh to overlap with the next scheduled refresh for that ticker. Bound timeouts, retries, queue length and retained history. Back off on provider errors/rate limiting; do not multiply Moomoo and Yahoo retry loops. Return to primary through bounded recovery checks, not rapid provider flapping.

Initial resource defaults: keep the 120-second interval; use a 15-second timeout per actual provider attempt, at most one retry per provider per logical refresh, at most two simultaneous provider requests from this feature across Moomoo and Yahoo, and at most one pending refresh per active ticker. New demand merges into that pending job, not an accumulating backlog. Retries for transient transport/5xx failures wait two seconds; do not retry authentication, permission or malformed-request failures within the refresh. Explicit rate limits follow shared cooldown instead of this immediate retry. Without provider-directed timing, shared cooldown starts at 120 seconds and doubles on confirmed provider-scope recovery failure to a 15-minute cap; provider-directed timing takes precedence even when longer. Reset shared backoff when a valid response confirms request admission for that provider scope. This does not mark any ticker's candle delivery recovered: each ticker/timeframe remains on fallback until its own required usable data returns. Symbol-specific or inconclusive no-data responses follow the bounded probe-rotation rule below and do not alone increase provider-wide backoff. Pagination is not a retry, but shares concurrency/timeouts; cap each logical provider refresh at ten actual attempts including pages and retries, report incomplete coverage and continue bounded initialization on a later cycle. These are application safeguards, not claimed vendor quotas.

Rate-limit coordination also operates at the affected provider/connection scope, not only by ticker. An explicit account/connection-wide Moomoo throttle pauses new requests for that scope across Indicators tickers and participating shared consumers; endpoint-specific limits use their documented narrower scope. If the provider reports a limit without a reliable scope, conservatively pause that connection's Indicators requests and record the uncertainty. Honor Retry-After when supplied; otherwise use one bounded shared backoff policy. Requests already in flight are tracked, not multiplied or blindly retried. Yahoo has its own independently coordinated limit/backoff state.

After the shared cooldown, permit one recovery probe for the affected provider scope. Prefer an eligible active ticker with a recent usable response on the same endpoint. Distinguish a valid accepted response from usable candle delivery: a well-formed, successful response with empty or insufficient symbol data can demonstrate that request admission has recovered without proving that ticker's indicators can use Moomoo. Release the shared cooldown on confirmed request admission, then stagger queued ticker requests. Keep fallback and usable-data recovery decisions per ticker/timeframe; switch a result back to Moomoo only after its own coherent required data is available.

A symbol-specific no-data, unsupported-symbol or coverage failure must not extend a provider-wide cooldown. If such a response does not establish request admission, mark the shared recovery probe inconclusive and rotate to another eligible ticker at the next normal 120-second probe opportunity without increasing provider-wide backoff solely for that symbol outcome. Explicit renewed throttling follows the shared rate-limit policy; connection/authentication failures follow their distinct provider-scope failure handling. Do not issue an uncontrolled chain of alternate-symbol probes. When no eligible ticker exists, wait for normal eligible work rather than probing unrelated symbols.

Prevent every ticker from probing simultaneously or falling back simultaneously without a bounded queue. Record shared request-admission recovery separately from each ticker/timeframe's usable-data recovery, including the probe outcome and any symbol-specific failure. Do not label a recovered connection as successful candle delivery. Reconcile shared-consumer coordination without disabling AI/publication functionality or inventing a provider quota. Verify multi-ticker throttling, successful-but-empty probes, unsupported symbols, an inconclusive probe followed by a healthy ticker, and a still-throttled response against actual transport-call counts.

Before enabling the new schedule, map the existing 60-second Yahoo poll and all its consumers. Reuse/coalesce compatible requests and snapshots; retire only redundant work whose consumers have been migrated. Do not simply add another poll or disable a shared loop that still supplies AI context, Potential Path or Discord. Record old-versus-new actual provider calls at the scheduling checkpoint. Keep the initial new Moomoo interval at two minutes; consider one minute only after measured performance, not from the unrelated Yahoo poll.

Give each ticker activation/session a generation identity. Cancel obsolete work where possible and discard responses from a removed ticker, an older activation or a superseded session. A late response must not overwrite a newer snapshot after removal/re-addition. Bound cache retention and release unused per-ticker resources without deleting Watchlist history.

### Provider-capability checkpoint

Before promising all timeframes, verify the application's actual Moomoo bridge and Yahoo adapter, not just general vendor documentation. Record supported intervals, prior-day one-minute access, extended-hours coverage, lookback limits, pagination, adjustment basis, timestamp semantics and completed-bar behavior. Test a bounded representative response for each required capability. If one provider cannot satisfy a timeframe/session, retain a valid prior snapshot or show the affected field unavailable; do not silently substitute daily candles for intraday history. Document the fallback behavior per timeframe and ensure summaries are not comparing incompatible sessions or price adjustments.

Active monitoring follows existing Watchlist eligibility/session boundaries, independent of whether a member page is open or AI generation is enabled. Do not request unsupported market-closed/overnight windows continuously. Exact session scheduling must be documented after inspecting current runtime behavior; changing existing publisher schedules is not implicit authorization.

Indicators-specific closed-session rule: permit one completion/history pass for the latest verified extended-session close, then reuse it throughout that closed interval (including weekends) until the next supported session opens. Unknown calendar coverage does not initiate candle requests. The existing publisher's own schedule is unchanged. Reconcile the calculation population against currently published activation identities so removed tickers do not accumulate indefinitely in its bounded cache.

No claimed Moomoo quota is assumed: the owner has not encountered a limit. Monitor measured call volume, latency and failures and adjust after actual use. A price-movement-triggered scheduler is deferred; it is not required for this version.

## 7. Admin observability and data contract

Keep the existing provider connection/status card in its current location. Put all detailed Indicators auditing in a dedicated **Indicator Audit** section, opened only when the owner selects its section link. Do not expand the connection card into an audit dashboard. Keep connection identities and credentials server-side.

### One main Watchlist admin menu — owner decision

All admin sections must be directly accessible from the main `/admin/watchlist` page through one consistent section menu. Include the complete existing inventory: **Watchlist**, **Runtime**, **Market Data**, **AI Controls**, **Live Website Controls**, **Automatic Low-Float Selection**, **Usage**, **Daily Recaps**, plus the new **Indicator Audit** section. Confirm any additional existing sections against the current released source and preserve them; this must not remove completed functionality.

Daily Recaps and Indicator Audit must not require opening Usage first. Keep section navigation accessible while viewing any section, with one selected state and consistent return to Watchlist. Hide inactive section content, and fetch paginated audit history only when opened or explicitly refreshed. Switching sections must preserve unsaved analysis/recap edits and must not submit, approve or publish anything. The existing connection summary stays where it is; provider request history, fallback details, statistics and exports belong inside Indicator Audit.

Source inspection for this decision found two navigation layers: the runtime document's injected section menu, and the Platform wrapper's section buttons. The locally available `origin/main` wrapper includes Watchlist controls, Usage and Daily Recaps, while the assigned worktree's wrapper is older. This explains a source-level split in navigation, but is not live browser verification of the owner's precise visibility symptom. Before implementation reconcile the narrow change with current release source and inventory the rendered menu; do not overwrite the newer recap integration with this older worktree file.

Acceptance: from the main admin Watchlist view, reach Usage, Daily Recaps and Indicator Audit directly in one click, on desktop and mobile, without a second competing menu. Connection status remains visible in its established location. Audit details remain hidden until opened and owner-only.

### Required provider audit trail

Inside Indicator Audit, provide a compact audit summary and expandable, paginated request history. Filtering by ticker, date, provider and outcome must allow the owner to answer what happened without reading server logs. This is an Indicators-specific audit, clearly distinguished from AI usage and other provider consumers.

Record each scheduled refresh and its individual actual provider attempts, including retries and pagination. Link them with a refresh ID, attempt ID and ticker activation/session identity. Record:

Each attempt also carries a runtime-instance identity and a lifecycle: queued, started, then a terminal outcome. Persist intent/start metadata through the bounded audit writer before dispatch where healthy storage permits, without making audit availability a prerequisite for market-data delivery. On startup, reconcile unfinished attempts belonging to a previous runtime instance as **Interrupted / outcome unknown** unless a durable terminal record establishes what happened. Do not call them provider failures or successes without evidence; do not leave them running indefinitely or replay them merely to complete the audit. Fresh market-data work follows the normal schedule and deduplication rules.

If a crash occurs before buffered audit metadata is persisted, exact attempts may be unrecoverable. Record the unclean-shutdown/audit coverage gap instead of claiming complete history. Audit-write failures remain visible in admin. Verification must cover crashes before dispatch, during a provider call, after response receipt and around snapshot publication, with no duplicate request or publication caused by audit recovery.

- Ticker, requested timeframe/session/date range, request purpose (initial history, incremental update, daily history, fallback or recovery), UTC timestamps and duration; render dates/times in ET in admin.
- Provider attempted, actual provider used by each resulting timeframe, request count and pagination count. Connection availability, request success and usable data are separate facts.
- Outcome: usable success, partial coverage, empty response, invalid data, timeout, authentication/permission failure, confirmed rate limit, other provider error, cancelled or obsolete response discarded.
- Sanitized HTTP status and provider error code where available. Classify a rate limit only from explicit response evidence; an unexplained timeout is not proof of throttling. Capture Retry-After or equivalent instructions when provided, next retry time and backoff duration. Do not invent remaining vendor quota when none is reported.
- Candle counts requested/received/accepted/rejected, earliest/latest accepted timestamps, latest completed candle, gaps, warm-up sufficiency, session/adjustment basis and corrections applied. A successful HTTP response alone is not a successful indicator update.
- Whether Yahoo fallback was needed and why; whether attempted or deferred by backoff; whether it succeeded with usable data, returned partial data or failed. Link its outcome to the originating Moomoo failure. If both fail, explicitly record that the prior snapshot was retained and its data-through time.
- Snapshot publication outcome, resulting snapshot/rule version and the provider/data-through time for each timeframe. Record calculation or publication failures separately from provider failures.
- Recovery checks and the exact point Moomoo resumed supplying usable data. A recovered connection alone must not be reported as recovered candle delivery.

Also record scheduler decisions that did not send a request: cache hit, coalesced request, in-flight skip, session closed and backoff. Keep these counts separate from actual provider attempts so apparent success/request totals cannot be inflated by cached results.

Assign one transport-request ID at the actual provider call boundary. Link every refresh/consumer that reuses its result to that ID; retries and additional pages each receive their own transport ID. Aggregate actual call counts by unique transport ID, never by consumer-link count. Show Indicators-initiated calls, calls initiated elsewhere and reused by Indicators, and total observed shared-connection calls separately. Shared totals cover only instrumented consumers; show that coverage explicitly instead of claiming account-wide visibility. A coalesced consumer is not another billable/transport request, and audit exports preserve those links.

Admin summary: active ticker count; effective refresh interval; actual attempts and usable successes by provider; failures by reason; rate-limit events; fallback attempts/successes/failures; last successful delivery; consecutive failures; response latency; cache/coalescing counts; and next retry. Show reporting window and numerator/denominator for any rates. Display selected primary separately from currently serving provider, including mixed-provider timeframes where applicable.

### Audit storage, privacy and verification

- Persist compact structured audit records across restarts using the existing approved storage mechanism where possible. Use bounded batched writes; audit persistence must not block or fail the market-data/publication path. Surface audit-write failure/coverage gaps in admin rather than silently pretending the history is complete.
- Retain request metadata for up to 14 days within a **100 MB** metadata cap, whichever limit is reached first. Retain calculation snapshots within a separate **100 MB** cap and the same maximum age. Here MB means 1,000,000 bytes of encoded records/blobs; report actual storage overhead separately and include bounded cleanup in the storage design. Evict oldest completed records/snapshots first, preserve explicit missing-input references, and state the earliest retained record and truncation. Use 50 records per history page, maximum 100. Do not turn this feature into unlimited raw-response logging.
- Include a protected JSON export of the selected audit window for owner-authorized Codex review. Exclude credentials, authorization headers, token-bearing URLs, account identifiers and raw provider error bodies; use allowlisted sanitized fields.
- For numerical audits, retain a bounded recent calculation-input snapshot per ticker/timeframe, including normalized candles, parameters, provenance and result version. Deduplicate unchanged input; do not copy the whole history into every attempt record. Export only through the owner boundary and label the coverage so older metadata is not misrepresented as a full numerical replay packet.
- File-backed implementation guard: additionally cap each category at 10,000 files so directory operations stay bounded on the owner's low-resource computer. This is an earlier retention boundary, not a promise of fourteen full days. Show this cap and the oldest retained timestamp in owner auditing. Persist expiry/drop counters; report unmeasured filesystem overhead as unavailable, separately from the encoded-byte cap.
- Assign each retained calculation snapshot an immutable snapshot ID linking exact normalized inputs, calculation/interpretation parameters and versions, outputs, session/adjustment basis, provider provenance and data-through time. Include the quote and quote timestamp when an audited result depends on a live-price comparison. Request attempts, refresh records and publication records reference the exact snapshot IDs they produced or retained; unchanged cached inputs may share an immutable input blob, not a mutable latest-snapshot pointer.
- For replay of incremental calculations, retain either the complete seed-to-result input history or an immutable starting-state checkpoint plus every subsequent input needed for that snapshot. The checkpoint includes previous close, each EMA value, Wilder average gain/loss and ATR state, processed-bar count, VWAP price-volume/volume accumulators and session identity, plus prior indicator/bar values needed for slopes and comparison baselines. Record algorithm version and checkpoint position. Replay must not reseed from only the last few saved candles. Verify replay after restart, correction and retained-history eviction; if required state has expired, mark replay unavailable rather than producing a different result as if it matched.
- Corrected candles or changed calculation inputs produce a new snapshot identity, leaving retained earlier snapshots unchanged. An older audit entry must never resolve to the ticker's newest candles. When retention removes its replay inputs, keep the reference and show **Calculation inputs no longer retained** in admin. Export that limitation explicitly rather than substituting newer data. Tests must reopen an old record after a refresh, candle correction, provider switch and retention cleanup.
- No new persistent-store migration is silently assumed. If existing storage cannot safely meet retention requirements, document the narrow storage change and obtain the required migration allocation/approval before applying anything.
- Verify primary success; explicit throttling; ambiguous timeout; fallback success/failure; partial or empty data; primary recovery; deduplication; obsolete responses; publication failure; restart persistence; retention; audit-write failure; and member-access denial. Cross-check actual transport calls against audit counts.
- Members continue to see only Last updated, not provider/audit details. No OpenAI calls are made for auditing or interpreting these events.

Keep these fields out of the member payload where not needed. Member data consists of indicator values, stable interpretation codes/rendered text, timeframe, rule version and meaningful timestamps. Do not leak provider errors through descriptions or generic API serialization.

Create an additive, versioned Indicators snapshot contract so runtime and Platform can be reconciled safely. Distinguish candle snapshot time, quote time, computation time and provider provenance internally. Missing individual indicators must not invalidate the whole snapshot. Existing ingestion authorization, owner/member visibility rules and pending-review concealment remain authoritative.

No database migration is assumed. First assess whether the existing snapshot/cache storage can hold bounded versioned results. Any newly necessary migration requires a separately registered and approved migration boundary.

## 8. Preservation and replacement inventory

Before coding, map the existing Technical Context card, Live 5-minute confirmation, volume helpers, runtime payload consumers and any Discord rendering. Record exactly which member display blocks the new card replaces.

- Keep TradersLink Analysis, manual refresh, saved owner edits, original/edited audit history and approval-before-publication behavior intact.
- Keep automatic AI follow-up settings and their current on/off behavior intact; Indicators must never call the AI trigger path.
- Keep Potential Path support/resistance and its ATR calculations/selection unchanged.
- Keep Watchlist add controls, navigation, company info, notices, potential gain controls and daily recap behavior intact.
- Consolidate overlapping live indicator/volume display without deleting static owner-approved analysis text or changing Discord posts.
- Do not remove a shared old calculation until every consumer is identified and preserved or intentionally migrated.
- No runtime relocation, credentials changes, provider subscription changes or unrelated Scanner/News/Journal refactoring.

## 9. Implementation sequence and provisional ownership

### A. Contract and UI checkpoint

Reconfirm source revisions, exact route/component placement and existing render inventory. Finalize input/session/warm-up formulas and the complete new snapshot schema. Show the owner the compact desktop/mobile card layout and example states before UI implementation. This written plan does not substitute for rendered visual acceptance.

### B. Runtime calculation slice

Implement pure, versioned calculations and interpretations in a narrowly scoped new Indicators module. Reuse verified EMA/VWAP utilities where their contracts match. Add shared bounded cache, scheduled Moomoo/Yahoo acquisition and snapshot publication without changing Potential Path or AI generation.

Candidate runtime integration points: technical-context utilities, manual-watchlist runtime manager, publisher, candle provider/coordinator and the authenticated Platform candle loader. These are inspection targets, not permission to rewrite the entire files or runtime.

### C. Platform presentation and admin slice

Add a dedicated Indicators component and focused styling, integrate its versioned payload with `app/watchlist/live-watchlist-client.tsx` and relevant Watchlist types, and add Indicator Audit behind the unified main admin section menu. Preserve the existing connection/status card. Reconcile the wrapper and runtime-injected navigation so Daily Recaps and every existing section are accessible directly. The Moomoo bridge may need a bounded history contract adjustment; inspect compatibility before changing it. Preserve old-client/new-runtime compatibility during staged source integration.

### D. Checkpoint verification and Help

Complete focused numerical, interpretation, scheduling and payload tests after related code is assembled. Update the existing Watchlist Help guide to explain timeframes, session basis, indicators, refresh cadence and timestamp semantics. Help must distinguish live Indicators from the approved static AI analysis and avoid implying recommendations or guarantees.

### E. Release boundary

Record exact file allowlists, local commits, focused results, remaining risks and deployment compatibility order. Coordinator owns serialized Railway reconciliation and release after separate owner authorization. No local preview server is required or wanted by the owner. Hosted visual checks occur only through the authorized release process, with service health and existing Watchlist flows checked. Do not claim completion from a successful build alone.

## 10. Verification matrix and acceptance criteria

| Area | Required evidence |
| --- | --- |
| Calculations | Independent fixed-fixture parity for EMA, RSI, VWAP, ATR and volume; seed/warm-up, zero denominators and rounding boundaries. |
| Multiple timeframes | Distinct 1m/5m/15m/daily results; correct aggregation, incomplete buckets and selected timestamps. |
| Micro-cap interpretation | Active runners, brief noise pullbacks, deep pullbacks, recoveries, fading momentum and chop; no tiny indicator move automatically called thesis failure. |
| Multiple tickers | Exercise all usable tickers in the bounded selected Watchlist sample, not one or two convenient successes. Include TRUG, TNON, AENT, FTFT, FEIM, BDRX, SURG, SXTC and PCLA when suitable saved candle evidence exists; record missing coverage rather than claiming unsupported historical validation. |
| Sessions | Premarket warm-up, regular open, postmarket, next day, DST, holidays and early closes. |
| Data edge cases | Halts, no trades, missing bars, duplicate/out-of-order bars, splits, newly listed symbols and insufficient history. |
| Fallback | Primary success, primary failure, Yahoo success/failure, recovery and coherent provider switching. |
| Request budget | Initial versus incremental requests, ten-ticker staggering, concurrent viewers, tab switching, slow responses, retry bounds and closed-session behavior. |
| Freshness/privacy | Retained valid snapshot and unchanged timestamp on failure; no provider/stale/error labels for members; actual source/health visible only to owner. |
| UI | Readable desktop/mobile summaries, keyboard tabs, remembered selection, no duplicate live volume blocks, no overflow. |
| Regressions | AI approval gate, edits/audit, manual refresh, Discord output, Watchlist add flow and Potential Path ATR behavior unchanged. |
| Cost | Zero OpenAI invocations for Indicators, including retries, page loads and timeframe changes. |

Use deterministic fixtures and bounded representative captured data. Do not generate unnecessary paid AI requests for this feature. During planning run no tests/builds/servers. During authorized implementation use focused low-resource checks at coherent checkpoints, not repeated broad suites. Full build or hosted end-to-end verification belongs only at the authorized final acceptance/release boundary.

Completion requires all controlling inventory implemented, applicable checks recorded, Help aligned and owner visual acceptance captured. Missing market coverage or unverified hosted behavior remains explicitly incomplete.

## 11. Reference material

These references inform explanatory boundaries; they do not validate this project's calculations or establish profitable trading signals:

- [Fidelity RSI guide](https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI): overbought/oversold interpretation and persistence during strong trends.
- [Schwab volume-weighted indicators](https://www.schwab.com/learn/story/how-to-use-volume-weighted-indicators-trading): VWAP context and volume-weighted interpretation.
- [Fidelity ATR guide](https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/atr): true range and volatility interpretation.
- [TradingView VWAP documentation](https://www.tradingview.com/support/solutions/43000502018-volume-weighted-average-price-vwap/): session anchoring, reset periods and candle-price source conventions.

Formula conventions and parity fixtures must be recorded in the implementation progress record, especially where a chart's session or smoothing settings differ.
