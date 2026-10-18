import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import {coachingRequiredAccess} from "@/src/modules/communities/contracts/coaching-required-access";
export function coachingSharingRequirements(snapshot:TraderLinkCommunityDashboardSnapshot,relationshipId:string){
 const accepted=snapshot.coachingAgreements?.filter(a=>a.relationshipId===relationshipId&&a.status==='accepted').sort((a,b)=>b.revision-a.revision)[0];
 const required=[...new Set([...(accepted?coachingRequiredAccess(accepted.terms.items,accepted.terms.builderConfig):[]),...snapshot.tradeReviews.filter(r=>r.relationshipId===relationshipId&&r.deliveryState==='draft').flatMap(r=>r.requiredJournalAccess??[])])];
 const accountId=snapshot.viewer.activeJournalAccountId;
 const all=snapshot.journalGrants.filter(g=>g.relationshipId===relationshipId);
 const latest=all.map(g=>g.grantedAtUtc).sort().at(-1);
 const latestAccounts=new Set(all.filter(g=>g.grantedAtUtc===latest).map(g=>g.journalAccountId));
 const current=latestAccounts.size===1&&latestAccounts.has(accountId??'');
 const active=snapshot.journalGrants.filter(g=>g.relationshipId===relationshipId&&g.journalAccountId===accountId&&g.status==='active');
 const missing=required.filter(scope=>!current||!active.some(g=>g.dataScope==='complete'||g.dataScope===scope||(g.dataScope==='trades'&&g.sharedFields?.includes(scope))));
 return {required,missing,accountId};
}
