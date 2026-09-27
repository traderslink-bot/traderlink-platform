import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
import { assertCanonicalUuidV4, platformFailure } from "../../platform/server/database/platform-migration-contract";
import { JournalAnalyticsFactSetRepository } from "../../journal/server/analytics/journal-analytics-fact-set-repository";
import { normalizeJournalAnalyticsFacts } from "../../journal-analytics/server/normalize-journal-analytics-facts";
import { readJournalTradeStory, type JournalTradeStoryReadModel } from "../../journal/server/trade-story/journal-trade-story-read-service";
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

export type CoachStudentJournalTrade=Readonly<{roundTripId:string;symbol:string;direction:"long"|"short";openedAtUtc:string;closedAtUtc:string|null;tradingDate?:string;state:string;quantityDecimal:string|null;entryPriceDecimal:string|null;exitPriceDecimal:string|null;netPnlDecimal:string|null;grossPnlDecimal:string|null;currency:string}>;
export type CoachStudentTradeDetails=Readonly<{trade:CoachStudentJournalTrade;story:Pick<JournalTradeStoryReadModel,"notes"|"ruleReviews"|"tags">&Readonly<{executions:readonly JournalTrackedExecution[]}>}>;

export class TraderLinkCommunityCoachJournalReadService{
  constructor(private readonly database:Database.Database){}

