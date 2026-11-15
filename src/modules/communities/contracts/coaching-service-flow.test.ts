// @vitest-environment node
import Database from 'better-sqlite3';
import {randomUUID} from 'node:crypto';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {platformMigrationManifest} from '../../platform/server/database/platform-migration-manifest';
import {TraderLinkCommunityRepository} from '../server/traderlink-community-repository';
import {TraderLinkCommunityPlatformRepository} from '../server/traderlink-community-platform-repository';
import {TraderLinkCommunityCoachingProgramService} from '../server/traderlink-community-coaching-program-service';
import {CoachingAgreementService} from '../server/coaching-agreement-service';
import {TraderLinkCommunityCoachJournalReadService as Journal} from '../server/traderlink-community-coach-journal-read-service';
import * as eligibility from '../server/coaching-review-trade-eligibility';
import {coachingReviewRequirements} from '../server/coaching-review-required-work';
import {coachingReviewResourceScope} from '../server/coaching-review-resource-scope';
import {writeCoachingTradeFeedback} from './coaching-trade-feedback';
import type {TraderLinkCommunityCoachingPlanItem} from './traderlink-community-platform-contracts';
import * as commercialAccess from '../server/coaching-commercial-access';
import * as studentPlatformAccess from '../server/coaching-student-platform-access';
import * as studentAdmission from '../server/coaching-coach-student-admission';
const NOW='2026-10-19T20:00:00.000Z';
let db:Database.Database;
afterEach(()=>{vi.restoreAllMocks();db?.close();});
function fixture(){
 // Isolate the review lifecycle from independently tested signup and payment admission.
 vi.spyOn(commercialAccess,'requireCoachCommercialAccess').mockReturnValue({policy:{}} as never);
 vi.spyOn(studentPlatformAccess,'requireStudentPlatformCoachingAccess').mockImplementation(()=>undefined);
 vi.spyOn(studentAdmission,'requireCoachStudentAdmission').mockImplementation(()=>undefined);

 db=new Database(':memory:');db.pragma('foreign_keys=ON');
 for(const migration of platformMigrationManifest)for(const statement of migration.statements)db.exec(statement);
 const owner=randomUUID(),coach=randomUUID(),workspace=randomUUID(),account=randomUUID(),guild='100000001';
 for(const [id,subject] of [[owner,'100000002'],[coach,'100000003']]){
 db.prepare("INSERT INTO platform_users(user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc) VALUES(?,'discord',?,?,'active',?,?)").run(id,subject,id,NOW,NOW);
 db.prepare("INSERT INTO platform_auth_identities(user_id,auth_provider,auth_subject,status,linked_by_user_id,created_at_utc,updated_at_utc,last_authenticated_at_utc) VALUES(?,'discord',?,'active',?,?,?,?)").run(id,subject,id,NOW,NOW,NOW);
 db.prepare("INSERT INTO platform_discord_memberships(user_id,guild_id,username,global_display_name,avatar_hash,role_ids_json,guild_owner,joined_at_utc,first_verified_at_utc,last_verified_at_utc) VALUES(?,?,?, ?,NULL,?,?,?,?,?)").run(id,guild,id,id,'["100000004"]',id===owner?1:0,NOW,NOW,NOW);
 }
 db.prepare("INSERT INTO platform_workspaces(workspace_id,display_name,default_trading_timezone,status,created_at_utc,updated_at_utc) VALUES(?,'QA','America/Toronto','active',?,?)").run(workspace,NOW,NOW);
 db.prepare("INSERT INTO platform_workspace_memberships(workspace_id,user_id,role,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'owner','active',?,?,?)").run(workspace,owner,owner,NOW,NOW);
 db.prepare("INSERT INTO journal_accounts(account_id,workspace_id,display_name,base_currency,trading_timezone,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'Synthetic','USD','America/Toronto','active',?,?,?)").run(account,workspace,owner,NOW,NOW);
 const permissions=new TraderLinkCommunityRepository(db),platform=new TraderLinkCommunityPlatformRepository(db);
 const communityId=permissions.createFromVerifiedDiscordOwner({ownerUserId:owner,discordGuildId:guild,slug:'qa-review',displayName:'QA Review',timestamp:NOW}).communityId;
 permissions.setStatus({communityId,actorUserId:owner,status:'active',timestamp:NOW});
 permissions.syncActiveMemberFromDiscord({communityId,userId:coach,timestamp:NOW});
 permissions.saveDiscordFeatureMapping({communityId,actorUserId:owner,discordRoleId:'100000004',discordRoleName:'Coach',responsibilities:['coach'],timestamp:NOW});
 const actor={userId:coach,displayName:'Coach',discordRoleIds:['100000004']},student={userId:owner,displayName:'Student',discordRoleIds:['100000004']};
 const profile=platform.upsertCoach({communityId,actor,userId:coach,displayName:'Coach',headline:'',biography:'',deliverySummary:'',capacity:10,active:true,atUtc:NOW});
 const audienceId=platform.ensureDefaultAudience({communityId,actorUserId:owner,atUtc:NOW});
 const programs=new TraderLinkCommunityCoachingProgramService(db),agreements=new CoachingAgreementService(db);
 return {platform,programs,agreements,communityId,actor,student,account,profile,audienceId};
}
it('moves a qualified enrollment into Students',()=>{
 const f=fixture();
 const workspace=(db.prepare('SELECT workspace_id FROM platform_workspace_memberships WHERE user_id=?').get(f.student.userId) as {workspace_id:string}).workspace_id;
 db.prepare("INSERT INTO platform_workspace_memberships(workspace_id,user_id,role,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'member','active',?,?,?)").run(workspace,f.actor.userId,f.student.userId,NOW,NOW);
 const item={planItemId:randomUUID(),ordinal:0,itemType:'trade_review',frequency:'once',coveragePeriod:'single_item',quantity:1,dueOffsetDays:2,selectionMode:'coach_or_student',followUpDays:0,measurementKind:'trades',plannedMinutes:null,timelineEnabled:true,reviewDepth:'standard',focusAreas:[]} satisfies TraderLinkCommunityCoachingPlanItem;
 const planId=f.platform.createPlan({communityId:f.communityId,actor:f.actor,coachProfileId:f.profile,name:'Enrollment notification QA',description:'Synthetic',cadence:'trade_reviews',tradeReviewLimit:1,studentCapacity:10,messagingIncluded:false,tradeReviewsIncluded:true,sessionsIncluded:false,teachingIncluded:false,priceLabel:'Free QA',priceAmountMinor:0,currency:'USD',billingCadence:'one_time',quoteRequired:false,paymentInstructions:'',audienceId:f.audienceId,requiredDiscordRoleId:'100000004',planStyle:'structured',items:[item],journalScopes:[],publish:true,atUtc:NOW});
 const relationshipId=f.platform.requestCoaching({communityId:f.communityId,actor:f.student,planId,atUtc:NOW});
 expect(db.prepare("SELECT status FROM traderlink_community_coaching_relationships WHERE relationship_id=?").get(relationshipId)).toEqual({status:'pending'});
 f.platform.setRelationshipStatus({communityId:f.communityId,actor:f.actor,relationshipId,status:'active',atUtc:NOW});
 expect(db.prepare("SELECT status FROM traderlink_community_coaching_relationships WHERE relationship_id=?").get(relationshipId)).toEqual({status:'active'});
});
describe('complete accepted coaching services with disposable current-schema data',()=>{
 it.each((['trade_review','trading_day_review','performance_review'] as const).flatMap(type=>(['completed','cancelled'] as const).map(ending=>({type,ending}))))('$type preserves consent, terms, drafts and $ending history',({type,ending})=>{
 const f=fixture();
 const item={planItemId:randomUUID(),ordinal:0,itemType:type,frequency:'once',coveragePeriod:type==='trading_day_review'?'single_item':'previous_7_days',quantity:type==='performance_review'?1:2,dueOffsetDays:2,selectionMode:'coach_or_student',followUpDays:0,measurementKind:type==='trading_day_review'?'trading_days':type==='trade_review'?'trades':'reviews',plannedMinutes:null,timelineEnabled:true,reviewDepth:'standard',focusAreas:['rules','journal','goals']} as TraderLinkCommunityCoachingPlanItem;
 const planInput={communityId:f.communityId,actor:f.actor,coachProfileId:f.profile,name:`QA ${type}`,description:'Synthetic',cadence:'trade_reviews',tradeReviewLimit:2,studentCapacity:10,messagingIncluded:true,tradeReviewsIncluded:true,sessionsIncluded:false,teachingIncluded:false,priceLabel:'Free QA',priceAmountMinor:0,currency:'USD',billingCadence:'one_time',quoteRequired:false,paymentInstructions:'',audienceId:f.audienceId,requiredDiscordRoleId:'100000004',planStyle:'structured',builderConfig:{about:'QA',offers:{trading_day_review:{details:'Two days',resources:[],includeDayJournal:true,tradeCap:{basis:'per_review',quantity:2}}}},items:[item],journalScopes:[{dataScope:'trades',required:true}],publish:true,atUtc:NOW} satisfies Parameters<TraderLinkCommunityPlatformRepository['createPlan']>[0];
 const planId=f.platform.createPlan(planInput);
 const relation=f.platform.requestCoaching({communityId:f.communityId,actor:f.student,planId,atUtc:NOW});
 expect(db.prepare('SELECT count(*) n FROM traderlink_community_journal_grants WHERE relationship_id=?').get(relation)).toEqual({n:0});
 f.platform.setRelationshipStatus({communityId:f.communityId,actor:f.actor,relationshipId:relation,status:'active',atUtc:NOW});
 const base={communityId:f.communityId,actor:f.actor,relationshipId:relation,atUtc:NOW};
 const agreementId=f.agreements.propose({...base,startDate:'2026-10-19',dueTimeUtc:'17:00'});
 expect(f.agreements.generate({...base,throughDate:'2026-10-19'})).toBe(0);
 expect(()=>f.agreements.accept({...base,agreementId})).toThrow();
 f.agreements.accept({...base,actor:f.student,agreementId});
 const frozen=db.prepare('SELECT terms_json FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(agreementId);
 f.platform.createPlan({...planInput,planId,expectedRevision:1,saveExisting:true,name:'Edited public offer',items:[{...item,quantity:3}]});
 expect(db.prepare('SELECT quantity FROM traderlink_community_coaching_plan_items WHERE plan_id=?').get(planId)).toEqual({quantity:3});
 expect(db.prepare('SELECT terms_json FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(agreementId)).toEqual(frozen);
 const grant=f.platform.grantJournal({...base,actor:f.student,journalAccountId:f.account,dataScope:'complete'});
 f.agreements.generate({...base,throughDate:'2026-10-19'});
 const reviewId=(db.prepare('SELECT work_id FROM traderlink_community_coaching_occurrences WHERE agreement_id=?').get(agreementId) as {work_id:string}).work_id;
 expect(f.platform.readCoachingSnapshot("qa-review",f.actor).tradeReviews.find(r=>r.reviewId===reviewId)?.agreedService).toMatchObject({quantity:item.quantity,planItemId:(JSON.parse((frozen as {terms_json:string}).terms_json).items as TraderLinkCommunityCoachingPlanItem[])[0].planItemId,agreementId});
 const work={...base,reviewId,atUtc:'2026-10-20T20:00:00.000Z'};
 if(type==='trading_day_review')f.programs.setSelectedDayPeriod({...work,periodStart:'2026-10-15',periodEnd:'2026-10-16'});
 const trades=['2026-10-15','2026-10-16','2026-10-16'].map((tradingDate,i)=>({roundTripId:randomUUID(),tradingDate,symbol:['BABA','INTC','PLTR'][i],direction:'long',openedAtUtc:`${tradingDate}T14:00:00.000Z`,closedAtUtc:`${tradingDate}T14:10:00.000Z`,state:'ready_closed',quantityDecimal:'1',entryPriceDecimal:'10',exitPriceDecimal:'11',grossPnlDecimal:'1',netPnlDecimal:'1',currency:'USD'}));
 // Only facts are synthetic. Every read still invokes the real current grant/account check.
 const authorize=(reader:Journal,input:{coachUserId:string;relationshipId:string})=>reader.readAnalysisScope(input);
 vi.spyOn(Journal.prototype,'read').mockImplementation(function(this:Journal,input){authorize(this,input);return {coverage:'complete',trades:trades.filter(t=>(!input.periodStart||t.tradingDate>=input.periodStart)&&(!input.periodEnd||t.tradingDate<=input.periodEnd))} as unknown as ReturnType<Journal['read']>;});
 vi.spyOn(Journal.prototype,'readTrade').mockImplementation(function(this:Journal,input){authorize(this,input);const trade=trades.find(t=>t.roundTripId===input.roundTripId);if(!trade)throw new Error('Unavailable trade');return {trade,story:{executions:[],notes:null,ruleReviews:[],tags:[]}} as unknown as ReturnType<Journal['readTrade']>;});
 vi.spyOn(Journal.prototype,'readReviewContext').mockImplementation(function(this:Journal,input){authorize(this,input);return {metrics:[],previous:[],rules:[],journal:[],dayNotes:[{date:'2026-10-15'},{date:'2026-10-16'}],dayRules:[]} as unknown as ReturnType<Journal['readReviewContext']>;});
 const goals=[{title:'Follow the plan',successMeasure:'Record stop before entry',startingPoint:'Synthetic baseline',targetDate:'2026-10-30'}];
 expect(()=>f.programs.shareReviewGoals({...work,actor:f.student,confirmed:false,goals})).toThrow();
 f.programs.shareReviewGoals({...work,actor:f.student,confirmed:true,goals});
 expect(f.platform.readCoachingSnapshot('qa-review',f.actor).tradeReviews.find(r=>r.reviewId===reviewId)?.sharedGoals).toEqual(goals);
 if(type!=='performance_review'){
 f.programs.selectTrades({...work,roundTripIds:[trades[0].roundTripId]});
 f.programs.selectTrades({...work,actor:f.student,roundTripIds:[trades[1].roundTripId]});
 if(type==='trading_day_review')expect(()=>f.programs.selectTrades({...work,roundTripIds:[trades[2].roundTripId]})).toThrow();
 for(const trade of trades.slice(0,2))f.programs.saveTradeReview({...work,roundTripId:trade.roundTripId,feedback:writeCoachingTradeFeedback({summary:`Review ${trade.symbol}`,focus:{rules:'Recorded evidence',journal:'Shared note'}})});
 }
 if(type!=='performance_review'){
  const identitySpy=vi.spyOn(eligibility,'coachingReviewIdentityKeys').mockReturnValue(new Map(trades.slice(0,2).map(t=>[t.roundTripId,trades[0].roundTripId])));
  try{expect(f.platform.readCoachingSnapshot('qa-review',f.actor).tradeReviews.find(r=>r.reviewId===reviewId)?.workTradeProgress).toEqual({selected:1,saved:1});}finally{identitySpy.mockRestore();}
 }
 if(type==='trading_day_review')for(const date of ['2026-10-15','2026-10-16'])f.programs.saveDayAssessment({...work,date,assessment:`Day ${date}`,focusFeedback:{rules:'Recorded day rule',journal:'Recorded day note',goals:'Assess goal within this day'}});
 else f.programs.saveFocusFeedback({...work,feedback:{rules:'Recorded rule evidence',journal:'Shared notes and tags',goals:'Goal assessment'}});
 f.platform.updateTradeReview({...work,coachFeedback:'Public overall assessment',wentWell:'',needsWork:'',nextFocus:'Next action',coachPrivateNotes:'PRIVATE DO NOT EXPOSE',previousFocusStatus:null,previousFocusAssessment:'',status:'in_review'});
 expect(coachingReviewRequirements(db,reviewId).ready).toBe(true);
 f.platform.revokeJournal({actorUserId:f.student.userId,grantId:grant,atUtc:NOW});
 expect(coachingReviewRequirements(db,reviewId).ready).toBe(false);expect(()=>f.programs.deliverReview(work)).toThrow();
 expect((db.prepare('SELECT coach_feedback,delivery_state FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId))).toEqual({coach_feedback:'Public overall assessment',delivery_state:'draft'});
 // Restore the agreed non-analytics fields first: saved work remains blocked
 // until Analytics alone is restored, without expanding any other sharing.
 f.platform.grantJournal({...base,actor:f.student,journalAccountId:f.account,dataScope:'trades',sharedFields:['trade_notes','tags','rules','day_rules','journal_notes']});
 const resource={coachUserId:f.actor.userId,reviewId,communitySlug:'qa-review'};
 expect(()=>coachingReviewResourceScope(db,resource)).toThrow();
 expect(coachingReviewRequirements(db,reviewId).ready).toBe(false);
 f.platform.grantJournal({...base,actor:f.student,journalAccountId:f.account,dataScope:'analytics'});
 expect(coachingReviewResourceScope(db,resource).missing).toEqual([]);
 expect(coachingReviewRequirements(db,reviewId).ready).toBe(true);
 f.programs.deliverReview(work);
 const studentView=f.platform.readCoachingSnapshot('qa-review',f.student).tradeReviews.find(r=>r.reviewId===reviewId)!;
 expect(studentView.coachFeedback).toBe('Public overall assessment');expect(studentView.coachPrivateNotes).toBe('');expect(studentView.sharedGoals).toEqual(goals);
 f.programs.markReviewViewed({...work,actor:f.student});
 f.programs.setReviewLifecycle({...work,state:ending});
 if(ending==='cancelled'){
 expect(()=>coachingReviewResourceScope(db,resource)).toThrow();
 expect(()=>f.programs.saveFocusFeedback({...work,feedback:{rules:'Forbidden edit'}})).toThrow();
 expect(()=>f.programs.deliverReview(work)).toThrow();
 }
 expect(db.prepare('SELECT terms_json FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(agreementId)).toEqual(frozen);
 expect(f.platform.readCoachingSnapshot('qa-review',f.student).tradeReviews.find(r=>r.reviewId===reviewId)?.deliveryState).toBe(ending);
 expect(f.platform.readCoachingSnapshot('qa-review',f.student).tradeReviews.find(r=>r.reviewId===reviewId)?.coachFeedback).toBe('Public overall assessment');
 expect(db.pragma('foreign_key_check')).toEqual([]);
 });
});

function acceptedTimingFixture(kind:'trade_review'|'trading_day_review'|'performance_review'|'private_session'='trade_review',selection:'coach_or_student'|'student'='coach_or_student',timeline=true,frequency:'once'|'weekly'='once',controls?:{flexible?:'calendar'|'weekdays';quantity?:number;preferences?:import('./coaching-student-review-preferences').StudentReviewPreferences;limits?:{perPeriod:number;perDay?:number}}){
 const f=fixture();const item:TraderLinkCommunityCoachingPlanItem={planItemId:randomUUID(),ordinal:0,itemType:kind,frequency,coveragePeriod:kind==='performance_review'?'previous_7_days':'single_item',quantity:controls?.quantity??1,dueOffsetDays:2,selectionMode:kind==='performance_review'?'not_applicable':selection,followUpDays:0,measurementKind:kind==='private_session'?'sessions':kind==='trade_review'?'trades':kind==='trading_day_review'?'trading_days':'reviews',plannedMinutes:null,timelineEnabled:timeline,reviewDepth:'standard',focusAreas:[]};
 const planId=f.platform.createPlan({communityId:f.communityId,actor:f.actor,coachProfileId:f.profile,builderConfig:controls?.flexible?{about:'',offers:{[kind]:{details:'',resources:[],weeklySchedule:'monday' as const,submissionSchedule:'weekend_choice' as const,deliveryDayCount:controls.flexible}}}:controls?.limits?{about:'',offers:{trade_review:{details:'',resources:[],submissionLimits:controls.limits}}}:kind==='trading_day_review'?{about:'QA',offers:{trading_day_review:{details:'Day',resources:[],tradeCap:{basis:'per_review',quantity:1}}}}:undefined,name:'Timing service',description:'Synthetic',cadence:'trade_reviews',studentCapacity:10,messagingIncluded:true,tradeReviewsIncluded:true,sessionsIncluded:false,teachingIncluded:false,priceLabel:'QA',priceAmountMinor:0,currency:'USD',billingCadence:'one_time',quoteRequired:false,paymentInstructions:'',audienceId:f.audienceId,requiredDiscordRoleId:'100000004',planStyle:'structured',items:[item],journalScopes:[],publish:true,atUtc:NOW});
 const relationshipId=f.platform.requestCoaching({communityId:f.communityId,actor:f.student,planId,atUtc:NOW});f.platform.setRelationshipStatus({communityId:f.communityId,actor:f.actor,relationshipId,status:'active',atUtc:NOW});
 const base={communityId:f.communityId,actor:f.actor,relationshipId,atUtc:NOW};const agreementId=f.agreements.propose({...base,startDate:'2026-10-19',dueTimeUtc:'17:00'});f.agreements.accept({...base,actor:f.student,agreementId,studentPreferences:controls?.preferences});
 const boundItem=(JSON.parse((db.prepare('SELECT terms_json FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(agreementId) as {terms_json:string}).terms_json).items as TraderLinkCommunityCoachingPlanItem[])[0];return {...f,base,item:boundItem,agreementId};
}
describe('review scheduling and submission rules',()=>{
 it.each(['trade_review','trading_day_review','performance_review'] as const)('%s cannot start or save during the final included trading day',kind=>{
  const f=acceptedTimingFixture(kind);f.platform.grantJournal({...f.base,actor:f.student,journalAccountId:f.account,dataScope:'complete'});const reviewId=f.programs.createReview({...f.base,planItemId:f.item.planItemId,reviewType:'custom',workspaceKind:kind==='trade_review'?'trade':kind==='trading_day_review'?'trading_day':'performance',title:'Future',context:'',periodStart:'2026-11-14',periodEnd:'2026-11-20',dueAtUtc:'2026-11-23T17:00:00.000Z',roundTripIds:[]});
  const before={...f.base,reviewId,atUtc:'2026-11-20T23:59:59.999Z'};
  expect(()=>f.programs.startReview(before)).toThrow('Available to start');
  expect(()=>f.programs.setWorkspace({...before,workspaceKind:kind==='trade_review'?'trade':kind==='trading_day_review'?'trading_day':'performance',focusAreas:[],periodStart:'2026-10-01',periodEnd:'2026-10-02'})).toThrow('cannot be changed');
  expect(()=>f.programs.saveFocusFeedback({...before,feedback:{}})).toThrow('Available to start');
  expect(()=>f.platform.updateTradeReview({...before,coachFeedback:'Bypass',wentWell:'',needsWork:'',nextFocus:'',coachPrivateNotes:'',previousFocusStatus:null,previousFocusAssessment:'',status:'in_review'})).toThrow('Available to start');
  expect(()=>coachingReviewResourceScope(db,{coachUserId:f.actor.userId,reviewId,communitySlug:'qa-review'})).toThrow('Available to start');
  expect(()=>f.programs.startReview({...before,atUtc:'2026-11-21T04:59:59.999Z'})).toThrow('Available to start');f.programs.startReview({...before,atUtc:'2026-11-21T05:00:00.000Z'});
  expect(db.prepare('SELECT status FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId)).toEqual({status:'in_review'});
 });
 it('requires deadlines and rejects deadlines before the trading period finishes',()=>{
  const f=acceptedTimingFixture();const request={...f.base,planItemId:f.item.planItemId,reviewType:'custom' as const,workspaceKind:'trade' as const,title:'Deadline',context:'',roundTripIds:[]};
  expect(()=>f.programs.createReview(request)).toThrow('deadline');
  expect(()=>f.programs.createReview({...request,periodStart:'2026-11-20',periodEnd:'2026-11-20',dueAtUtc:'2026-11-20T17:00:00.000Z'})).toThrow('deadline');
  const reviewId=f.programs.createReview({...request,dueAtUtc:'2026-10-21T17:00:00.000Z'});
  expect(()=>f.programs.setReviewDueDate({...f.base,reviewId})).toThrow('deadline');
 });
 it('student request starts its exact 48-hour deadline at submission; acceptance cannot extend it or create another entitlement',()=>{
  const f=acceptedTimingFixture('performance_review','student',false),submitted='2026-10-20T21:00:00.000Z';
  expect(f.platform.readCoachingSnapshot('qa-review',f.actor).tradeReviews).toHaveLength(0);
  const input={...f.base,actor:f.student,atUtc:submitted,planItemId:f.item.planItemId,reviewType:'custom' as const,workspaceKind:'performance' as const,title:'Submitted work',context:'Review this period',periodStart:'2026-10-13',periodEnd:'2026-10-19',roundTripIds:[]};
  const reviewId=f.programs.createReview(input);
  expect(db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId)).toEqual({due_at_utc:'2026-10-22T21:00:00.000Z'});
  expect(()=>f.programs.createReview(input)).toThrow('already has a review');
  f.programs.acceptReviewRequest({...f.base,reviewId,scope:'Agreed review',schedule:'unscheduled',atUtc:'2026-10-21T12:00:00.000Z',dueAtUtc:'2026-12-01T17:00:00.000Z'});
  expect(db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId)).toEqual({due_at_utc:'2026-10-22T21:00:00.000Z'});
  expect(()=>f.programs.setReviewDueDate({...f.base,reviewId,dueAtUtc:'2026-12-01T17:00:00.000Z'})).toThrow('turnaround');
 });
 it('student-selected scheduled work stays off the agenda until explicit submission, which is idempotent',()=>{
  const f=acceptedTimingFixture('trade_review','student');f.agreements.generate({...f.base,throughDate:'2026-10-19'});
  const reviewId=(db.prepare('SELECT work_id FROM traderlink_community_coaching_occurrences WHERE agreement_id=?').get(f.agreementId) as {work_id:string}).work_id;
  expect(f.platform.readCoachingSnapshot('qa-review',f.actor).tradeReviews[0].timing?.awaitingSubmission).toBe(true);
  expect(()=>f.programs.startReview({...f.base,reviewId})).toThrow('Awaiting student');
  expect(()=>f.programs.submitReview({...f.base,actor:f.student,reviewId})).toThrow('full trading period');
  expect(()=>f.programs.submitReview({...f.base,actor:f.student,reviewId,atUtc:'2026-10-20T21:00:00.000Z'})).toThrow('at least one trade');
  f.platform.grantJournal({...f.base,actor:f.student,journalAccountId:f.account,dataScope:'complete'});
  const trade={roundTripId:randomUUID(),tradingDate:'2026-10-15',symbol:'TEST',direction:'long',openedAtUtc:'2026-10-15T14:00:00.000Z',closedAtUtc:'2026-10-15T15:00:00.000Z',state:'ready_closed',quantityDecimal:'1',entryPriceDecimal:'10',exitPriceDecimal:'11',netPnlDecimal:'1',grossPnlDecimal:'1',currency:'USD'};
  vi.spyOn(Journal.prototype,'read').mockReturnValue({coverage:'complete',trades:[trade]} as unknown as ReturnType<Journal['read']>);
  f.programs.selectTrades({...f.base,actor:f.student,reviewId,roundTripIds:[trade.roundTripId]});
  expect(f.platform.readCoachingSnapshot('qa-review',f.actor).tradeReviews[0].timing?.awaitingSubmission).toBe(true);
  f.programs.submitReview({...f.base,actor:f.student,reviewId,atUtc:'2026-10-20T21:00:00.000Z'});
  expect(f.platform.readCoachingSnapshot('qa-review',f.actor).tradeReviews[0].timing?.awaitingSubmission).toBe(false);
  f.programs.submitReview({...f.base,actor:f.student,reviewId,atUtc:'2026-10-20T20:00:00.000Z'});
  expect(db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId)).toEqual({due_at_utc:'2026-10-21T17:00:00.000Z'});
  expect(()=>f.programs.setReviewDueDate({...f.base,reviewId,dueAtUtc:'2026-12-01T17:00:00.000Z'})).toThrow('agreed schedule');
  f.programs.startReview({...f.base,reviewId,atUtc:'2026-10-20T21:00:00.000Z'});
  expect(()=>f.programs.selectTrades({...f.base,actor:f.student,reviewId,roundTripIds:[trade.roundTripId]})).toThrow('already been submitted');
 });
});

it('future scheduled single-item reviews use their occurrence window instead of appearing ready immediately',()=>{
 const f=acceptedTimingFixture('trade_review','coach_or_student',true,'weekly');f.agreements.generate({...f.base,throughDate:'2026-11-25'});
 const reviews=f.platform.readCoachingSnapshot('qa-review',f.actor).tradeReviews;expect(reviews.length).toBeGreaterThan(1);
 for(const r of reviews){expect(r.periodEnd).toBeNull();expect(r.timing?.availableAtUtc).toBeTruthy();expect(()=>f.programs.startReview({...f.base,reviewId:r.reviewId})).toThrow('Available to start');}
});

// Regression coverage for the remaining-section QA findings.
it('session creation follows accepted services, not a coach relationship or later offer edit',()=>{
 const f=acceptedTimingFixture();
 expect(()=>f.programs.createSession({...f.base,title:'Unagreed',agenda:''})).toThrow('accepted coaching agreement');
});
it('accepted session agreements permit scheduling; proposed agreements do not',()=>{
 const f=acceptedTimingFixture('private_session');
 const id=f.programs.createSession({...f.base,title:'Agreed session',agenda:'Agenda'});
 expect(db.prepare('SELECT title FROM traderlink_community_coaching_sessions WHERE session_id=?').get(id)).toEqual({title:'Agreed session'});
 db.prepare("UPDATE traderlink_community_coaching_agreements SET status='proposed' WHERE agreement_id=?").run(f.agreementId);
 expect(()=>f.programs.createSession({...f.base,title:'Not accepted',agenda:''})).toThrow('accepted coaching agreement');
 expect(()=>f.programs.updateSession({...f.base,sessionId:id,title:'Rescheduled',agenda:'',notes:'',privateNotes:'',meetingUrl:'',durationMinutes:30,attendance:'not_recorded',status:'scheduled'})).toThrow('accepted coaching agreement');
 expect(db.prepare('SELECT title FROM traderlink_community_coaching_sessions WHERE session_id=?').get(id)).toEqual({title:'Agreed session'});
});
it('day submission rejects missing individual selections, supports reselection before submission, and preserves turnaround',()=>{
 const f=acceptedTimingFixture('trading_day_review','student');f.platform.grantJournal({...f.base,actor:f.student,journalAccountId:f.account,dataScope:'complete'});
 const reviewId=f.programs.createReview({...f.base,planItemId:f.item.planItemId,reviewType:'custom',workspaceKind:'trading_day',title:'Day submission',context:'',periodStart:'2026-10-15',periodEnd:'2026-10-16',dueAtUtc:'2026-10-21T17:00:00.000Z',roundTripIds:[]});
 const trades=['2026-10-15','2026-10-16'].map(tradingDate=>({roundTripId:randomUUID(),tradingDate,symbol:'TEST',direction:'long',openedAtUtc:tradingDate+'T14:00:00.000Z',closedAtUtc:tradingDate+'T15:00:00.000Z'}));
 const read=vi.spyOn(Journal.prototype,'read').mockReturnValue({coverage:'complete',trades} as unknown as ReturnType<Journal['read']>);
 vi.spyOn(Journal.prototype,'readReviewContext').mockReturnValue({dayNotes:[],dayRules:[]} as unknown as ReturnType<Journal['readReviewContext']>);
 const input={...f.base,actor:f.student,reviewId,atUtc:'2026-10-20T21:00:00.000Z'};
 f.programs.addStudentReviewDays({...input,days:['2026-10-15']});
 expect(()=>f.programs.submitReview(input)).toThrow('individual trades');
 read.mockReturnValue({coverage:'partial',trades:[]} as unknown as ReturnType<Journal['read']>);
 expect(()=>f.programs.submitReview(input)).toThrow('individual trades');
 read.mockReturnValue({coverage:'complete',trades} as unknown as ReturnType<Journal['read']>);
 f.programs.selectTrades({...input,roundTripIds:[trades[0].roundTripId]});
 f.programs.resetStudentReviewDays(input);
 expect(db.prepare("SELECT workflow_state FROM traderlink_community_coaching_review_trades WHERE review_id=?").get(reviewId)).toEqual({workflow_state:'removed'});
 f.programs.addStudentReviewDays({...input,days:['2026-10-16']});
 f.programs.selectTrades({...input,roundTripIds:[trades[1].roundTripId]});
 f.programs.submitReview(input);
 expect(db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId)).toEqual({due_at_utc:'2026-10-21T17:00:00.000Z'});
 expect(()=>f.programs.resetStudentReviewDays(input)).toThrow('before submission');
});

it.each(['coach_first','student_first'] as const)('assigns published plan lessons after both acceptance steps (%s), preserving completed assignments',order=>{
 const f=fixture();
 const item={planItemId:randomUUID(),ordinal:0,itemType:'group_lesson',frequency:'once',coveragePeriod:'single_item',quantity:1,dueOffsetDays:2,selectionMode:'coach_or_student',followUpDays:0,measurementKind:'lessons',plannedMinutes:null,timelineEnabled:true,reviewDepth:'standard',focusAreas:[]} as TraderLinkCommunityCoachingPlanItem;
 const planId=f.platform.createPlan({communityId:f.communityId,actor:f.actor,coachProfileId:f.profile,name:'Included lesson plan',description:'External resource',cadence:'trade_reviews',studentCapacity:10,messagingIncluded:true,tradeReviewsIncluded:false,sessionsIncluded:false,teachingIncluded:true,priceLabel:'Free QA',priceAmountMinor:0,currency:'USD',billingCadence:'one_time',quoteRequired:false,paymentInstructions:'',audienceId:f.audienceId,requiredDiscordRoleId:'100000004',planStyle:'structured',items:[item],journalScopes:[],publish:true,atUtc:NOW});
 // Existing plan catalogue before this student joins; fixtures intentionally have no prior recipients.
 const lessons=['published','completed','future','draft','cancelled','selected_students'].map(status=>{
  const id=f.programs.createTeaching({communityId:f.communityId,actor:f.actor,title:status,teachingType:'lesson',body:'External lesson',deliveryUrl:'https://example.invalid/lesson',audienceMode:status==='selected_students'?'selected_students':'plan',planId,relationshipIds:[],publish:false,atUtc:NOW});
  db.prepare('UPDATE traderlink_community_coaching_teaching_items SET status=?,available_at_utc=? WHERE teaching_id=?').run(status==='future'||status==='selected_students'?'published':status,status==='future'?'2030-01-01T00:00:00.000Z':null,id);return id;
 });
 const relationshipId=f.platform.requestCoaching({communityId:f.communityId,actor:f.student,planId,atUtc:NOW}),base={communityId:f.communityId,relationshipId,actor:f.actor,atUtc:NOW};
 const agreementId=f.agreements.propose({...base,startDate:'2026-10-19',dueTimeUtc:'17:00'});
 const accept=()=>f.agreements.accept({...base,actor:f.student,agreementId});
 const activate=()=>f.platform.setRelationshipStatus({...base,status:'active'});
 const assignments=()=>db.prepare('SELECT teaching_id,status,completed_at_utc,updated_at_utc FROM traderlink_community_coaching_teaching_students WHERE relationship_id=? ORDER BY teaching_id').all(relationshipId);
 if(order==='coach_first')activate();else accept();
 expect(assignments()).toHaveLength(0);
 if(order==='coach_first')accept();else activate();
 expect(assignments()).toHaveLength(3);
 expect(assignments().map(row=>(row as {teaching_id:string}).teaching_id).sort()).toEqual(lessons.slice(0,3).sort());
 f.programs.updateTeachingStudent({...base,actor:f.student,teachingId:lessons[0],status:'completed'});
 const saved=assignments(),terms=db.prepare('SELECT * FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(agreementId);
 accept();activate();
 expect(assignments()).toEqual(saved);
 expect(db.prepare('SELECT * FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(agreementId)).toEqual(terms);
 expect(db.prepare('SELECT count(*) n FROM traderlink_community_journal_grants WHERE relationship_id=?').get(relationshipId)).toEqual({n:0});
});

it.each(['plan','all_students','selected_students'] as const)('withholds %s lessons and preserved assignments until agreement acceptance',audienceMode=>{
 const f=fixture(),item={planItemId:randomUUID(),ordinal:0,itemType:'group_lesson',frequency:'once',coveragePeriod:'single_item',quantity:1,dueOffsetDays:2,selectionMode:'not_applicable',followUpDays:0,measurementKind:'lessons',plannedMinutes:null,timelineEnabled:true,reviewDepth:'standard',focusAreas:[]} as TraderLinkCommunityCoachingPlanItem;
 const planId=f.platform.createPlan({communityId:f.communityId,actor:f.actor,coachProfileId:f.profile,name:'Acceptance boundary',cadence:'trade_reviews',description:'External lesson',studentCapacity:10,messagingIncluded:false,tradeReviewsIncluded:false,sessionsIncluded:false,teachingIncluded:true,priceLabel:'Free QA',priceAmountMinor:0,currency:'USD',billingCadence:'one_time',quoteRequired:false,paymentInstructions:'',audienceId:f.audienceId,requiredDiscordRoleId:'100000004',planStyle:'structured',items:[item],journalScopes:[],publish:true,atUtc:NOW});
 const relationshipId=f.platform.requestCoaching({communityId:f.communityId,actor:f.student,planId,atUtc:NOW}),base={communityId:f.communityId,actor:f.actor,relationshipId,atUtc:NOW};
 f.platform.setRelationshipStatus({...base,status:'active'});const agreementId=f.agreements.propose({...base,startDate:'2026-10-19',dueTimeUtc:'17:00'});
 const lesson={communityId:f.communityId,actor:f.actor,title:'Pending lesson',teachingType:'lesson' as const,body:'Private instructions',deliveryUrl:'https://example.invalid/private',audienceMode,planId,relationshipIds:[relationshipId],atUtc:NOW};
 expect(()=>f.programs.createTeaching({...lesson,publish:true})).toThrow();
 const teachingId=f.programs.createTeaching({...lesson,publish:false}),details={...base,teachingId,title:lesson.title,body:lesson.body,deliveryUrl:lesson.deliveryUrl,recordingUrl:'',deliveryKind:'resource' as const,status:'published' as const};
 expect(()=>f.programs.updateTeachingDetails(details)).toThrow('Choose students');
 expect(db.prepare('SELECT count(*) n FROM traderlink_community_coaching_teaching_students WHERE teaching_id=?').get(teachingId)).toEqual({n:0});
 // Preserve, but do not expose or mutate, an assignment left by the old publication path.
 db.prepare("UPDATE traderlink_community_coaching_teaching_items SET status='published' WHERE teaching_id=?").run(teachingId);
 db.prepare("INSERT INTO traderlink_community_coaching_teaching_students(teaching_id,community_id,relationship_id,status,completed_at_utc,updated_at_utc) VALUES(?,?,?,'completed',?,?)").run(teachingId,f.communityId,relationshipId,NOW,NOW);
 const saved=db.prepare('SELECT * FROM traderlink_community_coaching_teaching_students WHERE teaching_id=?').get(teachingId);
 const attachmentId=f.programs.addImage({...base,targetType:'teaching',targetId:teachingId,filename:'lesson.png',mediaType:'image/png',content:Buffer.from([137,80,78,71,13,10,26,10])});
 expect(()=>f.programs.readImage({communityId:f.communityId,actor:f.student,attachmentId})).toThrow();
 expect(f.platform.readCoachingSnapshot('qa-review',f.student).coachingAttachments).toHaveLength(0);
 expect(f.platform.readCoachingSnapshot('qa-review',f.student).teachingItems.some(l=>l.teachingId===teachingId)).toBe(false);
 for(const actor of[f.actor,f.student])expect(()=>f.programs.updateTeachingStudent({...base,actor,teachingId,status:'attending'})).toThrow();
 expect(db.prepare('SELECT * FROM traderlink_community_coaching_teaching_students WHERE teaching_id=?').get(teachingId)).toEqual(saved);
 f.agreements.accept({...base,actor:f.student,agreementId});
 expect(f.platform.readCoachingSnapshot('qa-review',f.student).teachingItems.find(l=>l.teachingId===teachingId)?.students[0].status).toBe('completed');
 expect(()=>f.programs.readImage({communityId:f.communityId,actor:f.student,attachmentId})).not.toThrow();
 expect(db.prepare('SELECT * FROM traderlink_community_coaching_teaching_students WHERE teaching_id=?').get(teachingId)).toEqual(saved);
});

it('publishing new lessons or drafts skips pending students in a mixed plan cohort',()=>{
 const f=fixture(),item={planItemId:randomUUID(),ordinal:0,itemType:'group_lesson',frequency:'once',coveragePeriod:'single_item',quantity:1,dueOffsetDays:2,selectionMode:'not_applicable',followUpDays:0,measurementKind:'lessons',plannedMinutes:null,timelineEnabled:true,reviewDepth:'standard',focusAreas:[]} as TraderLinkCommunityCoachingPlanItem;
 const planId=f.platform.createPlan({communityId:f.communityId,actor:f.actor,coachProfileId:f.profile,name:'Mixed acceptance',cadence:'trade_reviews',description:'External lesson',studentCapacity:10,messagingIncluded:false,tradeReviewsIncluded:false,sessionsIncluded:false,teachingIncluded:true,priceLabel:'Free QA',priceAmountMinor:0,currency:'USD',billingCadence:'one_time',quoteRequired:false,paymentInstructions:'',audienceId:f.audienceId,requiredDiscordRoleId:'100000004',planStyle:'structured',items:[item],journalScopes:[],publish:true,atUtc:NOW});
 const oldId=f.platform.requestCoaching({communityId:f.communityId,actor:f.student,planId,atUtc:NOW}),oldBase={communityId:f.communityId,actor:f.actor,relationshipId:oldId,atUtc:NOW};f.platform.setRelationshipStatus({...oldBase,status:'active'});const oldAgreement=f.agreements.propose({...oldBase,startDate:'2026-10-19',dueTimeUtc:'17:00'});f.agreements.accept({...oldBase,actor:f.student,agreementId:oldAgreement});
 // A proposed revision must not revoke the existing accepted agreement.
 f.agreements.propose({...oldBase,startDate:'2026-10-20',dueTimeUtc:'17:00'});
 const userId=randomUUID(),subject='100000005',student={userId,displayName:'Later student',discordRoleIds:['100000004']};
 db.prepare("INSERT INTO platform_users(user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc) VALUES(?,'discord',?,'Later student','active',?,?)").run(userId,subject,NOW,NOW);
 db.prepare("INSERT INTO platform_auth_identities(user_id,auth_provider,auth_subject,status,linked_by_user_id,created_at_utc,updated_at_utc,last_authenticated_at_utc) VALUES(?,'discord',?,'active',?,?,?,?)").run(userId,subject,userId,NOW,NOW,NOW);
 db.prepare("INSERT INTO platform_discord_memberships(user_id,guild_id,username,global_display_name,avatar_hash,role_ids_json,guild_owner,joined_at_utc,first_verified_at_utc,last_verified_at_utc) VALUES(?,'100000001','Later student','Later student',NULL,'[\"100000004\"]',0,?,?,?)").run(userId,NOW,NOW,NOW);
 new TraderLinkCommunityRepository(db).syncActiveMemberFromDiscord({communityId:f.communityId,userId,timestamp:NOW});
 const relationshipId=f.platform.requestCoaching({communityId:f.communityId,actor:student,planId,atUtc:NOW}),base={...oldBase,relationshipId};f.platform.setRelationshipStatus({...base,status:'active'});const agreementId=f.agreements.propose({...base,startDate:'2026-10-19',dueTimeUtc:'17:00'});
 const lesson={communityId:f.communityId,actor:f.actor,title:'Mixed lesson',teachingType:'lesson' as const,body:'Instructions',deliveryUrl:'https://example.invalid/mixed',audienceMode:'plan' as const,planId,relationshipIds:[],atUtc:NOW};
 const published=f.programs.createTeaching({...lesson,publish:true}),draft=f.programs.createTeaching({...lesson,publish:false});f.programs.updateTeachingDetails({...base,teachingId:draft,title:lesson.title,body:lesson.body,deliveryUrl:lesson.deliveryUrl,recordingUrl:'',deliveryKind:'resource',status:'published'});
 expect(db.prepare('SELECT teaching_id FROM traderlink_community_coaching_teaching_students WHERE relationship_id=?').all(relationshipId)).toEqual([]);
 expect(f.platform.readCoachingSnapshot('qa-review',student).teachingItems).toHaveLength(0);
 f.programs.updateTeachingStudent({...oldBase,teachingId:published,status:'completed'});
 const prior=db.prepare('SELECT * FROM traderlink_community_coaching_teaching_students WHERE relationship_id=? ORDER BY teaching_id').all(oldId),terms=db.prepare('SELECT * FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(oldAgreement);
 f.agreements.accept({...base,actor:student,agreementId});
 expect(f.platform.readCoachingSnapshot('qa-review',student).teachingItems.map(l=>l.teachingId).sort()).toEqual([published,draft].sort());
 expect(db.prepare('SELECT * FROM traderlink_community_coaching_teaching_students WHERE relationship_id=? ORDER BY teaching_id').all(oldId)).toEqual(prior);
 expect(db.prepare('SELECT * FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(oldAgreement)).toEqual(terms);
});



describe('student agreement preferences and request allowances',()=>{
 it('keeps older selection with the student unless a date is approved, and retains same-coach reservations',()=>{
  const f=acceptedTimingFixture();f.platform.grantJournal({...f.base,actor:f.student,journalAccountId:f.account,dataScope:'complete'});
  const trade={roundTripId:randomUUID(),tradingDate:'2026-10-15',symbol:'TEST',direction:'long',openedAtUtc:'2026-10-15T14:00:00.000Z',closedAtUtc:'2026-10-15T15:00:00.000Z',state:'ready_closed',quantityDecimal:'1',entryPriceDecimal:'10',exitPriceDecimal:'11',netPnlDecimal:'1',grossPnlDecimal:'1',currency:'USD'};
  vi.spyOn(Journal.prototype,'read').mockReturnValue({coverage:'complete',trades:[trade]} as unknown as ReturnType<Journal['read']>);
  const input={...f.base,atUtc:'2026-10-27T18:00:00.000Z',planItemId:f.item.planItemId,reviewType:'custom' as const,workspaceKind:'trade' as const,title:'Review',context:'',periodStart:'2026-10-19',periodEnd:'2026-10-25',dueAtUtc:'2026-10-30T17:00:00.000Z',roundTripIds:[]};
  const first=f.programs.createReview(input);
  expect(()=>f.programs.selectTrades({...input,reviewId:first,roundTripIds:[trade.roundTripId]})).toThrow('inside this review period');
  f.programs.selectTrades({...input,actor:f.student,reviewId:first,roundTripIds:[trade.roundTripId]});
  const second=f.programs.createReview(input);
  expect(()=>f.programs.selectTrades({...input,actor:f.student,reviewId:second,roundTripIds:[trade.roundTripId]})).toThrow('already reviewed or reserved');
 });
 it('records a student-approved earliest date and enforces it for coach selection',()=>{
  const f=acceptedTimingFixture('trade_review','coach_or_student',true,'once',{preferences:{olderTrades:'earliest_date',earliestDate:'2026-10-15'}});
  expect((JSON.parse((db.prepare('SELECT terms_json FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(f.agreementId) as {terms_json:string}).terms_json) as import('./coaching-agreements').CoachingAgreementTerms).studentReviewPreferences).toEqual({olderTrades:'earliest_date',earliestDate:'2026-10-15'});
 });
 it('enforces cumulative period and optional daily caps across separately due requests',()=>{
  const f=acceptedTimingFixture('trade_review','coach_or_student',false,'weekly',{quantity:7,limits:{perPeriod:7,perDay:2}});
  f.platform.grantJournal({...f.base,actor:f.student,journalAccountId:f.account,dataScope:'complete'});
  const trades=Array.from({length:10},()=>({roundTripId:randomUUID(),tradingDate:'2026-10-15',symbol:'TEST',direction:'long',openedAtUtc:'2026-10-15T14:00:00.000Z',closedAtUtc:'2026-10-15T15:00:00.000Z',state:'ready_closed',quantityDecimal:'1',entryPriceDecimal:'10',exitPriceDecimal:'11',netPnlDecimal:'1',grossPnlDecimal:'1',currency:'USD'}));
  vi.spyOn(Journal.prototype,'read').mockReturnValue({coverage:'complete',trades} as unknown as ReturnType<Journal['read']>);
  const send=(indices:number[],atUtc:string)=>f.programs.createReview({...f.base,actor:f.student,atUtc,planItemId:f.item.planItemId,reviewType:'single_trade',title:'Submitted trades',context:'',roundTripIds:indices.map(index=>trades[index].roundTripId)});
  const first=send([0,1],'2026-11-02T18:00:00.000Z');
  expect(()=>send([2],'2026-11-02T20:00:00.000Z')).toThrow('daily limit');
  send([2,3],'2026-11-03T18:00:00.000Z');send([4,5],'2026-11-04T18:00:00.000Z');send([6],'2026-11-05T18:00:00.000Z');
  expect(()=>send([7],'2026-11-05T19:00:00.000Z')).toThrow('period allowance');
  send([7],'2026-11-09T18:00:00.000Z');
  expect(db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(first)).toEqual({due_at_utc:'2026-11-04T18:00:00.000Z'});
 });
});


it.each(['calendar','weekdays'] as const)('calculated schedule %s allows early community submission and retains its commitment',count=>{
 const f=acceptedTimingFixture('trade_review','student',true,'weekly',{flexible:count});
 f.platform.grantJournal({...f.base,actor:f.student,journalAccountId:f.account,dataScope:'complete'});
 f.agreements.generate({...f.base,throughDate:'2026-10-19'});
 const reviewId=(db.prepare('SELECT work_id FROM traderlink_community_coaching_occurrences WHERE agreement_id=?').get(f.agreementId) as {work_id:string}).work_id;
 const pending=f.platform.readCoachingSnapshot('qa-review',f.student).tradeReviews.find(review=>review.reviewId===reviewId);
 expect(pending).toMatchObject({dueAtUtc:count==='calendar'?'2026-10-25T17:00:00.000Z':'2026-10-27T17:00:00.000Z',timing:{awaitingSubmission:true,scheduled:true}});
 const trade={roundTripId:randomUUID(),tradingDate:'2026-10-19',symbol:'TEST',direction:'long',openedAtUtc:'2026-10-19T14:00:00.000Z',closedAtUtc:'2026-10-19T15:00:00.000Z',state:'ready_closed',quantityDecimal:'1',entryPriceDecimal:'10',exitPriceDecimal:'11',netPnlDecimal:'1',grossPnlDecimal:'1',currency:'USD'};
 vi.spyOn(Journal.prototype,'read').mockReturnValue({coverage:'complete',trades:[trade]} as unknown as ReturnType<Journal['read']>);
 const input={...f.base,reviewId,atUtc:'2026-10-20T21:00:00.000Z'};
 expect(()=>f.programs.startReview(input)).toThrow('Awaiting student');
 f.programs.selectTrades({...input,actor:f.student,roundTripIds:[trade.roundTripId]});
 f.programs.submitReview({...input,actor:f.student});
 expect(()=>f.programs.startReview(input)).not.toThrow();
 expect(db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId)).toEqual({due_at_utc:count==='calendar'?'2026-10-25T17:00:00.000Z':'2026-10-27T17:00:00.000Z'});
});

it('keeps an on-request community review undated until submission',()=>{
 const f=acceptedTimingFixture('trade_review','student',false);
 const reviewId=f.programs.createReview({...f.base,planItemId:f.item.planItemId,reviewType:'custom',workspaceKind:'trade',title:'On-request draft',context:'',dueAtUtc:'2026-10-21T17:00:00.000Z',roundTripIds:[]});
 expect(db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId)).toEqual({due_at_utc:'2026-10-21T17:00:00.000Z'});
 const pending=f.platform.readCoachingSnapshot('qa-review',f.student).tradeReviews.find(review=>review.reviewId===reviewId);
 expect(pending).toMatchObject({dueAtUtc:null,timing:{awaitingSubmission:true,scheduled:false}});
});

it('student replacement swaps only untouched submitted trades and preserves the community deadline',()=>{
 const f=acceptedTimingFixture('trade_review','student',true,'weekly',{flexible:'weekdays',quantity:2});
 f.platform.grantJournal({...f.base,actor:f.student,journalAccountId:f.account,dataScope:'complete'});f.agreements.generate({...f.base,throughDate:'2026-10-19'});
 const reviewId=(db.prepare('SELECT work_id FROM traderlink_community_coaching_occurrences WHERE agreement_id=?').get(f.agreementId) as {work_id:string}).work_id;
 const trades=Array.from({length:4},()=>({roundTripId:randomUUID(),tradingDate:'2026-10-19',symbol:'TEST',direction:'long',openedAtUtc:'2026-10-19T14:00:00.000Z',closedAtUtc:'2026-10-19T15:00:00.000Z',state:'ready_closed',quantityDecimal:'1',entryPriceDecimal:'10',exitPriceDecimal:'11',netPnlDecimal:'1',grossPnlDecimal:'1',currency:'USD'}));
 vi.spyOn(Journal.prototype,'read').mockReturnValue({coverage:'complete',trades} as unknown as ReturnType<Journal['read']>);
 vi.spyOn(Journal.prototype,'readTrade').mockReturnValue({trade:trades[1]} as unknown as ReturnType<Journal['readTrade']>);
 const input={...f.base,reviewId,atUtc:'2026-10-20T21:00:00.000Z'};
 f.programs.selectTrades({...input,actor:f.student,roundTripIds:[trades[0].roundTripId,trades[1].roundTripId]});f.programs.submitReview({...input,actor:f.student});f.programs.startReview(input);
 const swap={...input,actor:f.student,removeRoundTripId:trades[0].roundTripId,replacementRoundTripId:trades[2].roundTripId};
 expect(()=>f.programs.replaceStudentTrade(swap)).not.toThrow();
 const stale=f.programs.studentTradeReplacementState({...input,actor:f.student});expect(stale.selected.every(row=>row.canReplace)).toBe(true);
 f.programs.saveTradeReview({...input,roundTripId:trades[1].roundTripId,feedback:'Coach draft',atUtc:'2026-10-20T21:01:00.000Z'});
 expect(()=>f.programs.replaceStudentTrade({...swap,removeRoundTripId:trades[1].roundTripId,replacementRoundTripId:trades[3].roundTripId,atUtc:'2026-10-20T21:02:00.000Z'})).toThrow('coach may have saved');
 expect(()=>f.programs.replaceStudentTrade({...swap,actor:f.actor,removeRoundTripId:trades[2].roundTripId,replacementRoundTripId:trades[3].roundTripId})).toThrow();
 expect(db.prepare("SELECT count(*) n FROM traderlink_community_coaching_review_trades WHERE review_id=? AND workflow_state!='removed'").get(reviewId)).toEqual({n:2});
 expect(db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId)).toEqual({due_at_utc:'2026-10-27T17:00:00.000Z'});
 expect(f.programs.studentTradeReplacementState({...input,actor:f.student}).selected.find(row=>row.roundTripId===trades[2].roundTripId)?.canReplace).toBe(true);
});
it('student replacement keeps the same community trading day',()=>{
 const f=acceptedTimingFixture('trading_day_review','student',false);f.platform.grantJournal({...f.base,actor:f.student,journalAccountId:f.account,dataScope:'complete'});
 const reviewId=f.programs.createReview({...f.base,planItemId:f.item.planItemId,reviewType:'custom',workspaceKind:'trading_day',title:'Day selection',context:'',periodStart:'2026-10-15',periodEnd:'2026-10-16',dueAtUtc:'2026-10-24T17:00:00.000Z',roundTripIds:[]});
 const trades=['2026-10-15','2026-10-15','2026-10-16'].map(tradingDate=>({roundTripId:randomUUID(),tradingDate,symbol:'TEST',direction:'long',openedAtUtc:tradingDate+'T14:00:00.000Z',closedAtUtc:tradingDate+'T15:00:00.000Z'}));
 vi.spyOn(Journal.prototype,'read').mockReturnValue({coverage:'complete',trades} as unknown as ReturnType<Journal['read']>);
 vi.spyOn(Journal.prototype,'readReviewContext').mockReturnValue({dayNotes:[],dayRules:[]} as unknown as ReturnType<Journal['readReviewContext']>);
 const input={...f.base,actor:f.student,reviewId,atUtc:'2026-10-20T21:00:00.000Z'};
 f.programs.addStudentReviewDays({...input,days:['2026-10-15']});f.programs.selectTrades({...input,roundTripIds:[trades[0].roundTripId]});f.programs.submitReview(input);
 const original=db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId);
 expect(()=>f.programs.replaceStudentTrade({...input,removeRoundTripId:trades[0].roundTripId,replacementRoundTripId:trades[2].roundTripId})).toThrow('same selected trading day');
 expect(()=>f.programs.replaceStudentTrade({...input,removeRoundTripId:trades[0].roundTripId,replacementRoundTripId:trades[1].roundTripId})).not.toThrow();
 expect(db.prepare('SELECT due_at_utc FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId)).toEqual(original);
});
