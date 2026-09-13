import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";
import { dailyTradeAnalyzerManualRetryRequestsMigration } from "./0135_daily_trade_analyzer_manual_retry_requests";

const uuid = (column: string) => `CHECK (length(${column})=36 AND ${column}=lower(${column}) AND length(replace(${column},'-',''))=32 AND replace(${column},'-','') NOT GLOB '*[^0-9a-f]*' AND substr(${column},9,1)='-' AND substr(${column},14,1)='-' AND substr(${column},19,1)='-' AND substr(${column},24,1)='-' AND substr(${column},15,1)='4' AND substr(${column},20,1) GLOB '[89ab]')`;
const utc = (column: string) => `CHECK (length(${column})=24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;

const exemptions = `CREATE TABLE level_analysis_owner_exemption_events (
 exemption_event_id TEXT PRIMARY KEY ${uuid("exemption_event_id")},
 user_id TEXT NOT NULL ${uuid("user_id")},
 actor_user_id TEXT NOT NULL ${uuid("actor_user_id")},
 enabled INTEGER NOT NULL CHECK(enabled IN (0,1)),
 created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
 FOREIGN KEY(user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(actor_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT ON UPDATE RESTRICT
) STRICT;
CREATE INDEX level_analysis_owner_exemption_events_user ON level_analysis_owner_exemption_events(user_id,created_at_utc);
CREATE TRIGGER level_analysis_owner_exemption_events_no_update BEFORE UPDATE ON level_analysis_owner_exemption_events
BEGIN SELECT RAISE(ABORT,'analyzer_exemption_audit_immutable'); END;
CREATE TRIGGER level_analysis_owner_exemption_events_no_delete BEFORE DELETE ON level_analysis_owner_exemption_events
BEGIN SELECT RAISE(ABORT,'analyzer_exemption_audit_required'); END;
CREATE TABLE level_analysis_owner_exempt_acquisitions (
 acquisition_id TEXT PRIMARY KEY ${uuid("acquisition_id")},
 exemption_event_id TEXT NOT NULL ${uuid("exemption_event_id")},
 FOREIGN KEY(acquisition_id) REFERENCES level_analysis_analyzer_acquisitions(acquisition_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(exemption_event_id) REFERENCES level_analysis_owner_exemption_events(exemption_event_id) ON DELETE RESTRICT ON UPDATE RESTRICT
) STRICT;
CREATE TRIGGER level_analysis_owner_exempt_acquisitions_owner BEFORE INSERT ON level_analysis_owner_exempt_acquisitions
WHEN NOT EXISTS (SELECT 1 FROM level_analysis_analyzer_acquisitions a JOIN level_analysis_owner_exemption_events e
 ON e.exemption_event_id=NEW.exemption_event_id AND e.user_id=a.charged_user_id
 WHERE a.acquisition_id=NEW.acquisition_id AND e.enabled=1 AND a.charge_kind='correction_waived'
 AND e.exemption_event_id=(SELECT current.exemption_event_id FROM level_analysis_owner_exemption_events current
 WHERE current.user_id=e.user_id ORDER BY current.created_at_utc DESC,current.rowid DESC LIMIT 1))
BEGIN SELECT RAISE(ABORT,'analyzer_exemption_acquisition_invalid'); END;
CREATE TRIGGER level_analysis_owner_exempt_acquisitions_no_update BEFORE UPDATE ON level_analysis_owner_exempt_acquisitions
BEGIN SELECT RAISE(ABORT,'analyzer_exemption_acquisition_immutable'); END;
CREATE TRIGGER level_analysis_owner_exempt_acquisitions_no_delete BEFORE DELETE ON level_analysis_owner_exempt_acquisitions
BEGIN SELECT RAISE(ABORT,'analyzer_exemption_acquisition_required'); END;`;

// Rebuild the complete three-table retry FK graph with foreign keys enabled.
// Reuse the immutable predecessor's exact schema, relaxing only its ordinal
// CHECK; a new insertion trigger retains the ordinary-user cap. Never edit 0135.
const predecessor = dailyTradeAnalyzerManualRetryRequestsMigration.statements.join("\n");
const rebuilt = predecessor.replace("CHECK (daily_ordinal BETWEEN 1 AND 3)", "CHECK (daily_ordinal >= 1)");
const retryTables = ["level_analysis_manual_retry_requests", "level_analysis_manual_retry_acquisitions", "level_analysis_manual_retry_history_requests"];
const triggers = [...predecessor.matchAll(/CREATE TRIGGER ([a-z0-9_]+)[\s\S]*? END;/g)];
const indexes = [...predecessor.matchAll(/CREATE INDEX ([a-z0-9_]+)/g)];
const ownerTriggers = triggers.filter(match => match[1].endsWith("_owner"));
const rebuild = [
  ...triggers.map(match => `DROP TRIGGER ${match[1]};`),
  ...indexes.map(match => `DROP INDEX ${match[1]};`),
  ...[...retryTables].reverse().map(table => `ALTER TABLE ${table} RENAME TO ${table}_0136_old;`),
  rebuilt,
  // Historical jobs may now be completed. Copy their immutable evidence before
  // restoring insertion-time queued/current-owner checks for new requests.
  ...ownerTriggers.map(match => `DROP TRIGGER ${match[1]};`),
  ...retryTables.map(table => `INSERT INTO ${table} SELECT * FROM ${table}_0136_old;`),
  ...ownerTriggers.map(match => match[0]),
  ...[...retryTables].reverse().map(table => `DROP TABLE ${table}_0136_old;`),
  `CREATE TRIGGER level_analysis_manual_retry_requests_limit BEFORE INSERT ON level_analysis_manual_retry_requests
WHEN NEW.daily_ordinal>3 AND coalesce((SELECT enabled FROM level_analysis_owner_exemption_events
 WHERE user_id=NEW.user_id ORDER BY created_at_utc DESC,rowid DESC LIMIT 1),0)<>1
BEGIN SELECT RAISE(ABORT,'manual_retry_limit_reached'); END;`,
].join("\n");

export const sharedTradeAnalyzerOwnerExemptionsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "level_analysis", migrationId: "0136_shared_trade_analyzer_owner_exemptions",
  executionOrder: 136, statements: Object.freeze([exemptions, rebuild]),
});
