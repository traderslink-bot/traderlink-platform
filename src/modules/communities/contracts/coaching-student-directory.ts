import {reviewDeadline,reviewTimingProblem} from "./coaching-review-timing";
import type {TraderLinkCommunityRelationship} from './traderlink-community-platform-contracts';
import type {TraderLinkCommunityCoachingSnapshot as TraderLinkCommunityDashboardSnapshot} from "../server/traderlink-community-platform-repository";
import {coachingRequiredAccess,COACHING_ACCESS_LABELS} from './coaching-required-access';

export function coachStudentGroups(snapshot:TraderLinkCommunityDashboardSnapshot){
 const groups=new Map<string,TraderLinkCommunityRelationship[]>();
 for(const relationship of snapshot.relationships){
  if(relationship.coachUserId!==snapshot.viewer.userId||!['active','ended'].includes(relationship.status))continue;
  const group=groups.get(relationship.studentUserId)??[];group.push(relationship);groups.set(relationship.studentUserId,group);
 }
 return [...groups].map(([studentUserId,relationships])=>({studentUserId,relationships}));
}
export function coachStudentLessons(snapshot:TraderLinkCommunityDashboardSnapshot,relationships:readonly TraderLinkCommunityRelationship[]){
 const ids=new Set(relationships.filter(r=>r.coachUserId===snapshot.viewer.userId).map(r=>r.relationshipId));
 return snapshot.teachingItems.filter(lesson=>lesson.coachUserId===snapshot.viewer.userId&&lesson.status!=='draft')
  .map(lesson=>({...lesson,students:lesson.students.filter(student=>ids.has(student.relationshipId))}))
  .filter(lesson=>lesson.students.length>0);
}
export function coachStudentReviews(snapshot:TraderLinkCommunityDashboardSnapshot,relationships:readonly TraderLinkCommunityRelationship[],view:string){
 const scoped=relationships.filter(r=>r.coachUserId===snapshot.viewer.userId);
 if(['overdue','ready','upcoming'].includes(view)){const work=coachStudentWork(snapshot,scoped);return view==='overdue'?work.overdue:view==='ready'?work.ready:work.upcoming;}
 const ids=new Set(scoped.map(r=>r.relationshipId));
 return snapshot.tradeReviews.filter(review=>{
  if(!ids.has(review.relationshipId))return false;
  if(view==='all')return true;
  if(review.status==='cancelled'||review.deliveryState==='cancelled')return false;
  if(view==='delivered')return review.deliveryState!=='draft';
  if(view==='drafts')return review.deliveryState==='draft'&&review.status==='in_review';
  return review.deliveryState==='draft'||review.deliveryState==='follow_up';
 }).sort((a,b)=>(reviewDeadline(a)??'9999').localeCompare(reviewDeadline(b)??'9999'));
}
export function coachJournalAccess(snapshot:TraderLinkCommunityDashboardSnapshot,relationship:TraderLinkCommunityRelationship){
 const agreement=snapshot.coachingAgreements?.filter(a=>a.relationshipId===relationship.relationshipId&&a.status==='accepted').sort((a,b)=>b.revision-a.revision)[0];
 const required=[...new Set([...(agreement?coachingRequiredAccess(agreement.terms.items,agreement.terms.builderConfig):[]),...snapshot.tradeReviews.filter(r=>r.relationshipId===relationship.relationshipId&&['draft','follow_up'].includes(r.deliveryState)&&r.status!=='cancelled').flatMap(r=>r.requiredJournalAccess??[])])];
 const grants=snapshot.journalGrants.filter(g=>g.relationshipId===relationship.relationshipId);
 const latest=grants.map(g=>g.grantedAtUtc).sort().at(-1);
 const accounts=new Set(grants.filter(g=>g.grantedAtUtc===latest).map(g=>g.journalAccountId));
 const active=accounts.size===1?grants.filter(g=>accounts.has(g.journalAccountId)&&g.status==='active'):[];
 const missing=required.filter(scope=>!active.some(g=>g.dataScope==='complete'||g.dataScope===scope||(g.dataScope==='trades'&&g.sharedFields?.includes(scope))));
 const paused=relationship.accessStatus!=='active';
 return {required,missing,paused,label:paused?'Access paused':missing.length?'Access missing':required.length?'Ready':agreement?'Not required':'Agreement needed',detail:missing.map(scope=>COACHING_ACCESS_LABELS[scope]??scope).join(' · ')};
}
export function coachStudentWork(snapshot:TraderLinkCommunityDashboardSnapshot,relationships:readonly TraderLinkCommunityRelationship[]){
 const ids=new Set(relationships.map(r=>r.relationshipId));
 const reviews=snapshot.tradeReviews.filter(r=>ids.has(r.relationshipId));
 const pending=reviews.filter(r=>!r.timing?.awaitingSubmission&&r.status!=='cancelled'&&(r.deliveryState==='draft'||r.deliveryState==='follow_up'));
 const tasks=snapshot.coachingTasks.filter(t=>ids.has(t.relationshipId)&&t.status==='open');
 const sessions=snapshot.coachingSessions.filter(s=>ids.has(s.relationshipId)&&s.status==='scheduled'&&Boolean(s.scheduledAtUtc)&&(!snapshot.generatedAtUtc||s.scheduledAtUtc!>=snapshot.generatedAtUtc)).sort((a,b)=>(a.scheduledAtUtc??'').localeCompare(b.scheduledAtUtc??''));
 const due=[...pending.map(r=>r.deliveryState==='follow_up'?r.followUpDueAtUtc:r.dueAtUtc),...tasks.map(t=>t.dueAtUtc)].filter((d):d is string=>Boolean(d)).sort()[0]??null;
 const now=snapshot.generatedAtUtc??new Date().toISOString();
 const ordered=[...pending].sort((a,b)=>(reviewDeadline(a)??'9999').localeCompare(reviewDeadline(b)??'9999'));
 const overdue=ordered.filter(r=>!reviewTimingProblem(r,now)&&Boolean(reviewDeadline(r)&&reviewDeadline(r)!<now));
 const ready=ordered.filter(r=>r.acceptanceState!=='pending'&&!reviewTimingProblem(r,now)&&!overdue.includes(r));
 const upcoming=ordered.filter(r=>{const at=r.timing?.availableAtUtc;return Boolean(at&&at>now&&at<=new Date(Date.parse(now)+7*86400000).toISOString());});
 return {upcoming,reviews:pending.filter(r=>!reviewTimingProblem(r,now)||reviewTimingProblem(r,now)==='Deadline missing'),overdue,ready,tasks,sessions,nextDue:due,messages:snapshot.coachingMessages.filter(m=>ids.has(m.relationshipId)).length};
}
