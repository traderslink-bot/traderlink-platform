import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type { CalendarWeekOption } from "./calendar-types";

type CalendarActivityRow = Readonly<{
  closed_at_utc: string;
}>;

type CalendarTimezoneRow = Readonly<{
  trading_timezone: string;
}>;

export type CalendarNavigationOptions = Readonly<{
  availableMonths: readonly string[];
  availableWeekOptions: readonly CalendarWeekOption[];
  availableWeeks: readonly string[];
  selectedMonth: string;
  selectedWeek: string;
}>;

function localDate(utc: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date(utc));
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function weekStart(date: string): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
}

export function readCalendarActivityDates(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): Readonly<{ activityDates: readonly string[]; timezone: string | null }> {
  if (!scope.activeAccountId) return Object.freeze({ activityDates: Object.freeze([]), timezone: null });
  const account = database.prepare<[string, string], CalendarTimezoneRow>(`SELECT trading_timezone
FROM journal_accounts
WHERE workspace_id = ? AND account_id = ?`).get(scope.workspaceId, scope.activeAccountId);
  if (!account) return Object.freeze({ activityDates: Object.freeze([]), timezone: null });
  const rows = database.prepare<[string, string], CalendarActivityRow>(`SELECT version.closed_at_utc
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version
  ON version.workspace_id = round_trip.workspace_id
 AND version.account_id = round_trip.account_id
 AND version.round_trip_id = round_trip.round_trip_id
 AND version.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.workspace_id = ?
  AND round_trip.account_id = ?
  AND round_trip.lifecycle_state = 'active'
  AND version.projection_state = 'ready_closed'
  AND version.closed_at_utc IS NOT NULL
  AND version.round_trip_version_id NOT IN (
    SELECT seeded_allocation.round_trip_version_id
    FROM journal_round_trip_execution_allocations seeded_allocation
    JOIN journal_execution_provenance seeded_provenance
      ON seeded_provenance.workspace_id = seeded_allocation.workspace_id
     AND seeded_provenance.account_id = seeded_allocation.account_id
     AND seeded_provenance.execution_version_id = seeded_allocation.execution_version_id
    JOIN journal_import_batches seeded_batch
      ON seeded_batch.workspace_id = seeded_provenance.workspace_id
     AND seeded_batch.account_id = seeded_provenance.account_id
     AND seeded_batch.import_batch_id = seeded_provenance.import_batch_id
    WHERE seeded_batch.source_display_label LIKE 'Data Decisions review example:%'
  )`).all(scope.workspaceId, scope.activeAccountId);
  return Object.freeze({
    activityDates: Object.freeze([...new Set(rows.map((row) => localDate(
      row.closed_at_utc,
      account.trading_timezone,
    )))].sort()),
    timezone: account.trading_timezone,
  });
}

export function calendarNavigationOptions(
  activityDates: readonly string[],
  query: Readonly<Record<string, string | string[] | undefined>>,
  currentWeek: string,
): CalendarNavigationOptions {
  const activityMonths = [...new Set(activityDates.map((date) => date.slice(0, 7)))];
  const availableMonths = [...new Set([...activityMonths, currentWeek.slice(0, 7)])].sort();
  const availableWeeks = [...new Set([...activityDates.map(weekStart), currentWeek])].sort();
  const availableWeekOptions: readonly CalendarWeekOption[] = availableWeeks.map((week) => Object.freeze({
    months: Object.freeze([...new Set([
      ...activityDates
        .filter((date) => weekStart(date) === week)
        .map((date) => date.slice(0, 7)),
      ...(week === currentWeek ? [currentWeek.slice(0, 7)] : []),
    ])]),
    week,
  }));
  const requestedMonth = typeof query.month === "string" ? query.month : undefined;
  const requestedWeek = typeof query.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.week)
    ? weekStart(query.week)
    : undefined;
  return Object.freeze({
    availableMonths: Object.freeze(availableMonths),
    availableWeekOptions: Object.freeze(availableWeekOptions),
    availableWeeks: Object.freeze(availableWeeks),
    selectedMonth: requestedMonth && availableMonths.includes(requestedMonth)
      ? requestedMonth
      : activityMonths.at(-1) ?? currentWeek.slice(0, 7),
    selectedWeek: requestedWeek && availableWeeks.includes(requestedWeek)
      ? requestedWeek
      : currentWeek,
  });
}
