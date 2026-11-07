# Alpaca VPS owner test

Owner agreed to test Algo Trader Plus with the Alpaca connection on the VPS and Railway communicating with that service. Initial scope is owner-only; no member-facing rollout or replacement of the existing scanner feed is authorized by this test. Railway release remains Coordinator-controlled.

## Intended flow

Browser → authenticated Railway route → authenticated encrypted VPS market-data service → Alpaca SIP. Keys remain on the VPS. Historical OHLCV loads first; streaming and existing-chart integration follow as separate verifiable slices. No trading or account-management endpoint is needed.

Use explicit SIP feed selection, bounded date ranges, pagination, timeouts, safe errors and timestamps. Distinguish initial history from current-minute trade updates and corrected minute bars. Alpaca bars arrive at minute boundaries; they do not alone update a forming candle on every trade. Preserve provider trade-condition semantics when building intraminute candles. Existing Moomoo qualification/audit behavior stays unchanged until an explicit scanner comparison is implemented and reviewed.

## Progress — 2026-11-07

- Inspected current scanner/chart records and Alpaca historical/streaming documentation.
- Owner confirmed keys are not on the VPS.
- Prepared `scripts/configure-alpaca-owner-test.py`: interactive hidden entry, owner-readable credential file outside Git, no provider request, no service startup. File: `~/.config/traderlink/alpaca-owner-test.json`.
- Owner completed hidden credential entry. File permissions verified as 0600; no credential values logged.
- Read-only VPS proof passed: one AAPL SIP 1Min historical-bars request returned HTTP 200 and six bars for November 6, 09:30–09:35 ET (inclusive endpoints). Historical data older than 15 minutes alone does not prove real-time entitlement; a separate latest SIP trade request also returned HTTP 200. These are two bounded market-data reads, with no trading/account endpoints. Weekend live streaming has not been tested.
- Next: authenticated VPS service and an owner-only chart test. Railway connectivity and publication are not yet configured or verified.
- Member-facing data display entitlement remains unverified; subscription access alone does not establish redistribution permission.

Official references: [historical bars](https://docs.alpaca.markets/us/reference/stockbars), [stock stream](https://docs.alpaca.markets/us/docs/real-time-stock-pricing-data).

No app UI changed; Help Center update is not required for this credential-preparation slice.


## Lightweight Charts integration — 2026-11-07

Owner approved setting up TradingView Lightweight Charts using the saved Alpaca keys. Uses installed lightweight-charts 5.2.0 with CandlestickSeries and a separate HistogramSeries volume pane, automatic resize, ET labels, stable chart keys, chart removal on unmount, and deferred browser-only loading. The scanner workspace now imports the new component; unrelated shared TradingView widget routes are preserved. Existing four-chart drawer layout and details tabs are retained. Add chart in the workspace header accepts a real ticker independently of the synthetic scanner rows. Per-chart intervals: 1m, 5m, 15m, 1h and 1D. Intraday loads use up to 10,000 latest SIP minute bars within 14 days; daily loads use up to 400 days. This is a bounded initial window, not an infinite-history implementation. No synthetic candles are substituted. Raw prices are retained, with two displayed decimals for stocks at/above $1 and four below $1.

The independent Node/tsx gateway binds only 127.0.0.1:3041. Private bearer configuration is ~/.config/traderlink/alpaca-gateway.json, mode 0600, separate from the Alpaca key file. Every gateway endpoint requires authentication. Historical requests use explicit SIP/raw/latest-first bounds, a 30-second bounded cache, deduplication, four concurrent loads and 120 provider loads/minute. All charts share one upstream SIP socket. Subscriptions cover minute bars, corrected minute bars and daily bars; clients do not reconstruct provider candles from unfiltered trades. This first version updates candles as provider aggregate messages arrive, not on each individual trade. Corrected minute volumes replace existing source minutes before aggregation, avoiding double counting. Last chart close releases the upstream socket; reconnect uses bounded exponential backoff and reloads history to cover gaps. Slow SSE clients are disconnected rather than buffered indefinitely.

Next proxy routes `/api/screeners/charts/bars` and `/api/screeners/charts/stream` use existing Platform authentication. Access is restricted to trusted development-owner requests or an explicitly configured stable owner user ID. Gateway bearer tokens never reach the browser. Production transport requires HTTPS and rejects redirects. URL destinations come only from server configuration, not browser parameters. Closing a chart cancels its upstream SSE reader.

Private preview was updated in the existing generated production-source artifact at `/home/traderlink/preview-runtime/admin-watchlist/production-ebe8f054e/source`. The existing preview launcher now passes only the gateway URL and private bearer-file path; provider keys remain exclusively in the gateway process. The owner explicitly authorized the read-only provider test; this is separate from the synthetic scanner fixture data. Preview workers remain disabled and existing scanner discovery/audit configuration is unchanged. Runtime service: `traderlink-alpaca-gateway.service` (transient user service, 512 MiB limit). Startup uses absolute Node and tsx paths because user services lack interactive-shell PATH. The scanner preview service remains the same service on 3010.

Validation: 33 tests across five focused files passed, then the new socket-sharing/disconnect case passed in the two-test gateway suite (34 total applicable cases). Tests cover authentication, destination restrictions, credential/error masking, caching, correction aggregation, injected SSE updates, socket sharing, cancellation, and existing scanner/four-chart behavior. Exact-file lint passed; focused gateway/model/chart TypeScript check passed. Full repository build/typecheck was not run. Real private-browser verification: AAPL 8,996 intraday bars; 275 daily bars; AAPL/MSFT/NVDA/AMD four-chart canvas rendering without iframes; 5m/15m/1h/1D switching; 390px mobile resize; zero browser JS errors; gateway direct unauthenticated request returns 401. SIP WebSocket authentication/subscription succeeded. Help reviewed and updated with Add chart and timeframe controls using a narrow text delta.

Railway production is unchanged. The proxy implementation supports its future connection via `TRADERLINK_ALPACA_GATEWAY_URL`, `TRADERLINK_ALPACA_GATEWAY_TOKEN`, and `TRADERLINK_ALPACA_OWNER_USER_ID`. No externally reachable VPS gateway endpoint, Railway environment changes, push or deployment was performed. Encrypted Railway-to-VPS connectivity and production publication remain a separate Coordinator-controlled integration step. Member display remains outside this owner-only test.


## Four-hour interval — 2026-11-07

Added owner-requested 4h control between 1h and 1D on every Lightweight Chart. Aggregates the existing minute source into 240-minute UTC-aligned buckets, displayed in ET, including replacement/correction handling. No additional provider endpoint or subscription. Updated Help controls list. Three focused candle tests, exact-file lint and focused TypeScript pass; private browser verified NWGL 4h loads. Preview updated; production unchanged.


## Scanner and Watchlist migration scope

The owner expanded scope to scanner market data and Watchlist, retaining the shared WebSocket architecture. See [Alpaca market-data migration progress](alpaca-market-data-migration-progress.md) for implemented adapters, session-counter semantics, the located Railway Watchlist/Stock Levels runtime, its eight-file patch candidate, verification and the separate hosted release boundary. This supersedes the chart-only next-step list; no hosted provider cutover is claimed.
