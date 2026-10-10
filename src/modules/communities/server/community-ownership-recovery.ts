import type Database from "better-sqlite3";
import {TraderLinkCommunityAdminRepository} from "./traderlink-community-admin-repository";
import {verifyCommunityOwner} from "./community-onboarding-service";
import {isFreshCommunityEvidence} from "./community-launch-policy";
import {PlatformDiscordMembershipRepository} from "../../platform/server/authentication/platform-discord-membership-repository";
import {assertCanonicalUtcTimestamp,assertCanonicalUuidV4,createCanonicalUuidV4} from "../../platform/server/database/platform-migration-contract";

export function recoverCommunityOwnership(database:Database.Database,input:{actorUserId:string;communityId:string;newOwnerUserId:string;evidence:Awaited<ReturnType<typeof verifyCommunityOwner>>;atUtc:string}):void{
 new TraderLinkCommunityAdminRepository(database).requireOperator(input.actorUserId);
 assertCanonicalUuidV4(input.communityId,'communityId');assertCanonicalUuidV4(input.newOwnerUserId,'newOwnerUserId');assertCanonicalUtcTimestamp(input.atUtc,'atUtc');
 if(!isFreshCommunityEvidence(input.evidence.verifiedAtUtc,input.atUtc))throw new Error('Refresh Discord ownership verification.');
 database.transaction(()=>{
  const community=database.prepare("SELECT discord_guild_id,owner_user_id,status FROM traderlink_communities WHERE community_id=?").get(input.communityId) as {discord_guild_id:string;owner_user_id:string;status:string}|undefined;
  if(!community||community.discord_guild_id!==input.evidence.guildId||community.status==='suspended')throw new Error('Community recovery is unavailable.');
  const identity=database.prepare("SELECT 1 FROM platform_auth_identities i JOIN platform_users u ON u.user_id=i.user_id AND u.status='active' WHERE i.user_id=? AND i.auth_provider='discord' AND i.status='active' AND i.auth_subject=?").get(input.newOwnerUserId,input.evidence.discordUserId);
  const membership=database.prepare("SELECT status FROM traderlink_community_memberships WHERE community_id=? AND user_id=?").get(input.communityId,input.newOwnerUserId) as {status:string}|undefined;
  if(!identity||membership?.status==='suspended')throw new Error('An active linked Discord account is required.');
  database.prepare("UPDATE platform_discord_memberships SET guild_owner=0 WHERE guild_id=?").run(community.discord_guild_id);
  new PlatformDiscordMembershipRepository(database).upsertCurrent({userId:input.newOwnerUserId,guildId:community.discord_guild_id,username:input.evidence.username,globalDisplayName:input.evidence.globalDisplayName,avatarHash:input.evidence.avatarHash,roleIds:input.evidence.roleIds,guildOwner:true,joinedAtUtc:input.evidence.joinedAtUtc,verifiedAtUtc:input.evidence.verifiedAtUtc});
  database.prepare("INSERT INTO traderlink_community_memberships(community_id,user_id,status,discord_verified_at_utc,first_verified_at_utc,updated_at_utc) VALUES(?,?,'active',?,?,?) ON CONFLICT(community_id,user_id) DO UPDATE SET status='active',discord_verified_at_utc=excluded.discord_verified_at_utc,updated_at_utc=excluded.updated_at_utc").run(input.communityId,input.newOwnerUserId,input.evidence.verifiedAtUtc,input.evidence.verifiedAtUtc,input.atUtc);
  database.prepare("UPDATE traderlink_communities SET owner_user_id=?,status='active',updated_at_utc=? WHERE community_id=?").run(input.newOwnerUserId,input.atUtc,input.communityId);
  database.prepare("INSERT INTO traderlink_community_owner_events(owner_event_id,community_id,previous_owner_user_id,owner_user_id,actor_user_id,event_type,created_at_utc) VALUES(?,?,?,?,?,?,?)").run(createCanonicalUuidV4(),input.communityId,community.owner_user_id,input.newOwnerUserId,input.actorUserId,community.owner_user_id===input.newOwnerUserId?'reverified':'transferred',input.atUtc);
  // Relationship participants, notes, messages and Journal grants are intentionally untouched.
 }).immediate();
}