  readReviewContext(input:Readonly<{coachUserId:string;relationshipId:string;periodStart?:string;periodEnd?:string;selectedIds?:readonly string[];includeRules:boolean;includeJournal:boolean;includeDayJournal?:boolean}>){
    const {grant,scope}=this.grant(input);
    const fields=JSON.parse(grant.shared_fields_json) as string[];
    const permits=(field:string)=>grant.data_scope==="complete"||fields.includes(field);
    const shared=this.read(input);
    const trades=input.selectedIds?shared.trades.filter(trade=>input.selectedIds!.includes(trade.roundTripId)):shared.trades;
    const accountScope=narrowWorkspaceAccessToAccount(scope,grant.journal_account_id);
    const annotations=new JournalAnnotationService(new JournalAnnotationRepository(this.database),new JournalRuleRepository(this.database));
    const ids=trades.map(trade=>trade.roundTripId);
    const rulesAllowed=input.includeRules&&permits("rules")&&["trades","complete"].includes(grant.data_scope);
    const notesAllowed=input.includeJournal&&permits("trade_notes")&&["trades","complete"].includes(grant.data_scope);
    const tagsAllowed=input.includeJournal&&permits("tags")&&["trades","complete"].includes(grant.data_scope);
    const dayRulesAllowed=Boolean(input.includeDayJournal&&input.includeRules&&permits("day_rules"));
    const dayRules:{date:string;title:string;status:string;note:string}[]=[];
    if(dayRulesAllowed&&input.periodStart&&input.periodEnd){const first=Date.parse(input.periodStart),last=Date.parse(input.periodEnd);if(Number.isFinite(first)&&Number.isFinite(last)&&last>=first&&last-first<=366*86400000){const repository=new JournalAnnotationRepository(this.database);const ruleRepository=new JournalRuleRepository(this.database);const titles=new Map(ruleRepository.list(accountScope).map(rule=>[rule.ruleId,rule.title]));for(let day=first;day<=last;day+=86400000){const date=new Date(day).toISOString().slice(0,10);const tradingDayId=repository.findTradingDayId(accountScope,date);if(tradingDayId)for(const rule of annotations.listRuleReviews(accountScope,{tradingDayId,roundTripIds:[]}))dayRules.push({date,title:titles.get(rule.ruleId)??"Rule",status:rule.status,note:rule.note});}}}
    const dayNotesAllowed=Boolean(input.includeDayJournal&&input.includeJournal&&permits("journal_notes"));
    const ruleRecords=rulesAllowed?annotations.listRuleReviewsForRoundTripsWithRuleTitles(accountScope,ids):[];
    const rules=new Map<string,{title:string;followed:number;broken:number;notReviewed:number}>();
    for(const item of ruleRecords){const key=item.review.ruleId;const row=rules.get(key)??{title:item.ruleTitle,followed:0,broken:0,notReviewed:0};if(item.review.status==="followed")row.followed++;else if(item.review.status==="broken")row.broken++;else row.notReviewed++;rules.set(key,row);}
    const notes=notesAllowed?annotations.readRoundTripNotes(accountScope,ids):{};
    const tags=tagsAllowed?annotations.listTagsForRoundTrips(accountScope,ids):{};
    const dayNotes:{date:string;whatWorked:string;whatNeedsWork:string;technicalRecap:string;tomorrowsFocus:string;anythingElse:string}[]=[];
    // Only an explicitly bounded period may read trading-day Journal notes.
    if(dayNotesAllowed&&input.periodStart&&input.periodEnd){const first=Date.parse(input.periodStart),last=Date.parse(input.periodEnd);if(Number.isFinite(first)&&Number.isFinite(last)&&last>=first&&last-first<=366*86400000){for(let day=first;day<=last;day+=86400000){const date=new Date(day).toISOString().slice(0,10);const note=annotations.readDailyNote(accountScope,date);if(note)dayNotes.push({date,whatWorked:note.whatWorked,whatNeedsWork:note.whatNeedsWork,technicalRecap:note.technicalRecap,tomorrowsFocus:note.tomorrowsFocus,anythingElse:note.anythingElse});}}}
    const metrics=(rows:readonly CoachStudentJournalTrade[])=>{const currencies=[...new Set(rows.map(trade=>trade.currency))];return currencies.map(currency=>{const closed=rows.filter(trade=>trade.currency===currency&&trade.state==="ready_closed");const net=closed.every(trade=>trade.netPnlDecimal!==null);const values=closed.map(trade=>net?trade.netPnlDecimal:trade.grossPnlDecimal);const covered=values.filter((value):value is string=>value!==null);return {currency,closedTrades:closed.length,coveredTrades:covered.length,basis:net?"Net P/L":"Gross P/L",pnl:covered.length===closed.length&&closed.length?covered.reduce((total,value)=>total.plus(value),new Decimal(0)).toFixed():null,winners:covered.filter(value=>new Decimal(value).gt(0)).length,losers:covered.filter(value=>new Decimal(value).lt(0)).length};});};
    let previous:ReturnType<typeof metrics>|null=null;
    if(!input.selectedIds&&input.periodStart&&input.periodEnd){const start=Date.parse(input.periodStart),end=Date.parse(input.periodEnd),span=end-start+86400000;if(span>0&&span<=367*86400000){const prior=this.read({...input,periodStart:new Date(start-span).toISOString().slice(0,10),periodEnd:new Date(start-86400000).toISOString().slice(0,10)});previous=metrics(prior.trades);}}
    return {coverage:shared.coverage,tradeCount:trades.length,metrics:metrics(trades),previous,rulesAllowed,notesAllowed,tagsAllowed,dayNotesAllowed,dayRulesAllowed,dayRules,
      rules:[...rules.values()].sort((a,b)=>b.broken-a.broken||a.title.localeCompare(b.title)),
      journal:trades.filter(trade=>notes[trade.roundTripId]||tags[trade.roundTripId]?.length).map(trade=>({roundTripId:trade.roundTripId,symbol:trade.symbol,date:trade.tradingDate??trade.openedAtUtc.slice(0,10),tradeNote:notes[trade.roundTripId]?.tradeNote??"",technicalNote:notes[trade.roundTripId]?.technicalNote??"",tags:(tags[trade.roundTripId]??[]).map(tag=>tag.name)})),dayNotes};
  }

