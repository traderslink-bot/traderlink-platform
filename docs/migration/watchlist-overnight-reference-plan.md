# Watchlist overnight level reference

Owner-approved 2026-09-24. Preparation only; Coordinator owns eventual release.

## Scope and contract

- One Moomoo Open API direct quote on each overnight ticker activation; no candles, subscription, timer, AI request, or notification.
- Use the existing configured-owner server-only quote access and publisher-authenticated runtime bridge. Never return OAuth credentials.
- Direct `POST /api/v1.0/quote/stock-quote` returns `overnight.price`; owner verified CPOP 5.12 and VRME 1.42 in the 00:58 ET diagnostic.
- Provider top-level `data_time` was regular-close time: record retrieval time as **Checked**, never as overnight last-trade time.
- Potential Path only: select/reclassify historical levels and their distances against this price. Do not alter analysis reference/history, indicator candles, potential-gain baseline, notes, approval, or delivery.
- Persist per-activation reference/attempt so restart/retries do not continuously request quotes. Removal/re-add must not reuse the old activation's price.
- Missing/failed quote never blocks activation or owner publication; retain existing level behavior without an overnight-price claim.
- Ignore older postmarket prices for the overnight level reference. Clear only on an actual newer supported-session price, not merely when the clock reaches 04:00. First fresh premarket price refreshes levels and removes the note.
- Indicators remain untouched, using their existing completed-session candles and update time.

## Approved UI

Small blue information strip below the Potential Path title, above levels, light/dark compatible and mobile wrapping:

**Overnight price: $5.12 · Checked 12:58 AM ET**

Levels use this fixed price until live updates resume in premarket.

Suppress conflicting live-delay wording while this reference is in use. No popup, page-wide alert, or new user control.

## Verification checkpoint

Focused fixtures: direct quote parsing/null/zero/foreign symbol/errors; overnight weekday/midnight/DST/weekend session eligibility; one call per activation; restart persistence; cancellation/re-add races; no activation block on failure; older-price retention; first fresh premarket release; full levels/percentage reference consistency; UI copy/time/no seconds/mobile/dark styles; no changed indicator/AI/notification behavior.

Update Help for this price behavior. Package narrow immutable-parent commits: Platform 2c1e4337 and runtime 592e234, rechecked by Coordinator before release. No database migration planned. See [progress](watchlist-overnight-reference-progress.md).
