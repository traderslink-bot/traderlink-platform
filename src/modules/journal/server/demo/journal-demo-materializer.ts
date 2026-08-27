import type Database from "better-sqlite3";

import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";
import { assertJournalDemoExecutionProvenanceFacts, assertJournalDemoFinancialPack, resolveCurrentJournalDemoFinancialPack, type JournalDemoFinancialPack } from "./journal-demo-pack-contract";

export type JournalDemoMaterializationResult = Readonly<{ accountId: string | null; state: "materialized" | "unavailable" }>;

export class JournalDemoMaterializer {
  constructor(private readonly database: Database.Database, private readonly dependencies: Readonly<{
    createId?: () => string; now?: () => Date; resolvePack?: () => JournalDemoFinancialPack | null;
  }> = {}) {}

  materializeForNewWorkspace(input: Readonly<{ baseCurrency: string; createdForUserId: string; tradingTimezone: string; workspaceId: string }>): JournalDemoMaterializationResult {
    return this.database.transaction(() => this.materializeLocked(input)).immediate();
  }

  private materializeLocked(input: Readonly<{ baseCurrency: string; createdForUserId: string; tradingTimezone: string; workspaceId: string }>): JournalDemoMaterializationResult {
    assertCanonicalUuidV4(input.workspaceId, "workspaceId");
    assertCanonicalUuidV4(input.createdForUserId, "createdForUserId");
    const demos = new JournalDemoAccountRepository(this.database);
    const existing = demos.findAccountForUser({ workspaceId: input.workspaceId, userId: input.createdForUserId });
    if (existing) return Object.freeze({ accountId: existing.accountId, state: "materialized" });
    if (demos.hasAcceptedRealExecutionInWorkspace(input.workspaceId)) return Object.freeze({ accountId: null, state: "unavailable" });
    const pack = (this.dependencies.resolvePack ?? resolveCurrentJournalDemoFinancialPack)();
    if (!pack) return Object.freeze({ accountId: null, state: "unavailable" });
    const validatedPack = assertJournalDemoFinancialPack(pack);
    const createId = this.dependencies.createId ?? createCanonicalUuidV4;
    const timestamp = createCanonicalUtcTimestamp(this.dependencies.now?.());
    const accountId = createId();
    assertCanonicalUuidV4(accountId, "demoAccountId");
    demos.ensurePackVersion({ createdAtUtc: timestamp, manifest: validatedPack.manifest });
    new JournalAccountRepository(this.database).createAccount({
      accountId, workspaceId: input.workspaceId, displayName: "Demo Trade Tracker", baseCurrency: input.baseCurrency,
      tradingTimezone: input.tradingTimezone, status: "active", createdByUserId: input.createdForUserId,
      createdAtUtc: timestamp, updatedAtUtc: timestamp,
    });
    const materialized = validatedPack.materializeCanonicalFacts({
      accountId,
      createdForUserId: input.createdForUserId,
      database: this.database,
      workspaceId: input.workspaceId,
    });
    assertCanonicalUtcTimestamp(timestamp, "demoCreatedAtUtc");
    if (materialized.materializedFactManifestSha256 !== validatedPack.manifest.manifestSha256 ||
      materialized.materializedMarketDataManifestSha256 !== validatedPack.manifest.marketDataManifestSha256) {
      return this.refuseIncompletePack();
    }
    const executionProvenance = assertJournalDemoExecutionProvenanceFacts(materialized.executionProvenance);
    // Write the active account marker and mappings last: any earlier failure rolls the full transaction back.
    demos.createDemoAccount({ accountId, createdAtUtc: timestamp, createdForUserId: input.createdForUserId,
      demoPackVersionId: validatedPack.manifest.demoPackVersionId, workspaceId: input.workspaceId });
    for (const fact of executionProvenance) {
      const executionProvenanceId = createId();
      assertCanonicalUuidV4(executionProvenanceId, "demoExecutionProvenanceId");
      demos.createExecutionProvenance({ accountId, createdAtUtc: timestamp,
        demoPackVersionId: validatedPack.manifest.demoPackVersionId, executionProvenanceId, fact, workspaceId: input.workspaceId });
    }
    return Object.freeze({ accountId, state: "materialized" });
  }

  private refuseIncompletePack(): never {
    throw new Error("journal_demo_financial_pack_incomplete");
  }
}
