import {aggregateJournalTradeStoryPerformance,journalTradeStoryPerformanceFromRow} from "../../journal/server/trade-story/journal-trade-story-performance";
import {coachingCurrentTrades} from "../contracts/coaching-current-trades";
import {JournalLogicalTradeRepository} from "../../journal/server/logical-trades/journal-logical-trade-repository";
import type Database from "better-sqlite3";
import {coachingEntitlement} from "./coaching-access-lifecycle";
import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
import { assertCanonicalUuidV4, platformFailure } from "../../platform/server/database/platform-migration-contract";
import { JournalAnalyticsFactSetRepository } from "../../journal/server/analytics/journal-analytics-fact-set-repository";
import { normalizeJournalAnalyticsFacts } from "../../journal-analytics/server/normalize-journal-analytics-facts";
import { readJournalTradeStory,readJournalTradeStoryAnnotations, type JournalTradeStoryReadModel } from "../../journal/server/trade-story/journal-trade-story-read-service";
import type {JournalTrackedExecution} from "../../journal/contracts/journal-trade-tracker-contracts";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";
import {narrowWorkspaceAccessToAccount} from "../../platform/contracts/workspace-access-scope";
import {JournalAnnotationRepository} from "../../journal/server/annotations/journal-annotation-repository";
import {JournalAnnotationService} from "../../journal/server/annotations/journal-annotation-service";
import {JournalRuleRepository} from "../../journal/server/annotations/journal-rule-repository";

export type CoachStudentJournalSnapshot=Readonly<{
  studentName:string; accountName:string;
  dataScope:"summary"|"trades"|"journal"|"analytics"|"complete";
  coverage:string; closedTrades:number; openTrades:number;
  pendingDecisions:number; symbols:number;
  periodStart:string|null; periodEnd:string|null;
  comparison:Readonly<{closedTrades:number;openTrades:number;symbols:number}>|null;
  trades:readonly CoachStudentJournalTrade[];
}>;

export type CoachStudentJournalTrade=Readonly<{roundTripId:string;currentTradeId?:string;symbol:string;direction:"long"|"short";openedAtUtc:string;closedAtUtc:string|null;tradingDate?:string;state:string;quantityDecimal:string|null;entryPriceDecimal:string|null;exitPriceDecimal:string|null;netPnlDecimal:string|null;grossPnlDecimal:string|null;currency:string}>;
export type CoachStudentTradeDetails=Readonly<{representativeRoundTripId:string;trade:CoachStudentJournalTrade;story:Pick<JournalTradeStoryReadModel,"notes"|"ruleReviews"|"tags">&Readonly<{executions:readonly JournalTrackedExecution[]}>}>;

export class TraderLinkCommunityCoachJournalReadService{
  constructor(private readonly database:Database.Database){}
  readAnalysisScope(input:Readonly<{coachUserId:string;relationshipId:string}>):Readonly<{scope:WorkspaceAccessScope;canReadTrades:boolean}>{
    const {grant,scope}=this.grant(input);
    // Independent grants are additive only within this relationship and selected account.
    const grants=this.database.prepare(`SELECT data_scope,shared_fields_json FROM traderlink_community_journal_grants
      WHERE relationship_id=? AND coach_user_id=? AND student_user_id=? AND journal_account_id=? AND status='active'`)
      .all(input.relationshipId,input.coachUserId,grant.student_user_id,grant.journal_account_id) as {data_scope:string;shared_fields_json:string}[];
    if(!grants.some(item=>["complete","analytics"].includes(item.data_scope)||(JSON.parse(item.shared_fields_json) as string[]).includes("analytics")))platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_analytics_read"});
    return {scope,canReadTrades:grants.some(item=>["trades","complete"].includes(item.data_scope))};
  }

