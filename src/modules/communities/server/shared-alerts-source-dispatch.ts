import "server-only";
import type Database from "better-sqlite3";
import { assertCanonicalUuidV4, createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { resolvePlatformBackgroundWorkerMode } from "../../platform/server/runtime/platform-background-worker-mode";
import {sharedAlertsStorageReady} from "./shared-alerts-storage-readiness";
import { verifyCommunityRequestMember } from "./community-request-verification";
import { SharedAlertsDelivery } from "./shared-alerts-delivery";
import { SharedAlertError } from "./shared-alerts-errors";
import { sharedAlertPublishingAuthorization } from "./shared-alerts-publishing-authorization";
import { SharedAlertRateLimits, sharedAlertAwareDiscordRequest } from "./shared-alerts-rate-limits";
import { SharedAlertsSourcePolicy } from "./shared-alerts-source-policy";
import { SharedAlertsSourcePublication } from "./shared-alerts-source-publication";

type Counts = Readonly<{ delivered: number; failed: number }>;
export type SharedSourceDispatchContext = Readonly<{
  database: Database.Database;
  policy: SharedAlertsSourcePolicy;
  request: typeof fetch;
  now: () => string;
  botToken: string;
  limit: number;
  notBeforeUtc: string | undefined;
  /** Source ONLY. Partners always render complete frozen text without this URL. */
  trackedPageUrl: (communitySlug: string, alertId: string) => string;
}>;

/** Actual source senders must persist per-part text/attempt/receipt before returning.
 * Confirmed parts never replay; uncertain writes remain held. No plan-only adapter qualifies.
 */
export type SharedSourceDispatchBindings = Readonly<{
  originals: Readonly<{
    kind: "alert-original-multipart";
    run: (context: SharedSourceDispatchContext) => Promise<Counts>;
  }>;
  edits: Readonly<{
    kind: "alert-revision-multipart";
    run: (context: SharedSourceDispatchContext) => Promise<Counts>;
  }>;
  tracker: Readonly<{
    readBoundary: "authenticated-community-audience-and-channel";
    url: (communitySlug: string, alertId: string) => string;
  }>;
}>;

/** Dormant composition; registers no worker, interval, route or schema. Every source binding is REQUIRED. */
export async function runSharedAlertsSourceDispatch(database: Database.Database, config: Readonly<{
  enabled?: boolean; sharedEnabled?: boolean; botToken: string; publicOrigin: string;
  notBeforeUtc?: string; limit?: number; now?: () => string;
}>, bindings: SharedSourceDispatchBindings, transport: typeof fetch = fetch): Promise<Counts> {
  // Preserve current canonical production/global delivery/worker-mode gates.
  // Disabled calls do not inspect a DB or require any unregistered Shared table.
  if (config.enabled !== true || process.env.NODE_ENV !== "production" || process.env.TRADERLINK_COMMUNITY_DISCORD_DELIVERY_ENABLED !== "true" || resolvePlatformBackgroundWorkerMode() !== "enabled") return { delivered: 0, failed: 0 };
  return runSharedAlertsSourcePass(database,config,bindings,transport);
}

/** Native composition shared by hosted and explicitly admitted finite staging. */
export async function runSharedAlertsSourcePass(database:Database.Database,config:Readonly<{enabled?:boolean;sharedEnabled?:boolean;botToken:string;publicOrigin:string;notBeforeUtc?:string;limit?:number;now?:()=>string}>,bindings:SharedSourceDispatchBindings,transport:typeof fetch=fetch):Promise<Counts>{
  if(!sharedAlertsStorageReady(database))throw new SharedAlertError("unavailable");
  if (!config.botToken.trim() || !bindings || bindings.originals?.kind !== "alert-original-multipart" || typeof bindings.originals.run !== "function" || bindings.edits?.kind !== "alert-revision-multipart" || typeof bindings.edits.run !== "function" || bindings.tracker?.readBoundary !== "authenticated-community-audience-and-channel" || typeof bindings.tracker.url !== "function") throw new SharedAlertError("unavailable");
  const origin = new URL(config.publicOrigin);
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) throw new SharedAlertError("invalid");
  const now = config.now ?? createCanonicalUtcTimestamp;
  const limit = config.limit ?? 5;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10) throw new SharedAlertError("invalid");
  if (config.notBeforeUtc && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(config.notBeforeUtc) || !Number.isFinite(Date.parse(config.notBeforeUtc)))) throw new SharedAlertError("invalid");
  // Schema selection is Coordinator-owned. Never initialize or migrate it here.
  for (const table of ["traderlink_community_alerts", "traderlink_community_content_deliveries", "traderlink_community_delivery_attempt_history", "traderlink_community_publication_revisions", "traderlink_community_publication_actions", "traderlink_community_publication_action_attempts", "traderlink_community_publication_distribution", "traderlink_community_destination_publishers", "community_alert_publisher_permissions", "community_shared_alert_owner_checks", "community_shared_alert_rate_limits", "community_shared_alert_requests", "community_shared_alert_routes", "community_shared_alert_deliveries", "community_shared_alert_delivery_parts"])
    if (!database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(table)) throw new SharedAlertError("unavailable");
  const policy = new SharedAlertsSourcePolicy(database);
  const request = sharedAlertAwareDiscordRequest(transport, operation => operation(database), now);
  const context: SharedSourceDispatchContext = {
    database, policy, request, now, botToken: config.botToken, limit, notBeforeUtc: config.notBeforeUtc,
    trackedPageUrl: (slug, alertId) => {
      if (slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) throw new SharedAlertError("invalid");
      assertCanonicalUuidV4(alertId, "alertId");
      const url = new URL(bindings.tracker.url(slug, alertId));
      if (url.origin !== origin.origin || url.username || url.password || url.search || url.hash || !url.pathname.startsWith(`/communities/${slug}/alerts/`)) throw new SharedAlertError("invalid");
      return url.href;
    },
  };
  const mayChangeAlert = (communityId: string, userId: string, alertId: string) => {
    try { new SharedAlertsSourcePublication(database).readForPublisher(communityId, userId, alertId, now()); return true; }
    catch { return false; }
  };
  const authorization = sharedAlertPublishingAuthorization(database, policy,
    async (slug, userId) => verifyCommunityRequestMember(database, { slug, userId, botToken: config.botToken, atUtc: now() }, request),
    mayChangeAlert, now);
  const shared = new SharedAlertsDelivery(database, {
    botToken: config.botToken,
    enabled: config.sharedEnabled === true && process.env.TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED === "1",
    now, notBeforeUtc: config.notBeforeUtc, ...authorization,
  }, request);
  let delivered = 0, failed = 0;
  // Each bound stage receives the same durable cooldown wrapper, policy and bounded pass size.
  // Its kind marker documents the contract, not verification that an unknown adapter implements it.
  for (const stage of [bindings.originals, bindings.edits]) {
    if (new SharedAlertRateLimits(database, now).current()) break;
    const result = await stage.run(context);
    if (!Number.isSafeInteger(result.delivered) || result.delivered < 0 || !Number.isSafeInteger(result.failed) || result.failed < 0) throw new SharedAlertError("invalid");
    delivered += result.delivered; failed += result.failed;
  }
  const partners = await shared.runAvailable(limit);
  return { delivered: delivered + partners.delivered, failed: failed + partners.failed };
}
