import type Database from "better-sqlite3";

import { createJournalDemoFinancialPack } from "./journal-demo-canonical-fact-materializer";
import { createJournalDemoDailyTrackerFinancialPackSource } from "./journal-demo-financial-pack-source";
import { readJournalDemoImmutableMarketDataPack } from "./journal-demo-immutable-market-data-pack";

import {
  assertCanonicalUuidV4,
  assertLowercaseToken,
  isLowercaseSha256,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalDemoExecutionProvenanceFact = Readonly<{
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
): readonly JournalDemoExecutionProvenanceFact[] {
  if (facts.length < 1) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "demoExecutionProvenance" });
  }
  const executionIds = new Set<string>();
  const executionVersionIds = new Set<string>();
  const packExecutionKeys = new Set<string>();
  for (const fact of facts) {
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

export function resolveCurrentJournalDemoFinancialPack(): JournalDemoFinancialPack | null {
  const verifiedMarketDays = readJournalDemoImmutableMarketDataPack();
  const source = createJournalDemoDailyTrackerFinancialPackSource(verifiedMarketDays);
  return createJournalDemoFinancialPack(source, verifiedMarketDays);
}
