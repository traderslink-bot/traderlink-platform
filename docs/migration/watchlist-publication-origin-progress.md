# Watchlist publication origin correction

## Status

Source implemented and focused checks passed. Deployment held at owner request.
Parents: Runtime `0404560efca8aac3e199e82dd6e1f45a02bd4f75`, Platform `bb4b4c65dd5e183a2a04041aea541e5d91afffb3`.

## Contract and implementation

- Public listing Added and detail Posted time are first user-facing publication, not admin activation or analysis generation.
- Runtime supplies the latest valid available entry quote on first approved analysis publication, ticker-only publication and direct activation publication.
- Platform captures the time when that first publication reaches its public store. Durable delivery delays therefore do not turn approval time into public-post time.
- Header price has its own immutable publication record; it no longer borrows Potential Gain or analysis-reference price. This is the latest available quote, not a guarantee of a real-time tick while markets are closed.
- Analysis updates, duplicate delivery, startup snapshots, category moves and ticker-data updates preserve the original record. A genuine removal/new activation resets it unless existing-publication preservation is explicitly requested.
- Analysis contents/reference price and Potential Gain price calculations are not changed. First publication time is now also the common listing-origin timestamp.
- Existing JSON state stores the optional publication record; no migration. Legacy entries keep their saved dates. Without an independently saved original publication price, the header omits that price rather than substituting an analysis price. No historical backfill or production data mutation was performed.

## Verification

`node src/scripts/verify-watchlist-publication-origin.cjs` passed: modified TS/TSX syntax; actual store merge behavior for first publish, retries, moves, refreshes, removal/re-add, preservation; invalid prices; legacy behavior; Runtime quote helper and all three publication paths. No provider calls, OpenAI requests, Discord messages, local server, broad suite or build.

Help updated in the same source package. Hosted build, browser and real-publication verification remain pending release. Keep this cumulative with the prior pending checkbox, cleanup, global auto-notification and failure/recovery-display slices. IPDN resistance work remains separate and incomplete.
