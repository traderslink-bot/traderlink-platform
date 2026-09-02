# Calendar navigation-first loading progress

Linked plan: [calendar-navigation-load-plan.md](calendar-navigation-load-plan.md)

## 2026-09-02 — implementation started

- Owner requested an account-month navigation read so the Calendar dropdowns
  can list active periods without loading each period's visible Calendar data.
- Scope includes both standalone Calendar and the Workspace Calendar panel;
  left-navigation behavior remains unchanged pending a later owner decision.
- Source review confirmed the current all-history catalog is used only to
  construct month/week options before a second selected-period Calendar read.
- Source review also confirmed the existing analytics fact-set service currently
  materializes all available facts even when Calendar passes a date range. The
  first slice therefore removes the duplicate Calendar aggregation without
  claiming a month-bounded accounting fact set.

## 2026-09-02 — first slice implemented

- Added one server-only, account-scoped date-only query for completed Calendar
  activity. It returns local activity dates only; it does not retrieve ticker
  rows, P/L values, drawer evidence, notes, tags, or executions.
- Standalone Calendar and the Workspace Calendar API now use the same
  navigation builder before loading their selected month or week model.
- The selected-period model and the existing ticker-details-on-expansion API
  remain intact. No UI, navigation destination, schema, migration, or user
  data changed.
- Targeted source review and `git diff --check` are the only local validation
  in this low-resource implementation phase. Hosted deployment health and
  owner interaction review remain pending.