  private grant(input:Readonly<{coachUserId:string;relationshipId:string}>){
    assertCanonicalUuidV4(input.coachUserId,"coachUserId");
    assertCanonicalUuidV4(input.relationshipId,"relationshipId");
    const relationship=this.database.prepare(`SELECT community_id,coach_user_id FROM traderlink_community_coaching_relationships WHERE relationship_id=? AND status='active'`).get(input.relationshipId) as {community_id:string;coach_user_id:string}|undefined;
    if(!relationship||relationship.coach_user_id!==input.coachUserId)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_journal_read"});
    const entitlement=this.database.prepare(`SELECT CASE WHEN plan.required_discord_role_id IS NULL THEN 1 ELSE EXISTS(SELECT 1 FROM traderlink_communities community JOIN platform_discord_memberships membership ON membership.guild_id=community.discord_guild_id JOIN json_each(membership.role_ids_json) role ON role.value=plan.required_discord_role_id WHERE community.community_id=relationship.community_id AND membership.user_id=relationship.student_user_id) END role_present FROM traderlink_community_coaching_relationships relationship JOIN traderlink_community_coaching_plans plan ON plan.plan_id=relationship.plan_id WHERE relationship.relationship_id=?`).get(input.relationshipId) as {role_present:number}|undefined;
    if(entitlement?.role_present!==1)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coaching_access_paused"});
    new TraderLinkCommunityRepository(this.database).requireCapability(relationship.community_id,input.coachUserId,"community.coaching.students");
    const grant=this.database.prepare(`SELECT g.student_user_id,g.journal_account_id,g.data_scope,g.shared_fields_json,
  u.display_name student_name,a.display_name account_name,a.workspace_id
FROM traderlink_community_journal_grants g
JOIN traderlink_community_coaching_relationships r ON r.relationship_id=g.relationship_id
JOIN platform_users u ON u.user_id=g.student_user_id
JOIN journal_accounts a ON a.account_id=g.journal_account_id
WHERE g.relationship_id=? AND g.coach_user_id=? AND g.status='active' AND r.status='active'
ORDER BY CASE g.data_scope WHEN 'complete' THEN 5 WHEN 'trades' THEN 4 WHEN 'analytics' THEN 3 WHEN 'journal' THEN 2 ELSE 1 END DESC,g.granted_at_utc DESC LIMIT 1`).get(input.relationshipId,input.coachUserId) as {student_user_id:string;journal_account_id:string;data_scope:CoachStudentJournalSnapshot["dataScope"];shared_fields_json:string;student_name:string;account_name:string;workspace_id:string}|undefined;
    if(!grant)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_journal_read"});
    const scope:WorkspaceAccessScope=Object.freeze({userId:grant.student_user_id,workspaceId:grant.workspace_id,workspaceRole:"owner",allowedAccountIds:Object.freeze([grant.journal_account_id]),activeAccountId:grant.journal_account_id});
    return {grant,scope};
  }

