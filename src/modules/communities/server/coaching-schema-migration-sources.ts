/** Preparatory schema sources only. No registry import, default identity or SQL execution.
 * Canonical identity allocation, entry filenames and full-prefix validation remain
 * separate integration steps; importing this module does not register a migration.
 */
import {
  platformFailure,
  validatePlatformMigrationManifest,
  type PlatformMigration,
} from "../../platform/server/database/platform-migration-contract";
import {coachingDirectPaymentStatements} from "./coaching-direct-payment-storage";
import {independentCoachingStatements} from "./independent-coaching-storage";
import {COMMUNITY_ADMISSION_STORAGE_DRAFT} from "./community-admission-storage";
import {traderLinkCommunitiesIdentityPermissionsMigration} from "@/src/modules/communities/server/database/migrations/0121_traderlink_communities_identity_permissions";
import {traderLinkCommunitiesPartnerPlatformMigration} from "@/src/modules/communities/server/database/migrations/0122_traderlink_communities_partner_platform";
import {traderLinkCommunitiesDiscordFeatureAccessMigration} from "@/src/modules/communities/server/database/migrations/0123_traderlink_communities_discord_feature_access";
import {traderLinkCommunitiesServerWatchlistsMigration} from "@/src/modules/communities/server/database/migrations/0124_traderlink_communities_server_watchlists";
import {traderLinkCommunitiesWorkspaceToolsMigration} from "@/src/modules/communities/server/database/migrations/0126_traderlink_communities_workspace_tools";
import {traderLinkCommunitiesCoachingWorkspaceMigration} from "@/src/modules/communities/server/database/migrations/0127_traderlink_communities_coaching_workspace";
import {traderLinkCommunitiesCoachingProgramsMigration} from "@/src/modules/communities/server/database/migrations/0128_traderlink_communities_coaching_programs";
import {traderLinkCommunitiesCoachingPlanBuilderMigration} from "@/src/modules/communities/server/database/migrations/0129_traderlink_communities_coaching_plan_builder";
import {traderLinkCommunitiesCoachingServiceMeasurementMigration} from "@/src/modules/communities/server/database/migrations/0130_traderlink_communities_coaching_service_measurement";
import {traderLinkCommunitiesReviewCoachingSectionsMigration} from "@/src/modules/communities/server/database/migrations/0131_traderlink_communities_review_coaching_sections";
import {traderLinkCommunitiesReviewWorkflowMigration} from "@/src/modules/communities/server/database/migrations/0143_traderlink_communities_review_workflow";
import {traderLinkCommunitiesReviewWorkspaceMetadataMigration} from "@/src/modules/communities/server/database/migrations/0144_traderlink_communities_review_workspace_metadata";
import {traderLinkCommunitiesCoachingDeliveryWorkflowMigration} from "@/src/modules/communities/server/database/migrations/0145_traderlink_communities_coaching_delivery_workflow";
import {platformCoachingCommissionTermsMigration} from "@/src/modules/platform/server/database/migrations/0159_platform_coaching_commission_terms";
import {platformCoachingReviewRequestAcceptanceMigration} from "@/src/modules/platform/server/database/migrations/0160_platform_coaching_review_request_acceptance";
import {platformCoachingContentDeliveryReceiptsMigration} from "@/src/modules/platform/server/database/migrations/0161_platform_coaching_content_delivery_receipts";
import {platformCoachingDeliveryAttemptHistoryMigration} from "@/src/modules/platform/server/database/migrations/0162_platform_coaching_delivery_attempt_history";
import {platformCommunityPublicationFeedbackMigration} from "@/src/modules/platform/server/database/migrations/0163_platform_community_publication_feedback";
import {platformCoachingDeletionArchivesMigration} from "@/src/modules/platform/server/database/migrations/0164_platform_coaching_deletion_archives";
import {platformCommunityDestinationPublishersMigration} from "@/src/modules/platform/server/database/migrations/0168_platform_community_destination_publishers";
import {platformCommunityRemovalRecoveryMigration} from "@/src/modules/platform/server/database/migrations/0169_platform_community_removal_recovery";
import {platformCommunityPublicationRevisionActionsMigration} from "@/src/modules/platform/server/database/migrations/0170_platform_community_publication_revision_actions";

const historicalSources = Object.freeze([
  {migrationId: "0121_traderlink_communities_identity_permissions", source: traderLinkCommunitiesIdentityPermissionsMigration},
  {migrationId: "0122_traderlink_communities_partner_platform", source: traderLinkCommunitiesPartnerPlatformMigration},
  {migrationId: "0123_traderlink_communities_discord_feature_access", source: traderLinkCommunitiesDiscordFeatureAccessMigration},
  {migrationId: "0124_traderlink_communities_server_watchlists", source: traderLinkCommunitiesServerWatchlistsMigration},
  {migrationId: "0126_traderlink_communities_workspace_tools", source: traderLinkCommunitiesWorkspaceToolsMigration},
  {migrationId: "0127_traderlink_communities_coaching_workspace", source: traderLinkCommunitiesCoachingWorkspaceMigration},
  {migrationId: "0128_traderlink_communities_coaching_programs", source: traderLinkCommunitiesCoachingProgramsMigration},
  {migrationId: "0129_traderlink_communities_coaching_plan_builder", source: traderLinkCommunitiesCoachingPlanBuilderMigration},
  {migrationId: "0130_traderlink_communities_coaching_service_measurement", source: traderLinkCommunitiesCoachingServiceMeasurementMigration},
  {migrationId: "0131_traderlink_communities_review_coaching_sections", source: traderLinkCommunitiesReviewCoachingSectionsMigration},
  {migrationId: "0143_traderlink_communities_review_workflow", source: traderLinkCommunitiesReviewWorkflowMigration},
  {migrationId: "0144_traderlink_communities_review_workspace_metadata", source: traderLinkCommunitiesReviewWorkspaceMetadataMigration},
  {migrationId: "0145_traderlink_communities_coaching_delivery_workflow", source: traderLinkCommunitiesCoachingDeliveryWorkflowMigration},
  {migrationId: "0159_platform_coaching_commission_terms", source: platformCoachingCommissionTermsMigration},
  {migrationId: "0160_platform_coaching_review_request_acceptance", source: platformCoachingReviewRequestAcceptanceMigration},
  {migrationId: "0161_platform_coaching_content_delivery_receipts", source: platformCoachingContentDeliveryReceiptsMigration},
  {migrationId: "0162_platform_coaching_delivery_attempt_history", source: platformCoachingDeliveryAttemptHistoryMigration},
  {migrationId: "0163_platform_community_publication_feedback", source: platformCommunityPublicationFeedbackMigration},
  {migrationId: "0164_platform_coaching_deletion_archives", source: platformCoachingDeletionArchivesMigration},
  {migrationId: "0168_platform_community_destination_publishers", source: platformCommunityDestinationPublishersMigration},
  {migrationId: "0169_platform_community_removal_recovery", source: platformCommunityRemovalRecoveryMigration},
  {migrationId: "0170_platform_community_publication_revision_actions", source: platformCommunityPublicationRevisionActionsMigration},
] as const);

