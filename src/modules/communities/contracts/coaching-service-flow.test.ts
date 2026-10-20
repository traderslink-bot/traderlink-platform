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
import {coachingReviewRequirements} from '../server/coaching-review-required-work';
import {coachingReviewResourceScope} from '../server/coaching-review-resource-scope';
import {writeCoachingTradeFeedback} from './coaching-trade-feedback';
import type {TraderLinkCommunityCoachingPlanItem} from './traderlink-community-platform-contracts';
const NOW='2026-10-19T20:00:00.000Z';
let db:Database.Database;
afterEach(()=>{vi.restoreAllMocks();db?.close();});
function fixture(){
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
 const work={...base,reviewId};
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
 expect(f.platform.readSnapshot('qa-review',f.actor).tradeReviews.find(r=>r.reviewId===reviewId)?.sharedGoals).toEqual(goals);
 if(type!=='performance_review'){
 f.programs.selectTrades({...work,roundTripIds:[trades[0].roundTripId]});
 f.programs.selectTrades({...work,actor:f.student,roundTripIds:[trades[1].roundTripId]});
 if(type==='trading_day_review')expect(()=>f.programs.selectTrades({...work,roundTripIds:[trades[2].roundTripId]})).toThrow();
 for(const trade of trades.slice(0,2))f.programs.saveTradeReview({...work,roundTripId:trade.roundTripId,feedback:writeCoachingTradeFeedback({summary:`Review ${trade.symbol}`,focus:{rules:'Recorded evidence',journal:'Shared note'}})});
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
 const studentView=f.platform.readSnapshot('qa-review',f.student).tradeReviews.find(r=>r.reviewId===reviewId)!;
 expect(studentView.coachFeedback).toBe('Public overall assessment');expect(studentView.coachPrivateNotes).toBe('');expect(studentView.sharedGoals).toEqual(goals);
 f.programs.markReviewViewed({...work,actor:f.student});
 f.programs.setReviewLifecycle({...work,state:ending});
 if(ending==='cancelled'){
 expect(()=>coachingReviewResourceScope(db,resource)).toThrow();
 expect(()=>f.programs.saveFocusFeedback({...work,feedback:{rules:'Forbidden edit'}})).toThrow();
 expect(()=>f.programs.deliverReview(work)).toThrow();
 }
 expect(db.prepare('SELECT terms_json FROM traderlink_community_coaching_agreements WHERE agreement_id=?').get(agreementId)).toEqual(frozen);
 expect(f.platform.readSnapshot('qa-review',f.student).tradeReviews.find(r=>r.reviewId===reviewId)?.deliveryState).toBe(ending);
 expect(f.platform.readSnapshot('qa-review',f.student).tradeReviews.find(r=>r.reviewId===reviewId)?.coachFeedback).toBe('Public overall assessment');
 expect(db.pragma('foreign_key_check')).toEqual([]);
 });
});
