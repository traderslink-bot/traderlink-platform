# Watchlist AI News Source Policy Plan

**Status:** Owner-approved implementation in progress

**Related runtime record:** [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md)

## Approved behavior

1. The Watchlist runtime asks Platform for one authenticated, canonical
   TradersLink-processed article for the exact ticker and America/New_York
   target session date. The target must be a New York weekday.
2. Platform prefers that session's article. If none qualifies, it may return
   the newest eligible article from the inclusive five-weekday window ending
   on that target date. The response states whether it is current-day or
   older-within-window and gives the factual New York publication date.
3. The response supplies only the current immutable Platform article identity,
   revision, content SHA-256, public TradersLink URL, processed content and
   factual article fields. It never exposes publisher diagnostics, raw
   payloads, private upstream URLs, user data or credentials.
4. An authenticated `404 no_eligible_article` is the only Platform response
   that permits the runtime's legacy Stock Titan fallback. Authentication,
   validation, storage and contract failures are unavailable, not fallback.
5. The member-facing Watchlist never displays Stock Titan names, URLs, source
   rows or source-attribution text. When an older eligible TradersLink article
   supports the AI read, the detail card states `Older article: [date]`.

## Boundaries

- Platform does not start, configure or modify the Watchlist publisher/ingest
  runtime, entitlements, Watchlist data or hosted configuration.
- This endpoint is protected by the existing Watchlist publisher bearer token
  and is uncached.
- Platform may return protected canonical processed content to that runtime.
  The owner confirmed on 2026-09-08 that the runtime sends that full processed
  article to the AI request when Platform returns an eligible article.
- No Help Center workflow changes are needed: the application has no public
  Watchlist Help guide that documents AI source selection.

## Verification boundary

- Add focused source-selection coverage for current-day preference, the
  inclusive five-weekday window and the no-eligible result.
- Do not run a local server, Vitest, a broad test suite, build, migration,
  deployment or hosted action in this low-resource implementation checkpoint.
