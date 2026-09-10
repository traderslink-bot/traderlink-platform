# Scaling Out tooltip review

Owner requested plain-language wording across main chart, expanded zone lists,
comparison summary/details and both instances of the Scaling behavior table.

- [x] Main chart: gain threshold, reached denominator, profitable-exit dollars,
  mutually exclusive trade exit groups, partial-closing subset, missed dollars,
  recovery split, no-profit Next move denominator and median candle-close time.
- [x] Expanded lists: first reach timestamp source, capped Zone opportunity vs
  pre-drop Missed opportunity, share snapshot timing, position-cycle Next move,
  total zone time and whole-trade final P/L.
- [x] Comparison tables: first recorded in-band price, same-trade actual P/L,
  prior realized gains/losses included, later executions excluded from scenario,
  skipped bands, signed difference, reporting currency and non-additive rows.
- [x] Both sustained-level table instances: gain/time rule separate from main
  chart; profit-share and profit-dollar window ends at first red after qualifying
  or trade finish; quantity ratio basis; remaining-share snapshot; later exits.
- [x] Focused TypeScript / ESLint / whitespace review passes. An intermediate
  editing error removed chart markup; static checks caught it, the original
  markup was restored, and the final diff was checked as wording-only.
- [ ] Owner visual acceptance and separately authorized production release.

Copy-only: no metric definitions, populations, prices, amounts, layout or
pagination changed. Help documentation remains deferred pending page acceptance.

## Owner-requested P/L colors

- Added sign-based green/red to potential, actual and difference cells in the
  zone comparison summary and its trade details (all zones, not just 20%).
- Scaling behavior already colored potential/actual/profit taken by sign;
  changed its opportunity-gap color from inverted to the same positive-green,
  negative-red rule requested by the owner.
- Zero and missing comparison values stay neutral. No financial math changed.
- Focused TypeScript, ESLint and whitespace checks pass; rendered review and
  deployment pending.
