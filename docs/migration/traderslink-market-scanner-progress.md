# TradersLink Market Scanner Progress

## Status

Planned on 2026-08-22 at the owner's direction. The owner asked to build the
TradersLink Scanner now and not wait for a separate market-data approval process.

## Current slice

- [x] Add the Scanner navigation and `/scanner` route.
- [x] Build the first visual page around the market-data screen-result fields and
  deploy it for owner review.
- [x] Replace the narrow filter form with a visual full scanner filter library:
  market/trading, fundamentals, indicators, candle/chart patterns,
  sentiment/ownership, broker holdings and options. Filters can be combined,
  given bounds or timeframes where appropriate, and removed. This currently
  updates local UI state only; no provider call occurs yet.
- [x] Review Help Center coverage. No Scanner-specific guide exists yet; one is
  required before live results, saved screens, sharing or alerts are released.
- [x] Remove redundant Scanner heading/scope copy and the provider-connection
  alert at owner request. Add selectable MA/EMA lengths (5, 9, 10, 20, 50,
  100 and 200) to the indicator filter UI.
- [x] Deny direct Scanner-route access to every hosted account except the
  owner-selected Discord identities held as a comma-separated allowlist in
  `TRADERLINK_SCANNER_EARLY_ACCESS_DISCORD_SUBJECT`; no display name or
  identifier is committed. Local loopback development remains available to the
  development owner only.
- [x] Hide the Scanner navigation entry for every account without that same
  early-access gate.
- [x] Add the server-side screen result contract and bounded refresh path. The
  browser posts selected conditions to a protected Route Handler; the server
  obtains the current user's market-data access token without exposing it,
  requests the active U.S. stock-screen endpoint and returns only display values.
  Equivalent active screens share one bounded in-memory result for 60 seconds;
  a viewing browser refreshes that result on the same cadence.
- [x] Add a growing TradersLink Scanner library across market activity, price
  and volume, moving averages, momentum, chart patterns, fundamentals and
  options. Each screen is a real provider request, not a sample result, and
  can be inspected and adjusted in the filter builder.
- [x] Add the first ready-to-run TradersLink Scanners: Biggest percentage move,
  Most volume, Above daily EMA 9, Bullish daily MACD crossover and Bullish
  daily chart patterns. Each runs directly through the same protected scanner
  request and leaves the full condition builder available under My Scanner.
- [x] Replace the top-of-page preset wall with a clear Scanner library action
  and a closable right-side library drawer. Category headings remain visible
  with their screen counts; each category expands independently, and a selected
  screen loads into the builder before the mobile drawer closes.
- [ ] Owner testing of the live Scanner at market open. Visual approval is
  requested only when the owner explicitly asks for it before a deployment.
- [x] Record the planned Community Scanner home, My Scanners collection,
  account-scoped ratings, scanner-alert model and mobile Scanner acceptance
  boundary in [Scanner alerts and mobile progress](./traderslink-scanner-alerts-and-mobile-progress.md).

## Not started

- [ ] Community Scanner home, ratings and discovery filters.
- [ ] My Scanners collection and scanner-result sharing.
- [ ] TradersLink Watchlists and sharing.
- [ ] Calendar market-events layer.
- [ ] Sunday upcoming-week notice and scanner alerts.

## Boundaries retained

No market-data credential, personal broker data or user connection is shared. No
production provider configuration, database migration, scheduler or
notification delivery has been changed by this planning record.
