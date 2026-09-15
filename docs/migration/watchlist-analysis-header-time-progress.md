# Watchlist analysis header time

## September 15 owner correction

Controlling scope: [Watchlist runtime dashboard admin plan](watchlist-runtime-dashboard-admin-plan.md).

- Full analysis header order: TradersLink Analysis, ticker trade preparation,
  session + saved first-post time in ET + analysis price, then bias.
- Preserve existing typography and section controls. A draft without a public
  first-post timestamp uses its saved generation time; no invented posting time.
- No change to the Simple card, AI payload, approval, Discord images or delivery.
- Existing Help already explains the posted analysis price and distinguishes
  candle data timestamps from page-load time; no guide change is needed for
  this ordering correction.

## Indicator diagnosis (read-only; not fixed in this slice)

Production VEEA refresh audits show the 5m selection alternating between current
Yahoo history and Moomoo history ending at 7:20 AM ET. The latter is accepted as
sufficient history and replaces newer results. This is not the addition time.
The stored first public-post timestamp for this activation is 9:00 AM ET.
Future correction must prevent provider switching from regressing dataThrough,
while retaining original timestamps when neither provider has fresh data.

## Verification / release

- Targeted TSX transpilation and header-order/timezone assertions passed.
- No AI/provider requests, database mutations, Discord sends, server, broad test
  suite or build were performed for this correction.
- Local immutable header-only commit based on production 16bc8de; unrelated
  worktree changes excluded. Rendered acceptance and production release pending.
