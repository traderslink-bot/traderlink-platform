# Dashboard latency Calendar gate plan

## Purpose

Run one reversible production experiment against the exact live base
`9090818608f5bae8f2dd98e3717e36dba5f8139a`. The experiment determines whether
Calendar's initial all-history plus selected-range reads are materially causing
dashboard navigation latency.

Progress: [dashboard-latency-calendar-gate-progress.md](dashboard-latency-calendar-gate-progress.md)

Follow-up: [calendar-navigation-load-plan.md](calendar-navigation-load-plan.md)

## Scope

- Add a production-only environment gate, disabled by default.
- When enabled, `/calendar` redirects to `/workspace` before identity,
  analytics, Calendar annotation, Offline Saved View, or database work begins.
- Leave the Calendar source, records, schema, migrations, navigation structure,
  and every non-Calendar route intact.
- Do not alter database integrity verification, account isolation, background
  jobs, SQLite settings, PWA storage, or analytics facts in this experiment.

## Release and measurement

1. Commit only the Calendar gate, this plan, and its progress record.
2. Release the exact commit from the current production parent through the
   single Platform production lane.
3. Enable only `TRADERLINK_DISABLE_CALENDAR_FOR_PERFORMANCE_TEST=true` on the
   Platform service.
4. Verify direct health, `/workspace`, and `/calendar` redirect behavior.
5. Owner repeats the normal Workspace and navigation sequence without Calendar.
6. If latency materially improves, restore Calendar availability only after a
   separate, measured first-load redesign. If it does not, remove the flag and
   continue with per-route timing instrumentation.

## Rollback

Set the flag to `false` or remove it. The code path is inert when absent; no
database, data, migration, or deployment rollback is required.
