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
export const sharedAlertsProductionSelection: SharedProductionSelection | null = {
  "state": "selected",
  "target": "canonical_production_ledger",
  "carrierIdentity": "community-combined-203-20261117",
  "requiredMigrations": [
    {
      "migrationId": "0171_traderlink_community_shared_alerts",
      "moduleNamespace": "community",
      "executionOrder": 271,
      "checksumSha256": "3bae9d04bea341efbffc791f41ad95dcb9d2c937244ba9d756702914234638d4"
    },
    {
      "migrationId": "0177_traderlink_community_shared_alert_individuals",
      "moduleNamespace": "community",
      "executionOrder": 272,
      "checksumSha256": "5075ffa84545047d8b57089add34845edbc6c074216743283a8fbe77efa91259"
    }
  ],
  "prerequisiteMigrations": [
    {
      "migrationId": "0001_platform_identity",
      "moduleNamespace": "platform",
      "executionOrder": 1,
      "checksumSha256": "e2ccbc367e274162b0a9141dc73eddf68bf5624ff4fca4ca06f97efe6d00cbb8"
    },
    {
      "migrationId": "0012_platform_authentication_identities",
      "moduleNamespace": "platform",
      "executionOrder": 12,
      "checksumSha256": "f933c39e9341d34d1697a6375034a6d5bf4efb19a9c911e556a1ecdb209927f3"
    },
    {
      "migrationId": "0017_platform_discord_memberships",
      "moduleNamespace": "platform",
      "executionOrder": 17,
      "checksumSha256": "b9599e947b4e45a4b9e4ee730d701682ad2d5e23cf68ac1c6fcbb3f68a37c6f4"
    },
    {
      "migrationId": "0121_traderlink_communities_identity_permissions",
      "moduleNamespace": "community",
      "executionOrder": 225,
      "checksumSha256": "f99821f279d6468940d6f97b2c1d268a527fea54f1356115eb07df7e6433e1e4"
    },
    {
      "migrationId": "0122_traderlink_communities_partner_platform",
      "moduleNamespace": "community",
      "executionOrder": 226,
      "checksumSha256": "90eb501961e064691d50be9c4886dc21b0d6f2ef80bba485b23efce88cbfb51a"
    },
    {
      "migrationId": "0162_platform_coaching_delivery_attempt_history",
      "moduleNamespace": "community",
      "executionOrder": 241,
      "checksumSha256": "9a3581fc0681053d9a6e29ccb57965ff80909a016b289e8c2493848e4bb39c11"
    },
    {
      "migrationId": "0163_platform_community_publication_feedback",
      "moduleNamespace": "community",
      "executionOrder": 242,
      "checksumSha256": "4097b270f84d264d363d178a52be9200064e4a512950ae6995138db2a0902fdc"
    },
    {
      "migrationId": "0168_platform_community_destination_publishers",
      "moduleNamespace": "community",
      "executionOrder": 244,
      "checksumSha256": "e2d7d3aefbee0a4c33407c37352496038d7a0084106551ee50ef7e88d4808fcd"
    },
    {
      "migrationId": "0169_platform_community_removal_recovery",
      "moduleNamespace": "community",
      "executionOrder": 245,
      "checksumSha256": "315cac2e1b6f0a674417d770fd1b12f33044977ee45acac5b649ad98bd97025a"
    },
    {
      "migrationId": "0170_platform_community_publication_revision_actions",
      "moduleNamespace": "community",
      "executionOrder": 246,
      "checksumSha256": "1cbd7f2c0d5a932fed2d50ebc710529d87057edf287bb2818e7aca6d331e8242"
    }
  ],
  "tableMigrations": {
    "community_alert_discord_authors": "0171_traderlink_community_shared_alerts",
    "community_alert_publisher_permissions": "0177_traderlink_community_shared_alert_individuals",
    "community_shared_alert_blocks": "0171_traderlink_community_shared_alerts",
    "community_shared_alert_deliveries": "0171_traderlink_community_shared_alerts",
    "community_shared_alert_delivery_parts": "0177_traderlink_community_shared_alert_individuals",
    "community_shared_alert_events": "0171_traderlink_community_shared_alerts",
    "community_shared_alert_messages": "0171_traderlink_community_shared_alerts",
    "community_shared_alert_owner_checks": "0171_traderlink_community_shared_alerts",
    "community_shared_alert_rate_limits": "0171_traderlink_community_shared_alerts",
    "community_shared_alert_read_positions": "0171_traderlink_community_shared_alerts",
    "community_shared_alert_requests": "0171_traderlink_community_shared_alerts",
    "community_shared_alert_routes": "0177_traderlink_community_shared_alert_individuals",
    "community_shared_alert_settings": "0171_traderlink_community_shared_alerts",
    "platform_auth_identities": "0012_platform_authentication_identities",
    "platform_discord_memberships": "0017_platform_discord_memberships",
    "platform_users": "0001_platform_identity",
    "traderlink_communities": "0121_traderlink_communities_identity_permissions",
    "traderlink_community_activity_daily_members": "0122_traderlink_communities_partner_platform",
    "traderlink_community_activity_events": "0122_traderlink_communities_partner_platform",
    "traderlink_community_alerts": "0122_traderlink_communities_partner_platform",
    "traderlink_community_audience_discord_roles": "0122_traderlink_communities_partner_platform",
    "traderlink_community_audiences": "0122_traderlink_communities_partner_platform",
    "traderlink_community_authorization_audit_events": "0121_traderlink_communities_identity_permissions",
    "traderlink_community_coaching_relationships": "0122_traderlink_communities_partner_platform",
    "traderlink_community_content_deliveries": "0122_traderlink_communities_partner_platform",
    "traderlink_community_delivery_attempt_history": "0162_platform_coaching_delivery_attempt_history",
    "traderlink_community_destination_audit": "0168_platform_community_destination_publishers",
    "traderlink_community_destination_publishers": "0168_platform_community_destination_publishers",
    "traderlink_community_discord_destinations": "0122_traderlink_communities_partner_platform",
    "traderlink_community_discord_role_mappings": "0121_traderlink_communities_identity_permissions",
    "traderlink_community_lifecycle": "0169_platform_community_removal_recovery",
    "traderlink_community_member_role_assignments": "0121_traderlink_communities_identity_permissions",
    "traderlink_community_memberships": "0121_traderlink_communities_identity_permissions",
    "traderlink_community_owner_events": "0121_traderlink_communities_identity_permissions",
    "traderlink_community_publication_action_attempts": "0170_platform_community_publication_revision_actions",
    "traderlink_community_publication_actions": "0170_platform_community_publication_revision_actions",
    "traderlink_community_publication_distribution": "0168_platform_community_destination_publishers",
    "traderlink_community_publication_receipts": "0163_platform_community_publication_feedback",
    "traderlink_community_publication_revisions": "0170_platform_community_publication_revision_actions",
    "traderlink_community_role_capabilities": "0121_traderlink_communities_identity_permissions",
    "traderlink_community_roles": "0121_traderlink_communities_identity_permissions",
    "traderlink_community_settings": "0122_traderlink_communities_partner_platform"
  }
};

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