  read(input:Readonly<{coachUserId:string;relationshipId:string;periodStart?:string;periodEnd?:string}>):CoachStudentJournalSnapshot{
    const {grant,scope}=this.grant(input);
    const facts=new JournalAnalyticsFactSetRepository(this.database).read(scope,{accountIds:Object.freeze([grant.journal_account_id]),closingDateRange:Object.freeze({kind:"all_available"}),currencySelection:Object.freeze({kind:"all_partitions"})});
    const datePattern=/^\d{4}-\d{2}-\d{2}$/u;const periodStart=input.periodStart&&datePattern.test(input.periodStart)?input.periodStart:null;const periodEnd=input.periodEnd&&datePattern.test(input.periodEnd)?input.periodEnd:null;
    const tradingDate=(value:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:facts.accounts[0]?.tradingTimezone??"UTC",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
    const inPeriod=(value:string)=>{const date=tradingDate(value);return (!periodStart||date>=periodStart)&&(!periodEnd||date<=periodEnd);};
    const current=facts.roundTrips.filter(trade=>inPeriod(trade.closedAtUtc??trade.openedAtUtc));
    const ready=current.filter(trade=>trade.projectionState==="ready_closed");
    const opened=current.filter(trade=>trade.projectionState==="legitimate_open");
    let comparison:CoachStudentJournalSnapshot["comparison"]=null;
    if(periodStart&&periodEnd){const start=new Date(`${periodStart}T00:00:00.000Z`);const end=new Date(`${periodEnd}T00:00:00.000Z`);const days=Math.max(1,Math.round((end.getTime()-start.getTime())/86400000)+1);const previousEnd=new Date(start.getTime()-86400000);const previousStart=new Date(previousEnd.getTime()-(days-1)*86400000);const prior=facts.roundTrips.filter(trade=>{const date=tradingDate(trade.closedAtUtc??trade.openedAtUtc);return date>=previousStart.toISOString().slice(0,10)&&date<=previousEnd.toISOString().slice(0,10);});comparison=Object.freeze({closedTrades:prior.filter(trade=>trade.projectionState==="ready_closed").length,openTrades:prior.filter(trade=>trade.projectionState==="legitimate_open").length,symbols:new Set(prior.map(trade=>trade.displayedSymbol)).size});}
    const coverageStates=facts.accounts[0]?.coverage.rebuilds.latestByChain.map(item=>item.coverageState)??[];
    const coverage=!coverageStates.length?"unavailable":coverageStates.some(state=>state==="unavailable")?"unavailable":coverageStates.some(state=>state==="partial")?"partial":"complete";
    // Legacy database values remain readable, but only an explicit trade-history
    // or complete grant may expose individual trade rows. A journal-only value
    // must never be interpreted as permission to reveal trades.
    const showTrades=["trades","complete"].includes(grant.data_scope);
    const normalized=new Map(normalizeJournalAnalyticsFacts(facts).realizedRows.map(row=>[row.roundTripId,row] as const));
    return Object.freeze({studentName:grant.student_name,accountName:grant.account_name,dataScope:grant.data_scope,coverage,closedTrades:ready.length,openTrades:opened.length,pendingDecisions:facts.pendingDecisions.length,symbols:new Set(current.map(trade=>trade.displayedSymbol)).size,periodStart,periodEnd,comparison,trades:showTrades?Object.freeze([...current].sort((a,b)=>b.openedAtUtc.localeCompare(a.openedAtUtc)).map((trade):CoachStudentJournalTrade=>{const row=normalized.get(trade.roundTripId);const average=(notional:string,quantity:string)=>new Decimal(quantity).isZero()?null:new Decimal(notional).dividedBy(quantity).toFixed();return Object.freeze({roundTripId:trade.roundTripId,symbol:trade.displayedSymbol,direction:trade.direction,openedAtUtc:trade.openedAtUtc,closedAtUtc:trade.closedAtUtc,tradingDate:tradingDate(trade.closedAtUtc??trade.openedAtUtc),state:trade.projectionState,quantityDecimal:row?.enteredQuantityDecimal??null,entryPriceDecimal:row?average(row.entryNotionalDecimal,row.enteredQuantityDecimal):null,exitPriceDecimal:row?average(row.exitNotionalDecimal,row.exitQuantityDecimal):null,netPnlDecimal:row?.netPnlDecimal??null,grossPnlDecimal:row?.grossPnlDecimal??null,currency:trade.tradeCurrency});})):Object.freeze([])});
  }

  readTrade(input:Readonly<{coachUserId:string;relationshipId:string;roundTripId:string}>):CoachStudentTradeDetails{
    const {grant,scope}=this.grant(input);
    if(!["trades","complete"].includes(grant.data_scope))platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_trade_read"});
    const snapshot=this.read(input);
    const trade=snapshot.trades.find(item=>item.roundTripId===input.roundTripId);
    if(!trade)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_trade_read"});
    const source=readJournalTradeStory(scope,input.roundTripId);
    const fields:unknown=JSON.parse(grant.shared_fields_json);
    const permits=(field:string)=>grant.data_scope==="complete"||(Array.isArray(fields)&&fields.includes(field));
    const story=Object.freeze({executions:source.status==="ready"?source.executions:Object.freeze([]),notes:permits("trade_notes")?source.notes:null,ruleReviews:permits("rules")?source.ruleReviews:Object.freeze([]),tags:permits("tags")?source.tags:Object.freeze([])});
    return Object.freeze({trade,story});
  }
}
