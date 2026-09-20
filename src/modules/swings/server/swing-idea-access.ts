import "server-only";
import { requireTraderLinkPlatformDiscordMemberRequestIdentity, type TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { hasPlatformDiscordPremiumAccess } from "@/src/modules/watchlist/server/access/platform-discord-watchlist-entitlement";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import { resolveTraderLinkDiscordGuildId } from "@/src/modules/platform/server/authentication/platform-discord-configuration";

const verified = new Map<string,{roles:string[];until:number}>();

export async function readSwingIdeaAccess(headers: Headers): Promise<{
  identity: TraderLinkPlatformRequestIdentity | null; premium: boolean;
}> {
  let identity: TraderLinkPlatformRequestIdentity | null = null;
  try {
    identity = requireTraderLinkPlatformDiscordMemberRequestIdentity(headers);
    if (!identity.discord) return {identity,premium:false};
    const userId=identity.scope.userId, guildId=resolveTraderLinkDiscordGuildId();
    const evidence=withReadonlyPlatformDatabase({},db=>({
      member:new PlatformDiscordMembershipRepository(db).findCurrent(userId,guildId),
      subject:db.prepare<[string],{auth_subject:string}>("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord'").get(userId)?.auth_subject,
    }));
    const now=Date.now();
    // A recent OAuth membership response is already authoritative evidence.
    if(evidence.member && now-Date.parse(evidence.member.lastVerifiedAtUtc)>=0 && now-Date.parse(evidence.member.lastVerifiedAtUtc)<300000) {
      return {identity,premium:hasPlatformDiscordPremiumAccess(identity.discord)};
    }
    for(const [key,value] of verified) if(value.until<=now) verified.delete(key);
    let roles=verified.get(`${guildId}:${userId}`)?.roles;
    if(!roles) {
      const token=process.env.DISCORD_BOT_TOKEN?.trim();
      if(!token || !evidence.subject || !/^\d{1,32}$/.test(evidence.subject)) return {identity,premium:false};
      const response=await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${evidence.subject}`,{headers:{Authorization:`Bot ${token}`},cache:"no-store",signal:AbortSignal.timeout(5000)});
      if(!response.ok) return {identity,premium:false};
      const body=await response.json() as {roles?:unknown};
      if(!Array.isArray(body.roles)||!body.roles.every(r=>typeof r==="string"&&/^\d{1,32}$/.test(r))) return {identity,premium:false};
      roles=body.roles as string[];
      if(verified.size<1000) verified.set(`${guildId}:${userId}`,{roles,until:now+300000});
    }
    return {identity,premium:hasPlatformDiscordPremiumAccess({guildOwner:identity.discord.guildOwner,roleIds:roles})};
  } catch {
    // Unknown/expired sessions and unavailable entitlement evidence never expose content.
    return { identity, premium: false };
  }
}
