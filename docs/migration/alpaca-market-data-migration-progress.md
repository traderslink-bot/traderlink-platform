# Alpaca market-data migration — scanner and Watchlist

## Owner scope and current boundary

On November 7, 2026 the owner requested moving the scanner workspace and the separate Watchlist tools to Alpaca. Use the existing Algo Trader Plus connection on the VPS. The owner specifically confirmed WebSockets: trades and quotes must drive live data, with HTTP used for history/bootstrap/gap recovery. Keep keys exclusively on the VPS and retain the existing daily universe, float/country enrichment, saved news and scanner rules. No provider change authorizes financial-data fabrication, a detector retune, a migration or a hosted release.

This is an implementation checkpoint, **not a completed hosted cutover**. The VPS gateway upgrade is running privately. Platform source adapters are prepared behind `TRADERLINK_MARKET_DATA_PROVIDER=alpaca`. The separate Watchlist/levels runtime has a source patch candidate, not an applied release. The scanner preview retains its existing static table samples and real Alpaca charts. Railway service settings, data and deployments are unchanged.

## Implemented in assigned Platform source

- Shared VPS SIP socket now leases trades and quotes for scanner/Watchlist consumers alongside chart bars, updated bars and daily bars. A chart does not open another upstream connection. Expired consumers release subscriptions; chart count limits are separate from universe size. The quote endpoint bootstraps missing symbols once with SIP snapshots, then returns streamed state. Actual provider timestamps are retained. Daily-bar rollover retains the prior regular close. Corrections/cancels invalidate quote and session state for recovery.
- Separate session trade counters for premarket, regular and post-market. Actual eligible trade size and price-times-size provide shares and traded amount; minute volume or VWAP-times-volume is not substituted. SIP minute-price and volume eligibility rules are independent, including odd lots and official close/open conditions. Unknown conditions withhold completeness. Early closes use the scanner calendar's regular-close boundary.
- Counters warm from paginated same-date SIP trades only after the server acknowledges the requested trade subscription. Incoming messages at the history cutover are buffered/deduplicated, including submillisecond timestamps. Live duplicate suppression is bounded. Disconnects invalidate counter completeness and trigger bounded backfill on renewed demand. Partial history, failed pages, page-cap exhaustion or buffer overflow never publish a full-day/session counter. Four backfill workers, provider request cap and retry delay bound startup recovery. No persisted trade counter is claimed across a process restart: history is rebuilt.
- Scanner feed accepts a provider-specific normalizer, retains existing engine/audit/polling/qualification rules and records `provider: alpaca` in source observations. Post-market volume, prior regular close and same-day regular close remain independent. Collection market cap and float remain existing inputs. Selecting Alpaca avoids the Moomoo budget/OAuth path; changing provider for an existing running feed requires a process restart.
- General history endpoint supports native 1Min/5Min/15Min/1Hour/4Hour/1Day with SIP, split adjustment, bounded date ranges, pagination, completeness, coalescing and a bounded cache. Chart history stays raw under its existing endpoint. Distinct adjustment/series identity prevents cache mixing.
- Platform Watchlist indicator refresh selects Alpaca as the sole provider when enabled, uses the existing request coordinator/calculation/session/VWAP/audit engines, and records `alpaca` / `alpaca-split`. Saved evidence from other providers is not restored into the selected provider path. Setup input/replay accepts the truthful new provider identity. No Yahoo request is silently relabeled as Alpaca.
- The authenticated Watchlist AI candle bridge uses the VPS adapter when enabled, preserving seconds-based `MarketDataRequest`/`NormalizedMarketCandle` timestamps. Indicator history retains millisecond starts. Exact turnover is null when the bar API does not supply it.
- Watchlist overnight reference lookup uses the paid BOATS latest-trade endpoint through the VPS gateway and validates that the event belongs to the current overnight window. SIP is not relabeled as overnight data.

## Located hosted runtime

Read-only Railway metadata and source inspection confirmed:

- Project: TraderLink Platform.
- Service: `traderlink-watchlist-runtime-staging` (`d69d66fa-b785-414c-90f5-ca61fbfb7cc2`).
- Environment: staging (`9e079dd4-f3f3-4872-9b00-adbd3000c485`).
- Deployment: `e95dc262-bdd5-404a-97fd-56d93fe4b4c4`, SUCCESS, November 3.
- Live Platform's `TRADERLINK_WATCHLIST_RUNTIME_URL` and `TRADERLINK_STOCK_LEVELS_RUNTIME_URL` both point to that service. Only those URL origins were projected; credentials were not printed or copied.
- Runtime currently selects EODHD for historical and live providers. It has source under `/app/src`, uploaded deployment metadata, one replica and the persistent volume. No source repository was inferred from that deployment.
- Stock Levels has an additional hardcoded EODHD dashboard history service and Yahoo/EODHD reference-price path. Merely changing the main provider environment variable would leave those paths behind.

## Hosted runtime integration artifact

[Runtime provider patch](alpaca-watchlist-runtime-provider.patch) was generated from the exact read-only deployed modules. It adds the independently tested portable `runtime-providers.ts` adapter plus seven narrow source changes:

