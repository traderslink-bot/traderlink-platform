# Import Repair Accuracy And Bulk Review Progress

Plan: [import-repair-accuracy-and-bulk-review-plan-2026-07-30.md](./import-repair-accuracy-and-bulk-review-plan-2026-07-30.md)

Status: implementation in progress

## Confirmed diagnosis

- The selected April Interactive Brokers statement has 919 retained rows:
  575 accepted stock executions and 344 rows currently classified as skipped.
- Rows 870–875 are accepted YCBD executions.
- Rows 877–1142 are 266 automatically skipped rows. The block begins at a
  statement-section boundary and includes heading-like and FX values such as
  `SYMBOL` and `USD.CAD`; it is not 266 missing-field stock executions.
- Current Import Repair incorrectly counts every skipped row with a warning as
  a row needing review. This violates the visibility-before-restriction rule.
- Current UI combines the canonical timestamp into one `Date and time` field.
  The importer itself supports separate source Date and Time fields; the UI
  presentation must be separated without weakening the canonical timestamp.
- The import history confirms 575 accepted stock executions for the April
  statement. The shared dashboard authority locates the binding, then blocks
  the whole source because it finds open inventory remaining and a starting-
  inventory-as-of violation. This is too broad: it suppresses the accepted
  execution history and any independently usable completed-trade result.
  The repair must keep one shared authority and disclose the limitation only
  on metrics that require the missing opening history; Import Repair must not
  add a second dashboard source or bypass verification.

## Next implementation steps

1. Classify deterministic skipped rows as automatically set aside in the
   repair read model and exclude them from manual-review counts. Implemented;
   pending visual review with the April statement.
2. Add the approved table controls: separate Date/Time, sorting, selection,
   and bulk actions. Implemented; pending visual review.
3. Add the possible-open-position signal with an explicit non-proof label.
4. Ensure the complete source-row inventory is discoverable in Data Decisions,
   including accepted stock executions, without turning accepted rows into
   repair tasks.
5. Present the revised table for owner review before any bulk persistence
   workflow is used against the active statement.
6. Shared dashboard repair: make accepted executions visible through the one
   authority even when opening inventory limits some completed-trade metrics.
   Do not infer the missing opening position or fabricate P/L.
7. After owner approval of the Trades activity table, carry the same shared
   execution scope into Workspace and execution-oriented analytics, then
   review the remaining closed-trade limitations.

## Active shared-authority change

The existing all-or-nothing reconstruction gate is being replaced. Its current
assumption that every ledger begins flat is invalid for ordinary broker
statements and blocks the entire dashboard when an imported statement starts
mid-position. The active repair will retain row-level restrictions while
allowing usable execution and closed-trade results through the one shared
authority.

## 2026-07-30 shared-authority activity restoration

- The shared resolver now reads accepted executions from the already-bound V3
  snapshot authority. It does not create a browser-owned dashboard source or
  bypass the verified authority.
- Currency scope is now derived from accepted execution records rather than
  from the smaller closed-round-trip result set. A statement with accepted
  executions but no provable closed results therefore remains available to
  dashboard activity views.
- The snapshot authority now exposes a compact accepted-execution activity
  projection before the expensive analytical reconstruction. The reconstruction
  is lazy and remains the sole authority for verified P/L analytics.
- The resolver memoizes its verified analytical derivation during a request so
  planning and packet execution do not rebuild the same large statement twice.
- The current immutable binding is reused in memory while its statement
  digests and correction attachment remain unchanged. A new import, correction,
  reset, or statement deletion changes that binding key automatically.
- `/trades/roundtrips` now has an **Accepted executions** activity table with
  separate Date and Time columns, symbol, side, quantity, price, and fee
  coverage. It initially shows the latest 100 rows for local responsiveness;
  the full source inventory remains in Data Decisions.
- Focused ESLint and whitespace checks passed for the changed files. The
  updated local server slice compiled successfully, and the owner confirmed
  that `/trades/roundtrips` successfully displays the activity view: 1,765
  accepted executions across the configured account scope, including 575 from
  the April statement. Numeric dashboard restoration is the current checkpoint.
- Repaired an Analytics Lab median calculation that crashed when an even-sized
  result set had decimal or negative P/L values. The fix retains exact decimal
  arithmetic and does not alter the underlying execution or P/L facts.
