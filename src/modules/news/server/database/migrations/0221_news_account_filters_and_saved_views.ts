import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const uuidCheck = (column: string) => `CHECK(length(${column})=36 AND ${column}=lower(${column}) AND length(replace(${column},'-',''))=32 AND replace(${column},'-','') NOT GLOB '*[^0-9a-f]*' AND substr(${column},15,1)='4' AND substr(${column},20,1) GLOB '[89ab]')`;
const utcCheck = (column: string) => `CHECK(length(${column})=24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
const filtersCheck = `CHECK(json_valid(filters_json) AND length(filters_json) BETWEEN 2 AND 4096 AND json_type(filters_json) IS 'object' AND json_extract(filters_json,'$.version') IS 1 AND json_type(filters_json,'$.filters') IS 'object')`;

/** Coordinator allocation: 0221 / order 296. Additive News-owned account data. */
export const newsAccountFiltersAndSavedViewsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "news",
  migrationId: "0221_news_account_filters_and_saved_views",
  executionOrder: 296,
  statements: Object.freeze([
    `CREATE TABLE news_press_release_view_preferences (
      user_id TEXT PRIMARY KEY ${uuidCheck("user_id")} REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
      filters_json TEXT NOT NULL ${filtersCheck},
      revision INTEGER NOT NULL CHECK(revision >= 1),
      updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")}
    ) STRICT`,
    `CREATE TABLE news_press_release_saved_views (
      view_id TEXT PRIMARY KEY ${uuidCheck("view_id")},
      user_id TEXT NOT NULL ${uuidCheck("user_id")} REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
      name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 60 AND name=trim(name) AND instr(name,char(0))=0),
      filters_json TEXT NOT NULL ${filtersCheck},
      alerts_enabled INTEGER NOT NULL CHECK(alerts_enabled IN (0,1)),
      alerts_started_at_utc TEXT CHECK(alerts_started_at_utc IS NULL OR length(alerts_started_at_utc)=24),
      revision INTEGER NOT NULL CHECK(revision >= 1),
      created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
      updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
      CHECK(alerts_enabled=0 OR alerts_started_at_utc IS NOT NULL),
      UNIQUE(user_id, name COLLATE NOCASE)
    ) STRICT`,
    `CREATE INDEX news_press_release_saved_views_owner ON news_press_release_saved_views(user_id, alerts_enabled)`,
  ]),
});
