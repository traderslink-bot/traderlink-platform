# Trade Analyzer provider switching

## Scope and shared contract

Analyzer work stays in `/home/traderlink/projects/analyzer-alpaca` on
`codex/analyzer-alpaca-cutover`. The Platform owner owns shared administrator
controls and `src/modules/market-data/server/provider-settings.ts`.

The shared selection must be read when a new Analyzer job is queued. Jobs
already queued, leased, or awaiting post-session refresh keep the provider in
their referenced market-session record. The worker dispatches using that saved
record, independently of later administrator changes. Explicit retries may
choose the current provider and create a new analysis revision. Historical
candles, receipts, and analysis versions remain intact.

The retained Moomoo implementation uses the designated shared market-data
account from `SharedAnalyzerAllowanceRepository.designatedScope()`, then its
Moomoo connection access service. It does not use the requesting trader's
personal Moomoo connection. Moomoo history requests use `autype=0`, preserving
actual trading prices, and retain native END candle labels under adapter v1.
Derived Analyzer candle timestamps are normalized once. Alpaca uses raw SIP
bars with START labels under adapter `alpaca_sip_raw_v1`.

Integration needs the shared owner's `marketDataProvider('trade-analyzer',
environment)` when constructing the selection repository in
`journal-integrity-runtime.ts`. The queue repository accepts a provider
argument with Alpaca as its default. Worker dispatch must use the persisted
job identity, rather than applying the current administrator selection to
old work. No new schema migration is needed for this identity.

## Discovery findings

- `claimNext` currently repoints any claimed session to Alpaca. Remove that
  reassignment and dispatch each job to its pinned provider.
- Core cache lookup currently hardcodes Alpaca; select matching provider and
  adapter at enqueue time.
- Indicator evidence must join its acquisition's session, even after a retry
  switches the job to a different provider. Joining the mutable job session
  would relabel historical Moomoo receipts.
- The Moomoo worker source is retained in Git immediately before `7c98af673`.
  Its designated-connection and timestamp behavior must be preserved.
- The initial retained Moomoo candle provider had no split-date capability.
  The shared market-data implementation now supplies Moomoo corporate-action
  dates. Analyzer uses those dates to bound raw prior-session warmup.

## Verification

Implemented the shared selector call in `journal-integrity-runtime.ts`, passing
the runtime's environment to `marketDataProvider("trade-analyzer", environment)`.
Queue records retain their provider through claiming, leases and post-session
refresh. New requests and explicit terminal retries select the current
provider. Each worker claims only its own provider. Moomoo uses the designated
shared connection and normalizes native END labels exactly once in derived
analysis. The original receipt JSON and its digest stay unchanged.

Indicator evidence and request deduplication are filtered by the immutable
acquisition provider. Saved-coverage eligibility uses the selected provider's
adapter. Both runtimes bound raw prior-session warmup to the latest effective
split. Moomoo obtains split dates through the shared Moomoo corporate-action
bridge. Alpaca retains its split lookup and post-session reconciliation.

- 57 tests passed across eight Analyzer/provider suites. Coverage includes both
  switch directions, administrator selections persisted in a temporary folder,
  queued-provider stability, explicit retries, cache isolation, native receipt
  immutability, one-minute anchors and original fills/shares/gross P/L in both
  workers for reverse-split, forward-split and no-split price/quantity fixtures.
- Focused TypeScript over all changed code/tests and their imported dependencies
  passed. Targeted ESLint passed. Whole-repository TypeScript returned seven
  diagnostics outside this slice in Scanner tests and a membership jsdom type
  declaration. It was rerun with sufficient heap after the default heap limit
  interrupted the first attempt.
- Tested against the shared owner's actual selector module from
  `/home/traderlink/projects/admin-watchlist/src/modules/market-data/server/provider-settings.ts`
  using a temporary local symlink. The symlink and QA config were removed after
  verification. This checkpoint depends on integrating that shared module and
  its supporting source with this slice.
- Existing Trader Analyzer and Day Tracker guides were reviewed. Their
  trader-facing workflows are unchanged. Shared administrator provider help
  belongs to the shared controls owner.
- No browser/preview updates, live setting changes, live provider calls,
  production data writes or deployments were performed for this switching
  slice. Integrated administrator/browser acceptance remains with the shared
  controls integration.

Local implementation checkpoint is `8150c2af025b8edf6a865216344b49db7dffad83`
on `codex/analyzer-alpaca-cutover`. Integrate its 14-file allowlist together
with the shared administrator selector before running the combined acceptance.


## Moomoo split-aware warmup follow-up

The subsequent slice removes the temporary current-session-only Moomoo limit.
It calls `MoomooChartHistory.readEvents(symbol, "Splits")` from the shared
market-data module. Both providers now filter prior-session windows to dates
on or after the latest split effective on the trade date. Raw candle prices,
execution quantities and the Moomoo v1 native END-label receipt contract are
unchanged. Invalid split dates fail history preparation rather than permit an
incorrect raw-price basis.

Provider identity is an explicit history-service argument. Supplying Moomoo
split metadata therefore continues to use Moomoo receipt filtering, Moomoo
acquisition flags, and the designated shared Analyzer scope for candle history.
The shared metadata bridge uses its configured quote connection through
`withWatchlistIndicatorMoomooAccess`; that existing owner-subject and active
`quote:read` configuration must be available in the integrated runtime.
Metadata failure preserves core Analyzer processing with unavailable indicator
history, as before.

- All 61 tests across the eight focused suites passed.
- Focused TypeScript and targeted ESLint passed.
- Regressions exercise actual shared Moomoo SPLIT/JOIN date extraction,
  fetching the prior session after a split, excluding pre-split windows on
  the split date, no-split history, shared-scope authorization and unchanged
  Moomoo receipt identity. Existing raw fills/shares/P/L/minute-anchor and
  immutable-receipt tests also passed.
- Five required shared modules were copied to a disposable test projection;
  no shared owner's source file was edited.
- No live provider call, deployment, setting write, preview update or browser
  check was performed for this follow-up.

The exact follow-up file allowlist is

- `src/modules/level-analysis/server/daily-trade-analyzer-runtime.ts`
- `src/modules/level-analysis/server/trend-momentum-history-service.ts`
- `src/modules/level-analysis/server/trend-momentum-history-service.test.ts`
- `docs/migration/analyzer-provider-switching-progress.md`

The follow-up requires the shared owner's market-data module integration.
The temporary projection used these source fingerprints.

- `src/modules/market-data/moomoo-calendar.ts` — `222377399d21151a1b9c59338048f4a725d9d1d525e036ca12b63f0a6cf67d55`
- `src/modules/market-data/provider-contract.ts` — `a3168c00eb0f9ec56da7904c4a29f07f9a56f3da73dd04ec10341fca16f6ce07`
- `src/modules/market-data/server/moomoo-bridge.ts` — `b5d47f31fb6709428cf6523a2c8a24ab95d500c2b2ca53563b844e92ef91a8ff`
- `src/modules/market-data/server/moomoo-chart-history.ts` — `35513a247f81798971ed5ee39d80d151b4cb75e1edfc7f06797feccacb747761`
- `src/modules/market-data/server/provider-settings.ts` — `0a351a932c12f2a4f79b2ecf7300aed286dd212b23170a2efa4c3061d0d5286c`
