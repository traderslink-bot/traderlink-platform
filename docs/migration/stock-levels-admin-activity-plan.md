# Stock Levels Admin Activity Plan

**Status:** Owner-approved implementation contract

**Progress:** [Stock Levels Admin Activity Progress](stock-levels-admin-activity-progress.md)

**Owner-approved route:** `/admin/journal/levels`

## Outcome

Add one private owner-only Stock Levels activity page inside the existing
Journal Administration shell. It reports only today's successful Support and
Resistance requests:

- one `Today's generations` total;
- a user table, ordered from most to fewest successful generations today; and
- a clear empty state when no successful generation has been recorded today.

The existing `/admin/journal` namespace remains unchanged. A future
cross-product `/admin/dashboard` decision is explicitly outside this slice.

## Durable record and retention

Migration `0091_platform_stock_levels_activity` adds a small Platform-owned
activity table. A row is written only after `/levels` successfully returns a
map and saves it for the requesting account. It records:

- the Platform user who generated the map;
- the successful-generation time in milliseconds; and
- the centrally calculated New York calendar date used to report today.

It deliberately stores no map snapshot, level rows, raw candles, quote,
ticker, provider result, request body, account UUID in a browser response, or
other user content. The table is pruned during successful generation and
owner-admin read paths, so rows older than three days are deleted. `Today` is
computed centrally in the `America/New_York` timezone.

Existing quota receipts remain unchanged: they enforce fresh-request limits and
are not used as activity analytics because cache hits and owner-exempt requests
are intentionally absent from that table. Both kinds of successful map request
write this smaller activity record.

## Access and presentation

- Reuse the existing fail-closed Journal Administration page/API authorization:
  current Discord-owner evidence plus the active `journal_owner_admin` grant
  in production, or the existing guarded loopback owner mode locally.
- Reuse the private Journal Administration shell, navigation and no-store
  response conventions. Do not expose this page in normal Dashboard navigation.
- Display the existing Platform user display name and only today's aggregate
  successful-generation count. Do not add user detail links, tickers,
  individual timestamps, maps, exports or drill-downs.
- The page title is `Levels`; no descriptive duplicate title is added.

## Explicit exclusions

- No changes to LevelEngine, canonical Levels runtime, EODHD, Moomoo, Yahoo,
  Watchlist, quotas, Discord access configuration, AI, provider configuration
  or ordinary `/levels` presentation.
- No all-time statistics, ticker ranking, map history, map-detail links,
  failed-request tracking or personal activity export.
- No migration execution, local server, browser automation, test suite, push,
  deployment or Railway action in this implementation checkpoint.

## Acceptance order

1. Register the migration and document the storage/retention boundary without
   executing it.
2. Write and prune the small activity record only after a successful saved map.
3. Add the bounded owner read model and the private `/admin/journal/levels`
   page.
4. Run only source/diff checks, then request owner visual review before any
   broader verification or release handoff.
