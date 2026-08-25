# TradersLink Market Scanner Plan

## Owner direction

TradersLink will provide two distinct stock-scanning experiences:

1. **TradersLink Scanners** is the community discovery home. It contains
   TradersLink-created screens and screens shared by other TradersLink users.
   Everyone can browse it, filter it by scanner conditions and broader
   categories such as Momentum, and rate useful screens.
2. **My Scanners** is a private personal collection. A trader creates their
   own scanners here or adds a community screen to their collection. Their
   saved version remains theirs even when the community source changes.

The current owner-only Scanner is the data and builder foundation for these
experiences. The future public Scanner home and My Scanners collection must be
designed as separate pages before their routes, sharing model or ratings are
implemented. Links AI is explicitly out of scope for this work.

## First visual slice

The current `/scanner` route is a testing foundation with a growing
ready-to-run library and filter builder. The later public route architecture
will be reviewed before implementation; the intended product is a Scanner home
for community discovery plus a separate My Scanners collection.

The starter library uses two clear choices:

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

The ready-to-run library must not fill the top of the Scanner page. The filter
builder is the main workspace. A clear Scanner library action opens a closable
right-side drawer on desktop and a closable temporary drawer on phones. Every
library category stays visible as an expandable heading with its screen count;
only the selected category exposes its screen actions. Choosing a screen loads
its conditions into the builder and closes the phone drawer so the trader can
inspect or adjust it.

When result data is added, the page must show a result count, exact
last-updated time, a normal Refresh action and a responsive table limited to
the most useful first 25 matches, with optional 50 and 100 rows. Only factual
market-data values may be presented; no fixture, zero, stale placeholder
or inferred financial value is a result.

A trader may adjust a ready-to-run screen in the filter builder before results
run, but those settings are not saved as a personal scanner in this slice. It
must not pretend that users have already created scanners, watchlists, shares
or alerts. The page has no generic title subtitle or introductory scope labels;
each control explains itself where a trader needs it.

During the owner test period, Scanner access is limited server-side to the
owner-selected stable signed-in identities stored in protected hosted
configuration. The mutable display name and Discord server ownership are never
access-control inputs. The same gate must hide the navigation entry and reject
direct route access for every other account; it is removed or expanded
deliberately before beta access opens.

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

Implementation order is Community Scanner home, My Scanners collection and
sharing, then ratings/discovery filters. Scanner alerts are deliberately
deferred until those ownership and shared-result boundaries are live.

1. **Community Scanner home:** public TradersLink Scanner pages with condition
   filters and broad category browsing. Trader-created public screens can be
   rated; ratings must be account-scoped and one rating per user per scanner.
2. **My Scanners:** editable saved filters, names, user ownership and a private
   collection action for community screens.
3. **Scanner sharing:** a shared scanner exposes its definition and current
   factual results only. It never exposes the creator's market-data connection,
   token, broker information or private collection.
4. **TradersLink Watchlists:** visual personal lists, read-only sharing and
   scanner-to-watchlist actions.
5. **Market Calendar:** a market-events layer inside Calendar, without
   changing Journal trading facts.
6. **Scanner alerts:** the detailed plan and progress boundary is
   [Scanner alerts and mobile progress](./traderslink-scanner-alerts-and-mobile-progress.md).
   Alert evaluation and delivery begin only after the shared scanner,
   collection and account-notification boundaries are accepted.

## Mobile Scanner usability

Mobile is a first-class Scanner acceptance scope, not a squeezed desktop view.
The detailed work record is
[Scanner alerts and mobile progress](./traderslink-scanner-alerts-and-mobile-progress.md).

- Design from 360–390px widths upward without tiny text or undersized targets.
- Keep the ready-to-run library easy to browse by category without turning each
  scanner name into a cramped chip.
- Keep builder controls in full-width, readable rows rather than forcing a
  desktop filter grid onto a phone.
- Replace the wide desktop results table with a phone-specific row layout that
  presents every returned result field across clear compact rows. Desktop keeps
  the comparison table.
- Keep the active scanner, Run scan/Refresh action, match count and exact
  update time visible and usable without horizontal page overflow.

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
