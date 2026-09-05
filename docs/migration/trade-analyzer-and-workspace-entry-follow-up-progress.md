# Trade Analyzer and Workspace Entry Follow-up Progress

Related plan:
[trade-analyzer-and-workspace-entry-follow-up-plan.md](./trade-analyzer-and-workspace-entry-follow-up-plan.md).

## Current state

| Item | Status |
| --- | --- |
| Analyzer correction and fullscreen chart behavior | Implemented locally; focused source QA complete |
| Workspace Add Trade/Edit Trade confirmation and field layouts | Implemented locally; focused source QA complete |
| Analyzer outcome notification, pending refresh, and bell navigation | Implemented locally; focused source QA complete |
| Tracker helper text and page-loader dark appearance | Source confirms Tracker helper uses readable Dark theme text; loader text implemented locally |
| Owner visual review | Pending |

## Evidence captured

- Manual execution save refreshes the Tracker immediately, so a derived trade
  rebuild can leave remaining Analyzer corrections in a collapsed trade.
- Fullscreen changes the chart container height but does not currently trigger
  a new Analyzer visible-range calculation.
- Workspace Add Trade receives a server preview but automatically confirms it;
  the server's closed/open grouping result is not shown to the trader.
- Terminal Analyzer market-data failures notify the TradersLink team only.
- The compact bell menu depends on nested Button/Link behavior and does not
  explicitly close then navigate.
- The dashboard page loader uses the TradersLink chain image and previously
  inherited muted text in Navy Dark appearance.

## Focused source QA

- `git diff --check` passes.
- Confirmed the user notification uses the existing valid `chart_update_ready`
  notification kind and version-scoped event key.
- Confirmed all Workspace Add Trade and inline-edit date/time grids use the
  widened 164px date and 132px time fields, and the full Edit Trade drawer uses
  the same desktop widths.
- Confirmed pending Tracker refresh starts only with pending Analyzer work,
  avoids unsaved changes, checks document visibility, and cleans up both its
  timer and visibility listener.

## 2026-09-04 shared Moomoo acquisition regression repair

- Production review of valid IMRN and CDTG submissions exposed a regression in
  the logical-trade worker introduced with the shared beta acquisition path.
- The 4:00 AM Eastern request boundary remains unchanged. Coverage is now
  determined from the successful provider request window stored on the market
  session, not from whether a sparse small-cap ticker happened to print a
  candle at the opening boundary.
- Terminal jobs that already have a successful cached session covering their
  requested window are requeued for cache-only recovery. This neither requests
  Moomoo again nor consumes another user acquisition.
- Failed provider attempts now retain the requested UTC window and safe reason
  code as immutable market-session evidence. Existing usable candle revisions
  are not replaced by a later failed attempt.
- Production logs now identify the symbol, UTC request window, adapter, safe
  failure category, HTTP status/page where available, and Moomoo return code
  where available. OAuth credentials and access tokens are never recorded.
- A production IMRN retry was accepted and charged but failed before the
  provider call with an otherwise opaque SQLite error. The worker now records
  the exact safe processing stage plus SQLite code/message so the failing
  saved-session statement can be corrected from evidence rather than guessed.
- The resulting evidence showed the owner failure-notification lookup used the
  nonexistent workspace-membership field `joined_at_utc`; it now uses the
  canonical membership creation timestamp.
- Workspace's default Date/Newest order now keeps the trading date primary and
  places the most recently recorded trade first within that date. Explicit
  user-selected column sorting remains available.
- The Shared Analyzer administration page now reads the canonical Journal
  account `display_name`; its stale `account_label` reference prevented the
  owner from selecting the designated Moomoo connection.
- The shared Analyzer connection selector now identifies each active connection by both user and Journal account, so repeated account names such as `Primary Journal` are no longer ambiguous.
- Restored the Analyzer chart's Navy Dark surface while keeping its grid hidden, increased the contrast of the range, display, and fullscreen controls, and made Workspace recognize current shared logical-trade Analyzer results when coloring the Analyzer action.
- The Analyzer chart remains light in both application appearances because its chart labels are clearer on the light surface; Navy Dark still uses the higher-contrast chart controls.
- Both TradingView Advanced Chart embeds now default eligible symbols to extended-hours candles and hide only the side toolbar at 700px and below, rebuilding the widget when that breakpoint changes.
- The Workspace Rules broken card now places its larger count at the right side of the header and uses the warning color for the Recent broken rules label.
- Added a half-width Top tickers Workspace card beside PR Scanner with Most profitable and Most traded rankings that follow the active Workspace date filter and logical-trade identity.
- Best trade and Worst trade Workspace metric cards now place a Trade details action to the right of their values and open the exact filtered trade in the existing details drawer.
- The Top tickers card links Most profitable and Most traded to all-time Trade Explorer Ticker views, selecting the corresponding P/L or closed-trade ranking from highest to lowest.
