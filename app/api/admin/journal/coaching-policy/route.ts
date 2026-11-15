import {withJournalAdminRequest,journalAdminJson,journalAdminUnavailable} from '../admin-route-runtime';
import {requireJournalAdminMutationRequest} from '@/src/modules/platform/server/administration/platform-admin-request-security';
import {readCoachingCommercialPolicy,saveCoachingCommercialPolicy,saveCoachCommissionRate} from '@/src/modules/communities/server/coaching-commercial-policy';
export const runtime='nodejs';
export async function GET(request:Request){
 try{return withJournalAdminRequest(request,db=>{
  const query=new URL(request.url).searchParams,scope=query.get('scope')==='community'?'community':'platform',communityId=query.get('communityId')??undefined;
  const policy=readCoachingCommercialPolicy(db,{scope,communityId});
  const row=db.prepare('SELECT coalesce(max(revision),0) revision FROM traderlink_coaching_commercial_policies WHERE scope=? AND scope_key=?').get(scope,scope==='platform'?'platform':communityId??'') as {revision:number};
  return journalAdminJson({policy,revision:row.revision});
 });}catch(error){return journalAdminUnavailable(error);}
}
export async function POST(request:Request){
 try{
  requireJournalAdminMutationRequest(request);withJournalAdminRequest(request,()=>true);
  const body=await request.text();if(body.length>4000)return journalAdminJson({error:'Policy form is too large.'},413);
  const raw=JSON.parse(body) as Record<string,unknown>;
  if(raw?.action==='coach_rate'){
   if(typeof raw.coachUserId!=='string'||typeof raw.expectedRevision!=='number'||raw.basisPoints!==null&&typeof raw.basisPoints!=='number')return journalAdminJson({error:'Check the coach commission rate.'},400);
   return withJournalAdminRequest(request,(db,owner)=>{saveCoachCommissionRate(db,{coachUserId:raw.coachUserId as string,expectedRevision:raw.expectedRevision as number,basisPoints:raw.basisPoints as number|null,ownerUserId:owner.userId,atUtc:new Date().toISOString()});return journalAdminJson({saved:true});});
  }
  if(!raw||!['community','platform'].includes(String(raw.scope))||typeof raw.expectedRevision!=='number'||typeof raw.commissionEnabled!=='boolean'||typeof raw.commissionBasisPoints!=='number'||typeof raw.coachSubscriptionRequired!=='boolean'||raw.communityId!==undefined&&typeof raw.communityId!=='string')return journalAdminJson({error:'Check the policy form.'},400);
  return withJournalAdminRequest(request,(db,owner)=>{
   const policy=saveCoachingCommercialPolicy(db,{scope:raw.scope as 'community'|'platform',communityId:raw.communityId as string|undefined,expectedRevision:raw.expectedRevision as number,commissionEnabled:raw.commissionEnabled as boolean,commissionBasisPoints:raw.commissionBasisPoints as number,coachSubscriptionRequired:raw.coachSubscriptionRequired as boolean,ownerUserId:owner.userId,atUtc:new Date().toISOString()});return journalAdminJson({policy});
  });
 }catch(error){return journalAdminUnavailable(error);}
}
