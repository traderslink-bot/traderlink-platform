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

## Active shared-authority change

The existing all-or-nothing reconstruction gate is being replaced. Its current
assumption that every ledger begins flat is invalid for ordinary broker
statements and blocks the entire dashboard when an imported statement starts
mid-position. The active repair will retain row-level restrictions while
allowing usable execution and closed-trade results through the one shared
authority.

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
