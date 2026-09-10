# Expanded profit-zone lists

Owner request: paginate expanded zone trades with a minimum page size of 20,
keep profit-taking trades first, then sort no-profit trades by opportunity dollars.

- [x] Independent page and page-size state per zone; 20 default, 50 and 100 options.
- [x] Pagination below each nonempty expanded list, outside its row grid.
- [x] Sort all records before pagination; no-profit trades sort by descending
  exact decimal opportunity, with date, symbol and trade ID as stable tie-breakers.
- [x] Keep existing page-size options for other Analyzer tables.
- [x] Keep full-zone totals independent of visible page, retain default +20%
  expansion and the existing component remount on date/direction/hold changes.
- [x] Review source and whitespace. No tests or local app build run.
- [ ] Owner rendered review; production handoff requires separate authorization.

## Missed opportunity correction: owner approved

The former no-profit group included trades that continued higher. The owner
approved separating potential profit missed in a drop from simply not selling
in a zone, while retaining the existing compact chart layout.

- [x] Missed opportunity requires no profitable exit in the zone and a drop
  below it before the next zone was reached, during the original open position.
- [x] Sum each trade's highest actual-price, open-share Gross profit in that
  zone before the first drop. Never use later recovery/add quantities for it.
- [x] Identify recovery to the zone or higher while the position remains open;
  a later re-entry is not counted as a recovery of a closed position.
- [x] Preserve all no-profit trades and the three exclusive Next Move outcomes.
- [x] Split pre-drop opportunity dollars into recovered and never-recovered
  groups. Show counts and dollars on two compact lines in the existing column.
  The groups partition the total; their dollars describe the earlier opportunity,
  not the amount of dollars recovered. A separate profit-given-back metric was
  discussed but is not included in this change.
- [x] Show actual missed-opportunity dollars in affected trade rows and sort
  those no-profit trades first by missed dollars, then by general zone opportunity.
- [x] Keep column widths, font sizes, gradients and expansion layout. Add only
  compact supporting recovery text and expand existing tooltips.
- [x] Currency conversion covers the new dollar field. Version only Scaling
  Out's saved offline view key so old totals are not reused as new totals.
- [x] Focused TypeScript, ESLint and whitespace checks pass for the calculation,
  presentation, pagination and offline contract. Source review confirms exact
  currency scaling, unchanged grid widths and before-drop dollar boundaries.
- [ ] Rendered review after a separately authorized release.
