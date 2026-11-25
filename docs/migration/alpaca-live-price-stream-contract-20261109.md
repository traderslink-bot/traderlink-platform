# Shared Alpaca live price stream — protocol 1 integration contract

Status: protocol1 implemented and locally tested in `src/modules/scanner/alpaca/live-price-hub.ts` and `gateway.ts`; Watchlist has prepared its consumer. Not installed, not deployment approved. The owner has placed every deployment/restart on hold until expressly ready. Scanner/chart repairs and stream tests remain in progress.

## Endpoint and ownership

Authenticated server-to-server `POST /prices` with gateway bearer token, JSON `{ "symbols": ["AAA", "BBB"] }`. Uppercase valid chart symbols, distinct, 1–400 per consumer; at most 8 consumers. Reject malformed requests before upstream subscription. No credentials, user identity, email or market-data keys in frames. Gateway owns source/module implementation; Watchlist task owns Runtime consumer. Existing shared SIP WebSocket is reused. Consumer leases are connection-scoped and independent of scanner-universe leases and chart subscriptions. Removing a consumer removes only otherwise unneeded subscriptions. No second SIP socket and no upstream connection per user.

## Frames

UTF-8 SSE, `event: prices`, single JSON `data:` line, blank line separator. Each frame:

```json
{"protocolVersion":1,"feed":"sip","connected":true,"kind":"delta","emittedAt":1794238230000,"prices":{"AAA":{"price":2.15,"providerObservedAt":"2026-11-09T15:30:30.123456789Z","receiptAt":1794238230125}}}
```

`kind` is `snapshot`, `delta`, or `status`. `providerObservedAt` is the original eligible trade timestamp, unchanged, including sub-millisecond precision. `receiptAt` and `emittedAt` are gateway UTC epoch milliseconds; they are transport facts, never invented trade times. No quotes masquerade as trades. Optional bid/ask is excluded from protocol 1; consumer must allow it to be absent. `prices` contains only requested symbols; snapshot omits symbols without an eligible known trade. Lack of a symbol does not mean zero. A status frame has an empty prices object.

Delta fan-out coalesces the latest eligible price per symbol at 250ms; this is a display publication bound, not completed-minute-bar scheduling. Use existing SIP trade-condition price eligibility. Preserve timestamp ordering and never let stale REST bootstrap replace a newer live trade. Initial snapshot bootstraps latest trades from SIP snapshots using their actual provider timestamps. Snapshot is not proof the provider is currently streaming: `connected` must track authenticated subscription acknowledgment. No replay guarantee across reconnects: clear consumer currentness, reconnect with a fresh snapshot, reject older per-symbol observations and treat disconnection/staleness honestly. Provider time does not advance on heartbeats.

Emit a status heartbeat at least every 5 seconds, including when no trades occur. Disconnection immediately publishes connected false with no prices and invalidates live source health. Runtime must impose a receipt watchdog (12 seconds suggested), bounded frame buffer (2MB maximum), reconnect backoff and abort cleanup. Slow consumers exceeding 2MB queued output are disconnected; do not hold the shared provider socket behind one consumer. Validate protocol, feed, symbol membership, finite positive price and original timestamp before publishing.

## Overnight and exclusions

Protocol 1 is SIP only. BOATS is presently an honest separate REST path; no overnight WebSocket or elimination of overnight poll delay is claimed. Adding BOATS streaming requires a separate reviewed capability and feed identifier. Do not silently label IEX, delayed SIP, BOATS or cached bars as live SIP.

## Required qualification

Synthetic timestamp ordering, overlap/reconnect, no-trade heartbeat, stale/provider-disconnected state, authorization/input validation, independent overlapping leases, last-consumer cleanup, single upstream socket, slow-client bounds, price-condition eligibility and source-to-receipt-to-emission timing. Then actual end-to-end installed-source verification only after the owner lifts the deployment hold. Do not point a Runtime consumer at this endpoint until shared gateway owner supplies a tested immutable artifact and implementation confirmation.


## Local qualification checkpoint

Combined scanner/Alpaca regression:59files/395tests passed. Protocol tests confirm preserved sub-millisecond source ordering, eligible prices, heartbeat without invented observations, disconnected-state clearing, independent overlapping memberships and slow-consumer isolation. Local HTTP test opens `/prices` and chart SSE together, receives trade-driven price and provisional OHLCV, confirms one SIP socket, closes the chart while preserving the Watchlist connection, then releases the last consumer. These synthetic tests do not measure installed provider/network/UI latency. Source immutable preservation and final integration/recovery artifact follow separately; running gateway remains pinned and unchanged.

## Ordered Renko and Range trades — November 25, 2026 Toronto

The private bearer-authenticated `GET /chart-trades/stream?symbol=VIVS` serves today's regular Alpaca SIP tape. The official calendar supplies the session start and close, including early closes. The Gateway waits for trades, corrections and cancel/error subscription acknowledgments on the existing SIP connection. It joins fully paginated history through a fixed UTC cutoff to the live trades buffered during that read. It preserves the provider's nanosecond UTC time, reuses the existing price eligibility rules and preserves source order at equal timestamps. The replay uses the execution price as reported. [Alpaca historical trades](https://docs.alpaca.markets/us/reference/stocktrades-1) · [Alpaca live trades and revisions](https://docs.alpaca.markets/us/docs/real-time-stock-pricing-data)

`tape` events carry a `snapshot` with `stream`, `through`, `trades`, `symbol`, `date`, `start`, `cutoff`, `feed: "sip"` and `session: "regular"`, followed by contiguous `batch` frames with `stream`, `after`, `through` and `trades`. Each trade contains `position`, `time` and `price`. Positions begin at one. A complete empty snapshot has `through: 0`. `cutoff` describes the inclusive REST boundary. The snapshot can also contain buffered live trades beyond it.

An out-of-order print, correction or cancellation that changes the emitted order replaces the tape with a new identifier. A reset carries the prior identifier. A provider disconnect resets the tape and triggers a bounded historical read after the new subscription is confirmed. Previously observed corrections and cancels are reapplied during that read. The provider's REST response is the source for the outage window. The protocol exposes no separate replay of correction messages missed during the outage. `status` frames report `warming`, `closed`, `unavailable` or `limit`. There is no price or candle fallback. The Gateway supports four simultaneously retained symbols and eight connections, ten history pages and 50,000 underlying trades per symbol, and a 25-second bootstrap deadline. Last-viewer tapes are retained for 15 seconds to cover a quick browser reconnect. Subscriber backpressure can close a single downstream connection and a reconnect receives a complete current snapshot.

Local verification passed 35 focused tests, scoped TypeScript and ESLint. The loopback HTTP test exercised the actual Gateway with synthetic REST and WebSocket inputs, including bearer admission, history pagination and live overlap, spike and reversal at adjacent nanoseconds, corrections, cancels, upstream and downstream reconnects, and continued access to the existing Gateway behavior. The tape tests also cover equal-timestamp source order, late prints, the early close, missing revision-channel acknowledgment and incomplete history. Browser integration and the PC review belong to Shared Charts. No hosted process or provider connection was used for this checkpoint.
