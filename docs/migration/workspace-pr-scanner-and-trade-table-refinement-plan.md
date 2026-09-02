# Workspace PR Scanner and Trade Table Refinement Plan

## Purpose

Polish the Workspace PR Scanner in Navy Dark mode and make the Workspace trade
table easier to scan, interpret, and sort without creating a second news feed
or client-only partial-table ordering.

Progress is tracked in
[workspace-pr-scanner-and-trade-table-refinement-progress.md](./workspace-pr-scanner-and-trade-table-refinement-progress.md).

## Owner-approved scope

1. **PR Scanner panel and card**
   - Use readable white text in Navy Dark mode for the panel heading, display
     choice, article titles, and actions.
   - Make stock symbols visually distinct in both the large panel and compact
     card.
   - Rename the archive action to `All press releases`; scanner articles remain
     the current panel's content and continue opening the Workspace article
     drawer.
   - Refresh the compact card from its existing same-origin scanner endpoint
     while it is visible, without requiring a page refresh. The refresh must
     be bounded and must stop when the card unmounts.

2. **Workspace actions**
   - Add the requested tooltip to Rules and PR Scanner.
   - Add the Newspaper icon to the PR Scanner action.

3. **Trade table**
   - Keep realized gain/loss semantically green or red in both desktop and
     mobile rows.
   - Show a distinct Analyzer action state only when a current saved Analyzer
     result exists for the displayed trade version.
   - Increase the desktop header weight and size.
   - Add clear ascending/descending sort controls to every data column. Actions
     stays an action column rather than a fabricated sort field.
   - Preserve bounded server-side pagination and cursor correctness for every
     sort; never sort only the first loaded page in the browser.

## Data and performance boundaries

- The compact scanner uses the existing authenticated endpoint with no new
  news source, article storage, or write behavior.
- The refresh is interval-based and only mounted for a user-enabled compact
  card. It is not a background process.
- Analyzer indication is read-only and only recognizes the current saved
  analysis that matches the current trade version. It does not run an analyzer,
  request market data, or claim a pending/failed analysis is ready.
- Sorting derives from the existing projection data and Journal version facts;
  no migration or stored projection rewrite is allowed.

## Verification

- Run focused source checks for the scanner refresh cleanup, dark appearance,
  Analyzer-current predicate, allowed sort contract, keyset cursor handling,
  and `git diff --check`.
- Do not start a local server, run a broad suite, run migrations, or touch
  account data under the low-resource working policy.
- Owner visual review remains required for the refreshed card and table
  controls.
