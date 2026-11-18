# Screeners provider switching

## November 17, 2026 ET checkpoint

The owner requested an admin switch between Alpaca and the retained Moomoo method,
with Alpaca as the default. The Scanner/Charts feature chat owns shared admin
controls, the revisioned selector and the Moomoo credential bridge. This slice
owns the Screeners worker, market packs, live ingress and filtering integration.

The current Screeners interface, saved definitions, sharing, arbitrary market-cap
bounds, OR groups, exclusions, exchanges and secondary sorting use the same
contracts. Opening ranges, recent volume, relative volume, gap fills, premarket
breaks and daily technicals use the existing history calculations. Provider
fields such as trade counts remain unavailable where Moomoo lacks the inputs.

## Runtime and transport

The VPS worker reads `GET /api/internal/market-data?feature=screeners` using its
existing private publisher token. The selector returns a provider and revision.
The worker checks each second and cancels collection and publication for a
replaced revision. Alpaca uses its existing SIP session and candle-cache warm-up.
Moomoo uses bulk snapshot polling and paginated raw history through Platform's
authenticated bridge. Platform retains owner OAuth access. Its shared request
budget gives Screeners lower priority than Scanners.

The owner's subsequent clarification makes Moomoo use the existing persisted
app ticker universe with the $200M collection-cap eligibility. The authenticated
universe read carries the actual saved source date and configured batch spacing.
Screeners reuses the Scanner's 3 a.m. ET preparation and current-day/retained
universe persistence. The worker rechecks that saved roster at most every five
seconds and picks up changed membership on the next quote pass. Retained universe
dates follow the Scanner's existing fallback behavior. Alpaca uses its covered
U.S. stock universe.

Moomoo snapshots use the existing `snapshotBatches` and `pacedSnapshotPass`
helpers. Batch starts are 1,500 ms apart by default, with the server's configured
spacing honored. Each completed pass is followed by a 5,000 ms wait. Slow replies
already consume the spacing interval. Failed batches permit healthy later batches
to complete. The single quote loop populates a bounded cache for the historical
collector and initial quote pack. Every source request uses the existing shared
budget and priority. The one-second selection check reads Platform settings.

Moomoo history uses raw prices and documented split/consolidation ratios.
Prices and volumes use the same daily basis. Cash dividends do not alter the
split calculation. The existing collection and metric functions receive
normalized bars. Provider identity invalidates incompatible cached history.
Unavailable symbols retain their listing rows and available metrics.

An initial Moomoo quote pack reuses the completed quote pass while history loads.
It reports partial coverage and supplies no invented historical indicators.
It cannot replace an existing priced pack for the same selection and session
date when the worker restarts. The full collector subsequently publishes its
history-derived fields.

The worker publishes packs through `POST /api/internal/stock-screeners-pack`.
Writes validate the entire pack, use a private temporary file and atomic rename,
and recheck the selection immediately before rename. Packs have separate
`market-PROVIDER-REVISION.json` paths. The existing `market.json` remains readable
for the original Alpaca revision zero. Switching back uses the new revision's
pack. Live frames carry the same identity and stale revisions receive 409.
An Alpaca live book cannot merge with a Moomoo pack. Existing immutable user
runs keep their original source, sorting and pagination.

## Integration requirements

The worker keeps the existing private configuration fields `origin`,
`publishToken`, `credentialsFile`, `gatewayTokenFile` and `gatewayUrl`. The last
three are used only for Alpaca. The new runner combines prepared snapshots with
the live publisher. When activating it in a later approved release, the
Coordinator must retire the old independent REST snapshot schedule to avoid
duplicate collection. The shared selector, pure Moomoo calendar and authenticated
bridge must be integrated with this slice.

The assigned workspace lacked the published live-worker files and freshness
header. Local checkpoints `cb9afb646` and `7388e0e2b` restored those exact published
Screeners files before implementation. The Screeners source at published
`174ef044a` matches that baseline. Integration should apply the provider delta
to the published baseline and include this workspace's previously retained
collector recovery behavior.

## Verification boundary

The cadence followup passed 15 files and 67 tests, including six cases covering
normal/slow/configured pacing, failed batches, roster changes, retained dates,
eligibility and reuse of cached source quotes. Tests use disposable accounts
and market fixtures. The focused TypeScript projection
passed against published `174ef044a` plus the explicit feature/shared-selector
files. The preserved root contains an older Scanner row diagnostic outside this
slice. Targeted ESLint passed and the worker bundle compiled.

The final integration check removed an unintended runner dependency on preserved
candle-settle helpers. Snapshot scheduling uses published `174ef044a` behavior,
with five-minute active and thirty-minute inactive intervals measured from the
start of collection and a twenty-second minimum wait. `intraday-structure.ts`
requires no provider-switch change. The tightened TypeScript projection overlays
only the files changed by the two provider commits and resolves every other
dependency from the published commit. That exact projection passed.

The combined review also found that the published RVOL recovery fixture returned
both tickers when the collector retried only its rejected ticker. The narrow
fixture donor `969d68fc7af1b5a869372319e72bc74e27ab9a5d`, parented to published
`174ef044a`, makes its reply match the requested symbols. Its one-file allowlist
is `src/modules/stock-screeners/filters.test.ts`. The corrected fixture passed all
nine tests in the Coordinator's disposable combined projection. The assigned
workspace's existing collector tests retain their earlier recovery assertions.

Tests cover both switch directions, stale upload/live-frame rejection, source
isolation, retry after a missing first pack, saved-screen and sharing regressions,
opening-range and VWAP filters, and paging/sorting after 31 minutes. Moomoo
fixtures cover actual source clocks, split-adjusted prices and volumes,
pagination tokens and minute cutoffs, valid peers alongside missing data,
history metric parity, provider cache reset and quote startup.

Live Moomoo entitlement, app-universe cold and warm timings, and Scanner/Chart
performance under that source remain to be measured. Moomoo history is per
symbol. The quote bootstrap avoids waiting for that history before basic runs.
Actual production freshness requires later live qualification. This is a local
source checkpoint with no hosted or preview changes.

The source contracts follow official
[history](https://open.moomoo.com/api/quote/basic-data/history-kline),
[corporate-action](https://open.moomoo.com/api/quote/basic-data/rehab),
[snapshot](https://open.moomoo.com/api/quote/realtime/market-snapshot) and
[calendar](https://open.moomoo.com/api/quote/basic-data/trading-days) documentation.
