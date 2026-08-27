import "server-only";

import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";

const NEW_YORK = "America/New_York";

type WatchlistUsageDailyRow = Readonly<{
  new_york_date: string;
  distinct_visitors: number;
  visits: number;
}>;

type WatchlistUsageVisitorRow = Readonly<{
  display_name: string;
  most_recent_visit_ms: number;
  today_visits: number;
  recorded_visits: number;
}>;

export type WatchlistUsageAdminSnapshot = Readonly<{
  todayDistinctVisitors: number;
  todayVisits: number;
  allRecordedVisits: number;
  dataSinceMs: number | null;
  daily: readonly Readonly<{
    newYorkDate: string;
    distinctVisitors: number;
    visits: number;
  }>[];
  visitors: readonly Readonly<{
    displayName: string;
    mostRecentVisitMs: number;
    todayVisits: number;
    recordedVisits: number;
  }>[];
}>;

function newYorkDate(timestamp: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: NEW_YORK,
    year: "numeric",
  }).formatToParts(new Date(timestamp));
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value;
  const year = value("year");
  const month = value("month");
  const day = value("day");
  if (!year || !month || !day) {
    throw new Error("watchlist_usage_new_york_date_unavailable");
  }
  return `${year}-${month}-${day}`;
}

export function recordWatchlistUsageVisit(input: Readonly<{
  eventId: string;
  userId: string;
  visitedAtMs: number;
}>): boolean {
  if (!isCanonicalUuidV4(input.eventId) || !Number.isSafeInteger(input.visitedAtMs) || input.visitedAtMs <= 0) {
    return false;
  }
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return database.prepare(`INSERT INTO platform_watchlist_usage_events (
  event_id, user_id, visited_at_ms, new_york_date
) VALUES (?, ?, ?, ?)
ON CONFLICT(event_id) DO NOTHING`).run(
      input.eventId,
      input.userId,
      input.visitedAtMs,
      newYorkDate(input.visitedAtMs),
    ).changes === 1;
  } finally {
    database.close();
  }
}

export function readWatchlistUsageAdminSnapshot(
  now = Date.now(),
): WatchlistUsageAdminSnapshot {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const today = newYorkDate(now);
    const totals = database.prepare<[string, string], Readonly<{
      today_distinct_visitors: number;
      today_visits: number | null;
      all_recorded_visits: number;
      data_since_ms: number | null;
    }>>(`SELECT
  COUNT(DISTINCT CASE WHEN new_york_date = ? THEN user_id END) AS today_distinct_visitors,
  SUM(CASE WHEN new_york_date = ? THEN 1 ELSE 0 END) AS today_visits,
  COUNT(*) AS all_recorded_visits,
  MIN(visited_at_ms) AS data_since_ms
FROM platform_watchlist_usage_events`).get(today, today) ?? {
      all_recorded_visits: 0,
      data_since_ms: null,
      today_distinct_visitors: 0,
      today_visits: 0,
    };
    const daily = database.prepare<[], WatchlistUsageDailyRow>(`SELECT
  new_york_date,
  COUNT(DISTINCT user_id) AS distinct_visitors,
  COUNT(*) AS visits
FROM platform_watchlist_usage_events
GROUP BY new_york_date
ORDER BY new_york_date DESC`).all().map((row) => Object.freeze({
      distinctVisitors: row.distinct_visitors,
      newYorkDate: row.new_york_date,
      visits: row.visits,
    }));
    const visitors = database.prepare<[string], WatchlistUsageVisitorRow>(`SELECT
  user.display_name,
  MAX(event.visited_at_ms) AS most_recent_visit_ms,
  SUM(CASE WHEN event.new_york_date = ? THEN 1 ELSE 0 END) AS today_visits,
  COUNT(*) AS recorded_visits
FROM platform_watchlist_usage_events event
JOIN platform_users user ON user.user_id = event.user_id
GROUP BY event.user_id, user.display_name
ORDER BY most_recent_visit_ms DESC, user.display_name COLLATE NOCASE ASC, event.user_id ASC`).all(today)
      .map((row) => Object.freeze({
        displayName: row.display_name,
        mostRecentVisitMs: row.most_recent_visit_ms,
        recordedVisits: row.recorded_visits,
        todayVisits: row.today_visits,
      }));
    return Object.freeze({
      allRecordedVisits: Number(totals.all_recorded_visits),
      daily: Object.freeze(daily),
      dataSinceMs: totals.data_since_ms,
      todayDistinctVisitors: Number(totals.today_distinct_visitors),
      todayVisits: Number(totals.today_visits ?? 0),
      visitors: Object.freeze(visitors),
    });
  } finally {
    database.close();
  }
}
