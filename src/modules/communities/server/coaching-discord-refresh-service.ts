import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { verifyCommunityRequestMember } from "./community-request-verification";

type Target = { slug: string; discord_guild_id: string; user_id: string };
export class CoachingDiscordRefreshService {
 constructor(private readonly db: Database.Database, private readonly botToken: string, private readonly request: typeof fetch = fetch) {}
 async runAvailable(limit = 25, atUtc = new Date().toISOString()) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error("Invalid refresh batch size.");
  assertCanonicalUtcTimestamp(atUtc, "atUtc");
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
  ORDER BY coalesce(m.last_verified_at_utc,''),p.user_id LIMIT ?`).all(cutoff, limit) as Target[];
  let refreshed = 0, unavailable = 0, rateLimited = false;
  const request: typeof fetch = async (url, options) => {
   const response = await this.request(url, options);
   if (response.status === 429) rateLimited = true;
   return response;
  };
  for (const target of targets) {
   const verified = await verifyCommunityRequestMember(this.db, {slug:target.slug,userId:target.user_id,botToken:this.botToken,atUtc}, request);
   const evidence = this.db.prepare("SELECT last_verified_at_utc FROM platform_discord_memberships WHERE user_id=? AND guild_id=?").get(target.user_id,target.discord_guild_id) as {last_verified_at_utc:string}|undefined;
   if (verified || evidence?.last_verified_at_utc === atUtc) refreshed++; else unavailable++;
   if (rateLimited) break;
  }
  return {refreshed,unavailable};
 }
}
