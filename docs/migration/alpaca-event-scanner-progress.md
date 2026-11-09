# Alpaca event-driven scanner development

## Owner scope and status

Owner approved a development trial of shared Alpaca event ingest, bounded detection/display, elapsed-time safeguards and removal of the Alpaca-to-Moomoo startup dependency. The later clarification explicitly retains Moomoo code, leaves it unselected and requests an owner data-connection selector like Watchlist's. No production deployment, pinned gateway restart, hosted configuration change, unrelated posting or broker-import change is authorized.

Local implementation and focused qualification are complete; owner review and release qualification remain separate. The actual production gateway stays pinned to its previous bundle/PID. Its new scanner-stream endpoint is source code for integration, not an endpoint activated against real users by this task. Existing private UI preview stays worker-disabled with sample tables. No new provider credentials or services were created.

## Provider selection

- Scanner data connection appears inside Scanner controls in scanner administration. Alpaca is the default when no explicit saved selection/environment provider exists. Moomoo code remains available; it cannot be selected while its existing shared-transport enablement is off. No automatic fallback to Moomoo occurs when Alpaca fails.
- The owner-only `/api/admin/screeners/provider` endpoint uses existing identity/navigation access plus the existing same-origin mutation guard. Its read path does not instantiate a feed, audit writer or provider. Responses contain only provider/revision/availability, never credentials.
- Selection is saved atomically in private scanner settings with a revision conflict check. The selector stops scheduling, stops and drains the old source, stops it again after any in-flight scan finishes, retains the single audit writer and starts a new scanner instance only if a worker was already running. Old rolling/episode/focus data is not transferred to the new provider. A stopped/preview worker is never enabled by a selection change. A busy drain has a bounded retryable failure.
- Both the outer runtime and the actual inner feed scheduler now allow selected Alpaca while the Moomoo budget flag is false. The legacy Moomoo path still respects its own gate. This is scanner isolation, not a global disabling of unrelated Moomoo consumers or a change to Watchlist's separate selector.

## Event path

Opt-in remains `TRADERLINK_ALPACA_SCANNER_EVENT_DRIVEN=true` together with selected Alpaca. It was not set in hosted environments or the shared owner preview.

1. The existing VPS SIP socket receives trades/quotes and maintains the exact session trade book. A token-authenticated server-only POST scanner stream shares that same socket and cached state; no upstream connection is opened per browser or chart. It admits at most two backend stream consumers, 4,000 symbols each within the existing combined lease limit, and bounded request bodies.
2. Changed symbols are coalesced every 250ms. Frames contain only scanner-needed quote/baseline fields and session totals, at most 200 symbols each and 400 changed symbols per flush. Deferred symbols are retained for later flushes, so large initial universes do not synchronously overflow the response. Backpressure destroys persistently slow consumers rather than retaining unlimited memory. Heartbeats, leases, idle timeouts and exponential reconnects are bounded.
3. One shared runtime caches streamed state and schedules at most one evaluation per second. Bursts coalesce, evaluations cannot overlap, and changes received during an evaluation schedule a subsequent run. This trial uses a bounded full-universe qualification/ranking pass, **not** an incrementally evaluated engine or a separate detector per user. A five-second maintenance sweep handles expiry/session/configuration work even without new trades.
4. Startup/correction snapshot bootstrap is serialized and batched. Session history backfill remains complete-only and bounded. Backfill completion explicitly marks the symbol for publication. Unknown conditions, corrections, disconnects, missing baseline/coverage or stale stream state never become fabricated complete counters. Warmup/reconnect withholds affected rolling state. A membership edit retains cached covered symbols; a date/provider/actual stream gap clears the applicable context.
5. Universe, float and news reads are coalesced/cached on a five-second metadata cadence; country metadata has its own longer cache. The selected source does not request Moomoo OAuth or reserve Moomoo snapshot budget.

## Timing and unchanged rules

- Filters, gain comparison bases, float/market-cap universe inputs, ranking formulas and settings values are retained. Eastern session/calendar/early-close rules remain authoritative. Overnight data is not relabeled as SIP session data.
- Five seconds remains an intentional short activity window, not a mandatory network delay. Event-mode rolling history retains actual first/latest observations in five-second buckets over 670 seconds, preserving one/five/ten-minute anchors without a sample-count truncation. No interpolation is introduced. Rate-baseline buckets preserve that existing short-window scale.
- Building/focus scan-count settings map to elapsed durations based on the former five-second cycle. Two confirmation observations still require a five-second interval; three quiet scans map to 15 seconds. Episode accumulation uses only newly observed share/dollar deltas, preventing overlapping short windows from double counting. Existing 30-second cooling remains elapsed-time based.
- Event-mode quote spread inputs expire after 30 seconds. Stream receipt time does not invent a new trade or new volume. Invalid/incomplete symbols lose eligibility without carrying their old rolling context into recovery.
- Full audit cycles are retained with optional `timingMode` evidence (`sampled_5s` or `alpaca_events_1s`). No audit sampling, schema migration or hidden record dropping was added. Faster observation can change the ordering/timing of genuine episodes; the smooth deterministic replay is not a claim of universal equality on volatile real-market traces.

## Display and chart behavior

