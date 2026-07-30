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
