"use server";

import { revalidatePath } from "next/cache";

import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityAdminRepository } from "@/src/modules/communities/server/traderlink-community-admin-repository";

const field=(data:FormData,key:string)=>{const value=data.get(key);if(typeof value!=="string"||!value.trim())throw new Error(`${key} is required.`);return value.trim();};
export async function configureCommunityPartnerAction(data:FormData):Promise<void>{const identity=await requireTraderLinkPlatformServerComponentPageIdentity();withPlatformDatabase({mode:"runtime"},database=>new TraderLinkCommunityAdminRepository(database).configurePartner({actorUserId:identity.scope.userId,communityId:field(data,"communityId"),status:field(data,"status") as "disabled"|"active"|"paused",commissionBasisPoints:data.get("commissionPercent")?Math.round(Number(data.get("commissionPercent"))*100):null,attributionDays:Number(field(data,"attributionDays")),currency:field(data,"currency"),atUtc:createCanonicalUtcTimestamp()}));revalidatePath("/admin/communities");}
export async function configureCommunityCoachFeeAction(data:FormData):Promise<void>{const identity=await requireTraderLinkPlatformServerComponentPageIdentity();withPlatformDatabase({mode:"runtime"},database=>new TraderLinkCommunityAdminRepository(database).configureCoachFee({actorUserId:identity.scope.userId,communityId:field(data,"communityId"),coachUserId:data.get("coachUserId")?field(data,"coachUserId"):null,feeBasisPoints:Math.round(Number(field(data,"feePercent"))*100),status:field(data,"status") as "disabled"|"active",notes:String(data.get("notes")??""),atUtc:createCanonicalUtcTimestamp()}));revalidatePath("/admin/communities");}
export async function setCommunityStatusAction(data:FormData):Promise<void>{const identity=await requireTraderLinkPlatformServerComponentPageIdentity();withPlatformDatabase({mode:"runtime"},database=>new TraderLinkCommunityAdminRepository(database).setCommunityStatus({actorUserId:identity.scope.userId,communityId:field(data,"communityId"),status:field(data,"status") as "active"|"paused"|"suspended",atUtc:createCanonicalUtcTimestamp()}));revalidatePath("/admin/communities");}
