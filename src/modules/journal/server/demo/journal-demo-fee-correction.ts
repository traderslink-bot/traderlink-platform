import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import Decimal from "decimal.js";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalExecutionRepository } from "../executions/journal-execution-repository";
import { JournalRoundTripRepository } from "../round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";
import type { JournalDemoFinancialPackSource } from "./journal-demo-financial-pack-source";
import type { JournalDemoExecutionProvenanceFact } from "./journal-demo-pack-contract";

/** Runs inside the pack transaction. Original versions and provenance stay immutable. */
export function correctJournalDemoFeeVersions(database: Database.Database, scope: AccountScope,
  source: JournalDemoFinancialPackSource): readonly JournalDemoExecutionProvenanceFact[] {
  const demos = new JournalDemoAccountRepository(database);
  const demo = demos.findAccountForUser(scope);
  if (!demo || demo.accountId !== scope.accountId || demos.findLifecycleForUser(scope)?.state === "cleared") {
    throw new Error("journal_demo_fee_scope_invalid");
  }
  const known = new Map(source.trades.flatMap(t => t.executions.map(e => [e.packExecutionKey, e] as const)));
  const rows = database.prepare<[string,string,string,string], {pack_execution_key:string;execution_id:string}>(`
SELECT pack_execution_key, execution_id FROM journal_demo_execution_provenance WHERE workspace_id=? AND account_id=?
UNION SELECT pack_execution_key, execution_id FROM journal_demo_pack_application_execution_provenance WHERE workspace_id=? AND account_id=?
`).all(scope.workspaceId,scope.accountId,scope.workspaceId,scope.accountId);
  const executions = new JournalExecutionRepository(database);
  const changed: string[] = [], seen = new Set<string>();
  const provenance: JournalDemoExecutionProvenanceFact[] = [];
  const now = new Date(), timestamp = now.toISOString();
  for (const row of rows) {
    const fact = known.get(row.pack_execution_key);
    if (!fact || seen.has(row.execution_id)) throw new Error("journal_demo_fee_provenance_invalid");
    seen.add(row.execution_id);
    let current = executions.currentVersion(row.execution_id,scope.workspaceId,scope.accountId);
    const execution = executions.current(row.execution_id,scope.workspaceId,scope.accountId);
    if (!current || execution?.currentState !== "accepted" || current.feeSignConvention !== "cash_effect" ||
      current.feeCurrency !== "USD" || current.feesDecimal === null || !new Decimal(current.feesDecimal).abs().eq("0.5")) {
      throw new Error("journal_demo_fee_contract_invalid");
    }
    if (new Decimal(current.feesDecimal).isPositive()) {
      current = executions.appendVersion({executionId:row.execution_id,executionVersionId:createCanonicalUuidV4(),
        workspaceId:scope.workspaceId,accountId:scope.accountId,expectedCurrentVersionId:current.executionVersionId,
        versionNumber:current.versionNumber+1,state:"accepted",facts:{...current,feesDecimal:"-0.5"},
        actorKind:"system",actorUserId:null,changeReasonCode:"demo_v10_modeled_fee_cost_correction",timestamp});
      changed.push(row.execution_id);
    }
    provenance.push({analysisPolicy:fact.analysisPolicy,executionId:row.execution_id,
      executionVersionId:current.executionVersionId,packExecutionKey:row.pack_execution_key,
      executionFactSha256:createHash("sha256").update(JSON.stringify(current)).digest("hex")});
  }
  if (changed.length) {
    const results = new JournalRoundTripService(new JournalRoundTripRepository(database))
      .rebuildAffectedExecutionChains(scope,changed,{kind:"maintenance",maintenanceReasonCode:"demo_pack_materialization",now});
    if(results.some(r=>r.needsDecisionCount!==0||r.readyClosedCount===0))throw new Error("journal_demo_fee_rebuild_invalid");
  }
  return provenance;
}
