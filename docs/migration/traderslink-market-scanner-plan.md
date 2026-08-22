# TradersLink Market Scanner Plan

## Owner direction

TradersLink will provide two distinct stock-scanning experiences:

1. **TradersLink Scanners** give every user ready-to-use screens without
   requiring them to understand or choose technical values.
2. **My Scanners** lets a user later create, save and share their own screens.

This plan begins with the first experience only. Links AI is explicitly out of
scope for this work.

## First visual slice

Add a new `/scanner` dashboard page titled **Scanner**. It starts with U.S.
stocks and has one selected ready-to-use TradersLink scanner. The page shows:

- a clear scanner picker for TradersLink-provided screens;
- an unrestricted Moomoo filter builder. It must cover available market,
  fundamental, indicator, candle/chart-pattern, sentiment/ownership, broker
  holdings and option conditions. Traders may combine conditions, choose their
  bounds/timeframes where applicable, remove them, and choose a sort order;
- a result count, the exact last-updated time and a normal Refresh action;
- a responsive table limited to the most useful first 25 matches, with an
  optional 50 and 100 rows; and
- only factual Moomoo-returned values. No fixture, zero, stale placeholder or
  inferred financial value can be presented as a result.

The first UI must make the difference between a selected ready-to-use screen
and future personal saved screens obvious. A trader may adjust the visible
screen settings before results run, but those settings are not saved as a
personal scanner in this slice. It must not pretend that users have already
created scanners, watchlists, shares or alerts.

## Data and refresh boundary

The initial data adapter is server-side and uses the existing secure Moomoo
OAuth connection. Tokens stay server-side. The browser receives only the
display fields used by the scanner.

The screen will use Moomoo's unrestricted market screening capability and
bound the displayed page to 25 rows. The target experience is fresh scanner
results every 10 to 30 seconds while a user is actively viewing the page, with
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

- Owner visual approval of the first Scanner page before the product is called
  complete or personal-scanner work begins.
- The page must retain the approved light Material dashboard shell and a clear
  Scanner navigation entry.
- Live values must be clearly unavailable when the Moomoo connection cannot
  provide results; no financial values are fabricated.
- A focused TypeScript/lint/static route check may follow the accepted visual
  slice. Broad tests, production deployment and provider configuration changes
  are outside this plan unless separately authorized.
