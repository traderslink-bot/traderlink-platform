import { isSharedAlertPublisher } from "./shared-alerts-publisher-permissions";
import type Database from "better-sqlite3";
import { createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";

export type SharedAlertPublishingContext = Readonly<{ authorUserId: string; publisherUserId: string | null; changeActorUserId: string | null; kind: "publication" | "correction" | "withdrawal"; sourceDestinationIds: readonly string[] }>;
type PublishingPolicy = {
  intent(communityId: string, kind: string, objectId: string): { distribution: "website" | "discord"; destinationIds: readonly string[] } | undefined;
  assertDelivery(communityId: string, publisherId: string | null, destinationId: string, kind: "alerts", atUtc: string): void;
};

/** Bind the actual source policy and verifier. A later editor never replaces the queued publisher. */
export function sharedAlertPublishingAuthorization(database: Database.Database, policy: PublishingPolicy, verifyPublisher: (slug: string, userId: string) => Promise<boolean>, mayChangeAlert: (communityId: string, actorId: string, alertId: string) => boolean, now: () => string = createCanonicalUtcTimestamp) {
  return {
    preparePublication: async (communityId: string, alertId: string, context: SharedAlertPublishingContext): Promise<boolean> => {
      const source = database.prepare("SELECT c.slug FROM traderlink_communities c JOIN traderlink_community_alerts a ON a.community_id=c.community_id WHERE c.community_id=? AND a.alert_id=? AND c.status='active'").get(communityId, alertId) as { slug: string } | undefined;
      if (!source || !context.publisherUserId) return false;
      const users = new Set([context.authorUserId, context.publisherUserId, ...(context.changeActorUserId ? [context.changeActorUserId] : [])]);
      for (const userId of users) if (!await verifyPublisher(source.slug, userId)) return false;
      return true;
    },
    canSharePublication: (communityId: string, alertId: string, context: SharedAlertPublishingContext): boolean => {
      if (!context.publisherUserId || !isSharedAlertPublisher(database,communityId,context.authorUserId,now(),true)) return false;
      if (!database.prepare("SELECT 1 FROM traderlink_community_alerts WHERE community_id=? AND alert_id=? AND author_user_id=?").get(communityId,alertId,context.authorUserId)) return false;
      if (!mayChangeAlert(communityId,context.authorUserId,alertId)) return false;
      const intent = policy.intent(communityId, "alert", alertId);
      // Withdrawals remain possible after the original Discord distribution is removed.
      const destinations = context.kind === "publication" ? intent?.distribution === "discord" ? intent.destinationIds : [] : context.sourceDestinationIds;
      if (!destinations.length || (context.kind !== "publication" && (!context.changeActorUserId || !mayChangeAlert(communityId, context.changeActorUserId, alertId)))) return false;
      try {
        for (const id of destinations) {
          policy.assertDelivery(communityId, context.publisherUserId, id, "alerts", now());
          if (context.changeActorUserId) policy.assertDelivery(communityId, context.changeActorUserId, id, "alerts", now());
        }
        return true;
      } catch { return false; }
    },
  };
}
