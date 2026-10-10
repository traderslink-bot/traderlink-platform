import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";

export const COMMUNITY_NAMED_ACTIVITY_RETENTION_DAYS = 90;

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
    return { events, dailyMembers };
  };
  return db.inTransaction ? prune() : db.transaction(prune).immediate();
}
