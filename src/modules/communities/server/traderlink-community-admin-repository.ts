import type Database from "better-sqlite3";
import {validateDormantCoachingCommission} from "../contracts/coaching-commission-settings";
import {assertCanonicalUtcTimestamp,assertCanonicalUuidV4,createCanonicalUuidV4,platformFailure} from "../../platform/server/database/platform-migration-contract";
export class TraderLinkCommunityAdminRepository {
constructor(private readonly database:Database.Database){}

requireOperator(userId:string):void{assertCanonicalUuidV4(userId,"userId");if(!this.database.prepare(`SELECT 1 FROM traderlink_community_operator_grants WHERE user_id=? AND status='active'`).get(userId))platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED",{authority:"communities_operator"});}

configureCoachFee(input: Readonly<{
    actorUserId:string; communityId:string|null; coachUserId:string|null;
    feeBasisPoints:number; status:"disabled"|"active"; notes:string; atUtc:string;
    minimumCommissionMinor?:number|null; currency?:string;
    durationCount?:number|null; durationUnit?:string|null;
  }>):string {
    this.requireOperator(input.actorUserId);
    if(input.status!=="disabled") throw new Error("Commission collection is not enabled.");
    if(input.communityId)assertCanonicalUuidV4(input.communityId,"communityId");
    if(input.coachUserId)assertCanonicalUuidV4(input.coachUserId,"coachUserId");
    assertCanonicalUtcTimestamp(input.atUtc,"atUtc");
    if(!input.communityId&&!input.coachUserId)platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED",{field:"feeTarget"});
    if(input.coachUserId&&!this.database.prepare(`SELECT 1 FROM traderlink_community_coach_profiles WHERE user_id=? AND (? IS NULL OR community_id=?)`).get(input.coachUserId,input.communityId,input.communityId)) throw new Error("Choose a coach in this community.");
    const terms=validateDormantCoachingCommission(input);
    const id=createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO traderlink_community_coach_fee_rules(fee_rule_id,community_id,coach_user_id,fee_basis_points,status,provider_key,notes,updated_by_user_id,updated_at_utc,minimum_commission_minor,currency,duration_count,duration_unit) VALUES(?,?,?,?,'disabled','future_external_provider',?,?,?,?,?,?,?)`).run(
      id,input.communityId,input.coachUserId,input.feeBasisPoints,input.notes.trim().slice(0,1000),input.actorUserId,input.atUtc,
      terms.minimumCommissionMinor,terms.currency,terms.durationCount,terms.durationUnit,
    );
    return id;
  }
}
