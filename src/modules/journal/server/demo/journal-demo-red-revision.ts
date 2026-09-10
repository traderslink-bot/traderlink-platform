import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalExecutionRepository } from "../executions/journal-execution-repository";
import { JournalRoundTripRepository } from "../round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import { JournalAnnotationRepository } from "../annotations/journal-annotation-repository";
import { JournalAnnotationService } from "../annotations/journal-annotation-service";
import { JournalRuleRepository } from "../annotations/journal-rule-repository";
import type { JournalDemoDerivedTradeFact } from "./journal-demo-financial-pack-source";
import type { JournalDemoExecutionProvenanceFact } from "./journal-demo-pack-contract";

/** Internal to the atomic Demo pack materializer; only its verified mappings enter here. */
export function reviseJournalDemoRedTrades(input: Readonly<{
  database: Database.Database; scope: AccountScope;
  original: readonly JournalDemoDerivedTradeFact[];
  revised: readonly JournalDemoDerivedTradeFact[];
  provenance: readonly JournalDemoExecutionProvenanceFact[];
}>): readonly JournalDemoExecutionProvenanceFact[] {
  const executions = new JournalExecutionRepository(input.database);
  const mapped = new Map(input.provenance.map(fact => [fact.packExecutionKey, fact]));
  const changed: string[] = [];
  const now = new Date();
  for (const trade of input.revised) {
    const original = input.original.find(item => item.packTradeKey === trade.packTradeKey);
    if (!original || trade.executions.length !== 2) throw new Error("demo_v11_revision_scope_invalid");
    for (const fact of trade.executions) {
      const mapping = mapped.get(fact.packExecutionKey);
      const prior = original.executions.find(item => item.packExecutionKey === fact.packExecutionKey);
      if (!mapping || !prior) throw new Error("demo_v11_revision_mapping_missing");
      let current = executions.currentVersion(mapping.executionId, input.scope.workspaceId, input.scope.accountId);
      if (!current || current.executionVersionId !== mapping.executionVersionId || current.side !== fact.side ||
        current.priceDecimal !== prior.priceDecimal || current.quantityDecimal !== prior.quantityDecimal ||
        current.executedAtUtc !== prior.executedAtUtc || current.feesDecimal !== "-0.5") {
        throw new Error("demo_v11_revision_predecessor_invalid");
      }
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      }).formatToParts(new Date(fact.executedAtUtc)).map(part => [part.type, part.value]));
      current = executions.appendVersion({ executionId: mapping.executionId,
        executionVersionId: createCanonicalUuidV4(), workspaceId: input.scope.workspaceId,
        accountId: input.scope.accountId, expectedCurrentVersionId: current.executionVersionId,
        versionNumber: current.versionNumber + 1, state: "accepted",
        facts: { ...current, executedAtUtc: fact.executedAtUtc, priceDecimal: fact.priceDecimal,
          quantityDecimal: fact.quantityDecimal,
          sourceTimestampText: `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}` },
        actorKind: "system", actorUserId: null, changeReasonCode: "demo_v11_above_twenty_percent_revision",
        timestamp: now.toISOString(),
      });
      changed.push(mapping.executionId);
      mapped.set(fact.packExecutionKey, { ...mapping, executionVersionId: current.executionVersionId,
        executionFactSha256: createHash("sha256").update(JSON.stringify(current)).digest("hex") });
    }
  }
  const results = new JournalRoundTripService(new JournalRoundTripRepository(input.database))
    .rebuildAffectedExecutionChains(input.scope, changed, {
      kind: "maintenance", maintenanceReasonCode: "demo_pack_materialization", now,
    });
  if (results.some(result => result.needsDecisionCount !== 0 || result.readyClosedCount === 0)) {
    throw new Error("demo_v11_revision_rebuild_invalid");
  }
  const annotations = new JournalAnnotationService(new JournalAnnotationRepository(input.database), new JournalRuleRepository(input.database));
  for (const trade of input.revised) {
    const first = mapped.get(trade.executions[0]!.packExecutionKey)!;
    const rows = input.database.prepare<[string,string,string], {round_trip_id:string}>(`
      SELECT DISTINCT trip.round_trip_id FROM journal_round_trips trip
      JOIN journal_round_trip_versions version ON version.round_trip_version_id=trip.current_version_id
      JOIN journal_round_trip_execution_allocations allocation ON allocation.round_trip_version_id=version.round_trip_version_id
      WHERE trip.workspace_id=? AND trip.account_id=? AND allocation.execution_version_id=?
        AND version.projection_state='ready_closed'
    `).all(input.scope.workspaceId,input.scope.accountId,first.executionVersionId);
    if (rows.length !== 1) throw new Error("demo_v11_revision_trade_missing");
    const roundTripId = rows[0]!.round_trip_id;
    const note = annotations.readRoundTripNotes(input.scope,[roundTripId])[roundTripId];
    annotations.saveRoundTripNote(input.scope, { roundTripId, expectedRevision: note?.revision ?? null,
      technicalNote: note?.technicalNote ?? "", tradeNote: trade.demoReview!.note, now });
  }
  return [...mapped.values()];
}