1. `src/lib/market-data/alpaca-runtime-providers.ts` (new).
2. `src/lib/market-data/candle-types.ts` (Alpaca provider identity).
3. `src/lib/market-data/provider-factory.ts` (historical adapter).
4. `src/lib/market-data/selectable-same-day-candle-service.ts` (same-day option without silent fallback).
5. `src/lib/monitoring/live-price-provider-factory.ts` (live adapter).
6. `src/runtime/main.ts` (provider selection).
7. `src/runtime/manual-watchlist-server.ts` (selection validation and the separate dashboard/Stock Levels history path).
8. `src/runtime/stock-levels-reference-price.ts` (Alpaca reference with the existing freshness validator).

The portable historical provider preserves the runtime candle response contract and actual Alpaca identity. The live provider reads the VPS WebSocket cache at five-second intervals, carries actual trade timestamps, suppresses duplicates and supports cancellation. It does not fabricate volume from quote ticks. The existing levels/AI/monitoring calculations and Stock Levels price-age policy are retained. Existing historical calculation-profile names remain legacy identifiers; actual data-provider metadata is Alpaca.

The patch dry-run applies cleanly to the eight exact source modules captured from the deployed runtime. The portable providers pass local contract tests. This is **not** a full runtime build or runtime integration acceptance: the canonical runtime source, its full tests, deployment manifest and any provider-specific UI/cache validators must be reconciled by its owning Coordinator/worker before release. Do not apply a patch directly to the running container or recreate a complete runtime repository in this feature workspace.

## Verification

- 63 focused Vitest cases pass across 11 files: chart aggregation, gateway authentication/sharing/cancellation, session trades/eligibility/boundary deduplication, scanner mapping/runtime/feed, request proxy, Watchlist adapters, portable runtime adapters and existing indicator engine.
- Existing offline request-coordinator verification passes; refresh integration passes 84 assertions; indicator audit persistence/replay passes 24 assertions.
- Focused TypeScript check covering the gateway/models, adapters, indicator runtime and setup replay passes. Exact-file lint passes. No full repository or external runtime build is claimed.
- Real read-only VPS proof: NWGL Watchlist candle bridge returned 31 one-minute bars; indicator bridge returned 13 five-minute bars, with Alpaca-only audit identity, SIP and split adjustment. No broker/trading endpoints were used.
- The first standalone Node probe could not resolve Next's `server-only` marker outside Next; the follow-up used the existing test marker alias in an isolated esbuild probe and passed. No application package or lockfile was changed for this check.
- The existing Moomoo transport removal/constructor changes in three shared working-tree files predated this task. They are not part of this migration checkpoint: its temporary index retains preservation-baseline legacy safeguards and stages only the Alpaca deltas. Unknown work is left intact in the owner's working tree.

Help reviewed: this slice adds internal provider wiring and a separate runtime patch, with no newly released member UI. Existing live guides must not claim an already-completed provider cutover. Align runtime provider controls/help at its integration acceptance.

## Remaining integration/release work

1. Runtime owner applies/reconciles the eight-file patch in its canonical source and completes full type/build/provider/Stock Levels/Watchlist tests. Preserve all data and existing feature settings.
2. Coordinator provisions authenticated encrypted Railway-to-VPS connectivity; current gateway listener is private loopback only. Do not point production at the temporary preview bridge or expose a new public port as a shortcut. Alpaca keys stay on the VPS; Railway receives only the distinct gateway credential.
3. Configure Platform and runtime for Alpaca. Reconcile persisted runtime provider settings as well as environment settings; persisted selections can override environment defaults. Select historical/live/same-day Alpaca through the established settings path and restart through the coordinated release flow. Ensure the on-demand Stock Levels reference path also sees Alpaca selection.
4. Staging acceptance of complete scanner, indicator/AI, levels and Watchlist flows, source provenance, provider-disconnect recovery and retained results. Only then request the owner's production release approval. Current subscription access is not represented as member data-display authorization.

Primary docs: [Market Data API](https://docs.alpaca.markets/us/docs/about-market-data-api), [stock trade conditions](https://docs.alpaca.markets/us/docs/market-data-faq), [stock WebSockets](https://docs.alpaca.markets/us/docs/real-time-stock-pricing-data), [BOATS feed](https://docs.alpaca.markets/us/docs/245-trading-for-trading-api).

## Runtime patch source fingerprints

The patch is based on the deployed source read above. Reconcile changed fingerprints rather than overwriting newer source.

| Runtime path | Base SHA-256 |
| --- | --- |
| `src/lib/market-data/alpaca-runtime-providers.ts` | `new file` |
| `src/lib/market-data/candle-types.ts` | `a3059be6bd9bcc7255edca58d4e4f14119cc4e0f5ee1fdd7316d4aec99db59cc` |
| `src/lib/market-data/provider-factory.ts` | `2f8db1a6946cc02567a355dad363427bee21bca5d207d8ddd0de07117329bd2b` |
| `src/lib/market-data/selectable-same-day-candle-service.ts` | `5d0a9b3a0190fed3b2287746ab0810d727ce4e2950babd3671f9d62fd2cee283` |
| `src/lib/monitoring/live-price-provider-factory.ts` | `b47b8370914b770c796b30973d58f8285e5b3193357fd4b37304fbe745308b93` |
| `src/runtime/main.ts` | `a14f1457e5b6e550944ee5e47305d28763fbb8fbf6bf56ae234212bdc3769423` |
| `src/runtime/manual-watchlist-server.ts` | `06e4b7faf0b38e3b8e8de4571aea6431b3fa95e9873cdc8f1841e999e1cfacf9` |
| `src/runtime/stock-levels-reference-price.ts` | `d0a03b629d0ee6a4ad2d4992c09458499810a604cbbd05737ce5ba6189c58bd0` |
