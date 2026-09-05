import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "../../platform/contracts/workspace-access-scope";
import { assertCanonicalUuidV4, platformFailure } from "../../platform/server/database/platform-migration-contract";
import { JournalAnalyticsFactSetRepository } from "../../journal/server/analytics/journal-analytics-fact-set-repository";

export type CoachStudentJournalSnapshot=Readonly<{
  studentName:string; accountName:string;
  dataScope:"summary"|"trades"|"journal"|"analytics"|"complete";
  coverage:string; closedTrades:number; openTrades:number;
  pendingDecisions:number; symbols:number;
  trades:readonly Readonly<{roundTripId:string;symbol:string;direction:"long"|"short";openedAtUtc:string;closedAtUtc:string|null;state:string}>[];
}>;

export class TraderLinkCommunityCoachJournalReadService{
  constructor(private readonly database:Database.Database){}

  read(input:Readonly<{coachUserId:string;relationshipId:string}>):CoachStudentJournalSnapshot{
    assertCanonicalUuidV4(input.coachUserId,"coachUserId");
    assertCanonicalUuidV4(input.relationshipId,"relationshipId");
    const grant=this.database.prepare(`SELECT g.student_user_id,g.journal_account_id,g.data_scope,
  u.display_name student_name,a.display_name account_name,a.workspace_id
FROM traderlink_community_journal_grants g
JOIN traderlink_community_coaching_relationships r ON r.relationship_id=g.relationship_id
JOIN platform_users u ON u.user_id=g.student_user_id
JOIN journal_accounts a ON a.account_id=g.journal_account_id
WHERE g.relationship_id=? AND g.coach_user_id=? AND g.status='active' AND r.status='active'
ORDER BY CASE g.data_scope WHEN 'complete' THEN 5 WHEN 'analytics' THEN 4 WHEN 'journal' THEN 3 WHEN 'trades' THEN 2 ELSE 1 END DESC LIMIT 1`).get(input.relationshipId,input.coachUserId) as {student_user_id:string;journal_account_id:string;data_scope:CoachStudentJournalSnapshot["dataScope"];student_name:string;account_name:string;workspace_id:string}|undefined;
    if(!grant)platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED",{operation:"coach_journal_read"});
    const scope:WorkspaceAccessScope=Object.freeze({userId:grant.student_user_id,workspaceId:grant.workspace_id,workspaceRole:"owner",allowedAccountIds:Object.freeze([grant.journal_account_id]),activeAccountId:grant.journal_account_id});
    const facts=new JournalAnalyticsFactSetRepository(this.database).read(scope,{accountIds:Object.freeze([grant.journal_account_id]),closingDateRange:Object.freeze({kind:"all_available"}),currencySelection:Object.freeze({kind:"all_partitions"})});
    const ready=facts.roundTrips.filter(trade=>trade.projectionState==="ready_closed");
    const opened=facts.roundTrips.filter(trade=>trade.projectionState==="legitimate_open");
    const coverageStates=facts.accounts[0]?.coverage.rebuilds.latestByChain.map(item=>item.coverageState)??[];
    const coverage=!coverageStates.length?"unavailable":coverageStates.some(state=>state==="unavailable")?"unavailable":coverageStates.some(state=>state==="partial")?"partial":"complete";
    const showTrades=["trades","journal","complete"].includes(grant.data_scope);
    return Object.freeze({studentName:grant.student_name,accountName:grant.account_name,dataScope:grant.data_scope,coverage,closedTrades:ready.length,openTrades:opened.length,pendingDecisions:facts.pendingDecisions.length,symbols:new Set(facts.roundTrips.map(trade=>trade.displayedSymbol)).size,trades:showTrades?Object.freeze(facts.roundTrips.slice(-100).reverse().map(trade=>Object.freeze({roundTripId:trade.roundTripId,symbol:trade.displayedSymbol,direction:trade.direction,openedAtUtc:trade.openedAtUtc,closedAtUtc:trade.closedAtUtc,state:trade.projectionState}))):Object.freeze([])});
  }
}