  readReviewContext(input:Readonly<{coachUserId:string;relationshipId:string;periodStart?:string;periodEnd?:string;selectedIds?:readonly string[];includeRules:boolean;includeJournal:boolean;includeDayJournal?:boolean}>){
    const {grant,scope}=this.grant(input);
    const fields=JSON.parse(grant.shared_fields_json) as string[];
    const permits=(field:string)=>grant.data_scope==="complete"||fields.includes(field);
    const shared=this.read(input);
    const trades=coachingCurrentTrades(input.selectedIds?shared.trades.filter(trade=>input.selectedIds!.includes(trade.roundTripId)):shared.trades);
    const accountScope=narrowWorkspaceAccessToAccount(scope,grant.journal_account_id);
    const annotations=new JournalAnnotationService(new JournalAnnotationRepository(this.database),new JournalRuleRepository(this.database));
    const rulesAllowed=input.includeRules&&permits("rules")&&["trades","complete"].includes(grant.data_scope);
    const notesAllowed=input.includeJournal&&permits("trade_notes")&&["trades","complete"].includes(grant.data_scope);
    const tagsAllowed=input.includeJournal&&permits("tags")&&["trades","complete"].includes(grant.data_scope);
    const dayRulesAllowed=Boolean(input.includeDayJournal&&input.includeRules&&permits("day_rules"));
    const dayRules:{date:string;title:string;status:string;note:string}[]=[];
    if(dayRulesAllowed&&input.periodStart&&input.periodEnd){const first=Date.parse(input.periodStart),last=Date.parse(input.periodEnd);if(Number.isFinite(first)&&Number.isFinite(last)&&last>=first&&last-first<=366*86400000){const repository=new JournalAnnotationRepository(this.database);const ruleRepository=new JournalRuleRepository(this.database);const titles=new Map(ruleRepository.list(accountScope).map(rule=>[rule.ruleId,rule.title]));for(let day=first;day<=last;day+=86400000){const date=new Date(day).toISOString().slice(0,10);const tradingDayId=repository.findTradingDayId(accountScope,date);if(tradingDayId)for(const rule of annotations.listRuleReviews(accountScope,{tradingDayId,roundTripIds:[]}))dayRules.push({date,title:titles.get(rule.ruleId)??"Rule",status:rule.status,note:rule.note});}}}
    const dayNotesAllowed=Boolean(input.includeDayJournal&&input.includeJournal&&permits("journal_notes"));
    const sources=new Map(trades.map(trade=>[trade.roundTripId,(rulesAllowed||notesAllowed||tagsAllowed)?readJournalTradeStoryAnnotations(scope,trade.currentTradeId??trade.roundTripId):null] as const));
    const rules=new Map<string,{title:string;followed:number;broken:number;notReviewed:number}>();
    if(rulesAllowed)for(const source of sources.values())for(const item of source?.ruleReviews??[]){const row=rules.get(item.ruleId)??{title:item.ruleTitle,followed:0,broken:0,notReviewed:0};if(item.status==='followed')row.followed++;else if(item.status==='broken')row.broken++;else row.notReviewed++;rules.set(item.ruleId,row);}
    const dayNotes:{date:string;currentFocus:string;whatWorked:string;whatNeedsWork:string;technicalRecap:string;tomorrowsFocus:string;anythingElse:string}[]=[];
    // Only an explicitly bounded period may read trading-day Journal notes.
    if(dayNotesAllowed&&input.periodStart&&input.periodEnd){const first=Date.parse(input.periodStart),last=Date.parse(input.periodEnd);if(Number.isFinite(first)&&Number.isFinite(last)&&last>=first&&last-first<=366*86400000){for(let day=first;day<=last;day+=86400000){const date=new Date(day).toISOString().slice(0,10);const note=annotations.readDailyNote(accountScope,date);const actualDay=Boolean(note)||trades.some(trade=>trade.tradingDate===date);const currentFocus=actualDay?annotations.readCurrentFocus(accountScope,date):"";if(note||currentFocus)dayNotes.push({date,currentFocus,whatWorked:note?.whatWorked??"",whatNeedsWork:note?.whatNeedsWork??"",technicalRecap:note?.technicalRecap??"",tomorrowsFocus:note?.tomorrowsFocus??"",anythingElse:note?.anythingElse??""});}}}
    const metrics=(rows:readonly CoachStudentJournalTrade[])=>{const currencies=[...new Set(rows.map(trade=>trade.currency))];return currencies.map(currency=>{const closed=rows.filter(trade=>trade.currency===currency&&trade.state==="ready_closed");const net=closed.every(trade=>trade.netPnlDecimal!==null);const values=closed.map(trade=>net?trade.netPnlDecimal:trade.grossPnlDecimal);const covered=values.filter((value):value is string=>value!==null);return {currency,closedTrades:closed.length,coveredTrades:covered.length,basis:net?"Net P/L":"Gross P/L",pnl:covered.length===closed.length&&closed.length?covered.reduce((total,value)=>total.plus(value),new Decimal(0)).toFixed():null,winners:covered.filter(value=>new Decimal(value).gt(0)).length,losers:covered.filter(value=>new Decimal(value).lt(0)).length};});};
    let previous:ReturnType<typeof metrics>|null=null;let previousPeriod:{start:string;end:string}|null=null;
    if(!input.selectedIds&&input.periodStart&&input.periodEnd){const start=Date.parse(input.periodStart),end=Date.parse(input.periodEnd),span=end-start+86400000;if(span>0&&span<=367*86400000){const prior=this.read({...input,periodStart:new Date(start-span).toISOString().slice(0,10),periodEnd:new Date(start-86400000).toISOString().slice(0,10)});previous=metrics(coachingCurrentTrades(prior.trades));previousPeriod={start:new Date(start-span).toISOString().slice(0,10),end:new Date(start-86400000).toISOString().slice(0,10)};}}
    return {coverage:shared.coverage,tradeCount:trades.length,metrics:metrics(trades),previous,previousPeriod,rulesAllowed,notesAllowed,tagsAllowed,dayNotesAllowed,dayRulesAllowed,dayRules,
      rules:[...rules.values()].sort((a,b)=>b.broken-a.broken||a.title.localeCompare(b.title)),
      journal:trades.flatMap(trade=>{const source=sources.get(trade.roundTripId),note=notesAllowed?source?.notes:null,tags=tagsAllowed?source?.tags??[]:[];return note||tags.length?[{roundTripId:trade.roundTripId,symbol:trade.symbol,date:trade.tradingDate??trade.openedAtUtc.slice(0,10),tradeNote:note?.tradeNote??'',technicalNote:note?.technicalNote??'',tags:tags.map(tag=>tag.name)}]:[];}),dayNotes};
  }

