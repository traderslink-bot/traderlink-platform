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
     when the canonical article publisher emits a scanner update, without a
     page refresh. When a browser resumes the tab after pausing the live
     connection, refresh immediately on return. The connection exists only
     while the card is visible and closes when it unmounts; no periodic
     browser polling is used.

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
- The refresh uses one authenticated Server-Sent Events connection only for a
  user-enabled compact card. The original scanner remains the sole publisher;
  it persists an article first, then broadcasts an update signal. The client
  reads the saved scanner feed after that signal and never receives a second
  direct article feed from the scanner computer.
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
