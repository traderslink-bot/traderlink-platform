import type Database from "better-sqlite3";
import { marketCapUsd } from "../contracts/press-release-filters";
export function registerPressReleaseFilterFunctions(database: Database.Database): void {
  database.function("traderlink_news_cap", { deterministic: true }, (value, recordedUsd) => marketCapUsd(value, recordedUsd));
}
