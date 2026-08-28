import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import { createJournalDemoFinancialPack } from "./journal-demo-canonical-fact-materializer";
import {
  createJournalDemoDailyTrackerFinancialPackSource,
  type JournalDemoFinancialPackSource,
} from "./journal-demo-financial-pack-source";
import { readJournalDemoImmutableMarketDataPack } from "./journal-demo-immutable-market-data-pack";
import { createJournalDemoV2JournalOnlyPackSource } from "./journal-demo-v2-journal-only-pack-source";
import { createJournalDemoV4PerformancePackSource } from "./journal-demo-v4-performance-pack-source";

import {
  assertCanonicalUuidV4,
  assertLowercaseToken,
  isLowercaseSha256,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalDemoExecutionProvenanceFact = Readonly<{
  analysisPolicy: "analyzer_backed" | "journal_only";
  executionFactSha256: string;
  executionId: string;
  executionVersionId: string;
  packExecutionKey: string;
}>;

export type JournalDemoPackManifest = Readonly<{
  demoPackVersionId: string;
  manifestSha256: string;
  marketDataManifestSha256: string;
  materializerVersion: string;
  packKey: string;
  packVersion: number;
}>;

export type JournalDemoFinancialPack = Readonly<{
  manifest: JournalDemoPackManifest;
  materializeCanonicalFacts: (input: Readonly<{
    accountId: string;
    createdForUserId: string;
    database: Database.Database;
    workspaceId: string;
  }>) => Readonly<{
    executionProvenance: readonly JournalDemoExecutionProvenanceFact[];
    materializedFactManifestSha256: string;
    materializedMarketDataManifestSha256: string;
  }>;
}>;

function canonicalJson(value: unknown): string {
  const normalize = (candidate: unknown): unknown => Array.isArray(candidate)
    ? candidate.map(normalize)
    : candidate && typeof candidate === "object"
      ? Object.fromEntries(Object.entries(candidate as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, normalize(child)]))
      : candidate;
  return `${JSON.stringify(normalize(value))}\n`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Version 2 is one immutable demo account pack. Its first 21 trades remain
 * Analyzer-backed; its 76 added trades are explicit Journal-only examples.
 */
function combineVersionTwoSources(
  analyzerSource: JournalDemoFinancialPackSource,
  journalOnlySource: JournalDemoFinancialPackSource,
): JournalDemoFinancialPackSource {
  const trades = Object.freeze([...analyzerSource.trades, ...journalOnlySource.trades]);
  const marketDataManifestSha256 = sha256(canonicalJson({
    analyzerMarketDataManifestSha256: analyzerSource.marketDataManifestSha256,
    journalOnlySyntheticInventorySha256: journalOnlySource.marketDataManifestSha256,
  }));
  const sourceEvidenceManifestSha256 = sha256(canonicalJson({
    analyzerSourceEvidenceManifestSha256: analyzerSource.sourceEvidenceManifestSha256,
    journalOnlySourceEvidenceManifestSha256: journalOnlySource.sourceEvidenceManifestSha256,
  }));
  const derivedFactManifestSha256 = sha256(canonicalJson({
    marketDataManifestSha256,
    packKey: "daily_tracker_demo",
    packVersion: 2,
    sourceEvidenceManifestSha256,
    trades,
  }));
  if (trades.length !== 97 || trades.reduce((count, trade) => count + trade.executions.length, 0) !== 582) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoVersionTwoTradeInventory" });
  }
  return Object.freeze({
    corporateActionReview: "required_before_materialization" as const,
    derivedFactManifestSha256,
    marketDataManifestSha256,
    packKey: "daily_tracker_demo" as const,
    packVersion: 2,
    sourceEvidenceManifestSha256,
    trades,
  });
}

