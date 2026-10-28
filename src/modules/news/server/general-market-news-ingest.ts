import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { GENERAL_NEWS_LIMITS } from "../contracts/general-market-news-contracts";
import { normalizeGeneralNews, newsTimestamp } from "./general-market-news-normalizer";
import type { GeneralMarketNewsRepository } from "./general-market-news-repository";

export function generalNewsSignature(secret: string, timestamp: string, deliveryId: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}\n${deliveryId}\n${body}`).digest("hex");
}
export function validateGeneralNewsEnvelope(timestamp: string, deliveryId: string, signature: string, now: Date): void {
  if (!/^\d{10}$/.test(timestamp) || Math.abs(now.getTime() / 1000 - Number(timestamp)) > GENERAL_NEWS_LIMITS.replaySeconds ||
    !/^[a-zA-Z0-9-]{1,64}$/.test(deliveryId) || !/^[a-f0-9]{64}$/.test(signature)) throw new Error("unauthorized");
}
export async function readGeneralNewsBody(request: Request): Promise<string> {
  if (Number(request.headers.get("content-length")) > GENERAL_NEWS_LIMITS.batchBytes) throw new Error("oversize");
  if (!request.body) throw new Error("invalid_body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > GENERAL_NEWS_LIMITS.batchBytes) { await reader.cancel(); throw new Error("oversize"); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
}
export function ingestGeneralNews(input: {
  body: string; timestamp: string; deliveryId: string; signature: string; secret: string;
  now: Date; repository: (operation: (repository: Pick<GeneralMarketNewsRepository, "ingest">) => "accepted" | "duplicate") => "accepted" | "duplicate";
}): "accepted" | "duplicate" {
  const { body, timestamp, deliveryId, signature, secret, now, repository } = input;
  if (secret.length < 32) throw new Error("unauthorized");
  validateGeneralNewsEnvelope(timestamp, deliveryId, signature, now);
  const expected = generalNewsSignature(secret, timestamp, deliveryId, body);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("unauthorized");
  if (Buffer.byteLength(body) > GENERAL_NEWS_LIMITS.batchBytes) throw new Error("oversize");
  const parsed = JSON.parse(body) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_batch");
  const collectedAt = newsTimestamp(parsed.collectedAt);
  if (parsed.version !== 1 || !collectedAt || Date.parse(collectedAt) > now.getTime() + 60_000 ||
    Date.parse(collectedAt) < now.getTime() - 7 * 86_400_000 ||
    !["fresh", "partial", "paused"].includes(String(parsed.state)) || !["general", "ticker"].includes(String(parsed.collection)) ||
    !Array.isArray(parsed.articles) || parsed.articles.length > GENERAL_NEWS_LIMITS.batchItems) throw new Error("invalid_batch");
  const articles = parsed.articles.map(item => normalizeGeneralNews(item, collectedAt));
  if (articles.some(article => article.collection !== parsed.collection)) throw new Error("invalid_collection");
  return repository(repo => repo.ingest(deliveryId, createHash("sha256").update(body).digest("hex"), articles,
    collectedAt, now.toISOString(), parsed.state as "fresh" | "partial" | "paused", parsed.collection as "general" | "ticker"));
}
