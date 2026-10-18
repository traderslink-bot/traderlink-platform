# Watchlist Setup Recorded Validation

Date: 2026-10-17

Scope: the four approved setup detectors and their shared Watchlist candle acquisition. This is offline engineering validation, not deployment or a claim of profitable entries. No live provider request, account-data change or notification was made.

## Recorded market data

The executable is `src/scripts/verify-watchlist-setups.ts`. It reads existing recordings without changing them and creates a new, uniquely named result directory under `data/watchlist-setup-validation/`. It disables network access and imports pure calculation modules, not hosted startup, account authorization or application settings writers.

- BDAI, LOOP and WFF: October 9 Moomoo WebAPI recordings in `data/scanner-verification-candles.jsonl`. Provider end labels are normalized with the existing adapter. Five-minute candles are derived only from five actual consecutive recorded minutes; missing minutes are not filled. These examples do not establish the live native-5m response contract.
- WETO, DRMA, YYAI, SHFS, RCT and TCRT: the six October 15 recordings in `data/simple-structure-v2/1792120718589.jsonl.<symbol>.packet.json`. Their existing 1m and 5m price observations are replayed. The packet identifies Moomoo current-session and EODHD completed-session context, but not adjustment/provenance for every older candle. These are price-sequence checks, not independently verified provider-adjustment evidence.

The nine datasets contain 3,600 recorded 1m bars and 2,502 5m bars. Source hashes, exact retained windows, provenance qualifications, detector counts and first confirmation witnesses are saved with each successful result. Account metadata, request credentials, news payloads and original analysis text are not copied into those results.

## Recorded results

Counts below are detector confirmations across the recorded windows, not separate trades or unique opportunities. Related EMA detections may describe the same price leg.

| Ticker | VWAP reclaim | EMA9 bounce | EMA20 bounce | Higher low |
| --- | ---: | ---: | ---: | ---: |
| BDAI | 2 | 6 | 5 | 21 |
| LOOP | 7 | 0 | 0 | 4 |
| WFF | 5 | 16 | 4 | 26 |
| WETO | 0 | 3 | 3 | 1 |
| DRMA | 0 | 0 | 0 | 2 |
| YYAI | 0 | 2 | 2 | 2 |
| SHFS | 0 | 4 | 2 | 3 |
| RCT | 0 | 1 | 3 | 5 |
| TCRT | 0 | 1 | 1 | 2 |
| Total | 14 | 33 | 20 | 66 |

The six short analysis packets do not establish session VWAP coverage; no VWAP setup is manufactured from those incomplete windows. LOOP has observed VWAP/higher-low events without a qualifying EMA continuation. DRMA has higher-low events without a qualifying EMA response. A detector does not need to produce a setup for every ticker.

The final nine-ticker execution passed 1,111 assertions. Its receipt is `data/watchlist-setup-validation/1792291277530-c3aa1bfb/results.json`. Actual shared-feed/runtime and isolated ledger persistence checks passed 24 additional assertions, and existing focused regressions passed 268 assertions. Commands and source-check limits are recorded in the [progress tracker](watchlist-trade-setup-detection-progress.md). Earlier successful results remain separately saved; they are not overwritten.

## Checks

- Completed-candle prefix replay agrees with full chronological replay at bounded checkpoints and exact first-confirmation boundaries for all four families. No future event is visible in an earlier prefix.
- EMA response-high triggers and defended lows match actual recorded candles. EMA values are checked with a separate chronological recurrence; VWAP is checked independently from recorded HLC3 prices and share volume on its named anchor.
- Missing volume cannot erase an independent price event. A malformed 5m frame cannot remove valid 1m higher-low events. Removing a required confirmation candle cannot let a later candle supply that missing step.
- Shared input objects remain unchanged by detection. Separate current-publication and private-list demand checks prevent old/private activations from starting public feed work.
- Concurrent setup and Indicators requests acquire the common 1m/5m frames once. A later consumer may acquire only its additional frames. Repeated same-window reads and restored fresh calculations use cache; a genuinely newer completed minute may request a new window while unchanged completed 5m data is reused.
- Admission reserves starts before transport, spaces requests by at least 750 ms and caps coordinated Watchlist starts at 80 per rolling minute. Mocked 429 responses apply cooldown across connection scopes; persisted cooldown survives restart. Clock rollback and failed ledger writes cannot reset admission. Removed/disabled queued demand is rechecked after admission, before HTTP, without a fictitious request ID.
- Existing offline Indicators refresh, session/calendar, correction-cache, history-adapter and actual refresh-route checks remain green. Route verification uses its real authorization/body parser with stubbed storage/background dependencies, not live access.

Two defects found by the recorded checks were corrected with shared rules: expiry was recorded before the observation that established it, and the 1m higher-low context depended on optional 5m data. No symbol-specific price, tolerance or branch was added.

## Shared feed

The existing hosted startup registers one setup timer near minute close plus five seconds. It remains inactive when setup detection is disabled or the selected session is closed. It calls the same refresh operation as the publisher; browsers still read cached results only. Hiding Indicators does not remove setup demand. Setup-only demand needs only 1m/5m Moomoo data and does not create Yahoo fallback traffic; existing visible Indicators retains its fallback behavior.

Publication, visibility and frame demand are checked again immediately before each provider attempt. Settings changes and startup can evaluate retained accepted calculations without another request. Normal analysis, owner approval, Discord routing and notification delivery are unchanged.

The durable admission ledger covers the hosted Watchlist Indicators/setup path. It does not establish total account/IP usage from the Trade Analyzer, OAuth refresh, computer-run scanner or another process. Missing/corrupt ledger history causes a conservative one-minute deferral; existing cached data remains readable. Actual account capacity and live arrival latency need hosted observation.

## Remaining release acceptance

Deployment is explicitly withheld. Native live 1m/5m timing/provenance, combined external-caller traffic, marked-chart/held-out false/missed/late rates, real desktop/mobile acceptance, evidence-retention operations and optional outbound setup delivery remain separate acceptance work. The three other setup families remain deferred. This report does not claim those checks passed merely because recorded engineering checks passed.
