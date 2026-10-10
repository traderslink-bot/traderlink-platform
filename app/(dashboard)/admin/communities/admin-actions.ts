"use server";

import { revalidatePath } from "next/cache";

import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityAdminRepository } from "@/src/modules/communities/server/traderlink-community-admin-repository";
import { parseCommissionHundredths } from "@/src/modules/communities/contracts/coaching-commission-settings";

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
export async function setCommunityStatusAction(data:FormData):Promise<void>{await withJournalAdminPageDatabase((database,scope)=>new TraderLinkCommunityAdminRepository(database).setCommunityStatus({actorUserId:scope.userId,communityId:field(data,"communityId"),status:field(data,"status") as "active"|"paused"|"suspended",atUtc:createCanonicalUtcTimestamp()}));revalidateCommunityAdministration();}
