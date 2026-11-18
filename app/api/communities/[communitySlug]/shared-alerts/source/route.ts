import { sharedAlertsMigrationCarrier, sharedProductionPrerequisitesReady, sharedProductionRequiredTables } from "@/src/modules/platform/server/database/platform-shared-alerts-production-carrier";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireCommunityOwnerReviewIdentity } from "@/src/modules/communities/server/community-owner-review-request-identity";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { calculatePlatformMigrationChecksum } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = Readonly<{ params: Promise<{ communitySlug: string }> }>;
const headers = { "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };
function unavailable() { return Response.json({ status: "error", message: "Shared alert publishing is not available yet." }, { status: 503, headers }); }
function invalid() { return Response.json({ status: "error", message: "The community in this request does not match this page." }, { status: 400, headers }); }

/** Source registration is authored only; flag, selected manifest and actual read-only schema must all qualify. */
async function handle(request: Request, context: Context): Promise<Response> {
  if (process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED !== "1"
    && process.env.TRADERLINK_SHARED_ALERTS_OWNER_REVIEW_ENABLED !== "1") return unavailable();
  try {
    const { communitySlug } = await context.params;
    if (communitySlug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(communitySlug)) return invalid();
    const url = new URL(request.url);
    if (url.pathname !== `/api/communities/${communitySlug}/shared-alerts/source`) return invalid();
    if (request.method === "GET") {
      if (url.searchParams.getAll("communitySlug").length !== 1 || url.searchParams.get("communitySlug") !== communitySlug) return invalid();
    } else {
      if (url.search) return invalid();
      requirePlatformMutationRequest(request);
    }
    // Source manifest selection check performs no DB query or migration.
    const { platformMigrationManifest } = await import("@/src/modules/platform/server/database/platform-migration-manifest");
    const carrier = sharedAlertsMigrationCarrier;
    if (carrier.state !== "selected" || typeof carrier.carrierIdentity !== "string" || !carrier.carrierIdentity.trim() || !Array.isArray(carrier.requiredMigrations) || carrier.requiredMigrations.length !== 2) return unavailable();
    const requirements = carrier.requiredMigrations;
    if (requirements.some(row => !row) || new Set(requirements.map(row => row.migrationId)).size !== 2 || new Set(requirements.map(row => row.executionOrder)).size !== 2 || requirements.some(row => !row || !["0171_traderlink_community_shared_alerts", "0177_traderlink_community_shared_alert_individuals"].includes(row.migrationId) || row.moduleNamespace !== "community" || !Number.isSafeInteger(row.executionOrder) || row.executionOrder <= 0 || !/^[a-f0-9]{64}$/u.test(row.checksumSha256))) return unavailable();
    for (const required of requirements) {
      const selected = platformMigrationManifest.filter(row => row.migrationId === required.migrationId);
      if (selected.length !== 1 || selected[0].moduleNamespace !== required.moduleNamespace || selected[0].executionOrder !== required.executionOrder || calculatePlatformMigrationChecksum(selected[0]) !== required.checksumSha256) return unavailable();
    }
    const [http, actions] = await Promise.all([
      import("@/src/modules/communities/server/shared-alerts-source-http"),
      import("@/app/(dashboard)/communities/shared-alerts/shared-alerts-source-actions"),
    ]);
    if (typeof http.handleSharedAlertsSourceHttp !== "function" || typeof actions.executeSharedAlertsSourceMutation !== "function") return unavailable();
    requireCommunityOwnerReviewIdentity(requireTraderLinkPlatformRequestIdentity(request.headers));
    // Metadata ONLY before any source read/mutation/provider operation. Never create/upgrade a DB here.
    const ready = withReadonlyPlatformDatabase({}, database => {
      if (!sharedProductionPrerequisitesReady(database, platformMigrationManifest, carrier.prerequisiteMigrations, sharedProductionRequiredTables)) return false;
      for (const migration of requirements) {
        const applied = database.prepare("SELECT module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations WHERE migration_id=?").get(migration.migrationId) as { module_namespace: string; execution_order: number; checksum_sha256: string } | undefined;
        if (!applied || applied.module_namespace !== migration.moduleNamespace || applied.execution_order !== migration.executionOrder || applied.checksum_sha256 !== migration.checksumSha256) return false;
      }
      for (const table of ["traderlink_community_alerts", "traderlink_community_discord_destinations", "traderlink_community_publication_receipts", "traderlink_community_publication_distribution", "traderlink_community_destination_publishers", "traderlink_community_destination_audit", "traderlink_community_publication_revisions", "community_alert_discord_authors", "community_alert_publisher_permissions", "community_shared_alert_requests", "community_shared_alert_owner_checks", "community_shared_alert_rate_limits", "community_shared_alert_routes", "community_shared_alert_deliveries", "community_shared_alert_delivery_parts"])
        if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(table)) return false;
      return true;
    });
    if (!ready) return unavailable();
    return await http.handleSharedAlertsSourceHttp(request, async original => {
      // HTTP adapter has already bounded the body. Clone for scope inspection only;
      // exact original Request still reaches its real authentication/mutation checks.
      if (original !== request) throw new Error("Original request required");
      const form = await original.clone().formData();
      const scopes = form.getAll("communitySlug");
      if (scopes.length !== 1 || scopes[0] !== communitySlug) return { status: "error", message: "The community in this form does not match this page." };
      return actions.executeSharedAlertsSourceMutation(original);
    });
  } catch {
    return Response.json({ status: "error", message: "Shared alert publishing is unavailable. Check your sign-in and community access." }, { status: 403, headers });
  }
}

export async function GET(request: Request, context: Context): Promise<Response> { return handle(request, context); }
export async function POST(request: Request, context: Context): Promise<Response> { return handle(request, context); }
