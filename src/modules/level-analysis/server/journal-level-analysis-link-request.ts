import {
  isCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import type { JournalLevelAnalysisLinkRequest } from "./journal-level-analysis-link-service";

export const LEVEL_ANALYSIS_LINK_MAX_BYTES = 16 * 1024;

export type ParsedJournalLevelAnalysisLinkRequest = JournalLevelAnalysisLinkRequest & Readonly<{
  expectedAccountSelectionRef: string;
}>;

const ALLOWED_FIELDS = new Set([
  "roundTripId",
  "expectedAccountSelectionRef",
  "provider",
  "deliveryId",
  "linkSource",
]);

export async function readJournalLevelAnalysisLinkRequest(
  request: Request,
): Promise<ParsedJournalLevelAnalysisLinkRequest> {
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > LEVEL_ANALYSIS_LINK_MAX_BYTES) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID", {}, error);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");
  }
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !ALLOWED_FIELDS.has(key))) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");
  }
  const { roundTripId, expectedAccountSelectionRef, provider, deliveryId, linkSource } = body;
  if (
    typeof roundTripId !== "string" || !isCanonicalUuidV4(roundTripId) ||
    typeof expectedAccountSelectionRef !== "string" ||
    !/^[0-9a-f]{64}$/u.test(expectedAccountSelectionRef) ||
    typeof provider !== "string" || !/^[a-z][a-z0-9_-]{0,63}$/u.test(provider) ||
    (deliveryId !== undefined && (
      typeof deliveryId !== "string" || !/^(?:lad|laq)_[0-9a-f]{16}$/u.test(deliveryId)
    )) ||
    (linkSource !== undefined && ![
      "manual_review", "resolver", "import_batch_hint",
    ].includes(String(linkSource)))
  ) platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");
  return Object.freeze({
    roundTripId,
    expectedAccountSelectionRef,
    provider,
    deliveryId: deliveryId as string | undefined,
    linkSource: linkSource as ParsedJournalLevelAnalysisLinkRequest["linkSource"],
  });
}
