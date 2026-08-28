import { createHash } from "node:crypto";

import type { JournalDemoFinancialPackSource } from "./journal-demo-financial-pack-source";

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Immutable annotation-only update; it deliberately adds no trade or execution facts. */
export function createJournalDemoV3AnnotationPackSource(): JournalDemoFinancialPackSource {
  const inventorySha256 = sha256("traderlink-demo-v3-annotation-copy\n");
  return Object.freeze({
    corporateActionReview: "not_applicable_synthetic_journal_only" as const,
    derivedFactManifestSha256: sha256(`daily_tracker_demo\n3\n${inventorySha256}\n`),
    marketDataManifestSha256: inventorySha256,
    packKey: "daily_tracker_demo" as const,
    packVersion: 3,
    sourceEvidenceManifestSha256: inventorySha256,
    trades: Object.freeze([]),
  });
}
