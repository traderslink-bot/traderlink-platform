import "server-only";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";

const DEMO_TODAY = "2026-08-21";
const DEMO_TRADE_TRACKER_LANDING_DATE = "2026-08-27";

export type JournalDemoScopeClock = Readonly<{
  month: "2026-08";
  today: "2026-08-21";
  weekStart: "2026-08-17";
}>;

const FIXED_DEMO_SCOPE_CLOCK: JournalDemoScopeClock = Object.freeze({
  month: "2026-08",
  today: DEMO_TODAY,
  weekStart: "2026-08-17",
});

function localDateInTimezone(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function mondayForDate(date: string): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
}

export function readJournalDemoScopeClockFromDatabase(
  database: Database.Database,
  scope: WorkspaceAccessScope,
): JournalDemoScopeClock | null {
  return new JournalDemoAccountRepository(database).findActiveAccount(scope)
    ? FIXED_DEMO_SCOPE_CLOCK
    : null;
}

export function readJournalDemoScopeClock(
  scope: WorkspaceAccessScope,
): JournalDemoScopeClock | null {
  return withReadonlyPlatformDatabase({}, (database) =>
    readJournalDemoScopeClockFromDatabase(database, scope));
}

export function journalScopeCurrentDate(
  clock: JournalDemoScopeClock | null,
  timezone: string,
  now = new Date(),
): string {
  return clock?.today ?? localDateInTimezone(now, timezone);
}

export function journalScopeCurrentWeek(
  clock: JournalDemoScopeClock | null,
  timezone: string,
  now = new Date(),
): string {
  return clock?.weekStart ?? mondayForDate(journalScopeCurrentDate(null, timezone, now));
}

export function journalScopeCurrentMonth(
  clock: JournalDemoScopeClock | null,
  timezone: string,
  now = new Date(),
): string {
  return clock?.month ?? journalScopeCurrentDate(null, timezone, now).slice(0, 7);
}

/**
 * The Demo account's Daily Trade Tracker opens on the financial demo session
 * with the complete current-day review. This deliberately does not change the
 * Demo scope's Workspace, Calendar, or Swing Tracker clock.
 */
export function journalDemoTradeTrackerLandingDate(
  _clock: JournalDemoScopeClock,
): string {
  return DEMO_TRADE_TRACKER_LANDING_DATE;
}
