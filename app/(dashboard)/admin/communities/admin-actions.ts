"use server";

import { revalidatePath } from "next/cache";

import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityAdminRepository } from "@/src/modules/communities/server/traderlink-community-admin-repository";
import { parseCommissionHundredths } from "@/src/modules/communities/contracts/coaching-commission-settings";
import {verifyCommunityOwner} from "@/src/modules/communities/server/community-onboarding-service";
import {recoverCommunityOwnership} from "@/src/modules/communities/server/community-ownership-recovery";

const field=(data:FormData,key:string)=>{const value=data.get(key);if(typeof value!=="string"||!value.trim())throw new Error(`${key} is required.`);return value.trim();};
function revalidateCommunityAdministration():void{revalidatePath("/admin/journal/communities");revalidatePath("/admin/communities");}
export async function configureCommunityPartnerAction(data:FormData):Promise<void>{await withJournalAdminPageDatabase((database,scope)=>new TraderLinkCommunityAdminRepository(database).configurePartner({actorUserId:scope.userId,communityId:field(data,"communityId"),status:field(data,"status") as "disabled"|"active"|"paused",commissionBasisPoints:data.get("commissionPercent")?Math.round(Number(data.get("commissionPercent"))*100):null,attributionDays:Number(field(data,"attributionDays")),currency:field(data,"currency"),atUtc:createCanonicalUtcTimestamp()}));revalidateCommunityAdministration();}
export async function configureCommunityCoachFeeAction(data:FormData):Promise<void>{
  const minimum=String(data.get("minimumCommission")??"").trim();
  const duration=String(data.get("durationCount")??"").trim();
  await withJournalAdminPageDatabase((database,scope)=>new TraderLinkCommunityAdminRepository(database).configureCoachFee({
    actorUserId:scope.userId,communityId:field(data,"communityId"),coachUserId:data.get("coachUserId")?field(data,"coachUserId"):null,
    feeBasisPoints:parseCommissionHundredths(field(data,"feePercent"),10000),status:"disabled",
    minimumCommissionMinor:minimum?parseCommissionHundredths(minimum):null,currency:field(data,"currency"),
    durationCount:duration?Number(duration):null,durationUnit:duration?field(data,"durationUnit"):null,
    notes:String(data.get("notes")??""),atUtc:createCanonicalUtcTimestamp(),
  }));
  revalidateCommunityAdministration();
}
async function verifyAndRecover(data:FormData,newOwner:boolean):Promise<void>{
 const communityId=field(data,"communityId");
 const target=await withJournalAdminPageDatabase((database,scope)=>{
  new TraderLinkCommunityAdminRepository(database).requireOperator(scope.userId);
  const row=database.prepare(`SELECT c.discord_guild_id guildId,i.user_id userId,i.auth_subject discordId FROM traderlink_communities c JOIN platform_auth_identities i ON i.auth_provider='discord' AND i.status='active' AND ${newOwner?'i.auth_subject=?':'i.user_id=c.owner_user_id'} JOIN platform_users u ON u.user_id=i.user_id AND u.status='active' WHERE c.community_id=?`).get(...(newOwner?[field(data,'discordUserId'),communityId]:[communityId])) as {guildId:string;userId:string;discordId:string}|undefined;
  if(!row)throw new Error('Linked Discord owner account not found.');return row;
 });
 const evidence=await verifyCommunityOwner(target.guildId,target.discordId,process.env.TRADERLINK_DISCORD_BOT_TOKEN??'');
 await withJournalAdminPageDatabase((database,scope)=>recoverCommunityOwnership(database,{actorUserId:scope.userId,communityId,newOwnerUserId:target.userId,evidence,atUtc:createCanonicalUtcTimestamp()}));
}
export async function recoverCommunityOwnerAction(data:FormData):Promise<void>{await verifyAndRecover(data,true);revalidateCommunityAdministration();}
export async function setCommunityStatusAction(data:FormData):Promise<void>{if(field(data,'status')==='active')await verifyAndRecover(data,false);else await withJournalAdminPageDatabase((database,scope)=>new TraderLinkCommunityAdminRepository(database).setCommunityStatus({actorUserId:scope.userId,communityId:field(data,"communityId"),status:field(data,"status") as "paused"|"suspended",atUtc:createCanonicalUtcTimestamp()}));revalidateCommunityAdministration();}
