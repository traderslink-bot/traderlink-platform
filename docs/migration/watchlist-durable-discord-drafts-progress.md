# Durable owner-edited Discord post drafts

Related plan: [Watchlist admin](watchlist-runtime-dashboard-admin-plan.md).

## Approved scope and implementation

- Store owner-saved text in the existing Runtime durable directory, using atomic file replacement; no schema migration.
- Separate by symbol, activation cycle, post kind and move destination. Analysis drafts follow the original analysis across owner edits, not the changing edit revision. A new AI-generated analysis gets a fresh draft.
- Editor Save text confirms persistence. Close without saving does not commit edits; unsaved input explicitly says to select Save text. Reset to generated text durably removes the override.
- Existing authenticated owner route gains POST support. No public read endpoint or secrets added.
- Approval, ticker-only publication and category moves resolve the stored draft on the server. Existing delivery snapshots/retries remain unchanged.
- Version checks prevent stale editor windows from overwriting newer saved text. Corrupt/unreadable storage does not silently substitute generated text.
- Saving/resetting never publishes or notifies. Existing links and configured mentions remain controlled by existing delivery rules.
- Saved drafts remain until replaced/reset; distinct new-generation/cycle keys prevent reuse for unrelated analyses or re-added tickers.

## Verification

Focused local verification passed: persistence across new store instances, reload, separate kinds/destinations/cycles/generations, edit-stable identity, stale-write rejection, reset tombstone, owner authorization, exact saved text passed to all three send handlers, generated browser script parse and TypeScript transpile.

No broad test suite, build, local server, real Discord posts or paid AI calls. Full hosted acceptance remains pending the coordinated release: save/reload/reopen, edit analysis/reopen, distinct ticker/analysis/move text, reset. Do not send notifications merely for verification without explicit authorization.

Release ordering: Platform POST allowlist and Help first, then Runtime durable storage/API/editor. Existing unsaved browser-memory text cannot be recovered after the tab has already reloaded. No migration, environment variable or existing publication backfill required.
