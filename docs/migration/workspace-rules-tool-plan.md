# Workspace Rules tool plan

## Purpose

Move the trader-facing Rules experience into Workspace without creating a
second rule system. The existing `/rules` and `/rules/results` routes remain
valid direct links, but Workspace becomes the normal place to create, select,
edit, and review rules.

Progress is tracked in
[workspace-rules-tool-progress.md](./workspace-rules-tool-progress.md).

## Owner-requested experience

1. The Workspace **+ Rules** action opens a wide, right-side Rules panel. It
   fills the available Workspace area on desktop and the mobile viewport on
   small screens; it is a feature panel, not a second application sidebar.
2. The panel has four views matching the Rules experience:
   **Trading Rules**, **Browse presets**, **Create custom**, and
   **Rules results**.
3. Each view reuses the established rule-management and factual-results
   behavior. Preset rules remain automatically evaluated and custom rules
   remain explicit trader selections; no rule outcome is reinterpreted.
4. The ordinary left navigation no longer lists the Rules group. Existing
   `/rules` and `/rules/results` URLs remain available for saved links and
   direct access.
5. A trader can optionally show a Workspace card for the currently selected
   Workspace period (Today, This week, This month, or All time). The card
   reports the count of **Rules broken**, shows a bounded set of recent broken
   rule titles, and opens the panel directly to **Rules results**.

## Data and performance boundary

- The panel loads only after **+ Rules** is selected. It reads the existing
  account-scoped Rules dashboard and Rule Results models.
- The Workspace card receives a bounded server-derived summary for the same
  dates as the Workspace period. It does not scan browser trade history or
  manufacture a result when rule facts are unavailable.
- Result language retains the existing factual distinction between automatic
  preset checks and saved manual selections. A missing manual selection remains
  **Not selected**, not a broken rule.
- The card visibility choice is stored per selected Journal account and can be
  changed in the Rules panel.

## Implementation steps

1. Extract panel-safe reusable bodies from the existing Rules and Rule Results
   clients while leaving their standalone routes intact.
2. Add the account-scoped, lazy Workspace Rules panel and its four responsive
   views.
3. Add the persisted optional Workspace results-card preference and a bounded
   date-range summary read model.
4. Wire **+ Rules**, card-to-results navigation, and removal of the regular
   left-navigation Rules group.
5. Review dark/light token usage, direct routes, mobile panel behavior, and
   source-level safeguards before owner visual review.

## Out of scope

- New rule types, altered preset detection, altered manual-rule records, or
  changes to the Daily Trade Tracker rule workflow.
- A global tools navigation or a general Workspace card-customization system.
  This slice establishes an isolated, reusable Rules tool boundary only.
- A production release. Release remains a separate owner and Coordinator
  decision after visual approval.