function combineVersionFourSources(
  sources: readonly JournalDemoFinancialPackSource[],
  expectedTradeCount: number,
  expectedExecutionCount: number,
): JournalDemoFinancialPackSource {
  const trades = Object.freeze(sources.flatMap((source) => source.trades));
  if (trades.length !== expectedTradeCount ||
    trades.reduce((count, trade) => count + trade.executions.length, 0) !== expectedExecutionCount) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoVersionFourTradeInventory" });
  }
  const marketDataManifestSha256 = sha256(canonicalJson(sources.map((source) => source.marketDataManifestSha256)));
  const sourceEvidenceManifestSha256 = sha256(canonicalJson(sources.map((source) => source.sourceEvidenceManifestSha256)));
  return Object.freeze({
    corporateActionReview: "required_before_materialization" as const,
    derivedFactManifestSha256: sha256(canonicalJson({
      marketDataManifestSha256,
      packKey: "daily_tracker_demo",
      packVersion: 4,
      sourceEvidenceManifestSha256,
      trades,
    })),
    marketDataManifestSha256,
    packKey: "daily_tracker_demo" as const,
    packVersion: 4,
    sourceEvidenceManifestSha256,
    trades,
  });
}

/**
 * A pack manifest is immutable once stored. A new version deliberately forks
 * the current complete source instead of relabeling an already-applied
 * manifest after its demo inventory changed.
 */
function reversionSource(
  source: JournalDemoFinancialPackSource,
  packVersion: number,
): JournalDemoFinancialPackSource {
  return Object.freeze({
    ...source,
    derivedFactManifestSha256: sha256(canonicalJson({
      marketDataManifestSha256: source.marketDataManifestSha256,
      packKey: source.packKey,
      packVersion,
      sourceEvidenceManifestSha256: source.sourceEvidenceManifestSha256,
      trades: source.trades,
    })),
    packVersion,
  });
}

export function assertJournalDemoFinancialPack(
  pack: JournalDemoFinancialPack,
): JournalDemoFinancialPack {
  assertCanonicalUuidV4(pack.manifest.demoPackVersionId, "demoPackVersionId");
  assertLowercaseToken(pack.manifest.packKey, "demoPackKey");
  assertLowercaseToken(pack.manifest.materializerVersion, "demoMaterializerVersion");
  if (!Number.isSafeInteger(pack.manifest.packVersion) || pack.manifest.packVersion < 1) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "demoPackVersion",
    });
  }
  if (!isLowercaseSha256(pack.manifest.manifestSha256)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoManifestSha256" });
  }
  if (!isLowercaseSha256(pack.manifest.marketDataManifestSha256)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "demoMarketDataManifestSha256",
    });
  }
  if (typeof pack.materializeCanonicalFacts !== "function") {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoMaterializer" });
  }
  return pack;
}

export function assertJournalDemoExecutionProvenanceFacts(
  facts: readonly JournalDemoExecutionProvenanceFact[],
  options: Readonly<{ allowEmpty?: boolean }> = {},
): readonly JournalDemoExecutionProvenanceFact[] {
  if (facts.length < 1 && options.allowEmpty !== true) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoExecutionProvenance" });
  }
  const executionIds = new Set<string>();
  const executionVersionIds = new Set<string>();
  const packExecutionKeys = new Set<string>();
  for (const fact of facts) {
    if (fact.analysisPolicy !== "analyzer_backed" && fact.analysisPolicy !== "journal_only") {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "demoExecutionAnalysisPolicy",
      });
    }
    assertCanonicalUuidV4(fact.executionId, "demoExecutionId");
    assertCanonicalUuidV4(fact.executionVersionId, "demoExecutionVersionId");
    assertLowercaseToken(fact.packExecutionKey, "demoPackExecutionKey");
    if (!isLowercaseSha256(fact.executionFactSha256)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "demoExecutionFactSha256",
      });
    }
    if (
      executionIds.has(fact.executionId) ||
      executionVersionIds.has(fact.executionVersionId) ||
      packExecutionKeys.has(fact.packExecutionKey)
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "demoExecutionProvenance",
      });
    }
    executionIds.add(fact.executionId);
    executionVersionIds.add(fact.executionVersionId);
    packExecutionKeys.add(fact.packExecutionKey);
  }
  return Object.freeze([...facts]);
}

