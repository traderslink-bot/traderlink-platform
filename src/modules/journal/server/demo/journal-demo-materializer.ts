import type Database from "better-sqlite3";
import { TRADE_INDICATOR_CALCULATION_VERSION } from "@/src/lib/trade-candle-analysis/trend-momentum-version";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { DemoIndicatorHistoryRequired, refreshJournalDemoTradeIndicators } from "./journal-demo-indicator-refresh";

import { assertCanonicalUtcTimestamp, assertCanonicalUuidV4, createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";
import { JOURNAL_DEMO_CURRENT_VERSION_ID } from "./journal-demo-current-version";
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

  /** Existing fact packs stay immutable. Advance one saved-analysis candidate
   * per request; missing history never triggers provider access from activation.
   */
  refreshExistingAnalysis(scope: WorkspaceAccessScope, after: string | null = null) {
    if (scope.workspaceRole !== "owner") throw new Error("demo_indicator_account_not_authorized");
    if (after !== null) assertCanonicalUuidV4(after, "demoIndicatorCursor");
    const demos = new JournalDemoAccountRepository(this.database);
    if (demos.findLifecycleForUser(scope)?.state === "cleared") return { changed: false, nextAfter: null };
    const demo = demos.findAccountForUser(scope);
    if (!demo) return { changed: false, nextAfter: null };
    const rows = this.database.prepare(`SELECT DISTINCT trip.round_trip_id AS id
 FROM journal_round_trips trip JOIN journal_round_trip_daily_trade_analyses analysis
 ON analysis.workspace_id=trip.workspace_id AND analysis.account_id=trip.account_id
 AND analysis.round_trip_id=trip.round_trip_id AND analysis.round_trip_version_id=trip.current_version_id
 WHERE trip.workspace_id=? AND trip.account_id=? AND analysis.status='ready'
 AND trip.round_trip_id>?
 AND NOT EXISTS (
 SELECT 1 FROM journal_active_logical_trade_memberships member
 JOIN journal_logical_trade_daily_analyses current
 ON current.workspace_id=member.workspace_id AND current.account_id=member.account_id
 AND current.logical_trade_id=member.logical_trade_id
 AND current.logical_trade_version_id=member.logical_trade_version_id
 JOIN journal_logical_trade_daily_analysis_versions version
 ON version.logical_trade_analysis_id=current.logical_trade_analysis_id
 AND version.revision_number=current.current_revision
 WHERE member.workspace_id=trip.workspace_id AND member.account_id=trip.account_id
 AND member.round_trip_id=trip.round_trip_id AND current.user_id=? AND current.status='ready'
 AND json_extract(version.result_json,'$.trendMomentum.calculationVersion')=?
 AND json_extract(version.result_json,'$.trendMomentum.historyOutcome')='complete')
 ORDER BY trip.round_trip_id LIMIT 2`).all(
      scope.workspaceId, demo.accountId, after ?? "", scope.userId, TRADE_INDICATOR_CALCULATION_VERSION,
    ) as { id: string }[];
    if (!rows[0]) return { changed: false, nextAfter: null };
    let changed = false;
    try {
      changed = refreshJournalDemoTradeIndicators(this.database, {
        scope: { userId: scope.userId, workspaceId: scope.workspaceId, workspaceRole: "owner", accountId: demo.accountId },
        roundTripId: rows[0].id, now: this.dependencies.now?.() ?? new Date(),
      }).status === "refreshed";
    } catch (error) {
      if (!(error instanceof DemoIndicatorHistoryRequired)) throw error;
    }
    return { changed, nextAfter: rows.length > 1 ? rows[0].id : null };
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
    const pack = this.dependencies.resolvePack ? this.dependencies.resolvePack() : resolveCurrentJournalDemoFinancialPack(this.database);
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
    if (!this.dependencies.resolveUpgradePack && (input.existing.demoPackVersionId === JOURNAL_DEMO_CURRENT_VERSION_ID ||
      input.demos.findPackApplication({ accountId: input.existing.accountId, workspaceId: input.input.workspaceId,
        demoPackVersionId: JOURNAL_DEMO_CURRENT_VERSION_ID }))) {
      return Object.freeze({ accountId: input.existing.accountId, state: "materialized" });
    }
    const pack = this.dependencies.resolveUpgradePack
      ? this.dependencies.resolveUpgradePack(input.existing.demoPackVersionId)
      : resolveJournalDemoUpgradePack(input.existing.demoPackVersionId, {
        database: this.database, accountId: input.existing.accountId, workspaceId: input.input.workspaceId,
      });
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
        { allowEmpty: validatedPack.manifest.packVersion === 3 ||
          (validatedPack.manifest.packVersion === 11 && validatedPack.manifest.demoPackVersionId === "a2703b8c-41a7-48ac-8a1c-62f7695ed6f1") ||
          (validatedPack.manifest.packVersion === 12 && validatedPack.manifest.demoPackVersionId === JOURNAL_DEMO_CURRENT_VERSION_ID) },
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
