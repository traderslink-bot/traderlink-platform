import { createHash } from "node:crypto";

import type { NormalizedMarketCandle } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { isLowercaseSha256, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import packed from "./packs/daily-tracker-verified-market-data.json";
import type { JournalDemoVerifiedMarketDaysInput, JournalDemoVerifiedMarketSessionInput } from "./journal-demo-financial-pack-source";

const PACK_SHA256 = "c3a92deff8a838ba75ba51a5ee3ed16f79ab938d752ec68abb7014c48201a7f7";

function failure(field: string): never {
  return platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

function asCandle(candidate: unknown): NormalizedMarketCandle {
  if (!candidate || typeof candidate !== "object") failure("demoImmutableMarketCandle");
  const candle = candidate as Record<string, unknown>;
  if (!Number.isSafeInteger(candle.time) || typeof candle.openDecimal !== "string" ||
    typeof candle.highDecimal !== "string" || typeof candle.lowDecimal !== "string" ||
    typeof candle.closeDecimal !== "string" || typeof candle.volumeDecimal !== "string" ||
    (candle.turnoverDecimal !== null && candle.turnoverDecimal !== undefined && typeof candle.turnoverDecimal !== "string")) {
    failure("demoImmutableMarketCandle");
  }
  return Object.freeze({
    closeDecimal: candle.closeDecimal,
    highDecimal: candle.highDecimal,
    lowDecimal: candle.lowDecimal,
    openDecimal: candle.openDecimal,
    time: Number(candle.time),
    turnoverDecimal: candle.turnoverDecimal as string | null | undefined,
    volumeDecimal: candle.volumeDecimal,
  });
}

/**
 * Returns the in-repository, sanitized, provider-normalized session evidence.
 * The pack carries its raw-page, normalized-bar, evidence-file, and source
 * manifest receipts; later source validation verifies every one of them.
 */
export function readJournalDemoImmutableMarketDataPack(): JournalDemoVerifiedMarketDaysInput {
  const serialized = `${JSON.stringify(packed, null, 2)}\n`;
  if (createHash("sha256").update(serialized, "utf8").digest("hex") !== PACK_SHA256) {
    return failure("demoImmutableMarketPackChecksum");
  }
  if (!packed || typeof packed !== "object" || !Array.isArray(packed.sessions) ||
    !isLowercaseSha256(packed.sourceEvidenceManifestSha256)) {
    return failure("demoImmutableMarketPackShape");
  }
  const sessions: JournalDemoVerifiedMarketSessionInput[] = packed.sessions.map((candidate) => {
    if (!candidate || typeof candidate !== "object") return failure("demoImmutableMarketSession");
    const session = candidate as Record<string, unknown>;
    const bars = session.bars;
    const date = session.date;
    const daySourceSha256 = session.daySourceSha256;
    const evidenceFileSha256 = session.evidenceFileSha256;
    const normalizedBarsSha256 = session.normalizedBarsSha256;
    const rawPagesSha256 = session.rawPagesSha256;
    const symbol = session.symbol;
    if (typeof date !== "string" || typeof symbol !== "string" || !Array.isArray(bars) ||
      typeof daySourceSha256 !== "string" || typeof evidenceFileSha256 !== "string" ||
      typeof normalizedBarsSha256 !== "string" || typeof rawPagesSha256 !== "string" ||
      !isLowercaseSha256(daySourceSha256) || !isLowercaseSha256(evidenceFileSha256) ||
      !isLowercaseSha256(normalizedBarsSha256) || !isLowercaseSha256(rawPagesSha256)) {
      return failure("demoImmutableMarketSession");
    }
    return Object.freeze({
      bars: Object.freeze(bars.map(asCandle)),
      date,
      daySourceSha256,
      evidenceFileSha256,
      normalizedBarsSha256,
      rawPagesSha256,
      symbol,
    });
  });
  return Object.freeze({
    sourceEvidenceManifestSha256: packed.sourceEvidenceManifestSha256,
    sessions: Object.freeze(sessions),
  });
}