function resolveVersionTwoSources(): Readonly<{
  analyzerSource: JournalDemoFinancialPackSource;
  fullSource: JournalDemoFinancialPackSource;
  journalOnlySource: JournalDemoFinancialPackSource;
  verifiedMarketDays: ReturnType<typeof readJournalDemoImmutableMarketDataPack>;
}> {
  const verifiedMarketDays = readJournalDemoImmutableMarketDataPack();
  const analyzerSource = createJournalDemoDailyTrackerFinancialPackSource(verifiedMarketDays);
  const journalOnlySource = createJournalDemoV2JournalOnlyPackSource();
  return Object.freeze({
    analyzerSource,
    fullSource: combineVersionTwoSources(analyzerSource, journalOnlySource),
    journalOnlySource,
    verifiedMarketDays,
  });
}

function resolveVersionFourSources(): Readonly<{
  analyzerSource: JournalDemoFinancialPackSource;
  fullSource: JournalDemoFinancialPackSource;
  newAnalyzerSource: JournalDemoFinancialPackSource;
  upgradeFromV1Source: JournalDemoFinancialPackSource;
  upgradeSource: JournalDemoFinancialPackSource;
  verifiedMarketDays: ReturnType<typeof readJournalDemoImmutableMarketDataPack>;
}> {
  const versionTwo = resolveVersionTwoSources();
  const versionFour = createJournalDemoV4PerformancePackSource(versionTwo.verifiedMarketDays);
  return Object.freeze({
    analyzerSource: combineVersionFourSources([versionTwo.analyzerSource, versionFour.analyzerSource], 28, 168),
    fullSource: combineVersionFourSources([versionTwo.fullSource, versionFour.fullSource], 104, 624),
    newAnalyzerSource: versionFour.analyzerSource,
    upgradeFromV1Source: combineVersionFourSources([versionTwo.journalOnlySource, versionFour.fullSource], 83, 498),
    upgradeSource: versionFour.fullSource,
    verifiedMarketDays: versionTwo.verifiedMarketDays,
  });
}

export function resolveCurrentJournalDemoFinancialPack(): JournalDemoFinancialPack | null {
  const resolved = resolveVersionFourSources();
  const versionEightFullSource = reversionSource(resolved.fullSource, 8);
  return createJournalDemoFinancialPack(
    versionEightFullSource,
    resolved.verifiedMarketDays,
    resolved.analyzerSource,
  );
}

/** Applies missing immutable facts without rewriting prior demo records. */
export function resolveJournalDemoUpgradePack(existingDemoPackVersionId: string): JournalDemoFinancialPack | null {
  const resolved = resolveVersionFourSources();
  const versionEightFullSource = reversionSource(resolved.fullSource, 8);
  if (existingDemoPackVersionId === "750b9d83-d7de-49a0-ae89-0383ad20f21b") {
    return createJournalDemoFinancialPack(
      reversionSource(resolved.upgradeFromV1Source, 8), resolved.verifiedMarketDays,
      resolved.newAnalyzerSource, versionEightFullSource, versionEightFullSource,
    );
  }
  if (existingDemoPackVersionId === "cb0483be-7e57-4a08-832e-93ad3b279b9c") {
    return createJournalDemoFinancialPack(
      resolved.upgradeSource,
      resolved.verifiedMarketDays,
      null,
    );
  }
  if (existingDemoPackVersionId !== "927f9d3e-bc33-4b20-8e31-bb1e62597354" &&
    existingDemoPackVersionId !== "5ae7f0b8-ae5c-4a9c-8548-737ba4b4b559") return null;
  return createJournalDemoFinancialPack(
    reversionSource(resolved.upgradeSource, 8),
    resolved.verifiedMarketDays,
    resolved.newAnalyzerSource,
    versionEightFullSource,
    versionEightFullSource,
  );
}
