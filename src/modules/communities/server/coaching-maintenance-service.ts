import type Database from "better-sqlite3";
import { setImmediate } from "node:timers/promises";
import { assertCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { CoachingDiscordRefreshService } from "./coaching-discord-refresh-service";
import { CoachingAgreementService } from "./coaching-agreement-service";
import { coachingEntitlement, archivePausedCoaching } from "./coaching-access-lifecycle";

/** One bounded pass; callers own the connection and must close it in finally. */
export async function runCoachingMaintenance(
  db: Database.Database,
  options: { atUtc?: string; botToken?: string; limit?: number; request?: typeof fetch } = {},
) {
  const atUtc = options.atUtc ?? new Date().toISOString();
  assertCanonicalUtcTimestamp(atUtc, "atUtc");
  const limit = options.limit ?? 5;
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new Error("Invalid maintenance batch size.");
  const token = options.botToken?.trim();
  const access = token
    ? await new CoachingDiscordRefreshService(db, token, options.request).runAvailable(limit, atUtc)
    : { refreshed: 0, unavailable: 0 };
  const rows = db.prepare(`SELECT agreement.agreement_id, relationship.community_id,
    relationship.relationship_id, relationship.coach_user_id
    FROM traderlink_community_coaching_relationships relationship
    JOIN traderlink_community_coaching_agreements agreement
      ON agreement.relationship_id=relationship.relationship_id AND agreement.status='accepted'
    JOIN traderlink_communities community ON community.community_id=relationship.community_id
    WHERE relationship.status='active' AND relationship.archived_at_utc IS NULL
      AND community.status='active'
      AND (agreement.last_scheduled_at_utc IS NULL OR agreement.last_scheduled_at_utc<?)
    ORDER BY coalesce(agreement.last_scheduled_at_utc,''), agreement.agreement_id LIMIT ?
  `).all(new Date(Date.parse(atUtc) - 3_600_000).toISOString(), limit) as {
    agreement_id: string; community_id: string; relationship_id: string; coach_user_id: string;
  }[];
  let created = 0, failed = 0;
  const service = new CoachingAgreementService(db);
  for (const row of rows) {
    // Rotate inaccessible/invalid agreements too, so they cannot starve other students.
    db.prepare(`UPDATE traderlink_community_coaching_agreements SET last_scheduled_at_utc=?
      WHERE agreement_id=? AND status='accepted'`).run(atUtc, row.agreement_id);
    if (coachingEntitlement(db, row.relationship_id)?.present) {
      try {
        created += service.generate({
          communityId: row.community_id, relationshipId: row.relationship_id,
          actor: { userId: row.coach_user_id, displayName: "Coach", discordRoleIds: [] },
          atUtc, throughDate: new Date(Date.parse(atUtc) + 31 * 86_400_000).toISOString().slice(0, 10),
        });
      } catch { failed++; }
    }
    // Let normal requests progress between each bounded agreement transaction.
    await setImmediate();
  }
  const archived = archivePausedCoaching(db, atUtc);
  return { ok: failed === 0, access, checked: rows.length, created, failed, archived, roleRefreshConfigured: Boolean(token) };
}

/** Shared by the hosted timer: a slow provider pass never overlaps the next tick. */
export function nonOverlappingCoachingMaintenance<T>(operation: () => Promise<T>) {
  let running = false;
  return async (): Promise<T | null> => {
    if (running) return null;
    running = true;
    try { return await operation(); }
    finally { running = false; }
  };
}
