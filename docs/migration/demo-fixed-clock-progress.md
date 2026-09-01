# Demo Fixed Clock Progress

**Status:** Implementation in progress

**Controlling plan:** [Demo Trade Data Plan](demo-trade-data-plan.md)

## Owner-approved scope

- [x] Only an active Demo account uses the fixed current date `2026-08-17`.
- [x] Today, this week, and this month use the existing date boundaries from
      that fixed date. Real accounts continue to use the real current date.
- [x] Stored executions, timestamps, candles, Analyzer facts, imports, news,
      account selection, pagination, cursors, and Demo lifecycle behavior stay
      unchanged.
- [x] The existing Demo explanation contains exactly: `Demo account is
      permanently set to Aug 17th`.

## Source coverage check

- [x] Source/fixture inspection found an Aug. 17 entry in the existing
      journal-only Demo source.
- [x] The active financial Daily Tracker inventory remains two later August
      sessions (24 closed trades and 86 executions in aggregate). No facts are
      moved, duplicated, or materialized to make the fixed date look populated.

## Implementation record

- [x] Add one server-authoritative Demo scope clock, resolved from the active
      Demo account record.
- [x] Apply it to Workspace period filters and review-date reads, the Daily
      Trade Tracker default and redirect, Calendar server navigation and its
      client current-week cue, and the rendered Swing Tracker default date.
- [x] Keep Quick Trade Entry out of this slice because it now redirects to the
      Workspace trade drawer and does not render a date field.
- [x] Preserve the Workspace default period of All time. The fixed Demo Today
      and This week are Aug. 17, while its initial All time view may include
      the later August source facts already in the selected Demo account.
- [x] Preserve the separate offline projection contract; the saved Calendar
      view supplies its captured selected week without changing projection
      schema or persistence behavior.
- [x] Complete source-level whitespace and scope checks. Coordinator diff
      review remains before commit. No Vitest, local server, migration, data
      write, or hosted action is part of this implementation checkpoint.
