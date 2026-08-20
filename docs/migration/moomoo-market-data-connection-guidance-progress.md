# Moomoo Market-Data Connection Guidance Progress

**Controlling connection plan:** [Moomoo Direct Connection Plan](moomoo-direct-connection-plan.md)

**Progress:** In implementation following owner approval on 2026-08-18.

## Approved outcome

- Users with an active Trade Analyzer plan but no active Moomoo `quote:read`
  connection receive clear guidance where chart-based analysis is unavailable.
- The message explains that a free Moomoo account can be created in minutes;
  no Moomoo trading or brokerage account is required for market-data access.
- Every prompt links to Moomoo's public US site and to TradersLink Account
  settings to connect Moomoo.
- Guidance covers every Trade Analyzer page, Daily Trade Tracker chart replay,
  its Entry & Exit and Green-to-Red cards, plus Analyzer chart drawers.
- Manual trade entry, statement/CSV imports, ordinary Journal analytics, Market
  Charts and Candle Review remain outside this requirement.

## Implementation checklist

- [x] Add one shared TraderLink prompt with surface-specific trader benefits.
- [x] Read the active paid-plan interval and Moomoo `quote:read` state without
  exposing connection credentials.
- [x] Add guidance to the Trade Analyzer family and its Candle Patterns drawer.
- [x] Add guidance to Daily Trade Tracker chart, Entry & Exit and Green-to-Red
  unavailable states.
- [x] Add guidance to the Analytics trade-detail drawer.
- [x] Keep Trade Analyzer and Daily Trade Tracker Help accurate.
- [x] Complete focused static verification (`npx.cmd eslint` on the changed Moomoo guidance files; `git diff --check`).
- [ ] Complete owner visual review of the approved guidance on the live dashboard.