- The single browser scanner loop honors one-second refreshes only for event-mode results; the sampled mode keeps five seconds. Requests serialize, hidden tabs stop polling, and returning to visibility requests fresh results. Side-card views reuse this loop/model.
- Provider identity is carried in results. Display continuity never keeps old-provider rows across a switch, and an event-mode coverage loss cannot be disguised by the existing empty-screen grace period. Other legacy display-continuity behavior is preserved.
- Charts keep authoritative provider bars/updates and volume. A separate coalesced Live price guide can move between those bars from eligible trades on the same shared SIP socket. It does not manufacture intraminute OHLC or add trade sizes onto authoritative bar volume. Reconnect/error clears the guide; existing history recovery and chart close/unmount cleanup remain.
- The existing preview exposes the selector at `/admin/screeners`: Alpaca selected, Moomoo off, no account/JS errors. Preview provider POSTs explicitly return worker-disabled rather than enabling real data effects. Only the UI/read-only selector/price guide/display overlay was applied there; its static tables were not presented as the event detector.

## Remaining Moomoo consumers — source trace, not an assertion they are running

| Consumer | Current boundary |
| --- | --- |
| Legacy `/scanner` → `/api/scanner/run` → `moomoo-stock-screen-service.ts` | Separate financial-filter stock screener; retained untouched. |
| Journal broker-import scheduler/repository | Broker execution import, not scanner candle ingest; retained untouched. |
| Level Analysis / Daily Trade Analyzer Moomoo candle provider | Separate consumers; retained untouched. |
| Watchlist indicator/candle/overnight bridges | Existing selected-Alpaca branches already bypass Moomoo; fallback code remains for other selections. |
| Shared transport, OAuth and saved broker connection management | Retained for those consumers; no global flag/credential deletion or hosted change. |

## Verification

- 98 focused cases across 17 files passed in the consolidated detector/gateway/session/selector/audit/display suite. Subsequent bounded tests cover the final source-drain and missing-universe stop corrections. Exact edited-source lint passes.
- Ten-minute deterministic old-five-second versus event-mode replay: matching qualification/gainer ordering and aligned one/five/ten-minute metrics for the supplied smooth trace. Separate tests cover confirmation/quiet durations, non-duplicated episode volume, missing coverage and session reset.
- Real local HTTP/SSE gateway → shared source → actual feed/engine flow with synthetic upstream trades passed: no Moomoo calls, one upstream socket shared with chart prices, updated price/volume, disconnected results withheld. No real provider or hosted mutation was used in that proof.
- Stream tests cover authorization, request bounds, coalescing, deferred initial-universe chunks, stale-state expiry, membership edits, disconnect clearing and cancellation. Provider tests cover private persistence, owner/mutation checks, conflicts, orderly switch, one audit writer, unchanged environment and no startup of a stopped worker.
- Core candidate-focused TypeScript passes, including new contract tests, with the approved High Drops calculation baseline and its existing rapid-drop input preserved in the compiler overlay. The expanded check including the workspace client still reports two pre-existing nullable-price errors in the unchanged High Drops card; it is not an all-green full UI type check. The assigned mixed tree has a pre-existing High Drops contract mismatch and missing rapid-drop argument; they are not silently absorbed or rewritten by this checkpoint. No full-repository build/all-green claim.
- Private browser: administration loads HTTP200 with Alpaca, disabled Moomoo-off option and no JS errors; read-only provider API HTTP200. A request-context TLS diagnostic initially failed outside Chromium's configured Tailscale resolver; browser-origin fetch succeeded. Display test with an isolated one-second fixture override: two refreshes in 2.3 seconds, zero hidden-tab refreshes, one immediate visibility-return refresh, maximum one in-flight request. Fixture override was browser-local only. The first interception used route.fetch and hit the same resolver limitation; the corrected isolated-fixture run passed.

## Performance limits and next checkpoint

The initial 4,000-symbol synthetic ten-minute working-engine measurement (11 final evaluations) was median108ms/p95-max185ms, heap201MiB at measurement. This excludes HTTP, metadata, audit compression/disk and browser/concurrent-user costs. A final candidate measurement preserving the approved High Drops path is recorded below when complete.

A full 4,000-symbol audit decision array was about6.45MB raw per evaluation. That is concrete evidence that audit write/compression/retention capacity must be qualified before enabling a one-second production detector. This task preserves the full evidence rather than silently sampling it. The existing bounded queue reports overflow as a coverage gap; no production acceptance of that load is implied.

Before rollout: qualify audit write/storage and authenticated transport under representative market event rates, check changing/volatile traces against the audit, and test representative concurrent browser/API demand. Preserve the existing single-writer release procedure. No production deployment or broad Moomoo shutdown was requested or performed.

Final candidate benchmark, including preserved High Drops implementation: 4,000 symbols, eleven measured evaluations after a synthetic ten-minute history, median82ms/p95-max166ms, heap235MiB at measurement, audit array6,450,081 raw bytes. This is a bounded single-host pure-engine measurement, not a statistically broad latency guarantee or capacity result.

Preservation note: the checkpoint also keeps the existing Levels generation-allowance Help section; its unrelated removal in the mixed working file is not staged. New owner-connection Help text is applied to the preservation baseline only. The expanded candidate type overlay includes the preserved High Drops card plus live workspace client; those two unchanged card errors remain. The core detector/provider/chart/selector check has zero errors.

Source checkpoint: `089104399f970bac0e187d0757bf12bf38c1fca1`, parent `a633fdd6e364606e05b550fbcad999890e08a419`,32 explicit paths. Saved through a temporary index on the local preservation ref. Actual assigned HEAD/index and unrelated mixed files remain untouched; no push or hosted operation.
