import {timingSafeEqual} from "node:crypto";
import {openPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {CoachingDiscordRefreshService} from "@/src/modules/communities/server/coaching-discord-refresh-service";
import {CoachingAgreementService} from "@/src/modules/communities/server/coaching-agreement-service";
import {coachingEntitlement,archivePausedCoaching} from "@/src/modules/communities/server/coaching-access-lifecycle";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET?.trim(),authorization=request.headers.get("authorization");
 if(!secret||!authorization)return Response.json({ok:false},{status:401});
 const expected=Buffer.from(`Bearer ${secret}`),actual=Buffer.from(authorization);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return Response.json({ok:false},{status:401});
 const db=openPlatformDatabase({mode:"runtime"});
 try{
  const atUtc=new Date().toISOString(),token=process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim();
  const access=token?await new CoachingDiscordRefreshService(db,token).runAvailable(25,atUtc):{refreshed:0,unavailable:0};
  const rows=db.prepare(`SELECT agreement.agreement_id,relationship.community_id,relationship.relationship_id,relationship.coach_user_id FROM traderlink_community_coaching_relationships relationship JOIN traderlink_community_coaching_agreements agreement ON agreement.relationship_id=relationship.relationship_id AND agreement.status='accepted' WHERE relationship.status='active' AND (agreement.last_scheduled_at_utc IS NULL OR agreement.last_scheduled_at_utc<?) ORDER BY coalesce(agreement.last_scheduled_at_utc,''),agreement.agreement_id LIMIT 25`).all(new Date(Date.parse(atUtc)-3600000).toISOString()) as {agreement_id:string;community_id:string;relationship_id:string;coach_user_id:string}[];
  let created=0,failed=0;const service=new CoachingAgreementService(db);
  for(const row of rows){
   db.prepare(`UPDATE traderlink_community_coaching_agreements SET last_scheduled_at_utc=? WHERE agreement_id=?`).run(atUtc,row.agreement_id);
   if(!coachingEntitlement(db,row.relationship_id)?.present)continue;
   try{created+=service.generate({communityId:row.community_id,relationshipId:row.relationship_id,actor:{userId:row.coach_user_id,displayName:"Coach",discordRoleIds:[]},atUtc,throughDate:new Date(Date.parse(atUtc)+31*86400000).toISOString().slice(0,10)});}catch{failed++;}
  }
  const archived=archivePausedCoaching(db,atUtc);
  return Response.json({ok:failed===0,access,created,failed,archived,roleRefreshConfigured:Boolean(token)},{headers:{"Cache-Control":"no-store"}});
 }finally{db.close();}
}
