import type Database from "better-sqlite3";

import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";
import {
  assertJournalDemoExecutionProvenanceFacts,
  assertJournalDemoFinancialPack,
  resolveCurrentJournalDemoFinancialPack,
  resolveJournalDemoUpgradePack,
  type JournalDemoExecutionProvenanceFact,
  type JournalDemoFinancialPack,
} from "./journal-demo-pack-contract";

export type JournalDemoMaterializationResult = Readonly<{
  accountId: string | null;
  state: "cleared" | "materialized" | "unavailable";
}>;

export class JournalDemoMaterializer {
  constructor(private readonly database: Database.Database, private readonly dependencies: Readonly<{
    createId?: () => string;
    now?: () => Date;
    resolvePack?: () => JournalDemoFinancialPack | null;
    resolveUpgradePack?: (existingDemoPackVersionId: string) => JournalDemoFinancialPack | null;
  }> = {}) {}

  materializeForWorkspace(input: Readonly<{ baseCurrency: string; createdForUserId: string; tradingTimezone: string; workspaceId: string }>): JournalDemoMaterializationResult {
    return this.database.transaction(() => this.materializeLocked(input)).immediate();
  }

  private materializeLocked(input: Readonly<{ baseCurrency: string; createdForUserId: string; tradingTimezone: string; workspaceId: string }>): JournalDemoMaterializationResult {
    assertCanonicalUuidV4(input.workspaceId, "workspaceId");
    assertCanonicalUuidV4(input.createdForUserId, "createdForUserId");
    const demos = new JournalDemoAccountRepository(this.database);
    if (demos.findLifecycleForUser({
      userId: input.createdForUserId,
      workspaceId: input.workspaceId,
    })?.state === "cleared") {
      return Object.freeze({ accountId: null, state: "cleared" });
    }
    const existing = demos.findAccountForUser({ workspaceId: input.workspaceId, userId: input.createdForUserId });
    if (existing) return this.upgradeExistingLocked({ demos, existing, input });
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
    this.recordPackApplication({
      applicationKind: "initial", createdAtUtc: timestamp, demos, executionProvenance,
      manifest: validatedPack.manifest, accountId, createId, workspaceId: input.workspaceId,
    });
    return Object.freeze({ accountId, state: "materialized" });
  }

  private upgradeExistingLocked(input: Readonly<{
    demos: JournalDemoAccountRepository;
    existing: Readonly<{ accountId: string; demoPackVersionId: string }>;
    input: Readonly<{ baseCurrency: string; createdForUserId: string; tradingTimezone: string; workspaceId: string }>;
  }>): JournalDemoMaterializationResult {
    const pack = (this.dependencies.resolveUpgradePack ?? resolveJournalDemoUpgradePack)(
      input.existing.demoPackVersionId,
    );
    if (!pack) return Object.freeze({ accountId: input.existing.accountId, state: "materialized" });
    const validatedPack = assertJournalDemoFinancialPack(pack);
    if (input.existing.demoPackVersionId === validatedPack.manifest.demoPackVersionId) {
      return Object.freeze({ accountId: input.existing.accountId, state: "materialized" });
    }
    if (input.demos.findPackApplication({
      accountId: input.existing.accountId,
      demoPackVersionId: validatedPack.manifest.demoPackVersionId,
      workspaceId: input.input.workspaceId,
    })) {
      return Object.freeze({ accountId: input.existing.accountId, state: "materialized" });
    }
    const createId = this.dependencies.createId ?? createCanonicalUuidV4;
    const timestamp = createCanonicalUtcTimestamp(this.dependencies.now?.());
    input.demos.ensurePackVersion({ createdAtUtc: timestamp, manifest: validatedPack.manifest });
    const materialized = validatedPack.materializeCanonicalFacts({
      accountId: input.existing.accountId,
      createdForUserId: input.input.createdForUserId,
      database: this.database,
      workspaceId: input.input.workspaceId,
    });
    if (materialized.materializedFactManifestSha256 !== validatedPack.manifest.manifestSha256 ||
      materialized.materializedMarketDataManifestSha256 !== validatedPack.manifest.marketDataManifestSha256) {
      return this.refuseIncompletePack();
    }
    this.recordPackApplication({
      applicationKind: "upgrade", createdAtUtc: timestamp, demos: input.demos,
      executionProvenance: assertJournalDemoExecutionProvenanceFacts(
        materialized.executionProvenance,
        { allowEmpty: validatedPack.manifest.packVersion === 3 },
      ),
      manifest: validatedPack.manifest, accountId: input.existing.accountId, createId,
      workspaceId: input.input.workspaceId,
    });
    return Object.freeze({ accountId: input.existing.accountId, state: "materialized" });
  }

  private recordPackApplication(input: Readonly<{
    accountId: string;
    applicationKind: "initial" | "upgrade";
    createdAtUtc: string;
    createId: () => string;
    demos: JournalDemoAccountRepository;
    executionProvenance: readonly JournalDemoExecutionProvenanceFact[];
    manifest: JournalDemoFinancialPack["manifest"];
    workspaceId: string;
  }>): void {
    const demoPackApplicationId = input.createId();
    assertCanonicalUuidV4(demoPackApplicationId, "demoPackApplicationId");
    input.demos.createPackApplication({ accountId: input.accountId, applicationKind: input.applicationKind,
      createdAtUtc: input.createdAtUtc, demoPackApplicationId, manifest: input.manifest, workspaceId: input.workspaceId });
    for (const fact of input.executionProvenance) {
      const demoPackApplicationExecutionProvenanceId = input.createId();
      assertCanonicalUuidV4(demoPackApplicationExecutionProvenanceId, "demoPackApplicationExecutionProvenanceId");
      input.demos.createPackApplicationExecutionProvenance({ accountId: input.accountId, createdAtUtc: input.createdAtUtc,
        demoPackApplicationExecutionProvenanceId, demoPackApplicationId, fact, workspaceId: input.workspaceId });
    }
  }

  private refuseIncompletePack(): never {
    throw new Error("journal_demo_financial_pack_incomplete");
  }
}
