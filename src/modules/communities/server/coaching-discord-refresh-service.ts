import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { verifyCommunityRequestMember } from "./community-request-verification";

type Target = { slug: string; discord_guild_id: string; user_id: string };

/** Scheduling position and provider cooldown only; never authorization evidence. */
export type CoachingDiscordRefreshCursor = { after: string | null; retryAfterUtc?: string | null };
export class CoachingDiscordRefreshService {
 constructor(private readonly db: Database.Database, private readonly botToken: string, private readonly request: typeof fetch = fetch, private readonly cursor: CoachingDiscordRefreshCursor = { after: null }) {}
 async runAvailable(limit = 25, atUtc = new Date().toISOString()) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Invalid refresh batch size.");
  assertCanonicalUtcTimestamp(atUtc, "atUtc");
  if (this.cursor.retryAfterUtc && Date.parse(this.cursor.retryAfterUtc) > Date.parse(atUtc)) return { refreshed: 0, unavailable: 0 };
  this.cursor.retryAfterUtc = null;
  const cutoff = new Date(Date.parse(atUtc) - 300_000).toISOString();
  const targets = this.db.prepare(`WITH participants AS (
   SELECT community_id, student_user_id user_id FROM traderlink_community_coaching_relationships WHERE status='active' AND archived_at_utc IS NULL
   UNION
   SELECT community_id, coach_user_id user_id FROM traderlink_community_coaching_relationships WHERE status='active' AND archived_at_utc IS NULL
  ) SELECT c.slug,c.discord_guild_id,p.user_id FROM participants p
  JOIN traderlink_communities c ON c.community_id=p.community_id AND c.status='active'
  JOIN platform_auth_identities i ON i.user_id=p.user_id AND i.auth_provider='discord' AND i.status='active'
  LEFT JOIN platform_discord_memberships m ON m.user_id=p.user_id AND m.guild_id=c.discord_guild_id
  WHERE m.last_verified_at_utc IS NULL OR m.last_verified_at_utc<?
  ORDER BY CASE WHEN (c.discord_guild_id || ':' || p.user_id)>? THEN 0 ELSE 1 END,
   (c.discord_guild_id || ':' || p.user_id) LIMIT ?`).all(cutoff, this.cursor.after ?? '', limit) as Target[];
  let refreshed = 0, unavailable = 0, rateLimited = false;
  const request: typeof fetch = async (url, options) => {
   const response = await this.request(url, options);
   if (response.status === 429) {
    rateLimited = true;
    const header = Number(response.headers.get("Retry-After"));
    let bodyDelay: unknown;
    try { bodyDelay = (await response.clone().json() as { retry_after?: unknown }).retry_after; } catch { /* Use the header or conservative fallback. */ }
    const responseAt = Math.max(Date.now(), Date.parse(atUtc));
    const delays = [header, bodyDelay].filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= (8.64e15 - responseAt) / 1000);
    const delayMs = Math.ceil((delays.length ? Math.max(...delays) : 60) * 1000);
    // Use response time in production and retain deterministic future fixture time.
    const retryAt = responseAt + delayMs;
    const existing = Date.parse(this.cursor.retryAfterUtc ?? "");
    if (Number.isFinite(retryAt) && retryAt <= 8.64e15) this.cursor.retryAfterUtc = new Date(Math.max(Number.isFinite(existing) ? existing : 0, retryAt)).toISOString();
   }
   return response;
  };
  for (const target of targets) {
   const verified = await verifyCommunityRequestMember(this.db, {slug:target.slug,userId:target.user_id,botToken:this.botToken,atUtc,existingCoachingOnly:true}, request);
   // Advance after failures and suspensions too; stale evidence remains stale.
   this.cursor.after = `${target.discord_guild_id}:${target.user_id}`;
   const evidence = this.db.prepare("SELECT last_verified_at_utc FROM platform_discord_memberships WHERE user_id=? AND guild_id=?").get(target.user_id,target.discord_guild_id) as {last_verified_at_utc:string}|undefined;
   if (verified || evidence?.last_verified_at_utc === atUtc) refreshed++; else unavailable++;
   if (rateLimited) break;
  }
  return {refreshed,unavailable};
 }
}
