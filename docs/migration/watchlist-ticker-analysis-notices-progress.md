# Watchlist ticker analysis notices

## Owner-approved top-notice follow-up — 2026-09-10

Append only: "If a full analysis is not available, the support and resistance
levels shown can still help you plan your setup." Exact production parent
01301a061496368bb5660eef1e82ddf01f0ac907; no layout, lower/listing notice,
data, migration, runtime or configuration changes. Rendered acceptance pending.

Status: source implementation updated; rendered acceptance and release pending.

- Owner replaced the top-left ticker-detail guidance with the approved active
  stocks/volume-and-attention wording. The after-Company Info notice retains
  the original Watchlist analysis notice.
- The visible AI card label is now `TradersLink Analysis`; stored AI Read data
  names and runtime controls remain unchanged.
- When Potential Gain is hidden, desktop grid placement moves Company Info to
  its left-column position and the after-Company Info notice to the right
  column. Mobile remains the existing one-column order.
- Both notices retain the existing `academy-card watchlist-notice-card`
  styling and paragraph typography. Listing notice wording and Potential Path
  remain unchanged.
- Existing unrelated changes in this worktree were preserved. No tests, build,
  server, commit, deployment or hosted action performed in this slice.
- Help review: no workflow changes; no guide text change required.
- Desktop/mobile rendered verification remains pending; source reuse alone
  does not establish visual acceptance.

## Preserved previous release record

Status: source reconciled; rendered acceptance and release pending.

- Owner requested the identical supplied paragraph directly below the large
  ticker heading and immediately after Company Info on ticker details.
- Both placements reuse WatchlistAnalysisNotice and existing listing notice
  academy-card/watchlist-notice-card styles. Listing copy is unchanged.
- Country-only warning is restored without catalyst inference or suppression.
- Release parent: fa7c1eaf4d0e7b5f177d12061f2c46f4c3177621.
- Temporary-index candidate excludes mixed Stock Titan/source-policy work and
  preserves existing parent documentation. Recaps remains separate.
- Static transpilation and diff whitespace checks passed; no tests, builds,
  servers, migration or hosted action. Integrated desktop/mobile Light/Dark
  rendered QA remains outstanding. Help workflow is unchanged.
