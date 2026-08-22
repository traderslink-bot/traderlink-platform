# TradersLink Market Scanner Plan

## Owner direction

TradersLink will provide two distinct stock-scanning experiences:

1. **TradersLink Scanners** give every user ready-to-use screens without
   requiring them to understand or choose technical values.
2. **My Scanners** lets a user later create, save and share their own screens.

This plan delivers the first experience now. The visible builder remains the
unsaved starting point for the later My Scanners experience. Links AI is
explicitly out of scope for this work.

## First visual slice

Add a new `/scanner` dashboard page with two clear choices:

1. **TradersLink Scanners** are one-click, ready-to-run U.S. screens. They are
   a growing library across market activity, price and volume, moving averages,
   momentum, chart patterns, fundamentals and options. Each has an explicit
   market-data condition/sort mapping and runs through the same protected
   result path as the custom builder.
2. **My Scanner** is the unrestricted filter builder. It covers
   available market, fundamental, indicator, candle/chart-pattern,
   sentiment/ownership, broker-holding and option conditions. Traders may
   combine conditions, choose their bounds/timeframes where applicable, remove
   them, and choose a sort order. It does not yet save a scanner.

When result data is added, the page must show a result count, exact
last-updated time, a normal Refresh action and a responsive table limited to
the most useful first 25 matches, with optional 50 and 100 rows. Only factual
market-data values may be presented; no fixture, zero, stale placeholder
or inferred financial value is a result.

A trader may adjust a ready-to-run screen in My Scanner before results run,
but those settings are not saved as a personal scanner in this slice. It must not
pretend that users have already created scanners, watchlists, shares or
alerts. The page has no generic title subtitle or introductory scope labels;
each control explains itself where a trader needs it.

During the owner test period, Scanner access is limited server-side to the
owner's stable signed-in identity stored in protected hosted configuration.
The mutable display name is never an access control input. The same gate must
hide the navigation entry and reject direct route access for every other
account; it is removed or expanded deliberately before beta access opens.

## Data and refresh boundary

The initial data adapter is server-side and uses the existing secure market
data connection. Provider credentials stay server-side. The browser receives
only the display fields used by the scanner.

The screen will use the connected market-data provider's screening capability
and bound the displayed page to 25 rows. The target experience is fresh scanner
results every 60 seconds while a user is actively viewing the page, with
the exact update time always visible. The implementation must use a bounded
server refresh/result cache for equivalent screens rather than requesting the
same screen on every browser render.

The initial slice does not create a permanent provider/tool restriction. It
only adds the data calls needed by the visible Scanner feature.

## Follow-on slices

These are controlling scope, not part of the initial UI build:

1. **My Scanners:** editable saved filters, names and user ownership.
2. **Scanner sharing:** view-only shared screen and saved-result links between
   TradersLink users; no user credential, broker account or token is shared.
3. **TradersLink Watchlists:** visual personal lists, read-only sharing and
   scanner-to-watchlist actions.
4. **Market Calendar:** a market-events layer inside Calendar, without
   changing Journal trading facts.
5. **Weekly notice and alerts:** an upcoming-week Sunday notice plus
   deduplicated scanner/watchlist pattern alerts.

## Acceptance checkpoints

- Owner visual approval of the first Scanner page is requested only when the
  owner explicitly asks for it before a deployment. Otherwise, a completed
  focused slice may proceed to the normal release and owner testing boundary.
- The page must retain the approved light Material dashboard shell and a clear
  Scanner navigation entry.
- Live values must be clearly unavailable when the market-data connection cannot
  provide results; no financial values are fabricated.
- A focused TypeScript/lint/static route check may follow the accepted visual
  slice. Broad tests, production deployment and provider configuration changes
  are outside this plan unless separately authorized.
