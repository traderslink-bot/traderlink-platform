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
3. Show the real watchlist update time, not an inferred activity signal.
4. Keep the compact desktop status at the far right of the card and use the
   unambiguous mobile wording **Watchlist updated ...** beneath the profile.

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
