import type Database from "better-sqlite3";
import { validateDevelopmentDashboardRequest } from "../../platform/server/authentication/development-dashboard-network-boundary";

/** Explicit offline preview simulation of copied Discord evidence, never live verification. */
export function localPreviewCommunityEvidence(
 database: Database.Database,
 input: Readonly<{communityId:string;actorUserId:string;participantUserIds:readonly string[];headers:Headers;environment:NodeJS.ProcessEnv}>,
): boolean | null {
 if(input.environment.TRADERLINK_PLATFORM_PREVIEW_DISCORD_SNAPSHOT!=="1") return null;
 const selected=input.environment.TRADERLINK_PLATFORM_PREVIEW_USER_ID;
 if(!selected||selected!==input.actorUserId||!validateDevelopmentDashboardRequest(input.headers,input.environment).ok)return false;
 const users=[...new Set(input.participantUserIds)];
 if(!users.includes(selected)||users.length>3)return false;
 const community=database.prepare(`SELECT c.discord_guild_id,c.owner_user_id FROM traderlink_communities c WHERE c.community_id=? AND c.status IN ('active','setup')`).get(input.communityId) as {discord_guild_id:string;owner_user_id:string}|undefined;
 if(!community)return false;
 const cached=(userId:string)=>database.prepare(`SELECT m.guild_owner,i.auth_subject FROM platform_users u
 JOIN platform_auth_identities i ON i.user_id=u.user_id AND i.auth_provider='discord' AND i.status='active'
 JOIN platform_discord_memberships m ON m.user_id=u.user_id AND m.guild_id=?
 JOIN traderlink_community_memberships cm ON cm.user_id=u.user_id AND cm.community_id=? AND cm.status='active'
 WHERE u.user_id=? AND u.status='active'`).get(community.discord_guild_id,input.communityId,userId) as {guild_owner:number;auth_subject:string}|undefined;
 const owner=cached(community.owner_user_id);
 if(!owner||owner.guild_owner!==1||!/^\d{1,32}$/.test(owner.auth_subject))return false;
 return users.every(id=>{const member=cached(id);return Boolean(member&&/^\d{1,32}$/.test(member.auth_subject));});
}
