import "server-only";
import type Database from "better-sqlite3";
import { requireCommunityRequestAccess } from "../community-request-access";
import { readCommunityViewerChannels } from "../community-channel-readership";
import { TraderLinkCommunityRepository } from "../traderlink-community-repository";
import type { CommunityStatsRequestScope } from "../../contracts/community-stats-contracts";
import { platformFailure,isTraderLinkPlatformError } from "../../../platform/server/database/platform-migration-contract";
import {communityStatsStorageReady} from "./community-stats-repository";

/** Dedicated entry permission only; never adds a publication or global analytics capability. */
export function hasCommunityStatsOwnAccess(database:Database.Database,communityId:string,userId:string):boolean{
  if(!communityStatsStorageReady(database))return false;
  const settings=database.prepare(`SELECT own_content_user_ids_json FROM community_stats_settings WHERE community_id=?`).get(communityId) as {own_content_user_ids_json:string}|undefined;
  const grants:unknown=JSON.parse(settings?.own_content_user_ids_json??"[]");
  if(!Array.isArray(grants)||!grants.includes(userId))return false;
  const access=new TraderLinkCommunityRepository(database).requireCapability(communityId,userId,"community.view");
  return access.capabilities.some(capability=>["community.alerts.create","community.watchlists.publish_staff","community.coaching.offer"].includes(capability));
}

/** The authenticated actor comes from the platform session, never from a query or POST. */
export async function authorizeCommunityStats(
  database: Database.Database, slug: string, actorUserId: string, operation: "read" | "visit" | "settings" = "read",
): Promise<CommunityStatsRequestScope> {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(slug)) platformFailure("TRADERLINK_WORKSPACE_NOT_FOUND");
  await requireCommunityRequestAccess({ slug, userId: actorUserId });
  const row = database.prepare(`SELECT community_id,discord_guild_id,display_name FROM traderlink_communities
    WHERE slug=? AND status='active'`).get(slug) as {community_id:string;discord_guild_id:string;display_name:string}|undefined;
  if (!row) platformFailure("TRADERLINK_WORKSPACE_NOT_FOUND");
  const repository = new TraderLinkCommunityRepository(database);
  let access = repository.requireCapability(row.community_id, actorUserId,"community.view");
  const readableChannelIds = access.isOwner||operation==="settings"?[]:await readCommunityViewerChannels(database,slug,actorUserId,process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? "",fetch,[0,2,5,13,15,16]);
  // Re-read grants after any Discord I/O, before selecting report data or accepting settings.
  access=repository.requireCapability(row.community_id,actorUserId,"community.view");
  const settings=communityStatsStorageReady(database)?database.prepare(`SELECT own_content_user_ids_json,export_user_ids_json FROM community_stats_settings WHERE community_id=?`).get(row.community_id) as {own_content_user_ids_json:string;export_user_ids_json:string}|undefined:undefined;
  const ownGrants:unknown=JSON.parse(settings?.own_content_user_ids_json??"[]"),exportGrants:unknown=JSON.parse(settings?.export_user_ids_json??"[]");
  const ownContentOnly=!access.capabilities.includes("community.analytics.view");
  const publisher=access.capabilities.some(capability=>["community.alerts.create","community.watchlists.publish_staff","community.coaching.offer"].includes(capability));
  if(operation!=="visit"&&ownContentOnly&&!(publisher&&Array.isArray(ownGrants)&&ownGrants.includes(actorUserId)))platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  if (operation === "settings" && !access.isOwner) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  const membership = database.prepare(`SELECT role_ids_json FROM platform_discord_memberships WHERE user_id=? AND guild_id=?`)
    .get(actorUserId,row.discord_guild_id) as {role_ids_json:string}|undefined;
  const roles: unknown = JSON.parse(membership?.role_ids_json ?? "[]");
  if (!Array.isArray(roles) || roles.some(role=>typeof role!=="string")) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  return Object.freeze({communityId:row.community_id,guildId:row.discord_guild_id,slug,communityName:row.display_name,
    actorUserId,isOwner:access.isOwner,canReadNamed:!ownContentOnly&&access.capabilities.includes("community.member_activity.view"),
    ownContentOnly:operation!=="visit"&&ownContentOnly,canExport:access.isOwner||(Array.isArray(exportGrants)&&exportGrants.includes(actorUserId)),
    capabilities:access.capabilities,discordRoleIds:Object.freeze(roles as string[]),readableChannelIds});
}

export function isCommunityStatsAccessDenied(error:unknown):boolean{
  return isTraderLinkPlatformError(error)&&["TRADERLINK_WORKSPACE_ACCESS_DENIED","TRADERLINK_DASHBOARD_ACCESS_DENIED","TRADERLINK_ACCOUNT_ACCESS_DENIED","TRADERLINK_AUTH_SESSION_INVALID","TRADERLINK_WORKSPACE_NOT_FOUND","TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED"].includes(error.code);
}

export function assertStatsSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const configured = process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN;
  const expected = configured ? new URL(configured).origin : new URL(request.url).origin;
  if (!origin || origin !== expected || request.headers.get("sec-fetch-site") === "cross-site") {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
}

/** Bound memory before decoding JSON, including requests with no Content-Length. */
export async function readCommunityStatsJson(request:Request,maxBytes:number):Promise<unknown>{
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))throw new TypeError("Stats expects JSON.");
  if(Number(request.headers.get("content-length")??0)>maxBytes)throw new RangeError("Stats request exceeds its byte budget.");
  const reader=request.body?.getReader();if(!reader)throw new SyntaxError("Missing Stats request.");
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const result=await reader.read();if(result.done)break;size+=result.value.byteLength;if(size>maxBytes){await reader.cancel();throw new RangeError("Stats request exceeds its byte budget.");}chunks.push(result.value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
}
