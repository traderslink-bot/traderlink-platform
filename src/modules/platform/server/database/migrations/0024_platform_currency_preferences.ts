import type { PlatformMigration } from "../platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

function decimalCheck(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 128
    AND ${column} NOT GLOB '*[^0-9.-]*' AND ${column} NOT LIKE '+%'
    AND substr(${column}, -1, 1) <> '.' AND ${column} NOT IN ('-0', '-0.0', '')
    AND (length(${column}) - length(replace(${column}, '.', ''))) <= 1
    AND (length(${column}) - length(replace(${column}, '-', ''))) <= 1
    AND instr(${column}, '-') IN (0, 1)
  )`;
}

const sql = `CREATE TABLE platform_user_preferences (
  user_id TEXT PRIMARY KEY ${uuidCheck("user_id")},
  reporting_currency TEXT NOT NULL CHECK (
    reporting_currency IN ('USD', 'CAD', 'AUD', 'EUR', 'HKD', 'SGD', 'MYR')
  ),
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

INSERT INTO platform_user_preferences (user_id, reporting_currency, updated_at_utc)
SELECT user_id, 'USD', updated_at_utc
FROM platform_users;

CREATE TRIGGER platform_users_create_preferences
AFTER INSERT ON platform_users BEGIN
  INSERT INTO platform_user_preferences (user_id, reporting_currency, updated_at_utc)
  VALUES (NEW.user_id, 'USD', NEW.updated_at_utc);
END;

CREATE TABLE platform_fx_rate_observations (
  fx_rate_observation_id TEXT PRIMARY KEY ${uuidCheck("fx_rate_observation_id")},
  provider_key TEXT NOT NULL CHECK (provider_key = 'bank_of_canada_valet'),
  source_date TEXT NOT NULL CHECK (
    length(source_date) = 10
    AND source_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  source_currency TEXT NOT NULL CHECK (source_currency = 'USD'),
  target_currency TEXT NOT NULL CHECK (
    target_currency IN ('CAD', 'AUD', 'EUR', 'HKD', 'SGD', 'MYR')
  ),
  usd_to_target_decimal TEXT NOT NULL ${decimalCheck("usd_to_target_decimal")},
  source_series TEXT NOT NULL CHECK (length(source_series) BETWEEN 1 AND 120),
  retrieved_at_utc TEXT NOT NULL ${utcCheck("retrieved_at_utc")},
  UNIQUE (provider_key, source_date, source_currency, target_currency),
  CHECK (usd_to_target_decimal > '0')
) STRICT;

CREATE INDEX platform_fx_rate_observations_lookup
  ON platform_fx_rate_observations(
    provider_key, target_currency, source_date
  );

CREATE TRIGGER platform_fx_rate_observations_no_update
BEFORE UPDATE ON platform_fx_rate_observations BEGIN
  SELECT RAISE(ABORT, 'platform_fx_rate_observation_immutable');
END;

CREATE TRIGGER platform_fx_rate_observations_no_delete
BEFORE DELETE ON platform_fx_rate_observations BEGIN
  SELECT RAISE(ABORT, 'platform_fx_rate_observation_history_required');
END;`;

export const platformCurrencyPreferencesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0024_platform_currency_preferences",
  executionOrder: 24,
  statements: Object.freeze([sql]),
});
