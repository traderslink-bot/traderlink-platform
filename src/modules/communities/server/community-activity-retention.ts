import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";

export const COMMUNITY_NAMED_ACTIVITY_RETENTION_DAYS = 90;

// Mirrors community-activity-scope.ts for legacy records. Identifiers are not
// supplied by users; path and slug remain SQL column values, never SQL text.
const allowedContentPath = `(path = '/communities/' || c.slug OR (
  substr(path,1,length('/communities/' || c.slug || '/')) = '/communities/' || c.slug || '/'
  AND (
    substr(path,length('/communities/' || c.slug || '/')+1) IN ('alerts','watchlists','server-watchlists','coaches')
    OR (
      substr(path,length('/communities/' || c.slug || '/')+1,instr(substr(path,length('/communities/' || c.slug || '/')+1),'/')-1) IN ('alerts','watchlists','server-watchlists','coaches')
      AND length(substr(path,length('/communities/' || c.slug || '/')+1+instr(substr(path,length('/communities/' || c.slug || '/')+1),'/'))) > 0
      AND substr(path,length('/communities/' || c.slug || '/')+1+instr(substr(path,length('/communities/' || c.slug || '/')+1),'/')) NOT GLOB '*[^a-zA-Z0-9_-]*'
    )
  )
))`;

/** Bounded cleanup includes idle communities and the user-identifiable daily rollup. */
export function pruneCommunityNamedActivity(db: Database.Database, atUtc: string, limit = 500) {
  assertCanonicalUtcTimestamp(atUtc, "atUtc");
  if (!Number.isInteger(limit) || limit < 1 || limit > 5000) throw new Error("Invalid activity cleanup batch size.");
  const cutoff = new Date(Date.parse(atUtc) - COMMUNITY_NAMED_ACTIVITY_RETENTION_DAYS * 86_400_000).toISOString();
  const prune = () => {
    const events = db.prepare(`DELETE FROM traderlink_community_activity_events WHERE event_id IN (
      SELECT event_id FROM traderlink_community_activity_events WHERE occurred_at_utc < ?
      ORDER BY occurred_at_utc, event_id LIMIT ?
    )`).run(cutoff, limit).changes;
    // A daily row can straddle the cutoff: remove it when its first view expires,
    // rather than preserving that identifiable earlier view through its last view.
    const dailyMembers = db.prepare(`DELETE FROM traderlink_community_activity_daily_members
      WHERE (community_id, activity_day, path, user_id) IN (
        SELECT community_id, activity_day, path, user_id FROM traderlink_community_activity_daily_members
        WHERE first_viewed_at_utc < ? ORDER BY first_viewed_at_utc, community_id, path, user_id LIMIT ?
      )`).run(cutoff, limit).changes;
    const privateEvents = db.prepare(`DELETE FROM traderlink_community_activity_events WHERE event_id IN (
      SELECT event_id FROM traderlink_community_activity_events a JOIN traderlink_communities c ON c.community_id=a.community_id
      WHERE NOT ${allowedContentPath} ORDER BY occurred_at_utc,event_id LIMIT ?
    )`).run(limit).changes;
    const privateDailyMembers = db.prepare(`DELETE FROM traderlink_community_activity_daily_members WHERE (community_id,activity_day,path,user_id) IN (
      SELECT a.community_id,activity_day,path,user_id FROM traderlink_community_activity_daily_members a JOIN traderlink_communities c ON c.community_id=a.community_id
      WHERE NOT ${allowedContentPath} ORDER BY first_viewed_at_utc,a.community_id,path,user_id LIMIT ?
    )`).run(limit).changes;
    return { events, dailyMembers, privateEvents, privateDailyMembers };
  };
  return db.inTransaction ? prune() : db.transaction(prune).immediate();
}
