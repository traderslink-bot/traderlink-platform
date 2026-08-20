# Analytics Timing Reliability Progress

**Status:** Committed locally; owner visual review and focused verification pending
**Controlling plan:** [Analytics Page Architecture Plan](analytics-pages-architecture-plan.md)
**Route:** `/analytics/timing`

## Owner-approved scope

Keep the existing timing charts and measure selector. Make the raw selected
measure honest, then add separate repeatability evidence for entry and exit
time ranges so a single unusually large winner cannot be presented as the best
time to trade.

## Implemented behavior

- The former `Best` label now names the actual selected measure, such as
  `Highest total P/L`, `Highest average P/L`, `Highest win rate` or `Most
  trades`, and displays the matching value under the card title.
- Entry and exit buckets now name their full 30-minute range.
- The page requests existing Journal Analytics median P/L and largest-trade
  facts alongside its existing Net P/L, average P/L, win-rate and trade-count
  facts. No schema, import, Journal data or calculation-engine change is made.
- `Most reliable entry time` and `Most reliable exit time` require at least 10
  complete completed trades, positive median P/L, a win rate above 50%, and a
  positive remaining P/L after the largest winning trade is removed.
- Eligible ranges rank by sample-adjusted average P/L, then median P/L, win
  rate and completed-trade count. The displayed evidence gives the count, win
  rate and typical P/L.
- When no range qualifies, the page plainly says that more repeated trades are
  needed instead of manufacturing a winner.
- The existing line and bar selectors continue to draw the same factual timing
  data. The time-range labels now have enough room to show both the start and
  end time in the default horizontal-bar view.
- Core Analytics Help now explains the distinction between the highest raw
  total and the reliable historical result.

## Review boundary

- The current dirty working tree includes unrelated concurrent work. This
  slice changes only the Timing client/page, its Help text, this record and the
  dedicated Timing section in the controlling plan.
- No tests, database writes, migrations, process changes, push or deployment
  were run during the initial design/owner-review pass.
- The owner requested a narrow local commit before focused verification. Owner
  visual review remains required before this slice is accepted.
