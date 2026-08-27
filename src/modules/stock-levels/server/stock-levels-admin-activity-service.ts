import "server-only";

import type Database from "better-sqlite3";

import {
  STOCK_LEVELS_ACTIVITY_RETENTION_MS,
  stockLevelsNewYorkDate,
} from "./stock-levels-time";

type TodayUserRow = Readonly<{
  display_name: string;
  generation_count: number;
}>;

export type StockLevelsAdminActivity = Readonly<{
  todayTotal: number;
  users: readonly Readonly<{
    displayName: string;
    generationCount: number;
  }>[];
}>;

function pruneExpiredActivity(database: Database.Database, now: number): void {
  database.prepare("DELETE FROM platform_stock_levels_activity WHERE generated_at_ms < ?")
    .run(now - STOCK_LEVELS_ACTIVITY_RETENTION_MS);
}

export function recordStockLevelsActivity(
  database: Database.Database,
  input: Readonly<{
    userId: string;
    generatedAtMs: number;
  }>,
): void {
  pruneExpiredActivity(database, input.generatedAtMs);
  database.prepare(`INSERT INTO platform_stock_levels_activity (
  user_id, generated_at_ms, new_york_date
) VALUES (?, ?, ?)`)
    .run(
      input.userId,
      input.generatedAtMs,
      stockLevelsNewYorkDate(input.generatedAtMs),
    );
}

export class StockLevelsAdminActivityService {
  constructor(private readonly database: Database.Database) {}

  read(now = Date.now()): StockLevelsAdminActivity {
    const today = stockLevelsNewYorkDate(now);
    const read = this.database.transaction(() => {
      pruneExpiredActivity(this.database, now);
      const todayTotal = this.database.prepare<[string], Readonly<{ count: number }>>(
        "SELECT COUNT(*) AS count FROM platform_stock_levels_activity WHERE new_york_date = ?",
      ).get(today)?.count ?? 0;
      const users = this.database.prepare<[string], TodayUserRow>(`SELECT
  user.display_name,
  COUNT(*) AS generation_count
FROM platform_stock_levels_activity activity
JOIN platform_users user ON user.user_id = activity.user_id
WHERE activity.new_york_date = ?
GROUP BY user.user_id, user.display_name
ORDER BY generation_count DESC, user.display_name COLLATE NOCASE ASC, user.user_id ASC`).all(today)
        .map((row) => Object.freeze({
          displayName: row.display_name,
          generationCount: row.generation_count,
        }));
      return Object.freeze({ todayTotal, users: Object.freeze(users) });
    });
    return read();
  }
}
