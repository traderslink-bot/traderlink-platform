# Admin market data switching

Owner direction, November 17, 2026. Keep Alpaca as the default and let the
administrator switch Scanners, Screeners, shared Charts, Trade Analyzer and
Watchlist to their Moomoo paths. Preserve the exact pre-Alpaca Watchlist provider
combination, including EODHD where previously used, behind one restore control.

## Ownership

This chat owns the shared Platform settings, admin controls, Scanners and shared
Charts. The owner authorized contact with the feature chats. VPS Admin Watchlist
owns Watchlist/runtime restoration, Alpaca stock screener owns Screeners worker
switching, and analyzer analysis pages updates owns Trade Analyzer switching.
Each returns a narrow source checkpoint and verification evidence. Keep current
live provider selections, current preview and deployment untouched during work.

## Shared contract

`src/modules/market-data/server/provider-settings.ts` exports
`marketDataProvider(feature, environment)` and
`marketDataEnvironment(feature, environment)` for scanners, screeners, charts,
trade-analyzer and watchlist. Each selection defaults to Alpaca and is persisted
with a revision through the existing protected, atomic provider file store.
Scanners reuse their existing provider file and stop/drain/restart transition.
Watchlist's Moomoo selection means restoration of its verified previous setup,
with its exact historical/live/same-day sources handled together by its owner.

Admin controls show the selected source and use five recognizable switches
inside the existing admin Scanner connection section. Watchlist uses a previous-setup switch, with its actual sources stated underneath. Moomoo uses the existing server-side connection.
Browser caches, streams and pending requests must be isolated by provider and
selection revision. Changing provider must trigger a clean history reload and
close the previous stream. Preserve drawings, layout and indicator preferences.

## Acceptance

Verify default Alpaca, switching both ways, stale revision conflicts, connection
failures, provider identity and cache isolation, cancellation and reconnect,
stream/history timestamps, split adjustment, chart timeframes and indicators,
worker recovery and account access boundaries. Test with isolated fixtures
before any separately authorized live provider change. Report actual technical
limitations with evidence. Do not turn a selector into a claim that a data path
has been verified. Production release requires owner authorization.

Implementation is source-qualified against published `174ef044a`. See
[the integration and QA record](admin-market-data-switching-progress.md) for the
complete allowlist, paired Runtime dependency and remaining live qualification.
No production or preview provider selection was changed.

## Preserved Moomoo request flow

The owner's follow-up requires the same Moomoo request setup for Scanners and
Screeners. The retained scanner starts the next pass five seconds after the
previous pass completes. Within a pass, batch starts use the saved scanner
spacing (default 1,500ms) and the existing shared Moomoo request budget. This is
not an independent quota per feature. Screeners use that cadence and the same
persisted daily app universe, retaining the real source date when necessary.
The existing scanner premarket path starts universe/float warmup at 3 a.m.
Eastern before the 4 a.m. scanning session. Alpaca remains the default.

The exact Watchlist switch receipt confirms EODHD historical/live and Moomoo
same-day before cutover. Restoring it is a single atomic Runtime profile change,
followed by a verified Platform pointer. Custom profiles are displayed honestly;
reads do not change them. Interrupted acknowledgments are reread, and incomplete
pairing supports an explicit repair action. Provider files require no schema
migration. Moomoo quotes and history require the shared connection to be valid.