  private grant(input:Readonly<{coachUserId:string;relationshipId:string}>){
    assertCanonicalUuidV4(input.coachUserId,"coachUserId");
    assertCanonicalUuidV4(input.relationshipId,"relationshipId");
    const relationship=this.database.prepare(`SELECT community_id,coach_user_id FROM traderlink_community_coaching_relationships WHERE relationship_id=? AND status='active' AND archived_at_utc IS NULL`).get(input.relationshipId) as {community_id:string;coach_user_id:string}|undefined;
    if(!relationship||relationship.coach_user_id!==input.coachUserId)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_journal_read"});
    const entitlement=this.database.prepare(`SELECT CASE WHEN plan.required_discord_role_id IS NULL THEN 1 ELSE EXISTS(SELECT 1 FROM traderlink_communities community JOIN platform_discord_memberships membership ON membership.guild_id=community.discord_guild_id JOIN json_each(membership.role_ids_json) role ON role.value=plan.required_discord_role_id WHERE community.community_id=relationship.community_id AND membership.user_id=relationship.student_user_id) END role_present FROM traderlink_community_coaching_relationships relationship JOIN traderlink_community_coaching_plans plan ON plan.plan_id=relationship.plan_id WHERE relationship.relationship_id=?`).get(input.relationshipId) as {role_present:number}|undefined;
    if(!entitlement||!coachingEntitlement(this.database,input.relationshipId)?.present)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coaching_access_paused"});
    new TraderLinkCommunityRepository(this.database).requireCapability(relationship.community_id,input.coachUserId,"community.coaching.students");
    // Choose the most recently explicitly shared account before ranking its scopes.
    // Include revoked grants when choosing the account: revocation must not silently
    // switch a review back to an older account that still has a complete grant.
    const accounts=this.database.prepare(`SELECT DISTINCT journal_account_id FROM traderlink_community_journal_grants
      WHERE relationship_id=? AND coach_user_id=? AND granted_at_utc=(SELECT MAX(granted_at_utc) FROM traderlink_community_journal_grants WHERE relationship_id=? AND coach_user_id=?)`)
      .all(input.relationshipId,input.coachUserId,input.relationshipId,input.coachUserId) as {journal_account_id:string}[];
    if(accounts.length!==1)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_journal_account_selection"});
    const grant=this.database.prepare(`SELECT g.student_user_id,g.journal_account_id,g.data_scope,g.shared_fields_json,
  u.display_name student_name,a.display_name account_name,a.workspace_id
FROM traderlink_community_journal_grants g
JOIN traderlink_community_coaching_relationships r ON r.relationship_id=g.relationship_id
JOIN platform_users u ON u.user_id=g.student_user_id
JOIN journal_accounts a ON a.account_id=g.journal_account_id
WHERE g.relationship_id=? AND g.coach_user_id=? AND g.journal_account_id=? AND g.status='active' AND r.status='active'
ORDER BY CASE g.data_scope WHEN 'complete' THEN 5 WHEN 'trades' THEN 4 WHEN 'analytics' THEN 3 WHEN 'journal' THEN 2 ELSE 1 END DESC,g.granted_at_utc DESC LIMIT 1`).get(input.relationshipId,input.coachUserId,accounts[0].journal_account_id) as {student_user_id:string;journal_account_id:string;data_scope:CoachStudentJournalSnapshot["dataScope"];shared_fields_json:string;student_name:string;account_name:string;workspace_id:string}|undefined;
    if(!grant)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_journal_read"});
    const scope:WorkspaceAccessScope=Object.freeze({userId:grant.student_user_id,workspaceId:grant.workspace_id,workspaceRole:"owner",allowedAccountIds:Object.freeze([grant.journal_account_id]),activeAccountId:grant.journal_account_id});
    return {grant,scope};
  }