export type CoachingHistoricalMigrationId = typeof historicalSources[number]["migrationId"];
export type CoachingHistoricalAppendOrders = Readonly<Record<CoachingHistoricalMigrationId, number>>;
export type AssignedCoachingMigrationIdentity = Readonly<Pick<
  PlatformMigration, "moduleNamespace" | "migrationId" | "executionOrder"
>>;
export type AssignedCurrentCoachingMigrationIdentities = Readonly<{
  payment: AssignedCoachingMigrationIdentity;
  independent: AssignedCoachingMigrationIdentity;
  admission: AssignedCoachingMigrationIdentity;
}>;

function requireRelativeOrder(sources: readonly PlatformMigration[]): void {
  // The existing contract rejects malformed/duplicate identities and orders.
  validatePlatformMigrationManifest(sources);
  for (let index = 1; index < sources.length; index += 1) {
    if (sources[index - 1].executionOrder >= sources[index].executionOrder) {
      platformFailure("TRADERLINK_MIGRATION_ORDER_CONFLICT", {
        migrationId: sources[index].migrationId,
        executionOrder: sources[index].executionOrder,
      });
    }
  }
}

/** Copies only the approved historical sources; never mutates the originals. */
export function createHistoricalCoachingMigrationSources(
  orders: CoachingHistoricalAppendOrders,
): readonly PlatformMigration[] {
  if (!orders || typeof orders !== "object" || Array.isArray(orders)) {
    platformFailure("TRADERLINK_MIGRATION_ORDER_CONFLICT", {field: "coachingAppendOrders"});
  }
  const expected = new Set<string>(historicalSources.map(entry => entry.migrationId));
  const supplied = Object.keys(orders);
  if (supplied.length !== expected.size || supplied.some(id => !expected.has(id))) {
    platformFailure("TRADERLINK_MIGRATION_ORDER_CONFLICT", {field: "coachingAppendOrders"});
  }
  const sources = historicalSources.map(({migrationId, source}) => {
    if (source.migrationId !== migrationId) {
      platformFailure("TRADERLINK_MIGRATION_FILE_ID_MISMATCH", {migrationId});
    }
    return Object.freeze({...source, executionOrder: orders[migrationId]});
  });
  requireRelativeOrder(sources);
  return Object.freeze(sources);
}

function currentSource(
  identity: AssignedCoachingMigrationIdentity,
  statements: readonly string[],
): PlatformMigration {
  if (!identity || typeof identity !== "object" || Array.isArray(identity)) {
    platformFailure("TRADERLINK_MIGRATION_CHECKSUM_MISMATCH", {field: "coachingMigrationIdentity"});
  }
  return Object.freeze({
    moduleNamespace: identity.moduleNamespace,
    migrationId: identity.migrationId,
    executionOrder: identity.executionOrder,
    statements,
  });
}

/** Fixed source sequence; every namespace, ID and order must be supplied. */
export function createCurrentCoachingMigrationSources(
  identities: AssignedCurrentCoachingMigrationIdentities,
): readonly PlatformMigration[] {
  if (!identities || typeof identities !== "object" || Array.isArray(identities)) {
    platformFailure("TRADERLINK_MIGRATION_CHECKSUM_MISMATCH", {field: "coachingMigrationIdentities"});
  }
  const sources = Object.freeze([
    currentSource(identities.payment, coachingDirectPaymentStatements),
    currentSource(identities.independent, independentCoachingStatements),
    currentSource(identities.admission, Object.freeze([COMMUNITY_ADMISSION_STORAGE_DRAFT])),
  ]);
  requireRelativeOrder(sources);
  return sources;
}

/** Also rejects collisions between the historical and three current sources.
 * The final full manifest must still validate against the immutable canonical
 * prefix and any separately approved held/relocated source.
 */
export function createCoachingSchemaMigrationSources(input: Readonly<{
  historicalOrders: CoachingHistoricalAppendOrders;
  current: AssignedCurrentCoachingMigrationIdentities;
}>): readonly PlatformMigration[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    platformFailure("TRADERLINK_MIGRATION_CHECKSUM_MISMATCH", {field: "coachingMigrationSources"});
  }
  const sources = Object.freeze([
    ...createHistoricalCoachingMigrationSources(input.historicalOrders),
    ...createCurrentCoachingMigrationSources(input.current),
  ]);
  requireRelativeOrder(sources);
  return sources;
}
