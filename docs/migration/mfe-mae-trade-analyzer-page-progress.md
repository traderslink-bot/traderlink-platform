# MFE & MAE Trade Analyzer Page

**Status:** Complete — owner visually approved on 2026-08-10
**Scope:** `/analytics/trade-analyzer/day/mfe-mae`

## Purpose

Give traders one focused long-term MFE & MAE page without adding per-trade
analytics controls to the Day Trade Tracker. The page studies saved Moomoo
one-minute candle facts for completed Day trades, then keeps the individual
entry/add evidence available in a bounded, paginated table.

## Controlled inventory

1. Add a clearly labelled **MFE & MAE** Trade Analyzer route and sidebar/capability navigation.
2. Use only the current account-scoped, versioned Daily Trade Analyzer facts:
   entry/add price, direction, favorable/adverse movement until flat, measured
   minutes and the already selected Journal result/currency.
3. Present complete-population average and median favorable/adverse movement,
   including percentage-of-entry-price comparisons.
4. Present small fixed comparison groups for entry versus add and long versus
   short. Do not infer setup, intent, tick sequence, order-book behavior or
   an exact intraminute high/low order.
5. Present individual measured entries/adds with ticker filtering and client
   pagination. Never truncate the population or render an unbounded long list.
6. Add the corresponding Help Center guide and keep existing Analyzer guidance
   aligned.

## Boundary and acceptance

- MFE/MAE remains a per-entry/add price excursion based on saved one-minute
  Moomoo candles between the execution and the position becoming flat.
- A candle sharing a fill cannot prove whether its high or low occurred before
  the fill. The existing Analyzer boundary avoids claiming that sequence.
- The page does not change Journal facts, trigger provider calls, write market
  data, add a database migration, or modify the Day Trade Tracker UI.
- The owner approved the Material UI result on 2026-08-10. No Vitest or other
  test suite was run during this design-first implementation.

## Completion record

- Added the dedicated MFE & MAE route, navigation and capability card without
  adding a per-trade line or new controls to the Day Trade Tracker.
- The page uses saved, account-scoped Moomoo one-minute Analyzer facts and
  presents complete-population cards, four fixed comparisons and paginated
  individual entry/add evidence.
- Help Center guidance explains the factual measurement boundary, comparisons,
  filters and pagination.
- Owner visual approval was given before the local review server was shut down.

## Planned files

- `src/modules/level-analysis/server/daily-trade-long-term-analytics-service.ts`
- `app/(dashboard)/analytics/trade-analysis-client.tsx`
- `app/(dashboard)/analytics/trade-analysis-page.tsx`
- `app/(dashboard)/analytics/trade-analyzer/day/mfe-mae/page.tsx`
- `app/dashboard-navigation.ts`
- `src/modules/help/trade-analyzer-guides.ts`