- Workspace no longer aborts its verified overview request after 20 seconds.
  It retains its existing calculating state until the shared authority finishes
  or the trader leaves the page, avoiding a false unavailable result on larger
  statement histories.
- Added the two-decimal dashboard display rule to the shared analytics metric
  formatter and accepted-execution activity table. It rounds display only;
  Data Decisions retains exact editable broker values by design.
- Dashboard-only numeric-renderer audit completed: Analytics Lab and Day
  Session already cap display at two decimals; Calendar P/L now retains up to
  two decimal places instead of dropping cents.

## Handoff note: current facts, fixes, and limits

### What the imported data contains

- The configured account currently has **1,765 accepted broker executions**
  across its attached statements. The April statement contributes 575 of those
  executions; it is not the whole account history.
- The April statement has 919 retained rows: 575 accepted stock executions and
  344 non-execution rows. The 266-row block beginning at statement row 877 is
  recognized heading, FX, summary, and other non-stock content, not a request
  for a trader to repair 266 missing trades.
- No re-import is required for the accepted execution activity already visible
  in `/trades/roundtrips`.

### Why the dashboard was blank

- The old shared-authority path rejected the *entire* dataset when a statement
  began while a position was already open. Its blocked reasons were open ending
  inventory and a starting-inventory-as-of violation.
- That approach was too strict for ordinary broker statements: it made valid
  executions disappear even where only a specific P/L conclusion lacked prior
  position evidence.
- Workspace additionally abandoned its overview request after 20 seconds, so
  a long-running but valid verified calculation was shown as unavailable.

### Changes now in `main`

- `bc039ceb` allows verified reconstruction ledgers to remain usable when other
  ledgers are limited, and marks the affected closed-trade capability limited
  instead of blocking unrelated execution activity.
- `445cd712` adds the accepted-execution activity projection to the existing
  fixed V3 authority, makes P/L reconstruction lazy, memoizes the immutable
  authority for an unchanged binding, and connects `/trades/roundtrips`.
  The page shows the latest 100 rows for responsiveness with separate Date and
  Time, Symbol, Side, Quantity, Price, and fee coverage. It intentionally does
  not label every execution a completed trade or show unverified P/L.
- `2f616baf` fixes Analytics Lab median math for decimal and negative values.
- `f5396e73` removes Workspace's premature 20-second overview timeout.

### Verification and remaining risk

- Focused ESLint and whitespace checks passed for each changed slice. The local
  server compiled the accepted-execution view, and the owner confirmed that
  `/trades/roundtrips` displays the 1,765 accepted executions.
- No broad test suite, production build, full regression, or production deploy
  was run. Local source-data and server-log files are intentionally untracked
  and must not be added to Git.
- The first numerical analytics calculation can still be slow on this machine;
  the activity path is intentionally separate and fast. Let Workspace finish
  once without refreshing. Subsequent requests reuse the unchanged binding in
  memory. Do not report all numerical analytics as verified until Workspace and
  the Analytics views have been visually checked with this account.
- A previous Analytics Lab median crash is fixed, but the repaired result needs
  a fresh browser visit before it is claimed as runtime-verified.

### Safe next steps

1. Visually confirm `/workspace` populates its existing metric cards after its
   first calculation, then check `/analytics`, `/analytics/results`, and
   `/analytics/execution` for numbers and clear limitation disclosure.
2. Investigate any remaining slow first-run calculation before expanding table
   size or adding extra analytics calls. Do not make the browser calculate P/L.
3. Continue the planned Import Repair work: possible-open-position signal,
   complete accepted-row discoverability in Data Decisions, then owner review
   before exercising bulk persistence against real statements.
4. At the integration checkpoint, run the planned focused and broader checks
   from canonical `main`; do not use this note as proof of production readiness.

## Implemented in this slice

- A skipped row is now an automatic set-aside when every recorded issue is a
  deterministic non-execution reason. It no longer inflates the manual review
  total or receives a repair action.
- Automatic rows have a dedicated, scrollable statement-row table with their
  separate date, time, symbol, and plain-language reason.
- Review rows now have separate editable Date and Time fields, statement-row,
  symbol A–Z/Z–A, and oldest/newest sorting, plus multi-select actions for
  keep, exclude, and reset. Bulk correction remains intentionally unavailable.
- Decision recorded: execution tables should display lossless broker Date and
  Time components in separate columns alongside the exact canonical timestamp.
  This is a trader-facing display rule, not a replacement for timestamp
  authority or a second dashboard data source.
