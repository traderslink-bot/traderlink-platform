import { createHash } from "node:crypto";

import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export type LevelAnalysisJsonEvidence = Readonly<{
  json: string;
  sha256: string;
}>;

export function createLevelAnalysisJsonEvidence(value: unknown): LevelAnalysisJsonEvidence {
  let json: string | undefined;
  try {
    json = JSON.stringify(value);
  } catch (error) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID", {}, error);
  }
  if (json === undefined) platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");
  return Object.freeze({
    json,
    sha256: createHash("sha256").update(`${json}\n`, "utf8").digest("hex"),
  });
}

export function parseLevelAnalysisJsonEvidence<T>(
  json: string,
  sha256: string,
  field: string,
): T {
  const actual = createHash("sha256").update(`${json}\n`, "utf8").digest("hex");
  if (actual !== sha256) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field });
  }
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", { field }, error);
  }
}
