import { createHash } from "node:crypto";
import {
  constants as zlibConstants,
  deflateRawSync,
  inflateRawSync,
  type ZlibOptions,
} from "node:zlib";

import {
  canonicalCoachAiReviewInsightBytes,
  deepFreezeCoachAiReviewInsight,
} from "./coach-ai-review-insight-canonical";
import { CoachAiReviewInsightInvariantError } from
  "./coach-ai-review-insight-normalizer";

export const COACH_AI_REVIEW_INSIGHT_ARTIFACT_CODEC_VERSION =
  "deflate_raw_v1" as const;

export type CoachAiReviewEncodedInsightArtifact = Readonly<{
  codecVersion: typeof COACH_AI_REVIEW_INSIGHT_ARTIFACT_CODEC_VERSION;
  uncompressedByteLength: number;
  compressedByteLength: number;
  digestSha256: string;
  compressedBytes: Buffer;
}>;

type InflateRawInfoResult = Readonly<{
  buffer: Buffer;
  engine: Readonly<{ bytesWritten: number }>;
}>;

const inflateRawWithInfo = inflateRawSync as unknown as (
  buffer: Buffer,
  options: ZlibOptions & Readonly<{ info: true }>,
) => InflateRawInfoResult;

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function digest(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertByteLength(value: number, code: string): void {
  invariant(Number.isSafeInteger(value) && value > 0, code);
}

export function encodeCoachAiReviewInsightArtifact(
  artifact: unknown,
): CoachAiReviewEncodedInsightArtifact {
  const uncompressed = canonicalCoachAiReviewInsightBytes(artifact);
  invariant(uncompressed.byteLength > 0,
    "TRADERLINK_AI_REVIEW_ARTIFACT_EMPTY");
  const compressed = deflateRawSync(uncompressed, {
    level: zlibConstants.Z_BEST_COMPRESSION,
  });
  invariant(compressed.byteLength > 0,
    "TRADERLINK_AI_REVIEW_ARTIFACT_COMPRESSION_EMPTY");
  return Object.freeze({
    codecVersion: COACH_AI_REVIEW_INSIGHT_ARTIFACT_CODEC_VERSION,
    uncompressedByteLength: uncompressed.byteLength,
    compressedByteLength: compressed.byteLength,
    digestSha256: digest(uncompressed),
    compressedBytes: Buffer.from(compressed),
  });
}

export function decodeCoachAiReviewInsightArtifact<T>(input: Readonly<{
  codecVersion: string;
  uncompressedByteLength: number;
  compressedByteLength: number;
  digestSha256: string;
  compressedBytes: Buffer | Uint8Array;
}>): Readonly<T> {
  invariant(input.codecVersion === COACH_AI_REVIEW_INSIGHT_ARTIFACT_CODEC_VERSION,
    "TRADERLINK_AI_REVIEW_ARTIFACT_CODEC_UNSUPPORTED");
  assertByteLength(input.uncompressedByteLength,
    "TRADERLINK_AI_REVIEW_ARTIFACT_LENGTH_INVALID");
  assertByteLength(input.compressedByteLength,
    "TRADERLINK_AI_REVIEW_ARTIFACT_COMPRESSED_LENGTH_INVALID");
  invariant(/^[0-9a-f]{64}$/u.test(input.digestSha256),
    "TRADERLINK_AI_REVIEW_ARTIFACT_DIGEST_INVALID");
  const compressed = Buffer.from(input.compressedBytes);
  invariant(compressed.byteLength === input.compressedByteLength,
    "TRADERLINK_AI_REVIEW_ARTIFACT_COMPRESSED_LENGTH_MISMATCH");

  let inflated: InflateRawInfoResult;
  try {
    inflated = inflateRawWithInfo(compressed, {
      info: true,
      maxOutputLength: input.uncompressedByteLength,
    });
  } catch {
    throw new CoachAiReviewInsightInvariantError(
      "TRADERLINK_AI_REVIEW_ARTIFACT_DECOMPRESSION_FAILED",
    );
  }
  invariant(inflated.engine.bytesWritten === compressed.byteLength,
    "TRADERLINK_AI_REVIEW_ARTIFACT_TRAILING_BYTES");
  invariant(inflated.buffer.byteLength === input.uncompressedByteLength,
    "TRADERLINK_AI_REVIEW_ARTIFACT_LENGTH_MISMATCH");
  invariant(digest(inflated.buffer) === input.digestSha256,
    "TRADERLINK_AI_REVIEW_ARTIFACT_DIGEST_MISMATCH");

  let parsed: unknown;
  try {
    parsed = JSON.parse(inflated.buffer.toString("utf8"));
  } catch {
    throw new CoachAiReviewInsightInvariantError(
      "TRADERLINK_AI_REVIEW_ARTIFACT_JSON_INVALID",
    );
  }
  invariant(canonicalCoachAiReviewInsightBytes(parsed).equals(inflated.buffer),
    "TRADERLINK_AI_REVIEW_ARTIFACT_NOT_CANONICAL");
  return deepFreezeCoachAiReviewInsight(parsed as T);
}
