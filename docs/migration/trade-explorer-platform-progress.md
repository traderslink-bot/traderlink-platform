# Trade Explorer Progress

**Status:** Explorer 1 active. The owner approved implementation on 2026-08-04.

**Controlling plan:** [Trade Explorer Plan](trade-explorer-platform-plan.md)

## Current checkpoint

The owner requested a full-capability Trade Explorer where traders can filter
and inspect the trades and statistics their confirmed Journal facts support,
rather than a reduced replacement of the legacy V3 Explorer. Period comparison
is a separate optional tool.

The planning audit confirmed that the active replacement already provides the
foundation for the first Explorer slice: exact completed-round-trip analytics,
gross/net basis, metrics including win rate, profit factor, expectancy and
medians, bounded evidence, date/instrument/direction/provenance/outcome/time/
size/holding filters, and accepted groupings. The future page will reuse that
foundation rather than copy V3 calculation code.

Explorer 1 now has the replacement route/service/action/client construction in
progress. It uses the active Journal Analytics service and exact metric
registry; it does not create a database migration, provider request or V3
dependency. The first live view supports actual date, currency, ticker,
direction, day-trade status, outcome, weekday, entry-time, holding-time and
size filters together with real grouped results. The primary interaction now
shows the actual matching trades directly beneath the filters, and the Result
filter narrows that list to wins, losses or flat trades. Pre-market,
regular-hours and post-market selectors remain planned until their
exchange-session fact contract is accepted.

The owner review replaced the mixed metric selector with factual result-table
families. The live first draft now offers Trades, Trading Days, Tickers, Entry
Times, Holding Time, Position Size and Periods. Each grouped view has its own
columns and client-side highest/lowest sorting over the returned groups. The
Trades view shows shares, weighted average entry and exit prices, total entry
amount, P/L, return, holding time and execution count with bounded pagination.
Red-to-green and green-to-red now appear only as day movement in Trading Days.
The incomplete comparison UI is withheld pending later focused review.

The view-family revision retains the useful analytics catalog through a
contextual Statistic selector instead of hiding it. Trade and grouped views
offer trade statistics; Trading Days offers daily-result and daily-movement
statistics. A selected grouped statistic becomes a sortable table column. The
initial page read no longer calculates and discards a separate Analytics Lab
preview before calculating the Explorer result.

Trade rows now expand in place to show their execution time, side, shares and
price. The interaction keeps at most one row open: selecting a different trade
closes the first, while selecting the open trade again hides its executions.
The detail read reuses the existing owner/account-scoped Journal endpoint and
does not reload the full Explorer result.

The execution detail is presented as a compact nested table instead of
stretching across the full result width. Trade-result count statistics now
apply their matching win, loss or flat filter to the Trades list and its
pagination, and the redundant total-trades badge was removed.

The selector audit also aligned winner/loser-specific averages and holding-time
statistics with their matching trade populations. Profitable, losing, flat,
red-to-green and green-to-red trading-day counts now list only the matching
days. Scale-in and scale-out counts are withheld from the Explorer selector
until a complete matching-trade filter and pagination contract is available.

## Next action after plan approval

Complete Explorer 1's visual and interaction check, then add the next accepted
fact family without placeholder controls.
