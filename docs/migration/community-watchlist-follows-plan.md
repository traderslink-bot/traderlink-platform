# Community Watchlist Follows Plan

**Status:** Owner-authorized implementation in progress

**Parent feature:** [Community Watchlists Plan](community-watchlists-plan.md)

## Outcome

Let a signed-in trader follow one published watchlist and later receive a
useful alert when its owner adds or removes a ticker.

## Current slice

1. Store one durable watchlist-follow relationship per follower and published
   watchlist.
2. Show **Follow Watchlist** beside the title and symbol count. It changes to
   **Unfollow Watchlist** after the saved relationship is created.
3. Show actual ticker symbols in the compact card, limiting the visible strip
   to five and showing the remainder as a compact `N more` chip.
4. Keep ticker-specific tags inside each expanded ticker card; they are not
   compact watchlist-card content.
5. Put the real watchlist update time in the left column beneath the compact
   ticker-symbol strip, not under the profile.
6. Keep the compact ticker fact order as M/C, O/S, Country, Industry, with
   full Country and Industry labels where the facts are shown.
7. Collect one freeform **Trader's take** note per ticker rather than directing
   the trader to split it into a reason and a plan.
8. Give only the owner an **Edit watchlist** mode. Its list-level add-ticker
   control sits outside ticker cards; description, Trader's take and ticker-tag
   editing stay with the content they change.

## Boundaries

- This follows a **watchlist**, not its owner. Future profile following uses a
  separate relationship and separate UI.
- No follower count or social ranking is shown.
- Ticker add/remove alerts are deferred until the owner editor can add and
  remove tickers. The follow relation is intentionally the durable recipient
  source for that next slice; no notification is faked before those events
  exist.
- Existing ticker-tag edits continue to update the truthful watchlist update
  time, but do not notify followers.
