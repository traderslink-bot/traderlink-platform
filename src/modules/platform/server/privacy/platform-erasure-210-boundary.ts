import { createHash } from "node:crypto";
import { calculatePlatformMigrationChecksum, type PlatformMigration } from "../database/platform-migration-contract";
import type { AppliedPlatformMigrationRow } from "../database/platform-migration-registry";

const suffix = Object.freeze([
  [203, "0216_platform_premium_current_access_events", "platform", 291],
  [204, "0217_traderlink_community_stats_forward_checkpoints", "community", 292],
  [205, "0218_watchlist_row_visibility", "platform", 293],
  [206, "0219_watchlist_masked_added_date", "platform", 294],
  [207, "0220_watchlist_trader_notes_notifications", "platform", 295],
  [208, "0221_news_account_filters_and_saved_views", "news", 296],
  [209, "0222_watchlist_indicators_visibility", "platform", 297],
] as const);

/** Additional exact source boundary only. Caller MUST still verify the whole
 * canonical descriptor prefix, managed tables, actual physical schema, original
 * Premium rebuild SQL/checksum, newly reviewed catalog and native authority.
 * This predicate is never an admission receipt or compatibility fallback.
 */
export function isReviewed210PremiumEventsBoundary(
  rows: readonly AppliedPlatformMigrationRow[], manifest: readonly PlatformMigration[],
): boolean {
  if (rows.length !== 210 || manifest.length !== 210) return false;
  return suffix.every(([index, id, moduleNamespace, executionOrder]) => {
    const applied = rows[index], declared = manifest[index];
    if (!applied || !declared || applied.migration_id !== id || declared.migrationId !== id
      || applied.module_namespace !== moduleNamespace || declared.moduleNamespace !== moduleNamespace
      || applied.execution_order !== executionOrder || declared.executionOrder !== executionOrder
      || applied.checksum_sha256 !== calculatePlatformMigrationChecksum(declared)) return false;
    return index !== 203 || applied.checksum_sha256 === "a40694720ff085f768b60cc08d5c7971a53f165371aeeed350920f9e076ea539";
  });
}

// Exact FULL canonical210 descriptor vector, evaluated by the native current
// manifest (IDs, modules, orders, checksums in registry order). Timestamp/schema
// history and physical schema remain the owning Core admission's checks.
// Keeping this predicate pure avoids repository -> manifest -> schema repository
// initialization cycles. It accepts no future count, partial tail or new prefix.
const canonical210DescriptorVectorSha256 = "ac8d6541ca0ccc95fdac2a7f322411064c55a6cd3a6b9ed42120e9d9507e1f38";
export function isReviewed210PremiumEventsLedgerPrefix(
  rows: readonly Pick<AppliedPlatformMigrationRow, "migration_id" | "module_namespace" | "execution_order" | "checksum_sha256">[],
): boolean {
  if (rows.length !== 210) return false;
  const vector = rows.map(row => [row.migration_id, row.module_namespace, row.execution_order, row.checksum_sha256]);
  return createHash("sha256").update(JSON.stringify(vector)).digest("hex") === canonical210DescriptorVectorSha256;
}

const newsMemberships211 = Object.freeze({
  migrationId: "0227_news_article_ingestion_memberships",
  namespace: "news",
  executionOrder: 306,
  checksum: "0fc66a860e938c4b3c9d5a583459ca6c9fa4c78644c2e84868ed29bddaec4c6b",
  predecessorSchema: "9124f4989232f8b9a6a2dcf393fb9adde7a480023f0de5097545aa553e80ab89",
  successorSchema: "e2b148f268e6ca409263612d1bc3b3457955db2e6ef07c390c3ba8a45e063016",
});

type DescriptorWithSchema = Pick<AppliedPlatformMigrationRow,
  "migration_id" | "module_namespace" | "execution_order" | "checksum_sha256" | "post_schema_sha256">;

/** Exact 0227 successor to the already reviewed full 210 vector. This checks
 * ledger identity only. Callers retain their current schema and policy checks.
 */
export function isReviewed211NewsMembershipsLedger(rows: readonly DescriptorWithSchema[]): boolean {
  if (rows.length !== 211 || rows[209]?.post_schema_sha256 !== newsMemberships211.predecessorSchema) return false;
  const added = rows[210];
  return !!added
    && added.migration_id === newsMemberships211.migrationId
    && added.module_namespace === newsMemberships211.namespace
    && added.execution_order === newsMemberships211.executionOrder
    && added.checksum_sha256 === newsMemberships211.checksum
    && added.post_schema_sha256 === newsMemberships211.successorSchema
    && isReviewed210PremiumEventsLedgerPrefix(rows.slice(0, 210));
}

export function isReviewed211NewsMembershipsPremiumEventsBoundary(
  rows: readonly AppliedPlatformMigrationRow[], manifest: readonly PlatformMigration[],
): boolean {
  if (manifest.length !== 211 || !isReviewed211NewsMembershipsLedger(rows)) return false;
  const added = manifest[210];
  return !!added
    && added.migrationId === newsMemberships211.migrationId
    && added.moduleNamespace === newsMemberships211.namespace
    && added.executionOrder === newsMemberships211.executionOrder
    && calculatePlatformMigrationChecksum(added) === newsMemberships211.checksum
    && isReviewed210PremiumEventsBoundary(rows.slice(0, 210), manifest.slice(0, 210));
}
