import type Database from "better-sqlite3";
import type { PlatformMigration } from "./platform-migration-contract";
import { calculatePlatformMigrationChecksum } from "./platform-migration-contract";

export type SharedProductionMigrationPin = Readonly<{
  migrationId: string;
  moduleNamespace: PlatformMigration["moduleNamespace"];
  executionOrder: number;
  checksumSha256: string;
}>;
export type SharedProductionSelection = Readonly<{
  state: "selected";
  target: "canonical_production_ledger";
  carrierIdentity: string;
  requiredMigrations: readonly [SharedProductionMigrationPin, SharedProductionMigrationPin];
  prerequisiteMigrations: readonly SharedProductionMigrationPin[];
  tableMigrations: Readonly<Record<string, string>>;
}>;
const sharedIds = [
  "0171_traderlink_community_shared_alerts",
  "0177_traderlink_community_shared_alert_individuals",
] as const;

/** Coordinator replaces this literal only after final canonical descriptor qualification. */
export const sharedAlertsProductionSelection: SharedProductionSelection | null = null;

export function selectSharedAlertsProductionCarrier(selection: SharedProductionSelection | null) {
  if (!selection) return Object.freeze({ state: "unselected" as const, carrierIdentity: null });
  const pins = [...selection.requiredMigrations, ...selection.prerequisiteMigrations];
  if (sharedProductionRequiredTables.some(table => !pins.some(pin => pin.migrationId === selection.tableMigrations[table]))
    || selection.state !== "selected"
    || selection.target !== "canonical_production_ledger" || !selection.carrierIdentity.trim()
    || selection.requiredMigrations.length !== 2
    || !sharedIds.every(id => selection.requiredMigrations.some(pin => pin.migrationId === id && pin.moduleNamespace === "community"))
    || new Set(pins.map(pin => pin.migrationId)).size !== pins.length
    || new Set(pins.map(pin => pin.executionOrder)).size !== pins.length
    || pins.some(pin => !pin.migrationId || !pin.moduleNamespace || !Number.isSafeInteger(pin.executionOrder)
      || pin.executionOrder <= 0 || !/^[a-f0-9]{64}$/.test(pin.checksumSha256))) {
    throw new Error("Invalid canonical Shared Alerts migration selection");
  }
  return Object.freeze({
    state: "selected" as const,
    carrierIdentity: selection.carrierIdentity,
    requiredMigrations: Object.freeze(selection.requiredMigrations.map(pin => Object.freeze({ ...pin }))),
    prerequisiteMigrations: Object.freeze(selection.prerequisiteMigrations.map(pin => Object.freeze({ ...pin }))),
  });
}


export function sharedProductionPrerequisitesReady(
  database: Database.Database,
  manifest: readonly PlatformMigration[],
  pins: readonly SharedProductionMigrationPin[],
  tables: readonly string[],
): boolean {
  for (const pin of pins) {
    const matches = manifest.filter(migration => migration.migrationId === pin.migrationId);
    if (matches.length !== 1 || matches[0].moduleNamespace !== pin.moduleNamespace
      || matches[0].executionOrder !== pin.executionOrder
      || calculatePlatformMigrationChecksum(matches[0]) !== pin.checksumSha256) return false;
    const row = database.prepare(
      "SELECT module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations WHERE migration_id=?",
    ).get(pin.migrationId) as { module_namespace: string; execution_order: number; checksum_sha256: string } | undefined;
    if (!row || row.module_namespace !== pin.moduleNamespace || row.execution_order !== pin.executionOrder
      || row.checksum_sha256 !== pin.checksumSha256) return false;
  }
  return tables.every(table => Boolean(database.prepare(
    "SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?",
  ).get(table)));
}

export const sharedProductionRequiredTables: readonly string[] = Object.freeze([
  "community_alert_discord_authors",
  "community_alert_publisher_permissions",
  "community_shared_alert_blocks",
  "community_shared_alert_deliveries",
  "community_shared_alert_delivery_parts",
  "community_shared_alert_events",
  "community_shared_alert_messages",
  "community_shared_alert_owner_checks",
  "community_shared_alert_rate_limits",
  "community_shared_alert_read_positions",
  "community_shared_alert_requests",
  "community_shared_alert_routes",
  "community_shared_alert_settings",
  "platform_auth_identities",
  "platform_discord_memberships",
  "platform_users",
  "traderlink_communities",
  "traderlink_community_activity_daily_members",
  "traderlink_community_activity_events",
  "traderlink_community_alerts",
  "traderlink_community_audience_discord_roles",
  "traderlink_community_audiences",
  "traderlink_community_authorization_audit_events",
  "traderlink_community_coaching_relationships",
  "traderlink_community_content_deliveries",
  "traderlink_community_delivery_attempt_history",
  "traderlink_community_destination_audit",
  "traderlink_community_destination_publishers",
  "traderlink_community_discord_destinations",
  "traderlink_community_discord_role_mappings",
  "traderlink_community_lifecycle",
  "traderlink_community_member_role_assignments",
  "traderlink_community_memberships",
  "traderlink_community_owner_events",
  "traderlink_community_publication_action_attempts",
  "traderlink_community_publication_actions",
  "traderlink_community_publication_distribution",
  "traderlink_community_publication_receipts",
  "traderlink_community_publication_revisions",
  "traderlink_community_role_capabilities",
  "traderlink_community_roles",
  "traderlink_community_settings"
]);

export const sharedAlertsMigrationCarrier = selectSharedAlertsProductionCarrier(sharedAlertsProductionSelection);