  read(input:Readonly<{coachUserId:string;relationshipId:string;periodStart?:string;periodEnd?:string}>):CoachStudentJournalSnapshot{
    const {grant,scope}=this.grant(input);
    const facts=new JournalAnalyticsFactSetRepository(this.database).read(scope,{accountIds:Object.freeze([grant.journal_account_id]),closingDateRange:Object.freeze({kind:"all_available"}),currencySelection:Object.freeze({kind:"all_partitions"})});
    const datePattern=/^\d{4}-\d{2}-\d{2}$/u;const periodStart=input.periodStart&&datePattern.test(input.periodStart)?input.periodStart:null;const periodEnd=input.periodEnd&&datePattern.test(input.periodEnd)?input.periodEnd:null;
    const tradingDate=(value:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:facts.accounts[0]?.tradingTimezone??"UTC",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
    const normalized=new Map(normalizeJournalAnalyticsFacts(facts).realizedRows.map(row=>[row.roundTripId,row] as const));
    const physical=facts.roundTrips.map((trade):CoachStudentJournalTrade=>{
     const row=normalized.get(trade.roundTripId),performance=row?journalTradeStoryPerformanceFromRow(row):null;
     return coachingTradeStoryFacts({roundTripId:trade.roundTripId,currentTradeId:trade.roundTripId,symbol:trade.displayedSymbol,direction:trade.direction,openedAtUtc:trade.openedAtUtc,closedAtUtc:trade.closedAtUtc,tradingDate:tradingDate(trade.closedAtUtc??trade.openedAtUtc),state:trade.projectionState,quantityDecimal:row?.enteredQuantityDecimal??null,entryPriceDecimal:performance?.entryPriceDecimal??null,exitPriceDecimal:performance?.exitPriceDecimal??null,netPnlDecimal:row?.netPnlDecimal??null,grossPnlDecimal:row?.grossPnlDecimal??null,currency:trade.tradeCurrency},{performance,symbol:trade.displayedSymbol,direction:trade.direction,timezone:facts.accounts[0]?.tradingTimezone??"UTC"});
    });
    const byId=new Map(physical.map(trade=>[trade.roundTripId,trade]));
    // Share the exact normal Details calculation, without preloading ledgers.
    // Project before date filtering; retain physical/logical IDs as aliases.
    const projected=new Map<string,CoachStudentJournalTrade>(),logicalAliases:CoachStudentJournalTrade[]=[];
    for(const group of new JournalLogicalTradeRepository(this.database).list(narrowWorkspaceAccessToAccount(scope,grant.journal_account_id))){
     if(group.members.length<2||!group.members.every(member=>byId.has(member.roundTripId)))continue;
     const first=byId.get(group.members[0]!.roundTripId)!;
     const memberPerformance=group.members.map(member=>normalized.get(member.roundTripId)).map(row=>row?journalTradeStoryPerformanceFromRow(row):null);
     const performance=memberPerformance.every(value=>value!==null)?aggregateJournalTradeStoryPerformance(memberPerformance.filter((value):value is NonNullable<typeof value>=>value!==null)):null;
     const source={performance,symbol:group.symbol,direction:group.direction,timezone:facts.accounts[0]?.tradingTimezone??'UTC'};
     const aggregate=coachingTradeStoryFacts({...first,currentTradeId:group.logicalTradeId??first.roundTripId,openedAtUtc:group.openedAtUtc,closedAtUtc:group.closedAtUtc,tradingDate:tradingDate(group.closedAtUtc),quantityDecimal:null,entryPriceDecimal:null,exitPriceDecimal:null,netPnlDecimal:null,grossPnlDecimal:null},source);
     for(const member of group.members)projected.set(member.roundTripId,{...aggregate,roundTripId:member.roundTripId});
     if(group.logicalTradeId)logicalAliases.push({...aggregate,roundTripId:group.logicalTradeId});
    }
    const all=[...physical.map(trade=>projected.get(trade.roundTripId)??trade),...logicalAliases];
    const current=all.filter(trade=>(!periodStart||trade.tradingDate!>=periodStart)&&(!periodEnd||trade.tradingDate!<=periodEnd));
    const unique=coachingCurrentTrades(current),ready=unique.filter(trade=>trade.state==='ready_closed'),opened=unique.filter(trade=>trade.state==='legitimate_open');
    let comparison:CoachStudentJournalSnapshot['comparison']=null;
    if(periodStart&&periodEnd){
     const start=Date.parse(periodStart),end=Date.parse(periodEnd),span=end-start+86400000;
     const prior=coachingCurrentTrades(all.filter(trade=>{const date=trade.tradingDate!;return date>=new Date(start-span).toISOString().slice(0,10)&&date<=new Date(start-86400000).toISOString().slice(0,10);}));
     comparison=Object.freeze({closedTrades:prior.filter(trade=>trade.state==='ready_closed').length,openTrades:prior.filter(trade=>trade.state==='legitimate_open').length,symbols:new Set(prior.map(trade=>trade.symbol)).size});
    }
    const coverageStates=facts.accounts[0]?.coverage.rebuilds.latestByChain.map(item=>item.coverageState)??[];
    const coverage=!coverageStates.length?"unavailable":coverageStates.some(state=>state==="unavailable")?"unavailable":coverageStates.some(state=>state==="partial")?"partial":"complete";
    // Legacy database values remain readable, but only an explicit trade-history
    // or complete grant may expose individual trade rows. A journal-only value
    // must never be interpreted as permission to reveal trades.
    const showTrades=["trades","complete"].includes(grant.data_scope);
    return Object.freeze({studentName:grant.student_name,accountName:grant.account_name,dataScope:grant.data_scope,coverage,closedTrades:ready.length,openTrades:opened.length,pendingDecisions:facts.pendingDecisions.length,symbols:new Set(unique.map(trade=>trade.symbol)).size,periodStart,periodEnd,comparison,trades:showTrades?Object.freeze([...current].sort((a,b)=>b.openedAtUtc.localeCompare(a.openedAtUtc)).map(trade=>Object.freeze(trade))):Object.freeze([])});
  }

  readTradeCard(input:Readonly<{coachUserId:string;relationshipId:string;roundTripId:string}>):JournalTradeStoryReadModel{
    const {scope}=this.grant(input);
    const {story,representativeRoundTripId}=this.readTrade(input);
    const source=readJournalTradeStory(scope,representativeRoundTripId);
    let analysisShared=false;try{const access=this.readAnalysisScope(input);analysisShared=access.canReadTrades&&access.scope.activeAccountId===scope.activeAccountId;}catch{}
    return {...source,notes:story.notes,ruleReviews:story.ruleReviews,tags:story.tags,hasCurrentAnalyzerResult:analysisShared&&source.hasCurrentAnalyzerResult};
  }

  readTrade(input:Readonly<{coachUserId:string;relationshipId:string;roundTripId:string}>):CoachStudentTradeDetails{
    const {grant,scope}=this.grant(input);
    if(!["trades","complete"].includes(grant.data_scope))platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_trade_read"});
    const snapshot=this.read(input);
    const account=narrowWorkspaceAccessToAccount(scope,grant.journal_account_id);
    const logical=new JournalLogicalTradeRepository(this.database).findByLogicalTradeId(account,input.roundTripId);
    const representativeRoundTripId=logical?.members[0]?.roundTripId??input.roundTripId;
    if(logical&&(!logical.members.length||!logical.members.every(member=>snapshot.trades.some(row=>row.roundTripId===member.roundTripId))))platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_trade_read"});
    let trade=snapshot.trades.find(item=>item.roundTripId===input.roundTripId);
    if(!trade&&logical){const first=snapshot.trades.find(row=>row.roundTripId===representativeRoundTripId);if(first)trade={...first,roundTripId:input.roundTripId};}
    if(!trade)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_trade_read"});
    // Native Details expects a member ID. Keep the original review ID on trade.
    const source=readJournalTradeStory(scope,representativeRoundTripId);
    trade=coachingTradeStoryFacts(trade,source);
    const fields:unknown=JSON.parse(grant.shared_fields_json);
    const permits=(field:string)=>grant.data_scope==="complete"||(Array.isArray(fields)&&fields.includes(field));
    const story=Object.freeze({executions:source.status==="ready"?source.executions:Object.freeze([]),notes:permits("trade_notes")?source.notes:null,ruleReviews:permits("rules")?source.ruleReviews:Object.freeze([]),tags:permits("tags")?source.tags:Object.freeze([])});
    return Object.freeze({trade,story,representativeRoundTripId});
  }
}

/** Same financial/date facts for the table, period checks and native Details. */
function coachingTradeStoryFacts(trade:CoachStudentJournalTrade,source:Pick<JournalTradeStoryReadModel,"performance"|"symbol"|"direction"|"timezone">):CoachStudentJournalTrade{
 const performance=source.performance;if(!performance)return trade;
 const tradingDate=new Intl.DateTimeFormat('en-CA',{timeZone:source.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(performance.closedAtUtc));
 return {...trade,symbol:source.symbol,direction:source.direction,openedAtUtc:performance.openedAtUtc,closedAtUtc:performance.closedAtUtc,tradingDate,quantityDecimal:performance.enteredQuantityDecimal,entryPriceDecimal:performance.entryPriceDecimal,exitPriceDecimal:performance.exitPriceDecimal,netPnlDecimal:performance.netPnlDecimal,grossPnlDecimal:performance.grossPnlDecimal,currency:performance.tradeCurrency};
}
